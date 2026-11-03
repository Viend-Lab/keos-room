import * as THREE from 'three';

export interface CameraBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
}

const LOOK_SPEED = 0.005;
const WALK_SPEED = 5;
const RUN_SPEED = 12;
const WHEEL_STEP = 0.012;
const MAX_PITCH = 0.6;
const MIN_PITCH = -1.5;

/**
 * Fly-anywhere camera: drag to look, scroll to move toward the cursor, WASD/arrows to walk,
 * Q/E to go down/up, Shift to hurry. It never leaves the room.
 */
export class FreeCamera {
  private yaw = 0;
  private pitch = 0;
  private position = new THREE.Vector3();
  private keys = new Set<string>();
  private dragFrom: { x: number; y: number } | null = null;
  private flight: { position: THREE.Vector3; yaw: number; pitch: number } | null = null;
  private raycaster = new THREE.Raycaster();

  constructor(
    private camera: THREE.PerspectiveCamera,
    private element: HTMLElement,
    private bounds: CameraBounds
  ) {
    element.addEventListener('pointerdown', (e) => {
      this.dragFrom = { x: e.clientX, y: e.clientY };
    });
    window.addEventListener('pointerup', () => {
      this.dragFrom = null;
    });
    element.addEventListener('pointermove', (e) => this.onDrag(e));
    element.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });
    element.addEventListener('contextmenu', (e) => e.preventDefault());

    window.addEventListener('keydown', (e) => {
      if (this.isTyping(e)) return;
      const key = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'q', 'e', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'shift'].includes(key)) {
        this.keys.add(key);
        this.flight = null;
        if (key.startsWith('arrow')) e.preventDefault();
      }
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.key.toLowerCase()));
    window.addEventListener('blur', () => this.keys.clear());
  }

  private isTyping(e: KeyboardEvent): boolean {
    const target = e.target as HTMLElement | null;
    return !!target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
  }

  private onDrag(e: PointerEvent) {
    if (!this.dragFrom || e.buttons === 0) return;
    const dx = e.clientX - this.dragFrom.x;
    const dy = e.clientY - this.dragFrom.y;
    this.dragFrom = { x: e.clientX, y: e.clientY };
    this.flight = null;
    this.yaw += dx * LOOK_SPEED;
    this.pitch = THREE.MathUtils.clamp(this.pitch + dy * LOOK_SPEED, MIN_PITCH, MAX_PITCH);
  }

  /** Scrolling moves along the ray under the cursor, so you zoom into whatever you point at. */
  private onWheel(e: WheelEvent) {
    e.preventDefault();
    this.flight = null;
    const rect = this.element.getBoundingClientRect();
    const pointer = new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
    this.raycaster.setFromCamera(pointer, this.camera);
    const step = THREE.MathUtils.clamp(-e.deltaY * WHEEL_STEP, -3, 3);
    this.position.addScaledVector(this.raycaster.ray.direction, step);
    this.clamp(this.position);
  }

  private direction(yaw: number, pitch: number): THREE.Vector3 {
    return new THREE.Vector3(-Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch));
  }

  private clamp(v: THREE.Vector3) {
    v.x = THREE.MathUtils.clamp(v.x, this.bounds.minX, this.bounds.maxX);
    v.y = THREE.MathUtils.clamp(v.y, this.bounds.minY, this.bounds.maxY);
    v.z = THREE.MathUtils.clamp(v.z, this.bounds.minZ, this.bounds.maxZ);
  }

  private anglesToward(from: THREE.Vector3, target: THREE.Vector3): { yaw: number; pitch: number } {
    const d = target.clone().sub(from).normalize();
    return { yaw: Math.atan2(-d.x, -d.z), pitch: Math.asin(THREE.MathUtils.clamp(d.y, -1, 1)) };
  }

  public set(position: THREE.Vector3, target: THREE.Vector3) {
    this.position.copy(position);
    this.clamp(this.position);
    const angles = this.anglesToward(this.position, target);
    this.yaw = angles.yaw;
    this.pitch = angles.pitch;
    this.flight = null;
    this.apply();
  }

  public flyTo(position: THREE.Vector3, target: THREE.Vector3) {
    const destination = position.clone();
    this.clamp(destination);
    const angles = this.anglesToward(destination, target);
    // Turn the short way round
    let yaw = angles.yaw;
    while (yaw - this.yaw > Math.PI) yaw -= Math.PI * 2;
    while (yaw - this.yaw < -Math.PI) yaw += Math.PI * 2;
    this.flight = { position: destination, yaw, pitch: angles.pitch };
  }

  public update(delta: number) {
    if (this.flight) {
      const ease = Math.min(1, 3.5 * delta);
      this.position.lerp(this.flight.position, ease);
      this.yaw += (this.flight.yaw - this.yaw) * ease;
      this.pitch += (this.flight.pitch - this.pitch) * ease;
      if (this.position.distanceTo(this.flight.position) < 0.01 && Math.abs(this.flight.yaw - this.yaw) < 0.002) this.flight = null;
    } else if (this.keys.size > 0) {
      const speed = (this.keys.has('shift') ? RUN_SPEED : WALK_SPEED) * delta;
      const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
      const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
      const move = new THREE.Vector3();
      if (this.keys.has('w') || this.keys.has('arrowup')) move.add(forward);
      if (this.keys.has('s') || this.keys.has('arrowdown')) move.sub(forward);
      if (this.keys.has('d') || this.keys.has('arrowright')) move.add(right);
      if (this.keys.has('a') || this.keys.has('arrowleft')) move.sub(right);
      if (this.keys.has('e')) move.y += 1;
      if (this.keys.has('q')) move.y -= 1;
      if (move.lengthSq() > 0) this.position.addScaledVector(move.normalize(), speed);
      this.clamp(this.position);
    }
    this.apply();
  }

  private apply() {
    this.camera.position.copy(this.position);
    this.camera.lookAt(this.position.clone().add(this.direction(this.yaw, this.pitch)));
  }
}
