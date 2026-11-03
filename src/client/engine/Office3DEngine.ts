import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { DialogueEngine, DialogueMessage } from '../services/DialogueEngine';
import { SoundEffects } from '../services/SoundEffects';
import {
  applyWork,
  comfort,
  createVitals,
  isLazy,
  isProductive,
  Mood,
  MOOD_LABELS,
  MOOD_LINES,
  PROTEST_LINES,
  stepVitals,
  Vitals,
  whip
} from './EmotionSystem';
import { FreeCamera } from './FreeCamera';
import {
  coffeeSpot,
  CREW,
  CrewSpec,
  DeviceKind,
  getTeam,
  LOUNGE_SEATS,
  MEETING_ROOM,
  MEETING_SEATS,
  PET_LINES,
  Place,
  Point,
  ROOM,
  Seat,
  SPINE_X,
  Team,
  TEAMS
} from './officeLayout';
import {
  buildCabinet,
  buildCafeTable,
  buildCat,
  buildCoffeeBar,
  buildCorgi,
  buildDeadlineBoard,
  buildHangingSign,
  buildMacBook,
  buildMeetingScreen,
  buildOfficeDesk,
  buildPC,
  buildRabbit,
  buildSidePanel,
  createFloorMaterial,
  createMoodMaterials,
  createScreenMaterials,
  PetModel,
  ScreenKind,
  screenForMood
} from './officeProps';

interface Pose {
  torsoPitch: number;
  headPitch: number;
  headYaw: number;
  armRaise: number;
}

type Zone = 'desk' | 'kopi' | 'tengah' | 'meeting';

export interface Character3D {
  id: string;
  name: string;
  roleTitle: string;
  roleColor: string;
  team: Team;
  device: DeviceKind;
  root: THREE.Group;
  mixer: THREE.AnimationMixer;
  actions: Map<string, THREE.AnimationAction>;
  currentAnimName: string;
  headBone?: THREE.Object3D;
  torsoBone?: THREE.Object3D;
  leftArmBone?: THREE.Object3D;
  rightArmBone?: THREE.Object3D;
  leftForearmBone?: THREE.Object3D;
  rightForearmBone?: THREE.Object3D;
  restPose: Map<THREE.Object3D, THREE.Quaternion>;
  pose: Pose;
  x: number;
  z: number;
  home: Seat;
  place: Place;
  zone: Zone;
  path: Point[];
  visited: Point[];
  awayTimer: number;
  running: boolean;
  jolt: number;
  vitals: Vitals;
  moodIcon: THREE.Sprite;
  hitbox: THREE.Mesh;
  speechText: string | null;
  speechTimer: number;
  seed: number;
}

interface Pet {
  name: string;
  model: PetModel;
  hitbox: THREE.Mesh;
  x: number;
  z: number;
  path: Point[];
  wait: number;
  speed: number;
}

interface Effect {
  update: (progress: number) => void;
  dispose: () => void;
  elapsed: number;
  duration: number;
}

export interface PersonSnapshot {
  id: string;
  name: string;
  roleTitle: string;
  device: DeviceKind;
  teamName: string;
  mood: Mood;
  moodLabel: string;
  energy: number;
  stress: number;
  whips: number;
  lazy: boolean;
}

export interface OfficeSnapshot {
  people: PersonSnapshot[];
  productivity: number;
  lazyCount: number;
  whipCount: number;
}

export type OfficeLogListener = (badge: string, name: string, message: string) => void;
export type OfficeHoverListener = (target: { title: string; person: PersonSnapshot | null } | null, x: number, y: number) => void;

const OVERVIEW_POSITION = new THREE.Vector3(5, 3.55, 7.9);
const OVERVIEW_TARGET = new THREE.Vector3(-3, 0.2, -4.2);
const MOOD_BUBBLE_GAP = 3.5;
const CLICK_SLOP_PX = 6;
const DESK_HEIGHT = 0.74;
const CUBICLE_PITCH = 1.6;
const MEETING_EVERY_SECONDS = 55;
const MEETING_LENGTH_SECONDS = 20;

const WALL_COLOR = '#ECEBE6';
const AXIS_X = new THREE.Vector3(1, 0, 0);
const AXIS_Y = new THREE.Vector3(0, 1, 0);
const AXIS_Z = new THREE.Vector3(0, 0, 1);

export class Office3DEngine {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private freeCamera: FreeCamera;

  public dialogueEngine: DialogueEngine;
  public soundEffects: SoundEffects;

  public characters: Map<string, Character3D> = new Map();
  public readonly crewSize = CREW.length;
  public onLog: OfficeLogListener | null = null;
  public onHover: OfficeHoverListener | null = null;

  private pets: Pet[] = [];
  private effects: Effect[] = [];
  private animFrameId: number | null = null;
  private lastTime: number = 0;
  public fps: number = 60;
  private frameCount: number = 0;
  private fpsTimer: number = 0;
  private autonomousTimer: number = 0;
  private meetingTimer: number = MEETING_EVERY_SECONDS - 20;
  private moodBubbleCooldown: number = 0;
  private whipCount: number = 0;

  private speechBubbleOverlay: HTMLElement;
  private effectOverlay: HTMLElement;
  private gltfLoader: GLTFLoader;
  private modelPromises: Map<string, Promise<{ scene: THREE.Group; animations: THREE.AnimationClip[] }>> = new Map();

  private screenMaterials: Record<ScreenKind, THREE.MeshBasicMaterial>;
  private moodMaterials: Partial<Record<Mood, THREE.SpriteMaterial>>;
  private deviceScreens: Map<string, THREE.Mesh> = new Map();
  private hitMaterial = new THREE.MeshBasicMaterial({ visible: false });
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private pressPoint: { x: number; y: number } | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.gltfLoader = new GLTFLoader();

    this.dialogueEngine = new DialogueEngine();
    this.soundEffects = new SoundEffects();
    this.screenMaterials = createScreenMaterials();
    this.moodMaterials = createMoodMaterials();

    // 1. Scene: an enclosed floor with walls, windows and a ceiling, so there is no outside to see
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#E4E7EA');

    // 2. Camera: eye level inside the room, free to fly anywhere within it
    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(55, aspect, 0.05, 120);

    // 3. High-Quality WebGL Renderer with ACES Tone Mapping and Soft Shadows
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    container.appendChild(this.renderer.domElement);

    // 4. Free camera, kept inside the walls and under the ceiling
    this.freeCamera = new FreeCamera(this.camera, this.renderer.domElement, {
      minX: ROOM.minX + 0.4,
      maxX: ROOM.maxX - 0.4,
      minY: 0.5,
      maxY: ROOM.height - 0.35,
      minZ: ROOM.minZ + 0.4,
      maxZ: ROOM.maxZ - 0.4
    });
    this.freeCamera.set(OVERVIEW_POSITION, OVERVIEW_TARGET);

    // 5. Speech Bubble and Whip Effect HTML Overlays
    this.speechBubbleOverlay = this.createOverlay();
    this.effectOverlay = this.createOverlay();

    // 6. Build the Office
    this.setupLighting();
    this.buildRoomShell();
    TEAMS.forEach((team) => this.furnishTeam(team));
    this.buildMeetingRoom();
    this.buildLounge();
    this.buildCoffeeCorner();
    this.buildUtilities();

    // 7. Staff and Pets
    CREW.forEach((spec, idx) => this.hireCrewMember(spec, idx));
    this.adoptPets();

    // 8. Supervisor Input
    this.renderer.domElement.addEventListener('pointerdown', (e) => {
      this.pressPoint = { x: e.clientX, y: e.clientY };
    });
    this.renderer.domElement.addEventListener('pointerup', (e) => this.onPointerUp(e));
    this.renderer.domElement.addEventListener('pointermove', (e) => this.onPointerMove(e));
    this.renderer.domElement.addEventListener('pointerleave', () => this.onHover?.(null, 0, 0));

    new ResizeObserver(() => this.onWindowResize()).observe(container);
  }

  private createOverlay(): HTMLElement {
    const overlay = document.createElement('div');
    overlay.style.position = 'absolute';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.pointerEvents = 'none';
    overlay.style.overflow = 'hidden';
    this.container.appendChild(overlay);
    return overlay;
  }

  private onWindowResize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    if (width === 0 || height === 0) return;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  // ==========================================
  // LIGHTING
  // ==========================================
  private setupLighting() {
    this.scene.add(new THREE.AmbientLight('#F7F5EF', 0.85));

    const hemiLight = new THREE.HemisphereLight('#FFFFFF', '#B9B2A5', 0.65);
    hemiLight.position.set(0, ROOM.height, 0);
    this.scene.add(hemiLight);

    // Daylight through the window wall, plus the ceiling panels from straight above
    const daylight = new THREE.DirectionalLight('#FFF4E0', 1.5);
    daylight.position.set(6, 22, -14);
    daylight.target.position.set(0, 0, 0);
    daylight.castShadow = true;
    daylight.shadow.mapSize.width = 4096;
    daylight.shadow.mapSize.height = 4096;
    daylight.shadow.camera.near = 2;
    daylight.shadow.camera.far = 60;
    daylight.shadow.camera.left = -19;
    daylight.shadow.camera.right = 19;
    daylight.shadow.camera.top = 14;
    daylight.shadow.camera.bottom = -14;
    daylight.shadow.bias = -0.0003;
    daylight.shadow.normalBias = 0.02;
    this.scene.add(daylight);
    this.scene.add(daylight.target);
  }

  // ==========================================
  // FLOOR, WALLS, WINDOWS & CEILING
  // ==========================================
  private buildRoomShell() {
    const width = ROOM.maxX - ROOM.minX;
    const depth = ROOM.maxZ - ROOM.minZ;
    const cx = (ROOM.minX + ROOM.maxX) / 2;
    const cz = (ROOM.minZ + ROOM.maxZ) / 2;

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), createFloorMaterial('carpet', '#8E949B', width, depth));
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(cx, 0, cz);
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Window wall along the north side, solid walls elsewhere
    this.buildWindowWall(ROOM.minX, ROOM.maxX, ROOM.minZ);
    this.buildSolidWall(ROOM.minX, ROOM.maxZ, ROOM.maxX, ROOM.maxZ);
    this.buildSolidWall(ROOM.minX, ROOM.minZ, ROOM.minX, ROOM.maxZ);
    this.buildSolidWall(ROOM.maxX, ROOM.minZ, ROOM.maxX, ROOM.maxZ);

    // Ceiling with a grid of light panels; it casts no shadow so daylight still reaches the floor
    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), new THREE.MeshStandardMaterial({ color: '#F4F4F2', roughness: 0.9 }));
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(cx, ROOM.height, cz);
    this.scene.add(ceiling);

    const panelMat = new THREE.MeshBasicMaterial({ color: '#FFFDF6' });
    for (let x = ROOM.minX + 3; x < ROOM.maxX - 1; x += 4) {
      for (let z = ROOM.minZ + 2.5; z < ROOM.maxZ - 1; z += 3.5) {
        const panel = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.6), panelMat);
        panel.rotation.x = Math.PI / 2;
        panel.position.set(x, ROOM.height - 0.01, z);
        this.scene.add(panel);
      }
    }

    // Skirting board where walls meet the carpet
    const skirting = new THREE.MeshStandardMaterial({ color: '#3A3F46' });
    [
      [cx, ROOM.maxZ - 0.09, width, 0.02],
      [ROOM.minX + 0.09, cz, 0.02, depth],
      [ROOM.maxX - 0.09, cz, 0.02, depth]
    ].forEach(([x, z, w, d]) => {
      const board = new THREE.Mesh(new THREE.BoxGeometry(w, 0.1, d), skirting);
      board.position.set(x, 0.05, z);
      this.scene.add(board);
    });
  }

  private buildSolidWall(x1: number, z1: number, x2: number, z2: number) {
    const wall = new THREE.Mesh(
      new THREE.BoxGeometry(Math.abs(x2 - x1) + 0.2, ROOM.height, Math.abs(z2 - z1) + 0.2),
      new THREE.MeshStandardMaterial({ color: WALL_COLOR, roughness: 0.9 })
    );
    wall.position.set((x1 + x2) / 2, ROOM.height / 2, (z1 + z2) / 2);
    wall.receiveShadow = true;
    this.scene.add(wall);
  }

  private buildWindowWall(x1: number, x2: number, z: number) {
    const sill = 0.85;
    const head = 3.3;
    const frameMat = new THREE.MeshStandardMaterial({ color: '#3A3F46', roughness: 0.5, metalness: 0.4 });
    const wallMat = new THREE.MeshStandardMaterial({ color: WALL_COLOR, roughness: 0.9 });
    const width = x2 - x1;

    const lower = new THREE.Mesh(new THREE.BoxGeometry(width, sill, 0.2), wallMat);
    lower.position.set((x1 + x2) / 2, sill / 2, z);
    this.scene.add(lower);
    const upper = new THREE.Mesh(new THREE.BoxGeometry(width, ROOM.height - head, 0.2), wallMat);
    upper.position.set((x1 + x2) / 2, (ROOM.height + head) / 2, z);
    this.scene.add(upper);

    // Bright daylight beyond the glass: a soft gradient, no scenery
    const sky = document.createElement('canvas');
    sky.width = 4;
    sky.height = 128;
    const g = sky.getContext('2d') as CanvasRenderingContext2D;
    const gradient = g.createLinearGradient(0, 0, 0, 128);
    gradient.addColorStop(0, '#CFE3F2');
    gradient.addColorStop(1, '#F5F8FA');
    g.fillStyle = gradient;
    g.fillRect(0, 0, 4, 128);
    const skyTexture = new THREE.CanvasTexture(sky);
    skyTexture.colorSpace = THREE.SRGBColorSpace;
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(width, head - sill), new THREE.MeshBasicMaterial({ map: skyTexture }));
    glass.position.set((x1 + x2) / 2, (sill + head) / 2, z + 0.02);
    this.scene.add(glass);

    for (let x = x1; x <= x2 + 0.01; x += 2) {
      const mullion = new THREE.Mesh(new THREE.BoxGeometry(0.08, head - sill, 0.14), frameMat);
      mullion.position.set(x, (sill + head) / 2, z + 0.06);
      this.scene.add(mullion);
    }
    [sill, head].forEach((y) => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(width, 0.08, 0.16), frameMat);
      rail.position.set((x1 + x2) / 2, y, z + 0.06);
      this.scene.add(rail);
    });
  }

  // ==========================================
  // TEAM AREAS
  // ==========================================
  private furnishTeam(team: Team) {
    const zone = team.zone;
    const rug = new THREE.Mesh(
      new THREE.PlaneGeometry(zone.width, zone.depth),
      createFloorMaterial('carpet', new THREE.Color(team.color).lerp(new THREE.Color('#8E949B'), 0.72).getStyle(), zone.width, zone.depth)
    );
    rug.rotation.x = -Math.PI / 2;
    rug.position.set(zone.cx, 0.006, zone.cz);
    rug.receiveShadow = true;
    this.scene.add(rug);

    const sign = buildHangingSign(team.name, team.color, ROOM.height, 2.55);
    sign.position.set(zone.cx, 0, zone.cz);
    if (team.boss) sign.rotation.y = Math.PI / 2;
    this.scene.add(sign);

    team.seats.forEach((seat, i) => {
      const occupant = CREW.find((c) => c.teamId === team.id && c.seat === i);
      if (team.boss) this.buildBossDesk(seat, occupant, team);
      else this.buildPodDesk(seat, occupant, team);
    });
    if (!team.boss) this.buildCubicleWalls(team);

    if (team.boss) {
      const board = buildDeadlineBoard();
      board.scale.setScalar(0.6);
      board.rotation.y = -Math.PI / 2;
      board.position.set(ROOM.maxX - 0.14, 1.75, zone.cz);
      this.scene.add(board);
      this.buildFicusPlant(ROOM.maxX - 0.6, zone.cz - 2.6);
      this.buildFicusPlant(ROOM.maxX - 0.6, zone.cz + 2.6);
    }
  }

  private buildPodDesk(seat: Seat, occupant: CrewSpec | undefined, team: Team) {
    // The desk's +Z faces whoever sits at it, so it turns the opposite way to the person
    const desk = buildOfficeDesk(1.5, 0.75, DESK_HEIGHT);
    desk.position.set(seat.deskX, 0, seat.deskZ);
    desk.rotation.y = seat.rot + Math.PI;
    this.scene.add(desk);
    this.placeChair(seat.x, seat.z, seat.rot);
    if (occupant) this.placeDevice(occupant, seat, team, DESK_HEIGHT);
  }

  /** Walls to each person's left and right, so neighbours in a row are separated but the desk front stays open. */
  private buildCubicleWalls(team: Team) {
    const rows = new Map<number, Seat[]>();
    team.seats.forEach((seat) => rows.set(seat.deskZ, [...(rows.get(seat.deskZ) || []), seat]));
    rows.forEach((seats, deskZ) => {
      const xs = seats.map((s) => s.x).sort((a, b) => a - b);
      const edges = [xs[0] - CUBICLE_PITCH / 2, ...xs.map((x) => x + CUBICLE_PITCH / 2)];
      edges.forEach((x) => {
        const wall = buildSidePanel(0.95, 1.15, team.color);
        wall.position.set(x, 0, deskZ + Math.sign(seats[0].z - deskZ) * 0.1);
        wall.traverse((child) => {
          child.castShadow = true;
        });
        this.scene.add(wall);
      });
    });
  }

  private buildBossDesk(seat: Seat, occupant: CrewSpec | undefined, team: Team) {
    this.loadGlbModel('/assets/office-3d/desk-v1.glb', (desk) => {
      // The executive desk model is far taller than a seated person, so it is rescaled
      desk.rotation.y = seat.rot;
      desk.updateMatrixWorld(true);
      const rawHeight = new THREE.Box3().setFromObject(desk).getSize(new THREE.Vector3()).y;
      desk.scale.set(0.85, DESK_HEIGHT / rawHeight, 0.85);
      this.placeOnFloor(desk, seat.deskX, seat.deskZ);
      desk.traverse((child) => {
        child.receiveShadow = true;
      });
      // The lamp and ornaments make the model taller than its writing surface, so find the surface itself
      if (occupant) this.placeDevice(occupant, seat, team, this.surfaceHeight(desk, seat.deskX, seat.deskZ));
    });
    this.placeChair(seat.x, seat.z, seat.rot);
  }

  /** Height of the lowest upward-facing surface under a few points around x/z: the desktop, not what stands on it. */
  private surfaceHeight(model: THREE.Object3D, x: number, z: number): number {
    model.updateMatrixWorld(true);
    const down = new THREE.Vector3(0, -1, 0);
    const heights: number[] = [];
    [[0, 0], [0.25, 0], [-0.25, 0], [0, 0.2], [0, -0.2]].forEach(([dx, dz]) => {
      this.raycaster.set(new THREE.Vector3(x + dx, 5, z + dz), down);
      const hit = this.raycaster.intersectObject(model, true)[0];
      if (hit) heights.push(hit.point.y);
    });
    return heights.length ? Math.min(...heights) : DESK_HEIGHT;
  }

  private placeDevice(spec: CrewSpec, seat: Seat, team: Team, surface: number) {
    const built = spec.device === 'MAC' ? buildMacBook(this.screenMaterials.code) : buildPC(this.screenMaterials.code, team.color);
    built.group.position.set(seat.deskX, surface, seat.deskZ);
    built.group.rotation.y = seat.rot + Math.PI;
    if (spec.device === 'MAC') built.group.scale.setScalar(0.85);
    built.group.traverse((child) => {
      child.castShadow = true;
    });
    this.scene.add(built.group);
    this.deviceScreens.set(spec.id, built.screen);
  }

  private placeChair(x: number, z: number, rot: number) {
    this.loadGlbModel('/assets/office-3d/chair-v1.glb', (chair) => {
      // Stand the castors on the carpet by the model's measured bottom
      chair.position.set(x, 0, z);
      chair.rotation.y = rot;
      chair.updateMatrixWorld(true);
      chair.position.y = -new THREE.Box3().setFromObject(chair).min.y;
      chair.traverse((child) => {
        child.castShadow = true;
      });
      this.scene.add(chair);
    });
  }

  // ==========================================
  // SHARED AREAS
  // ==========================================
  private buildMeetingRoom() {
    const m = MEETING_ROOM;
    const cx = (m.minX + m.maxX) / 2;
    const cz = (m.minZ + m.maxZ) / 2;

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(m.maxX - m.minX, m.maxZ - m.minZ), createFloorMaterial('wood', '#A27B57', m.maxX - m.minX, m.maxZ - m.minZ));
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(cx, 0.006, cz);
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Floor-to-ceiling glass on the two sides facing the office, with a door gap on the south side
    this.buildGlassPartition(m.maxX, m.minZ, m.maxX, m.maxZ);
    this.buildGlassPartition(m.minX, m.maxZ, m.doorX - 0.6, m.maxZ);
    this.buildGlassPartition(m.doorX + 0.6, m.maxZ, m.maxX, m.maxZ);

    this.loadGlbModel('/assets/office-3d/conference-v1.glb', (table) => {
      // Fitted to a 3.4 x 1.2 m table at desk height, whatever the model's own size
      table.updateMatrixWorld(true);
      const size = new THREE.Box3().setFromObject(table).getSize(new THREE.Vector3());
      table.scale.set(3.4 / size.x, 0.76 / size.y, 1.2 / size.z);
      this.placeOnFloor(table, cx, -6.5);
    });
    MEETING_SEATS.forEach((seat) => this.placeChair(seat.x, seat.z, seat.rot as number));

    const screen = buildMeetingScreen();
    screen.scale.setScalar(0.7);
    screen.rotation.y = Math.PI / 2;
    screen.position.set(ROOM.minX + 0.14, 1.6, -6.5);
    this.scene.add(screen);

    const sign = buildHangingSign('Ruang Meeting', '#334155', ROOM.height, 2.55);
    sign.position.set(cx, 0, m.maxZ + 0.6);
    this.scene.add(sign);
  }

  private buildGlassPartition(x1: number, z1: number, x2: number, z2: number) {
    const length = Math.hypot(x2 - x1, z2 - z1);
    const alongX = Math.abs(x2 - x1) > Math.abs(z2 - z1);
    const glass = new THREE.Mesh(
      new THREE.BoxGeometry(alongX ? length : 0.04, ROOM.height, alongX ? 0.04 : length),
      new THREE.MeshStandardMaterial({ color: '#CDE6F2', transparent: true, opacity: 0.22, roughness: 0.05, depthWrite: false })
    );
    glass.position.set((x1 + x2) / 2, ROOM.height / 2, (z1 + z2) / 2);
    this.scene.add(glass);

    const frameMat = new THREE.MeshStandardMaterial({ color: '#2F343B', roughness: 0.5, metalness: 0.5 });
    [0.03, 1.05, ROOM.height - 0.03].forEach((y) => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(alongX ? length : 0.07, 0.05, alongX ? 0.07 : length), frameMat);
      rail.position.set((x1 + x2) / 2, y, (z1 + z2) / 2);
      this.scene.add(rail);
    });
    const posts = Math.max(1, Math.round(length / 1.6));
    for (let i = 0; i <= posts; i++) {
      const t = i / posts;
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.06, ROOM.height, 0.06), frameMat);
      post.position.set(x1 + (x2 - x1) * t, ROOM.height / 2, z1 + (z2 - z1) * t);
      this.scene.add(post);
    }
  }

  private buildLounge() {
    this.loadGlbModel('/assets/office-3d/rug-v1.glb', (rug) => {
      rug.scale.setScalar(0.9);
      this.placeOnFloor(rug, -13.6, -0.1);
      rug.position.y = 0.01;
    });
    this.loadGlbModel('/assets/office-3d/sofa-v1.glb', (sofa) => {
      sofa.rotation.y = Math.PI / 2;
      this.placeOnFloor(sofa, -15.25, -0.1);
    });
    this.loadGlbModel('/assets/office-3d/armchair-v1.glb', (chair) => {
      this.placeOnFloor(chair, -12.9, -1.85);
    });
    this.loadGlbModel('/assets/office-3d/armchair-v1.glb', (chair) => {
      chair.rotation.y = Math.PI;
      this.placeOnFloor(chair, -12.9, 1.65);
    });
    this.loadGlbModel('/assets/office-3d/coffee-v1.glb', (table) => {
      this.placeOnFloor(table, -13.7, -0.1);
    });
    this.buildFicusPlant(-10.3, -1.9);

    const sign = buildHangingSign('Ruang Tengah', '#0F766E', ROOM.height, 2.55);
    sign.position.set(-12.8, 0, -0.1);
    sign.rotation.y = Math.PI / 2;
    this.scene.add(sign);
  }

  private buildCoffeeCorner() {
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(6.6, 5.4), createFloorMaterial('tile', '#D8CCB6', 6.6, 5.4));
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(-12.7, 0.006, 5.8);
    floor.receiveShadow = true;
    this.scene.add(floor);

    const bar = buildCoffeeBar(4.6);
    bar.position.set(-13, 0, ROOM.maxZ - 0.5);
    this.scene.add(bar);

    const fridge = buildCabinet(0.9, 1.75, '#E5E7EB');
    fridge.rotation.y = Math.PI / 2;
    fridge.position.set(ROOM.minX + 0.35, 0, 4.2);
    this.scene.add(fridge);
    const vending = buildCabinet(1.0, 1.8, '#B91C1C');
    vending.rotation.y = Math.PI / 2;
    vending.position.set(ROOM.minX + 0.35, 0, 5.4);
    this.scene.add(vending);

    [{ x: -13.2, z: 4.4 }, { x: -10.6, z: 4.9 }].forEach((spot) => {
      const table = buildCafeTable();
      table.position.set(spot.x, 0, spot.z);
      this.scene.add(table);
    });

    const sign = buildHangingSign('Pojok Kopi', '#92400E', ROOM.height, 2.55);
    sign.position.set(-12.7, 0, 6.4);
    this.scene.add(sign);
  }

  /** Printer, water cooler, filing cabinets and plants along the south wall. */
  private buildUtilities() {
    for (let x = -5; x <= 9; x += 1.2) {
      const cabinet = buildCabinet(1.1, 1.05, '#A1A7AF');
      cabinet.position.set(x, 0, ROOM.maxZ - 0.35);
      this.scene.add(cabinet);
    }
    const printer = buildCabinet(0.9, 0.95, '#E5E7EB');
    printer.position.set(11.2, 0, ROOM.maxZ - 0.4);
    this.scene.add(printer);

    this.loadGlbModel('/assets/office-3d/tech-server-rack-v1.glb', (rack) => {
      rack.scale.setScalar(0.85);
      rack.rotation.y = Math.PI;
      this.placeOnFloor(rack, 14.6, ROOM.maxZ - 0.5);
    });
    this.loadGlbModel('/assets/office-3d/bookcase-v1.glb', (bookcase) => {
      bookcase.scale.setScalar(0.65);
      this.placeOnFloor(bookcase, -14.3, -3.15);
    });

    [[-7.2, ROOM.minZ + 0.6], [10.5, ROOM.minZ + 0.6], [-7.2, ROOM.maxZ - 0.6], [-9.8, 3.4], [15.3, -7.5]].forEach(([x, z]) => this.buildFicusPlant(x, z));
  }

  /** Stands a model on the floor, centred on x/z, by its measured bounds rather than its origin. */
  private placeOnFloor(model: THREE.Group, x: number, z: number) {
    model.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    model.position.set(model.position.x + x - center.x, model.position.y - box.min.y, model.position.z + z - center.z);
    model.traverse((child) => {
      child.castShadow = true;
    });
    this.scene.add(model);
  }

  private buildFicusPlant(x: number, z: number) {
    const plantGroup = new THREE.Group();
    const potMat = new THREE.MeshStandardMaterial({ color: '#E2E8F0', roughness: 0.7 });
    const leafMat = new THREE.MeshStandardMaterial({ color: '#166534', roughness: 0.6 });

    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.21, 0.5, 16), potMat);
    pot.position.set(0, 0.25, 0);
    pot.castShadow = true;
    plantGroup.add(pot);

    for (let i = 0; i < 5; i++) {
      const foliage = new THREE.Mesh(new THREE.DodecahedronGeometry(0.26 + i * 0.03, 1), leafMat);
      foliage.position.set(Math.sin(i * 1.6) * 0.15, 0.7 + i * 0.24, Math.cos(i * 1.6) * 0.15);
      foliage.castShadow = true;
      plantGroup.add(foliage);
    }

    plantGroup.position.set(x, 0, z);
    this.scene.add(plantGroup);
  }

  // ==========================================
  // CREW LOADING & RIGGING
  // ==========================================
  private hireCrewMember(spec: CrewSpec, idx: number) {
    const team = getTeam(spec.teamId);
    const home = team.seats[spec.seat];

    this.loadGlbAsset(spec.asset, ({ scene, animations }) => {
      const charScene = SkeletonUtils.clone(scene) as THREE.Group;

      // Two rigs ship in the crew assets; GLTFLoader also strips dots, so UpperArm.L arrives as UpperArmL
      const bones: Record<string, THREE.Object3D> = {};
      charScene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          child.frustumCulled = false;
        }
        bones[child.name] = child;
      });

      const mixer = new THREE.AnimationMixer(charScene);
      const actions = new Map<string, THREE.AnimationAction>();
      animations.forEach((clip) => {
        actions.set(clip.name.toLowerCase(), mixer.clipAction(clip));
      });

      (actions.get('sit') || actions.get('idle'))?.play();
      mixer.update(0.01);

      charScene.position.set(home.x, 0, home.z);
      charScene.rotation.y = home.rot;
      this.scene.add(charScene);

      const posedBones = {
        headBone: bones['Head'],
        torsoBone: bones['Torso'] || bones['Spine1'] || bones['Spine'],
        // Only this rig's upper arms raise cleanly; on the other they swing down into the lap
        leftArmBone: bones['LeftArm'],
        rightArmBone: bones['RightArm'],
        leftForearmBone: bones['LowerArmL'] || bones['LeftForeArm'],
        rightForearmBone: bones['LowerArmR'] || bones['RightForeArm']
      };
      const restPose = new Map<THREE.Object3D, THREE.Quaternion>();
      Object.values(posedBones).forEach((bone) => {
        if (bone) restPose.set(bone, bone.quaternion.clone());
      });

      const moodIcon = new THREE.Sprite();
      moodIcon.scale.set(0.42, 0.42, 1);
      moodIcon.visible = false;
      moodIcon.renderOrder = 10;
      this.scene.add(moodIcon);

      const hitbox = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 1.8, 8), this.hitMaterial);
      hitbox.position.set(home.x, 0.9, home.z);
      hitbox.userData.characterId = spec.id;
      this.scene.add(hitbox);

      this.characters.set(spec.id, {
        id: spec.id,
        name: spec.name,
        roleTitle: spec.roleTitle,
        roleColor: spec.roleColor,
        team,
        device: spec.device,
        root: charScene,
        mixer,
        actions,
        currentAnimName: 'sit',
        ...posedBones,
        restPose,
        pose: { torsoPitch: 0, headPitch: 0, headYaw: 0, armRaise: 0 },
        x: home.x,
        z: home.z,
        home,
        place: home,
        zone: 'desk',
        path: [],
        visited: [],
        awayTimer: 0,
        running: false,
        jolt: 0,
        vitals: createVitals(spec.startMood, this.startingEnergy(spec.startMood, idx), spec.startMood === 'MARAH' ? 85 : 15 + (idx * 7) % 45),
        moodIcon,
        hitbox,
        speechText: null,
        speechTimer: 0,
        seed: idx + 1
      });
    });
  }

  private startingEnergy(mood: Mood, idx: number): number {
    if (mood === 'TIDUR') return 8;
    if (mood === 'LELAH') return 30;
    return 55 + (idx * 13) % 45;
  }

  // ==========================================
  // PETS
  // ==========================================
  private adoptPets() {
    const roster: { name: string; model: PetModel; x: number; z: number; speed: number }[] = [
      { name: 'Mochi', model: buildCat('#E8A04C', '#C97A2B'), x: -2, z: -8.6, speed: 0.8 },
      { name: 'Oreo', model: buildCat('#26272B', '#F4F4F5'), x: -12, z: 5.4, speed: 0.7 },
      { name: 'Kopi', model: buildCorgi(), x: 6, z: 3.2, speed: 1.4 },
      { name: 'Tahu', model: buildRabbit(), x: 0, z: -2.75, speed: 1.0 }
    ];

    roster.forEach((p, i) => {
      p.model.root.position.set(p.x, 0, p.z);
      this.scene.add(p.model.root);
      const hitbox = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 8), this.hitMaterial);
      hitbox.userData.petIndex = i;
      this.scene.add(hitbox);
      this.pets.push({ name: p.name, model: p.model, hitbox, x: p.x, z: p.z, path: [], wait: 1 + i, speed: p.speed });
    });
  }

  private updatePets(delta: number, t: number) {
    this.pets.forEach((pet, i) => {
      const walking = pet.path.length > 0 && pet.wait <= 0;
      if (walking) {
        const next = pet.path[0];
        const dx = next.x - pet.x;
        const dz = next.z - pet.z;
        const dist = Math.hypot(dx, dz);
        if (dist < 0.06) {
          pet.path.shift();
        } else {
          const step = Math.min(pet.speed * delta, dist);
          pet.x += (dx / dist) * step;
          pet.z += (dz / dist) * step;
          pet.model.root.rotation.y = this.turnToward(pet.model.root.rotation.y, Math.atan2(dx, dz), 8 * delta);
        }
        if (pet.path.length === 0) pet.wait = 3 + Math.random() * 7;
      } else if (pet.wait > 0) {
        pet.wait -= delta;
      } else {
        // Pets always stand on a clear line, so line -> spine -> line is a safe walk
        const line = this.pick(PET_LINES);
        const x = line.minX + Math.random() * (line.maxX - line.minX);
        pet.path = [{ x: SPINE_X, z: pet.z }, { x: SPINE_X, z: line.z }, { x, z: line.z }];
      }

      const swing = walking ? Math.sin(t * pet.speed * 11 + i) * 0.7 : 0;
      pet.model.legs.forEach((leg, l) => {
        leg.rotation.x = l === 0 || l === 3 ? swing : -swing;
      });
      pet.model.tail.rotation.z = Math.sin(t * (walking ? 11 : 3) + i) * 0.45;
      pet.model.head.rotation.y = walking ? 0 : Math.sin(t * 0.8 + i) * 0.45;
      pet.model.root.position.set(pet.x, walking ? Math.abs(Math.sin(t * pet.speed * 11)) * 0.02 : 0, pet.z);
      pet.hitbox.position.set(pet.x, 0.3, pet.z);

      // A pet nearby calms people down
      this.characters.forEach((c) => {
        if (Math.hypot(c.x - pet.x, c.z - pet.z) < 3) c.vitals.stress = Math.max(0, c.vitals.stress - 1.2 * delta);
      });
    });
  }

  private turnToward(current: number, target: number, amount: number): number {
    let diff = target - current;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    return current + diff * Math.min(1, amount);
  }

  // ==========================================
  // HELPER: GLTF CACHED PROMISE LOADER (DEDUPLICATED)
  // ==========================================
  private loadGlbAsset(url: string, onLoad: (asset: { scene: THREE.Group; animations: THREE.AnimationClip[] }) => void) {
    let p = this.modelPromises.get(url);
    if (!p) {
      p = new Promise((resolve, reject) => {
        this.gltfLoader.load(
          url,
          (gltf) => {
            resolve({ scene: gltf.scene, animations: gltf.animations });
          },
          undefined,
          reject
        );
      });
      this.modelPromises.set(url, p);
    }

    p.then(onLoad).catch((err) => {
      console.warn(`Could not load 3D asset ${url}:`, err);
    });
  }

  private loadGlbModel(url: string, onLoad: (model: THREE.Group) => void) {
    this.loadGlbAsset(url, ({ scene }) => {
      onLoad(SkeletonUtils.clone(scene) as THREE.Group);
    });
  }

  // ==========================================
  // ANIMATION LOOP
  // ==========================================
  public start() {
    this.lastTime = performance.now();
    const animate = (time: number) => {
      this.animFrameId = requestAnimationFrame(animate);
      const delta = Math.min((time - this.lastTime) / 1000, 0.1);
      this.lastTime = time;

      // Update FPS calculation
      this.frameCount++;
      this.fpsTimer += delta;
      if (this.fpsTimer >= 1.0) {
        this.fps = Math.round(this.frameCount / this.fpsTimer);
        this.frameCount = 0;
        this.fpsTimer = 0;
      }

      this.freeCamera.update(delta);
      this.updateCrewMembers(delta, time / 1000);
      this.updatePets(delta, time / 1000);
      this.updateEffects(delta);
      this.updateSpeechBubbles(delta);
      this.runAutonomousBehaviors(delta);

      this.renderer.render(this.scene, this.camera);
    };

    this.animFrameId = requestAnimationFrame(animate);
  }

  public stop() {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  private updateCrewMembers(delta: number, t: number) {
    this.moodBubbleCooldown -= delta;

    this.characters.forEach((c) => {
      c.mixer.update(delta);
      this.updateLocomotion(c, delta);

      const seated = c.currentAnimName === 'sit' && c.path.length === 0;
      if (stepVitals(c.vitals, delta, seated)) this.onMoodChanged(c);

      if (seated) this.applySeatedPose(c, delta, t + c.seed * Math.PI);

      // Whip recoil: a jump plus a quick shudder
      c.jolt = Math.max(0, c.jolt - delta * 2.4);
      const shake = c.jolt > 0 ? Math.sin(t * 60) * 0.05 * c.jolt : 0;
      c.root.position.set(c.x + shake, Math.sin(c.jolt * Math.PI) * 0.32, c.z);
      c.hitbox.position.set(c.x, 0.9, c.z);

      const material = this.moodMaterials[c.vitals.mood];
      c.moodIcon.visible = !!material;
      if (material) {
        c.moodIcon.material = material;
        c.moodIcon.position.set(c.x, (seated ? 1.75 : 2.05) + Math.sin(t * 2.4 + c.seed) * 0.04, c.z);
      }

      const screen = this.deviceScreens.get(c.id);
      if (screen) screen.material = this.screenMaterials[screenForMood(c.vitals.mood)];
    });
  }

  private updateLocomotion(c: Character3D, delta: number) {
    const next = c.path[0];
    if (next) {
      if (c.currentAnimName !== 'walk') this.crossFadeAction(c, 'walk', 0.25);

      const dx = next.x - c.x;
      const dz = next.z - c.z;
      const dist = Math.hypot(dx, dz);
      const step = Math.min((c.running ? 5 : 2.2) * delta, dist);
      if (dist > 0.001) {
        c.x += (dx / dist) * step;
        c.z += (dz / dist) * step;
        c.root.rotation.y = this.turnToward(c.root.rotation.y, Math.atan2(dx, dz), 10 * delta);
      }

      if (dist < 0.06) {
        c.visited.push(c.path.shift() as Point);
        if (c.path.length === 0) this.onArrived(c);
      }
    } else if (c.awayTimer > 0 && c.vitals.mood !== 'TIDUR') {
      c.awayTimer -= delta;
      if (c.awayTimer <= 0) this.walkHome(c, false);
    }
  }

  private onArrived(c: Character3D) {
    c.x = c.place.x;
    c.z = c.place.z;
    if (c.place === c.home) {
      c.running = false;
      c.zone = 'desk';
    }
    if (c.place.rot !== undefined) {
      c.root.rotation.y = c.place.rot;
      this.crossFadeAction(c, 'sit', 0.4);
    } else {
      this.crossFadeAction(c, 'idle', 0.4);
    }
    if (c.zone === 'kopi') {
      comfort(c.vitals, 30);
      this.soundEffects.playCoffeeSip();
    }
  }

  /** Walk out along the current place's access line, along the spine, then in along the destination's. */
  private routeTo(c: Character3D, destination: Place, zone: Zone) {
    c.path = [...c.place.access.slice(1), ...destination.access.slice().reverse()];
    c.visited = [{ x: c.x, z: c.z }];
    c.place = destination;
    c.zone = zone;
  }

  private walkHome(c: Character3D, running: boolean) {
    c.awayTimer = 0;
    c.running = running;
    if (c.path.length > 0 && c.place !== c.home) {
      // Still on the way out: retrace the steps already taken rather than cut through furniture
      c.path = c.visited.slice().reverse();
      c.visited = [];
      c.place = c.home;
      c.zone = 'desk';
      return;
    }
    if (c.place !== c.home) this.routeTo(c, c.home, 'desk');
  }

  private applySeatedPose(c: Character3D, delta: number, clock: number) {
    const target: Pose = { torsoPitch: 0, headPitch: 0.08, headYaw: 0, armRaise: 0 };
    let typing = 0;
    let tremble = 0;

    switch (c.vitals.mood) {
      case 'FOKUS':
        target.headYaw = Math.sin(clock * 0.5) * 0.12;
        typing = 1;
        break;
      case 'LELAH':
        target.torsoPitch = 0.2;
        target.headPitch = 0.3 + Math.max(0, Math.sin(clock * 0.9)) * 0.28;
        typing = 0.25;
        break;
      case 'MALAS':
        target.torsoPitch = -0.2;
        target.headPitch = 0.34;
        target.headYaw = Math.sin(clock * 0.45) * 0.5;
        break;
      case 'TIDUR':
        target.torsoPitch = 0.42 + Math.sin(clock * 1.1) * 0.02;
        target.headPitch = 0.4;
        target.headYaw = 0.35;
        break;
      case 'MARAH':
        target.torsoPitch = 0.08 + Math.sin(clock * 9) * 0.05;
        target.headYaw = Math.sin(clock * 12) * 0.28;
        target.armRaise = 0.9 + Math.sin(clock * 11) * 0.3;
        break;
      case 'TAKUT':
        target.torsoPitch = 0.1;
        target.headPitch = 0.14;
        typing = 2;
        tremble = 1;
        break;
      case 'SENANG':
        target.headPitch = -0.05 + Math.sin(clock * 3) * 0.1;
        target.headYaw = Math.sin(clock * 1.5) * 0.3;
        break;
    }

    const ease = Math.min(1, 5 * delta);
    c.pose.torsoPitch += (target.torsoPitch - c.pose.torsoPitch) * ease;
    c.pose.headPitch += (target.headPitch - c.pose.headPitch) * ease;
    c.pose.headYaw += (target.headYaw - c.pose.headYaw) * ease;
    c.pose.armRaise += (target.armRaise - c.pose.armRaise) * ease;

    const trembleYaw = tremble * Math.sin(clock * 37) * 0.04;
    this.setBone(c, c.torsoBone, c.pose.torsoPitch);
    this.setBone(c, c.headBone, c.pose.headPitch, c.pose.headYaw + trembleYaw);
    this.setBone(c, c.leftArmBone, c.pose.armRaise);
    this.setBone(c, c.rightArmBone, c.pose.armRaise);

    const keystroke = Math.sin(clock * 12) * 0.07 * typing;
    this.setBone(c, c.leftForearmBone, keystroke);
    this.setBone(c, c.rightForearmBone, -keystroke);
  }

  private setBone(c: Character3D, bone: THREE.Object3D | undefined, pitch: number, yaw = 0, roll = 0) {
    if (!bone) return;
    const rest = c.restPose.get(bone);
    if (!rest) return;
    bone.quaternion.copy(rest);
    if (pitch) bone.rotateOnAxis(AXIS_X, pitch);
    if (yaw) bone.rotateOnAxis(AXIS_Y, yaw);
    if (roll) bone.rotateOnAxis(AXIS_Z, roll);
  }

  private crossFadeAction(c: Character3D, newAnimName: string, duration: number) {
    const currentAction = c.actions.get(c.currentAnimName);
    const newAction = c.actions.get(newAnimName);

    if (newAction && currentAction && currentAction !== newAction) {
      newAction.reset();
      newAction.fadeIn(duration);
      newAction.play();
      currentAction.fadeOut(duration);
      c.currentAnimName = newAnimName;
    } else if (newAction && !currentAction) {
      newAction.play();
      c.currentAnimName = newAnimName;
    }
  }

  // ==========================================
  // EMOTIONS
  // ==========================================
  private onMoodChanged(c: Character3D) {
    const mood = c.vitals.mood;
    if (mood !== 'FOKUS') {
      this.onLog?.('MOOD', c.name, `${MOOD_LABELS[mood]} (${c.team.name})`);
    }
    if (mood === 'FOKUS' || this.moodBubbleCooldown > 0) return;
    this.moodBubbleCooldown = MOOD_BUBBLE_GAP;
    this.say(c, this.pick(MOOD_LINES[mood]), 4);
  }

  private pick<T>(items: T[]): T {
    return items[Math.floor(Math.random() * items.length)];
  }

  private say(c: Character3D, text: string, seconds: number) {
    c.speechText = text;
    c.speechTimer = seconds;
  }

  // ==========================================
  // THE WHIP
  // ==========================================
  public whipPerson(id: string) {
    const c = this.characters.get(id);
    if (!c) return;

    const outcome = whip(c.vitals);
    this.whipCount += 1;
    c.jolt = 1;
    this.soundEffects.playWhip();
    this.spawnWhipEffect(c);

    if (outcome === 'WOKE') {
      this.say(c, this.pick(MOOD_LINES.TAKUT), 3.5);
      this.showStamp(c, 'DIPECUT', 'stamp');
      this.onLog?.('PECUT', c.name, 'Dipecut dan langsung kembali bekerja.');
      if (c.place !== c.home || c.path.length > 0) this.walkHome(c, true);
    } else if (outcome === 'PROTEST') {
      this.say(c, this.pick(PROTEST_LINES), 3.5);
      this.showStamp(c, 'SALAH SASARAN', 'stamp stamp-miss');
      this.onLog?.('PECUT', c.name, 'Sedang bekerja tapi tetap dipecut. Stres naik.');
    } else {
      this.say(c, this.pick(MOOD_LINES.MARAH), 4);
      this.showStamp(c, 'MELAWAN', 'stamp stamp-miss');
      this.soundEffects.playErrorAlert();
      this.onLog?.('PECUT', c.name, 'Sudah terlalu stres dan mulai marah.');
    }
  }

  public whipAllLazy(): number {
    const lazy = Array.from(this.characters.values()).filter((c) => isLazy(c.vitals.mood));
    lazy.forEach((c, i) => {
      setTimeout(() => this.whipPerson(c.id), i * 140);
    });
    return lazy.length;
  }

  private spawnWhipEffect(c: Character3D) {
    // The lash comes from just beside the camera, wherever the supervisor is standing
    const end = new THREE.Vector3(c.x, 1.2, c.z);
    const start = this.camera.position.clone().lerp(end, 0.35);
    start.y += 0.5;
    const material = new THREE.MeshBasicMaterial({ color: '#4A2A12' });
    const lash = new THREE.Mesh(new THREE.BufferGeometry(), material);
    this.scene.add(lash);

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.25, 0.36, 32),
      new THREE.MeshBasicMaterial({ color: '#C4261D', transparent: true, side: THREE.DoubleSide, depthTest: false })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(c.x, 0.05, c.z);
    ring.renderOrder = 9;
    this.scene.add(ring);

    this.effects.push({
      elapsed: 0,
      duration: 0.5,
      update: (p) => {
        // The lash whips out to the target and snaps back along a sagging curve
        const reach = Math.sin(Math.min(1, p * 1.15) * Math.PI);
        const tip = start.clone().lerp(end, reach);
        const middle = start.clone().lerp(tip, 0.5);
        middle.y += 0.8 * (1 - reach) - 0.2;
        middle.x += Math.sin(p * 14) * 0.3 * (1 - reach);
        lash.geometry.dispose();
        lash.geometry = new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(start, middle, tip), 18, 0.02, 5);

        const grow = 1 + p * 4;
        ring.scale.set(grow, grow, 1);
        (ring.material as THREE.MeshBasicMaterial).opacity = 1 - p;
      },
      dispose: () => {
        this.scene.remove(lash);
        this.scene.remove(ring);
        lash.geometry.dispose();
        material.dispose();
        ring.geometry.dispose();
        (ring.material as THREE.Material).dispose();
      }
    });
  }

  private updateEffects(delta: number) {
    this.effects = this.effects.filter((effect) => {
      effect.elapsed += delta;
      const progress = Math.min(1, effect.elapsed / effect.duration);
      effect.update(progress);
      if (progress >= 1) {
        effect.dispose();
        return false;
      }
      return true;
    });
  }

  private screenPosition(x: number, y: number, z: number): { x: number; y: number; visible: boolean } {
    const v = new THREE.Vector3(x, y, z).project(this.camera);
    return {
      x: (v.x * 0.5 + 0.5) * this.container.clientWidth,
      y: (-(v.y * 0.5) + 0.5) * this.container.clientHeight,
      visible: v.z <= 1 && v.z >= -1
    };
  }

  private showStamp(c: Character3D, text: string, className: string) {
    const position = this.screenPosition(c.x, 1.1, c.z);
    if (!position.visible) return;
    const stamp = document.createElement('div');
    stamp.className = className;
    stamp.textContent = text;
    stamp.style.left = `${position.x}px`;
    stamp.style.top = `${position.y}px`;
    this.effectOverlay.appendChild(stamp);
    setTimeout(() => stamp.remove(), 1100);
  }

  // ==========================================
  // SUPERVISOR INPUT
  // ==========================================
  private pickTarget(e: MouseEvent): THREE.Intersection | null {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const targets: THREE.Object3D[] = [];
    this.characters.forEach((c) => targets.push(c.hitbox));
    this.pets.forEach((p) => targets.push(p.hitbox));
    return this.raycaster.intersectObjects(targets, false)[0] || null;
  }

  private onPointerUp(e: PointerEvent) {
    const press = this.pressPoint;
    this.pressPoint = null;
    if (!press || e.button !== 0 || Math.hypot(e.clientX - press.x, e.clientY - press.y) > CLICK_SLOP_PX) return;

    const hit = this.pickTarget(e);
    if (!hit) return;
    this.onHover?.(null, 0, 0);
    if (hit.object.userData.characterId) {
      this.whipPerson(hit.object.userData.characterId);
    } else {
      this.petAnimal(this.pets[hit.object.userData.petIndex]);
    }
  }

  private onPointerMove(e: PointerEvent) {
    if (e.buttons !== 0) return;
    const hit = this.pickTarget(e);
    const style = this.renderer.domElement.style;
    style.cursor = hit ? 'pointer' : '';

    if (!hit) {
      this.onHover?.(null, 0, 0);
      return;
    }
    const rect = this.renderer.domElement.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (hit.object.userData.characterId) {
      const c = this.characters.get(hit.object.userData.characterId) as Character3D;
      this.onHover?.({ title: c.name, person: this.snapshotPerson(c) }, x, y);
    } else {
      const pet = this.pets[hit.object.userData.petIndex];
      this.onHover?.({ title: `${pet.name}, peliharaan kantor. Klik untuk mengelus.`, person: null }, x, y);
    }
  }

  private petAnimal(pet: Pet) {
    this.soundEffects.playPet();
    pet.wait = Math.max(pet.wait, 3);
    const position = this.screenPosition(pet.x, 0.5, pet.z);
    if (position.visible) {
      const stamp = document.createElement('div');
      stamp.className = 'stamp stamp-pet';
      stamp.textContent = pet.name;
      stamp.style.left = `${position.x}px`;
      stamp.style.top = `${position.y}px`;
      this.effectOverlay.appendChild(stamp);
      setTimeout(() => stamp.remove(), 1100);
    }

    let cheered = 0;
    this.characters.forEach((c) => {
      if (Math.hypot(c.x - pet.x, c.z - pet.z) < 4) {
        comfort(c.vitals, 0);
        cheered += 1;
      }
    });
    this.onLog?.('PELIHARAAN', pet.name, cheered > 0 ? `Dielus. ${cheered} karyawan di dekatnya jadi lebih tenang.` : 'Dielus. Tidak ada karyawan di dekatnya.');
  }

  // ==========================================
  // AUTONOMOUS LIFE CYCLES
  // ==========================================
  private runAutonomousBehaviors(delta: number) {
    this.autonomousTimer += delta;
    this.meetingTimer += delta;

    if (this.meetingTimer >= MEETING_EVERY_SECONDS) {
      this.meetingTimer = 0;
      this.callMeeting();
    }

    // Every 16 seconds, someone takes a break at the coffee bar or in the Ruang Tengah
    if (this.autonomousTimer >= 16) {
      this.autonomousTimer = 0;

      const eligible = this.availablePeople();
      if (eligible.length > 0) {
        const actor = this.pick(eligible);
        if (Math.random() < 0.6) {
          this.routeTo(actor, coffeeSpot(Math.random()), 'kopi');
          actor.awayTimer = 7;
        } else {
          const seat = this.freeSeat(LOUNGE_SEATS);
          if (seat) {
            this.routeTo(actor, seat, 'tengah');
            actor.awayTimer = 12;
          }
        }
      }

      this.triggerSpontaneousTeamChat();
    }
  }

  private availablePeople(): Character3D[] {
    return Array.from(this.characters.values()).filter(
      (c) => c.place === c.home && c.currentAnimName === 'sit' && c.path.length === 0 && isProductive(c.vitals.mood)
    );
  }

  private freeSeat(seats: Place[]): Place | undefined {
    const taken = Array.from(this.characters.values()).map((c) => c.place);
    return seats.find((seat) => !taken.includes(seat));
  }

  private callMeeting() {
    const attendees = this.availablePeople()
      .sort(() => Math.random() - 0.5)
      .slice(0, 4);
    if (attendees.length < 2) return;

    attendees.forEach((c) => {
      const seat = this.freeSeat(MEETING_SEATS);
      if (!seat) return;
      this.routeTo(c, seat, 'meeting');
      c.awayTimer = MEETING_LENGTH_SECONDS;
    });
    this.say(attendees[0], 'Rapat dadakan! Bawa laptop, jangan bawa alasan.', 4);
    this.onLog?.('RAPAT', attendees[0].name, `Rapat dadakan di Ruang Meeting bersama ${attendees.length - 1} orang.`);
  }

  private triggerSpontaneousTeamChat() {
    const working = Array.from(this.characters.values()).filter((c) => isProductive(c.vitals.mood));
    if (working.length < 2) return;

    const speaker = this.pick(working);
    const naturalConversations = [
      'Refactor API gateway telemetry selesai, latency P99 turun ke 14ms.',
      'Unit test coverage naik ke 98.4%, pipeline CI hijau bersih.',
      'Arsitektur state synchronizer aman, zero race conditions terdeteksi.',
      'Desain token warna sudah sinkron dengan sistem UI design tokens.',
      'Load test 50.000 concurrent RPS stabil tanpa packet drop.',
      'Sip, deployment preview sudah diverifikasi di branch main.',
      'Kopi dulu sebentar sebelum lanjut sprint planning berikutnya.',
      'Security headers dan CORS policy sudah sesuai OWASP standard.'
    ];

    this.say(speaker, this.pick(naturalConversations), 5);
    this.soundEffects.playButtonClick();
  }

  // ==========================================
  // 3D SPEECH BUBBLE PROJECTED BILLBOARDS
  // ==========================================
  private updateSpeechBubbles(delta: number) {
    this.speechBubbleOverlay.textContent = '';

    this.characters.forEach((c) => {
      if (!c.speechText) return;
      c.speechTimer -= delta;
      if (c.speechTimer <= 0) {
        c.speechText = null;
        return;
      }

      // Bubbles fade out with distance so the far side of the floor doesn't turn into a wall of text
      const distance = this.camera.position.distanceTo(new THREE.Vector3(c.x, 1.5, c.z));
      if (distance > 22) return;
      const position = this.screenPosition(c.x, 2.05, c.z);
      if (!position.visible) return;

      const bubble = document.createElement('div');
      bubble.className = 'speech-bubble-3d';
      bubble.style.transform = `translate(-50%, -100%) translate(${position.x}px, ${position.y}px)`;
      bubble.style.borderLeftColor = c.roleColor;
      bubble.style.opacity = String(Math.min(1, (22 - distance) / 6));

      const who = document.createElement('div');
      who.className = 'speech-who';
      who.textContent = c.name;
      const line = document.createElement('div');
      line.textContent = c.speechText;
      bubble.append(who, line);

      this.speechBubbleOverlay.appendChild(bubble);
    });
  }

  // ==========================================
  // EXTERNAL CONTROL METHODS
  // ==========================================
  public resetCamera() {
    this.freeCamera.flyTo(OVERVIEW_POSITION, OVERVIEW_TARGET);
  }

  /** Flies to stand across the desk from the person, looking at their face. */
  public focusPerson(id: string) {
    const c = this.characters.get(id);
    if (!c) return;
    const facing = c.place.rot ?? c.root.rotation.y;
    // High enough to see over the monitor on the desk between you
    const position = new THREE.Vector3(c.x + Math.sin(facing) * 2.1, 2.25, c.z + Math.cos(facing) * 2.1);
    this.freeCamera.flyTo(position, new THREE.Vector3(c.x, 1.05, c.z));
  }

  public getScreenPositionOf(id: string): { x: number; y: number } | null {
    const c = this.characters.get(id);
    return c ? this.screenPosition(c.x, 0.9, c.z) : null;
  }

  public getSnapshot(): OfficeSnapshot {
    const people = CREW.map((spec) => this.characters.get(spec.id))
      .filter((c): c is Character3D => !!c)
      .map((c) => this.snapshotPerson(c));
    const productive = people.filter((p) => isProductive(p.mood)).length;
    return {
      people,
      productivity: people.length ? Math.round((productive / people.length) * 100) : 0,
      lazyCount: people.filter((p) => p.lazy).length,
      whipCount: this.whipCount
    };
  }

  private snapshotPerson(c: Character3D): PersonSnapshot {
    return {
      id: c.id,
      name: c.name,
      roleTitle: c.roleTitle,
      device: c.device,
      teamName: c.team.name,
      mood: c.vitals.mood,
      moodLabel: MOOD_LABELS[c.vitals.mood],
      energy: Math.round(c.vitals.energy),
      stress: Math.round(c.vitals.stress),
      whips: c.vitals.whips,
      lazy: isLazy(c.vitals.mood)
    };
  }

  public handleTelemetryEvent(tool: string, target?: string, isError: boolean = false) {
    // DialogueEngine already picks the speaker by job: tests go to QA, deploys to DevOps, and so on
    const dlg: DialogueMessage = this.dialogueEngine.getTaskDialogue(tool, target, isError);
    const actor = this.characters.get(dlg.speakerId);
    if (!actor) return;

    applyWork(actor.vitals, isError);
    this.say(actor, dlg.text, dlg.durationMs / 1000);

    if (isError) {
      this.soundEffects.playErrorAlert();
    } else {
      this.soundEffects.playHologramSweep();
    }
  }

  public dispatchTelemetryAction(roleId: string, actionText: string) {
    const char = this.characters.get(roleId);
    if (!char) return;
    this.say(char, actionText, 5);
    this.soundEffects.playButtonClick();
  }
}
