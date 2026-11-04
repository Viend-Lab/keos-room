import * as THREE from 'three';
import type { Mood } from './EmotionSystem';

export type ScreenKind = 'code' | 'slack' | 'off' | 'angry';

function canvasTexture(width: number, height: number, draw: (g: CanvasRenderingContext2D) => void): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  draw(canvas.getContext('2d') as CanvasRenderingContext2D);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// ==========================================
// DEVICE SCREENS
// ==========================================
export function createScreenMaterials(): Record<ScreenKind, THREE.MeshBasicMaterial> {
  const code = canvasTexture(256, 160, (g) => {
    g.fillStyle = '#10192B';
    g.fillRect(0, 0, 256, 160);
    const colors = ['#38BDF8', '#34D399', '#F472B6', '#FBBF24', '#E2E8F0'];
    for (let i = 0; i < 12; i++) {
      g.fillStyle = colors[i % colors.length];
      g.fillRect(12 + (i % 3) * 14, 10 + i * 12, 50 + ((i * 53) % 150), 6);
    }
  });
  const slack = canvasTexture(256, 160, (g) => {
    g.fillStyle = '#F8FAFC';
    g.fillRect(0, 0, 256, 160);
    const tiles = ['#EF4444', '#F59E0B', '#EC4899', '#8B5CF6', '#10B981', '#3B82F6'];
    tiles.forEach((color, i) => {
      g.fillStyle = color;
      g.fillRect(10 + (i % 3) * 80, 10 + Math.floor(i / 3) * 74, 72, 50);
      g.fillStyle = '#FFFFFF';
      g.beginPath();
      const x = 38 + (i % 3) * 80;
      const y = 24 + Math.floor(i / 3) * 74;
      g.moveTo(x, y);
      g.lineTo(x + 18, y + 11);
      g.lineTo(x, y + 22);
      g.fill();
    });
  });
  const off = canvasTexture(64, 40, (g) => {
    g.fillStyle = '#05070C';
    g.fillRect(0, 0, 64, 40);
  });
  const angry = canvasTexture(256, 160, (g) => {
    g.fillStyle = '#7F1D1D';
    g.fillRect(0, 0, 256, 160);
    g.fillStyle = '#FECACA';
    g.font = 'bold 34px sans-serif';
    g.textAlign = 'center';
    g.fillText('BUILD', 128, 70);
    g.fillText('FAILED', 128, 110);
  });

  return {
    code: new THREE.MeshBasicMaterial({ map: code }),
    slack: new THREE.MeshBasicMaterial({ map: slack }),
    off: new THREE.MeshBasicMaterial({ map: off }),
    angry: new THREE.MeshBasicMaterial({ map: angry })
  };
}

export function screenForMood(mood: Mood): ScreenKind {
  if (mood === 'TIDUR') return 'off';
  if (mood === 'MALAS') return 'slack';
  if (mood === 'MARAH') return 'angry';
  return 'code';
}

// ==========================================
// DEVICES: origin on the desk top, +Z points at the person using it
// ==========================================
export function buildMacBook(screenMat: THREE.Material): { group: THREE.Group; screen: THREE.Mesh } {
  const group = new THREE.Group();
  const aluminium = new THREE.MeshStandardMaterial({ color: '#D5D8DC', roughness: 0.32, metalness: 0.75 });
  const black = new THREE.MeshStandardMaterial({ color: '#16181D', roughness: 0.5 });

  const base = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.022, 0.5), aluminium);
  base.position.y = 0.011;
  base.castShadow = true;
  group.add(base);

  const keys = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.004, 0.24), black);
  keys.position.set(0, 0.023, -0.07);
  group.add(keys);

  const trackpad = new THREE.Mesh(
    new THREE.BoxGeometry(0.26, 0.003, 0.15),
    new THREE.MeshStandardMaterial({ color: '#C2C5CA', roughness: 0.25, metalness: 0.7 })
  );
  trackpad.position.set(0, 0.023, 0.15);
  group.add(trackpad);

  const lid = new THREE.Group();
  lid.position.set(0, 0.022, -0.245);
  lid.rotation.x = -0.28;
  group.add(lid);

  const shell = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.47, 0.012), aluminium);
  shell.position.y = 0.235;
  shell.castShadow = true;
  lid.add(shell);

  const bezel = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.45), new THREE.MeshBasicMaterial({ color: '#050608' }));
  bezel.position.set(0, 0.235, 0.0065);
  lid.add(bezel);

  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.66, 0.41), screenMat);
  screen.position.set(0, 0.235, 0.0075);
  lid.add(screen);

  // Glowing lid badge: what makes it read as a Mac from behind
  const badge = new THREE.Mesh(new THREE.CircleGeometry(0.045, 20), new THREE.MeshBasicMaterial({ color: '#F8FAFC' }));
  badge.position.set(0, 0.25, -0.0065);
  badge.rotation.y = Math.PI;
  lid.add(badge);

  return { group, screen };
}

export function buildPC(screenMat: THREE.Material, accent: string): { group: THREE.Group; screen: THREE.Mesh } {
  const group = new THREE.Group();
  const black = new THREE.MeshStandardMaterial({ color: '#1A1C22', roughness: 0.55, metalness: 0.3 });

  const foot = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.02, 0.24), black);
  foot.position.set(0, 0.01, -0.2);
  group.add(foot);

  const neck = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.2, 0.04), black);
  neck.position.set(0, 0.11, -0.22);
  group.add(neck);

  const frame = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.5, 0.04), black);
  frame.position.set(0, 0.46, -0.2);
  frame.castShadow = true;
  group.add(frame);

  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.78, 0.46), screenMat);
  screen.position.set(0, 0.46, -0.179);
  group.add(screen);

  const tower = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.46, 0.42), black);
  tower.position.set(0.6, 0.23, -0.08);
  tower.castShadow = true;
  group.add(tower);

  // RGB strip so a PC is recognisable at a distance
  const rgb = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.48, 0.012), new THREE.MeshBasicMaterial({ color: accent }));
  rgb.position.set(0.6, 0.23, 0.135);
  group.add(rgb);

  const keyboard = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.025, 0.2), black);
  keyboard.position.set(0, 0.0125, 0.18);
  group.add(keyboard);

  const mouse = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.03, 0.13), black);
  mouse.position.set(0.44, 0.015, 0.18);
  group.add(mouse);

  return { group, screen };
}

// ==========================================
// FLOORS
// ==========================================
export function createFloorMaterial(kind: 'carpet' | 'wood' | 'tile', base: string, width: number, depth: number): THREE.MeshStandardMaterial {
  const color = new THREE.Color(base);
  const shade = (amount: number) => `#${color.clone().offsetHSL(0, 0, amount).getHexString()}`;

  const texture = canvasTexture(256, 256, (g) => {
    g.fillStyle = base;
    g.fillRect(0, 0, 256, 256);
    if (kind === 'carpet') {
      // Square carpet tiles laid in alternating shades
      for (let x = 0; x < 2; x++) {
        for (let y = 0; y < 2; y++) {
          g.fillStyle = shade((x + y) % 2 === 0 ? 0.008 : -0.008);
          g.fillRect(x * 128, y * 128, 128, 128);
        }
      }
    } else if (kind === 'wood') {
      for (let y = 0; y < 4; y++) {
        const offset = y % 2 === 0 ? 0 : 128;
        g.fillStyle = shade(y % 2 === 0 ? 0.02 : -0.02);
        g.fillRect(0, y * 64, 256, 64);
        g.fillStyle = shade(-0.12);
        g.fillRect(0, y * 64, 256, 2);
        g.fillRect(offset + 60, y * 64, 2, 64);
        g.fillRect((offset + 188) % 256, y * 64, 2, 64);
      }
    } else {
      g.strokeStyle = shade(-0.14);
      g.lineWidth = 3;
      for (let i = 0; i <= 2; i++) {
        g.beginPath();
        g.moveTo(i * 128, 0);
        g.lineTo(i * 128, 256);
        g.moveTo(0, i * 128);
        g.lineTo(256, i * 128);
        g.stroke();
      }
    }
  });
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(width / (kind === 'carpet' ? 1.2 : 2), depth / (kind === 'carpet' ? 1.2 : 2));
  texture.anisotropy = 8;
  return new THREE.MeshStandardMaterial({ map: texture, roughness: kind === 'carpet' ? 0.95 : 0.55 });
}

// ==========================================
// ROOM FURNITURE
// ==========================================
export function buildMeetingScreen(): THREE.Mesh {
  const texture = canvasTexture(512, 256, (g) => {
    g.fillStyle = '#FFFFFF';
    g.fillRect(0, 0, 512, 256);
    g.fillStyle = '#16233F';
    g.font = '700 34px Arial, sans-serif';
    g.fillText('Target Q4: naik terus', 28, 52);
    [40, 62, 58, 96, 130, 176].forEach((height, i) => {
      g.fillStyle = i === 5 ? '#C4261D' : '#1F3A6E';
      g.fillRect(40 + i * 74, 236 - height, 48, height);
    });
  });
  const dark = new THREE.MeshStandardMaterial({ color: '#1A1C22' });
  return new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.8, 0.08), [dark, dark, dark, dark, new THREE.MeshBasicMaterial({ map: texture }), dark]);
}

export function buildCafeTable(): THREE.Group {
  const group = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({ color: '#2F3136', roughness: 0.4, metalness: 0.6 });
  const wood = new THREE.MeshStandardMaterial({ color: '#A8743F', roughness: 0.5 });
  part(new THREE.CylinderGeometry(0.55, 0.55, 0.05, 24), wood, 0, 0.78, 0, group);
  part(new THREE.CylinderGeometry(0.05, 0.05, 0.76, 10), metal, 0, 0.38, 0, group);
  part(new THREE.CylinderGeometry(0.28, 0.3, 0.03, 18), metal, 0, 0.015, 0, group);
  part(new THREE.CylinderGeometry(0.07, 0.06, 0.1, 12), new THREE.MeshStandardMaterial({ color: '#F8FAFC' }), 0.15, 0.85, 0.08, group);
  [-0.85, 0.85].forEach((x) => {
    part(new THREE.CylinderGeometry(0.2, 0.2, 0.06, 16), new THREE.MeshStandardMaterial({ color: '#7F1D1D', roughness: 0.7 }), x, 0.5, 0, group);
    part(new THREE.CylinderGeometry(0.03, 0.03, 0.48, 8), metal, x, 0.24, 0, group);
  });
  return group;
}

export function buildCoffeeBar(length: number): THREE.Group {
  const group = new THREE.Group();
  const cabinet = new THREE.MeshStandardMaterial({ color: '#3F3F46', roughness: 0.5 });
  const top = new THREE.MeshStandardMaterial({ color: '#8D5B2E', roughness: 0.3 });
  part(new THREE.BoxGeometry(length, 0.92, 0.8), cabinet, 0, 0.46, 0, group);
  part(new THREE.BoxGeometry(length + 0.08, 0.06, 0.88), top, 0, 0.95, 0, group);

  // Espresso machine with its cups, then a water gallon and microwave
  part(new THREE.BoxGeometry(0.75, 0.55, 0.5), new THREE.MeshStandardMaterial({ color: '#DC2626', roughness: 0.3, metalness: 0.5 }), -length / 2 + 0.8, 1.26, 0, group);
  for (let i = 0; i < 4; i++) {
    part(new THREE.CylinderGeometry(0.05, 0.04, 0.1, 10), new THREE.MeshStandardMaterial({ color: '#F8FAFC' }), -length / 2 + 1.4 + i * 0.16, 1.03, 0.2, group);
  }
  part(new THREE.CylinderGeometry(0.17, 0.17, 0.5, 16), new THREE.MeshStandardMaterial({ color: '#BAE6FD', transparent: true, opacity: 0.75 }), 0.3, 1.23, 0, group);
  part(new THREE.BoxGeometry(0.6, 0.36, 0.42), new THREE.MeshStandardMaterial({ color: '#D4D4D8', metalness: 0.5, roughness: 0.4 }), length / 2 - 0.7, 1.16, 0, group);
  return group;
}

/** Open-plan desk: white top on metal legs. Origin on the floor at the desk centre, +Z toward the sitter. */
export function buildOfficeDesk(width: number, depth: number, height: number): THREE.Group {
  const group = new THREE.Group();
  const top = new THREE.MeshStandardMaterial({ color: '#F1F0EC', roughness: 0.45 });
  const metal = new THREE.MeshStandardMaterial({ color: '#4B5058', roughness: 0.4, metalness: 0.6 });

  const slab = part(new THREE.BoxGeometry(width, 0.04, depth), top, 0, height - 0.02, 0, group);
  slab.receiveShadow = true;
  [-1, 1].forEach((sx) => {
    part(new THREE.BoxGeometry(0.05, height - 0.04, depth - 0.1), metal, sx * (width / 2 - 0.06), (height - 0.04) / 2, 0, group);
  });
  part(new THREE.BoxGeometry(width - 0.2, 0.3, 0.02), metal, 0, height - 0.25, -depth / 2 + 0.04, group);

  return group;
}

/** Cubicle wall standing between two neighbours' desks. Origin on the floor at its centre, running along Z. */
export function buildSidePanel(length: number, height: number, color: string): THREE.Group {
  const group = new THREE.Group();
  part(new THREE.BoxGeometry(0.05, height, length), new THREE.MeshStandardMaterial({ color, roughness: 0.95 }), 0, height / 2, 0, group);
  part(new THREE.BoxGeometry(0.07, 0.04, length + 0.02), new THREE.MeshStandardMaterial({ color: '#4B5058', roughness: 0.4, metalness: 0.6 }), 0, height, 0, group);
  return group;
}

/** A sign hung from the ceiling on two wires, readable from both sides. */
export function buildHangingSign(text: string, color: string, ceiling: number, bottom: number): THREE.Group {
  const group = new THREE.Group();
  const texture = canvasTexture(512, 128, (g) => {
    g.fillStyle = '#FFFFFF';
    g.fillRect(0, 0, 512, 128);
    g.fillStyle = color;
    g.fillRect(0, 0, 512, 16);
    g.fillStyle = '#16233F';
    g.font = '700 54px Arial, sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(text, 256, 74, 480);
  });
  const width = 2.4;
  const height = 0.6;
  const material = new THREE.MeshBasicMaterial({ map: texture });
  [0, Math.PI].forEach((turn) => {
    const face = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
    face.rotation.y = turn;
    face.position.set(0, bottom + height / 2, turn === 0 ? 0.011 : -0.011);
    group.add(face);
  });
  const wire = new THREE.MeshBasicMaterial({ color: '#30343B' });
  [-0.9, 0.9].forEach((x) => {
    const length = ceiling - bottom - height;
    part(new THREE.CylinderGeometry(0.008, 0.008, length, 4), wire, x, bottom + height + length / 2, 0, group);
  });
  return group;
}

export function buildCabinet(width: number, height: number, color: string): THREE.Group {
  const group = new THREE.Group();
  part(new THREE.BoxGeometry(width, height, 0.5), new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.2 }), 0, height / 2, 0, group);
  const seam = new THREE.MeshStandardMaterial({ color: '#27272A' });
  for (let i = 1; i < 3; i++) {
    part(new THREE.BoxGeometry(width - 0.04, 0.012, 0.01), seam, 0, (height * i) / 3, 0.254, group);
  }
  return group;
}

// ==========================================
// BOARDS & MOOD ICONS
// ==========================================
export function buildDeadlineBoard(): THREE.Mesh {
  const texture = canvasTexture(512, 256, (g) => {
    g.fillStyle = '#FFFFFF';
    g.fillRect(0, 0, 512, 256);
    g.fillStyle = '#C4261D';
    g.font = '800 58px Arial, sans-serif';
    g.textAlign = 'center';
    g.fillText('DEADLINE:', 256, 86);
    g.fillText('KEMARIN', 256, 160);
    g.fillStyle = '#16233F';
    g.font = '600 26px Arial, sans-serif';
    g.fillText('Lembur = dedikasi', 256, 218);
  });
  return new THREE.Mesh(new THREE.BoxGeometry(4.2, 2.1, 0.06), [
    new THREE.MeshStandardMaterial({ color: '#27272A' }),
    new THREE.MeshStandardMaterial({ color: '#27272A' }),
    new THREE.MeshStandardMaterial({ color: '#27272A' }),
    new THREE.MeshStandardMaterial({ color: '#27272A' }),
    new THREE.MeshBasicMaterial({ map: texture }),
    new THREE.MeshStandardMaterial({ color: '#27272A' })
  ]);
}

export function createMoodMaterials(): Partial<Record<Mood, THREE.SpriteMaterial>> {
  const icon = (draw: (g: CanvasRenderingContext2D) => void) =>
    new THREE.SpriteMaterial({
      map: canvasTexture(128, 128, (g) => {
        g.fillStyle = '#FFFFFF';
        g.beginPath();
        g.arc(64, 64, 58, 0, Math.PI * 2);
        g.fill();
        draw(g);
      }),
      depthTest: false
    });

  const heart = (g: CanvasRenderingContext2D, color: string) => {
    g.fillStyle = color;
    g.beginPath();
    g.moveTo(64, 100);
    g.bezierCurveTo(10, 62, 30, 22, 64, 48);
    g.bezierCurveTo(98, 22, 118, 62, 64, 100);
    g.fill();
  };

  return {
    TIDUR: icon((g) => {
      g.fillStyle = '#2563EB';
      g.font = '800 44px Arial';
      g.fillText('Z', 26, 92);
      g.font = '800 36px Arial';
      g.fillText('z', 58, 68);
      g.font = '800 28px Arial';
      g.fillText('z', 84, 46);
    }),
    LELAH: icon((g) => {
      g.fillStyle = '#38BDF8';
      g.beginPath();
      g.moveTo(64, 22);
      g.bezierCurveTo(30, 66, 36, 104, 64, 104);
      g.bezierCurveTo(92, 104, 98, 66, 64, 22);
      g.fill();
    }),
    MALAS: icon((g) => {
      g.fillStyle = '#16233F';
      g.fillRect(42, 20, 44, 88);
      g.fillStyle = '#F472B6';
      g.fillRect(47, 28, 34, 66);
    }),
    MARAH: icon((g) => {
      g.strokeStyle = '#DC2626';
      g.lineWidth = 12;
      g.lineCap = 'round';
      [[30, 30, 54, 52], [98, 30, 74, 52], [30, 98, 54, 76], [98, 98, 74, 76]].forEach(([a, b, c, d]) => {
        g.beginPath();
        g.moveTo(a, b);
        g.lineTo(c, d);
        g.moveTo(c, b);
        g.lineTo(c, d);
        g.moveTo(a, d);
        g.lineTo(c, d);
        g.stroke();
      });
    }),
    TAKUT: icon((g) => {
      g.fillStyle = '#EA580C';
      g.font = '900 86px Arial';
      g.textAlign = 'center';
      g.fillText('!!', 64, 94);
    }),
    SENANG: icon((g) => heart(g, '#EC4899'))
  };
}

// ==========================================
// PETS: low-poly, built facing +Z
// ==========================================
export interface PetModel {
  root: THREE.Group;
  legs: THREE.Object3D[];
  tail: THREE.Object3D;
  head: THREE.Object3D;
}

function part(geometry: THREE.BufferGeometry, material: THREE.Material, x: number, y: number, z: number, parent: THREE.Object3D): THREE.Mesh {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  parent.add(mesh);
  return mesh;
}

function addFace(head: THREE.Object3D, size: number, y: number, z: number) {
  const eye = new THREE.MeshBasicMaterial({ color: '#111111' });
  part(new THREE.SphereGeometry(size, 8, 8), eye, -size * 2.2, y, z, head);
  part(new THREE.SphereGeometry(size, 8, 8), eye, size * 2.2, y, z, head);
}

function addLegs(root: THREE.Object3D, mat: THREE.Material, w: number, h: number, dx: number, dz: number): THREE.Object3D[] {
  return [[-dx, dz], [dx, dz], [-dx, -dz], [dx, -dz]].map(([x, z]) => {
    const pivot = new THREE.Group();
    pivot.position.set(x, h, z);
    root.add(pivot);
    part(new THREE.BoxGeometry(w, h, w), mat, 0, -h / 2, 0, pivot);
    return pivot;
  });
}

export function buildCat(furColor: string, accentColor: string): PetModel {
  const root = new THREE.Group();
  const fur = new THREE.MeshStandardMaterial({ color: furColor, roughness: 0.85 });
  const accent = new THREE.MeshStandardMaterial({ color: accentColor, roughness: 0.85 });

  part(new THREE.BoxGeometry(0.26, 0.24, 0.52), fur, 0, 0.3, 0, root);
  const legs = addLegs(root, accent, 0.07, 0.2, 0.09, 0.18);

  const head = new THREE.Group();
  head.position.set(0, 0.46, 0.29);
  root.add(head);
  part(new THREE.BoxGeometry(0.28, 0.24, 0.24), fur, 0, 0, 0, head);
  [-0.09, 0.09].forEach((x) => {
    const ear = part(new THREE.ConeGeometry(0.06, 0.12, 4), accent, x, 0.17, 0, head);
    ear.rotation.y = Math.PI / 4;
  });
  addFace(head, 0.022, 0.02, 0.122);

  const tail = new THREE.Group();
  tail.position.set(0, 0.38, -0.26);
  root.add(tail);
  const tailMesh = part(new THREE.CylinderGeometry(0.025, 0.035, 0.36, 8), accent, 0, 0.17, -0.04, tail);
  tailMesh.rotation.x = -0.25;

  return { root, legs, tail, head };
}

export function buildCorgi(): PetModel {
  const root = new THREE.Group();
  const orange = new THREE.MeshStandardMaterial({ color: '#D98A3D', roughness: 0.85 });
  const white = new THREE.MeshStandardMaterial({ color: '#FBF7EF', roughness: 0.85 });

  part(new THREE.BoxGeometry(0.34, 0.28, 0.72), orange, 0, 0.3, 0, root);
  part(new THREE.BoxGeometry(0.28, 0.1, 0.5), white, 0, 0.17, 0.05, root);
  const legs = addLegs(root, white, 0.09, 0.16, 0.12, 0.27);

  const head = new THREE.Group();
  head.position.set(0, 0.5, 0.4);
  root.add(head);
  part(new THREE.BoxGeometry(0.32, 0.28, 0.28), orange, 0, 0, 0, head);
  part(new THREE.BoxGeometry(0.16, 0.12, 0.14), white, 0, -0.06, 0.18, head);
  part(new THREE.BoxGeometry(0.05, 0.04, 0.03), new THREE.MeshBasicMaterial({ color: '#111111' }), 0, -0.02, 0.26, head);
  [-0.11, 0.11].forEach((x) => {
    const ear = part(new THREE.ConeGeometry(0.075, 0.2, 4), orange, x, 0.22, 0, head);
    ear.rotation.y = Math.PI / 4;
  });
  addFace(head, 0.024, 0.05, 0.142);

  const tail = new THREE.Group();
  tail.position.set(0, 0.42, -0.36);
  root.add(tail);
  part(new THREE.SphereGeometry(0.07, 8, 8), white, 0, 0.03, -0.02, tail);

  return { root, legs, tail, head };
}

export function buildRabbit(): PetModel {
  const root = new THREE.Group();
  const fur = new THREE.MeshStandardMaterial({ color: '#F5F5F4', roughness: 0.9 });
  const pink = new THREE.MeshStandardMaterial({ color: '#F9A8D4', roughness: 0.8 });

  part(new THREE.SphereGeometry(0.2, 12, 10), fur, 0, 0.22, 0, root).scale.set(1, 0.95, 1.25);
  const legs = addLegs(root, fur, 0.07, 0.08, 0.1, 0.13);

  const head = new THREE.Group();
  head.position.set(0, 0.38, 0.2);
  root.add(head);
  part(new THREE.SphereGeometry(0.13, 12, 10), fur, 0, 0, 0, head);
  [-0.055, 0.055].forEach((x) => {
    part(new THREE.BoxGeometry(0.055, 0.26, 0.035), fur, x, 0.2, -0.02, head);
    part(new THREE.BoxGeometry(0.03, 0.2, 0.01), pink, x, 0.2, 0.002, head);
  });
  addFace(head, 0.018, 0.02, 0.118);

  const tail = new THREE.Group();
  tail.position.set(0, 0.24, -0.24);
  root.add(tail);
  part(new THREE.SphereGeometry(0.06, 8, 8), fur, 0, 0, 0, tail);

  return { root, legs, tail, head };
}
