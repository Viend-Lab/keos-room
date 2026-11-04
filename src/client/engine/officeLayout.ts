import type { Mood } from './EmotionSystem';

// One open-plan floor. +Z points toward the entrance (south), -Z toward the window wall (north).
export const ROOM = { minX: -16, maxX: 16, minZ: -9.5, maxZ: 8.5, height: 4 };

/** The walkway everyone uses to get between the desks and the shared areas on the west side. */
export const SPINE_X = -8.3;

export type DeviceKind = 'MAC' | 'PC';

export interface Point {
  x: number;
  z: number;
}

/**
 * A place someone can be. `access` walks from the place itself out to the spine, along lines
 * that are kept clear of furniture, so any two places connect through the spine.
 */
export interface Place extends Point {
  rot?: number;
  access: Point[];
}

export interface Seat extends Place {
  rot: number;
  deskX: number;
  deskZ: number;
}

export interface Team {
  id: string;
  name: string;
  color: string;
  zone: { cx: number; cz: number; width: number; depth: number };
  seats: Seat[];
  boss?: boolean;
}

export interface CrewSpec {
  id: string;
  name: string;
  roleTitle: string;
  roleColor: string;
  asset: string;
  teamId: string;
  seat: number;
  device: DeviceKind;
  startMood: Mood;
}

const SEAT_PITCH = 1.6;
const DESK_DEPTH = 0.75;
const CHAIR_OFFSET = 1.05;
const AISLE_OFFSET = 1.95;

/** Two rows of desks pushed back to back, colleagues facing each other across a low divider. */
function pod(cx: number, cz: number, perSide: number): Seat[] {
  const seats: Seat[] = [];
  [-1, 1].forEach((side) => {
    for (let i = 0; i < perSide; i++) {
      const x = cx + (i - (perSide - 1) / 2) * SEAT_PITCH;
      const z = cz + side * CHAIR_OFFSET;
      const aisle = cz + side * AISLE_OFFSET;
      seats.push({
        x,
        z,
        rot: side < 0 ? 0 : Math.PI,
        deskX: x,
        deskZ: cz + side * (DESK_DEPTH / 2),
        access: [{ x, z }, { x, z: aisle }, { x: SPINE_X, z: aisle }]
      });
    }
  });
  return seats;
}

function podZone(cx: number, cz: number, perSide: number) {
  return { cx, cz, width: perSide * SEAT_PITCH + 1.2, depth: 4.4 };
}

const PM_X = 12.4;
const PM_AISLE_X = 13.3;
const SOUTH_AISLE_Z = 3.2;

export const EXECUTIVE_OFFICE = {
  minX: 11.0,
  maxX: 15.5,
  minZ: -8.5,
  maxZ: -5.0,
  deskX: 13.4,
  deskZ: -6.5,
  seatX: 14.2,
  seatZ: -6.5,
  doorX: 11.5,
  doorZ: -5.0
};

export function executiveSeat(): Seat {
  return {
    x: EXECUTIVE_OFFICE.seatX,
    z: EXECUTIVE_OFFICE.seatZ,
    rot: -Math.PI / 2, // Facing West toward desk & office door
    deskX: EXECUTIVE_OFFICE.deskX,
    deskZ: EXECUTIVE_OFFICE.deskZ,
    access: [
      { x: EXECUTIVE_OFFICE.seatX, z: EXECUTIVE_OFFICE.seatZ },
      { x: EXECUTIVE_OFFICE.doorX, z: EXECUTIVE_OFFICE.deskZ },
      { x: EXECUTIVE_OFFICE.doorX, z: -4.5 },
      { x: PM_AISLE_X, z: -4.5 },
      { x: PM_AISLE_X, z: SOUTH_AISLE_Z },
      { x: SPINE_X, z: SOUTH_AISLE_Z }
    ]
  };
}

export const BOSS_PATROL_WAYPOINTS: Point[] = [
  { x: 11.5, z: -5.0 },              // Exit executive room
  { x: PM_AISLE_X, z: -4.5 },        // PM aisle
  { x: 10.0, z: -2.0 },              // East aisle
  { x: 4.3, z: -3.5 },               // Backend pod north aisle
  { x: 4.3, z: -7.5 },               // Backend pod south aisle
  { x: -3.5, z: -7.5 },              // Frontend pod south aisle
  { x: -3.5, z: -3.5 },              // Frontend pod north aisle
  { x: SPINE_X, z: -1.0 },           // Main spine walkway
  { x: -3.5, z: 2.0 },               // QA pod aisle
  { x: 2.5, z: 2.0 },                // Designer pod aisle
  { x: 6.5, z: 2.0 },                // SecOps pod aisle
  { x: PM_AISLE_X, z: SOUTH_AISLE_Z }, // South aisle towards office
  { x: 11.5, z: -4.5 },              // Return door
  { x: 14.2, z: -6.5 }               // Back to executive desk
];

function bossSeat(z: number): Seat {
  return {
    x: PM_X,
    z,
    rot: -Math.PI / 2,
    deskX: PM_X - 0.75,
    deskZ: z,
    access: [{ x: PM_X, z }, { x: PM_AISLE_X, z }, { x: PM_AISLE_X, z: SOUTH_AISLE_Z }, { x: SPINE_X, z: SOUTH_AISLE_Z }]
  };
}

export const TEAMS: Team[] = [
  {
    id: 'executive',
    name: 'Executive / Direksi',
    color: '#DC2626',
    zone: { cx: 13.25, cz: -6.75, width: 4.5, depth: 3.5 },
    seats: [executiveSeat()],
    boss: true
  },
  { id: 'frontend', name: 'Frontend', color: '#38BDF8', zone: podZone(-3.5, -5.5, 2), seats: pod(-3.5, -5.5, 2) },
  { id: 'backend', name: 'Backend', color: '#A855F7', zone: podZone(4.3, -5.5, 3), seats: pod(4.3, -5.5, 3) },
  { id: 'qa', name: 'Quality Assurance', color: '#10B981', zone: podZone(-3.5, 0, 2), seats: pod(-3.5, 0, 2) },
  { id: 'design', name: 'Designer', color: '#EC4899', zone: podZone(2.5, 0, 1), seats: pod(2.5, 0, 1) },
  { id: 'secops', name: 'Security & DevOps', color: '#F59E0B', zone: podZone(6.5, 0, 1), seats: pod(6.5, 0, 1) },
  {
    id: 'pm',
    name: 'Project Manager',
    color: '#EF4444',
    zone: { cx: 12.3, cz: -1.4, width: 4.2, depth: 6 },
    seats: [bossSeat(-3.2), bossSeat(0.4)],
    boss: true
  }
];

// ==========================================
// SHARED AREAS ON THE WEST SIDE
// ==========================================
export const MEETING_ROOM = { minX: -16, maxX: -9.5, minZ: -9.5, maxZ: -3.5, doorX: -12.75 };

const MEETING_DOOR_INSIDE = -4.3;
const LOUNGE_LANE_NORTH = -2.6;
const LOUNGE_LANE_SOUTH = 2.4;

export const MEETING_SEATS: Place[] = [-13.95, -12.75, -11.55].flatMap((x) => [
  {
    x,
    z: -7.55,
    rot: 0,
    access: [{ x, z: -7.55 }, { x: -15.4, z: -7.55 }, { x: -15.4, z: MEETING_DOOR_INSIDE }, { x: MEETING_ROOM.doorX, z: MEETING_DOOR_INSIDE }, { x: MEETING_ROOM.doorX, z: -3 }, { x: SPINE_X, z: -3 }]
  },
  {
    x,
    z: -5.45,
    rot: Math.PI,
    access: [{ x, z: -5.45 }, { x, z: MEETING_DOOR_INSIDE }, { x: MEETING_ROOM.doorX, z: MEETING_DOOR_INSIDE }, { x: MEETING_ROOM.doorX, z: -3 }, { x: SPINE_X, z: -3 }]
  }
]);

export const LOUNGE_SEATS: Place[] = [
  { x: -15.05, z: -0.6, rot: Math.PI / 2, access: [{ x: -15.05, z: -0.6 }, { x: -14.55, z: -0.6 }, { x: -14.55, z: LOUNGE_LANE_NORTH }, { x: SPINE_X, z: LOUNGE_LANE_NORTH }] },
  { x: -15.05, z: 0.4, rot: Math.PI / 2, access: [{ x: -15.05, z: 0.4 }, { x: -14.55, z: 0.4 }, { x: -14.55, z: LOUNGE_LANE_SOUTH }, { x: SPINE_X, z: LOUNGE_LANE_SOUTH }] },
  { x: -12.9, z: -1.75, rot: 0, access: [{ x: -12.9, z: -1.75 }, { x: -12.9, z: LOUNGE_LANE_NORTH }, { x: SPINE_X, z: LOUNGE_LANE_NORTH }] },
  { x: -12.9, z: 1.55, rot: Math.PI, access: [{ x: -12.9, z: 1.55 }, { x: -12.9, z: LOUNGE_LANE_SOUTH }, { x: SPINE_X, z: LOUNGE_LANE_SOUTH }] }
];

/** Standing at the coffee bar along the south wall. */
export function coffeeSpot(random: number): Place {
  const x = -15 + random * 4.2;
  return { x, z: 6.9, access: [{ x, z: 6.9 }, { x: SPINE_X, z: 6.9 }] };
}

/** Clear lines pets may wander along; each runs straight from the spine. */
export const PET_LINES: { z: number; minX: number; maxX: number }[] = [
  { z: -8.6, minX: -7.5, maxX: 14.5 },
  { z: -2.75, minX: -14, maxX: 9 },
  { z: SOUTH_AISLE_Z, minX: -7.5, maxX: 14.5 },
  { z: 5.4, minX: -15, maxX: 14.5 }
];

const crewAsset = (name: string) => `/assets/crew/office-${name}.glb`;

// The first ten keep the ids DialogueEngine speaks through, which already pick the speaker by job
export const CREW: CrewSpec[] = [
  { id: 'bos', name: 'Bos', roleTitle: 'Direktur Utama', roleColor: '#DC2626', asset: crewAsset('dohun'), teamId: 'executive', seat: 0, device: 'MAC', startMood: 'FOKUS' },
  { id: 'blaze', name: 'Blaze', roleTitle: 'Engineering PM', roleColor: '#EF4444', asset: crewAsset('male-base'), teamId: 'pm', seat: 0, device: 'PC', startMood: 'MARAH' },
  { id: 'nova', name: 'Nova', roleTitle: 'Tech Lead & Architect', roleColor: '#06B6D4', asset: crewAsset('ara'), teamId: 'pm', seat: 1, device: 'MAC', startMood: 'FOKUS' },
  { id: 'rex', name: 'Rex', roleTitle: 'Frontend Engineer', roleColor: '#38BDF8', asset: crewAsset('bomi'), teamId: 'frontend', seat: 0, device: 'MAC', startMood: 'FOKUS' },
  { id: 'bayu', name: 'Bayu', roleTitle: 'Junior Frontend', roleColor: '#60A5FA', asset: crewAsset('chan'), teamId: 'frontend', seat: 1, device: 'PC', startMood: 'TIDUR' },
  { id: 'rina', name: 'Rina', roleTitle: 'Junior Frontend', roleColor: '#A3E635', asset: crewAsset('eun'), teamId: 'frontend', seat: 2, device: 'MAC', startMood: 'FOKUS' },
  { id: 'putri', name: 'Putri', roleTitle: 'Frontend Magang', roleColor: '#F472B6', asset: crewAsset('daeun'), teamId: 'frontend', seat: 3, device: 'PC', startMood: 'FOKUS' },
  { id: 'kael', name: 'Kael', roleTitle: 'Backend Engineer', roleColor: '#A855F7', asset: crewAsset('chan'), teamId: 'backend', seat: 0, device: 'PC', startMood: 'FOKUS' },
  { id: 'dimas', name: 'Dimas', roleTitle: 'Backend Lembur Tetap', roleColor: '#34D399', asset: crewAsset('dohun'), teamId: 'backend', seat: 1, device: 'PC', startMood: 'FOKUS' },
  { id: 'zero', name: 'Zero', roleTitle: 'R&D Specialist', roleColor: '#6366F1', asset: crewAsset('min'), teamId: 'backend', seat: 2, device: 'MAC', startMood: 'LELAH' },
  { id: 'agus', name: 'Agus', roleTitle: 'Junior Backend', roleColor: '#5EEAD4', asset: crewAsset('min'), teamId: 'backend', seat: 3, device: 'PC', startMood: 'LELAH' },
  { id: 'joko', name: 'Joko', roleTitle: 'Backend Magang', roleColor: '#A78BFA', asset: crewAsset('jin'), teamId: 'backend', seat: 4, device: 'MAC', startMood: 'TIDUR' },
  { id: 'viper', name: 'Viper', roleTitle: 'QA Lead', roleColor: '#10B981', asset: crewAsset('dohun'), teamId: 'qa', seat: 0, device: 'PC', startMood: 'FOKUS' },
  { id: 'echo', name: 'Echo', roleTitle: 'QC / User Tester', roleColor: '#2DD4BF', asset: crewAsset('eun'), teamId: 'qa', seat: 1, device: 'MAC', startMood: 'FOKUS' },
  { id: 'eka', name: 'Eka', roleTitle: 'Staf QA', roleColor: '#FBBF24', asset: crewAsset('ara'), teamId: 'qa', seat: 2, device: 'MAC', startMood: 'MALAS' },
  { id: 'aura', name: 'Aura', roleTitle: 'UI/UX Designer', roleColor: '#EC4899', asset: crewAsset('daeun'), teamId: 'design', seat: 0, device: 'MAC', startMood: 'FOKUS' },
  { id: 'sari', name: 'Sari', roleTitle: 'Junior Designer', roleColor: '#FB923C', asset: crewAsset('bomi'), teamId: 'design', seat: 1, device: 'MAC', startMood: 'MALAS' },
  { id: 'rook', name: 'Rook', roleTitle: 'Security Officer', roleColor: '#F59E0B', asset: crewAsset('jin'), teamId: 'secops', seat: 0, device: 'PC', startMood: 'FOKUS' },
  { id: 'tark', name: 'Tark', roleTitle: 'DevOps Specialist', roleColor: '#F97316', asset: crewAsset('garam'), teamId: 'secops', seat: 1, device: 'PC', startMood: 'FOKUS' }
];

export function getTeam(id: string): Team {
  return TEAMS.find((t) => t.id === id) as Team;
}
