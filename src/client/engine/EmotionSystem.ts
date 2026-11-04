export type Mood = 'FOKUS' | 'LELAH' | 'MALAS' | 'TIDUR' | 'MARAH' | 'TAKUT' | 'SENANG';

export type WhipOutcome = 'WOKE' | 'PROTEST' | 'ANGRY';

export interface Vitals {
  mood: Mood;
  energy: number;
  stress: number;
  moodTimer: number;
  whips: number;
}

export const MOOD_LABELS: Record<Mood, string> = {
  FOKUS: 'Fokus kerja',
  LELAH: 'Kelelahan',
  MALAS: 'Malas-malasan',
  TIDUR: 'Ketiduran',
  MARAH: 'Marah',
  TAKUT: 'Kerja ketakutan',
  SENANG: 'Senang'
};

export const MOOD_LINES: Record<Mood, string[]> = {
  FOKUS: ['Oke, lanjut ngerjain tiket.', 'Sedikit lagi selesai, semoga.', 'Revisi ke-14, aman.'],
  LELAH: ['Capek banget, Pak...', 'Mata saya sudah kotak-kotak.', 'Kapan gajian ya?', 'Lembur lagi, lembur lagi.'],
  MALAS: ['Scroll sebentar, nggak ada yang lihat kan?', 'Lima menit lagi deh...', 'Nanti aja, deadline masih jam 5.'],
  TIDUR: ['Zzz... merge conflict... zzz', 'Zzz... gaji naik... zzz', 'Zzz... jangan meeting lagi... zzz'],
  MARAH: ['Requirement-nya ganti LAGI?!', 'Saya resign aja lah!', 'Siapa yang push langsung ke main?!', 'Meeting ini harusnya email!'],
  TAKUT: ['Iya Bos! Kerja, Bos!', 'Ampun, Bos! Saya lanjut!', 'Nggak tidur kok, cuma merem!'],
  SENANG: ['Akhirnya bisa napas.', 'Wah, ada yang lucu lewat!', 'Kopi gratis, hidup indah.']
};

export const PROTEST_LINES = ['Saya lagi kerja, Bos!', 'Lho, salah saya apa?', 'Ini sudah ngetik dari tadi, Bos.', 'Nanti saya lapor HRD lho.'];

const clamp = (value: number) => Math.max(0, Math.min(100, value));

export function createVitals(mood: Mood, energy: number, stress: number): Vitals {
  return { mood, energy, stress, moodTimer: mood === 'MALAS' || mood === 'MARAH' ? 25 : 0, whips: 0 };
}

export function isLazy(mood: Mood): boolean {
  return mood === 'TIDUR' || mood === 'MALAS' || mood === 'LELAH';
}

export function isProductive(mood: Mood): boolean {
  return mood === 'FOKUS' || mood === 'TAKUT' || mood === 'SENANG';
}

function enter(v: Vitals, mood: Mood, timer = 0) {
  v.mood = mood;
  v.moodTimer = timer;
}

/** Advances one person's state. Returns true when the mood changed. */
export function stepVitals(v: Vitals, dt: number, seated: boolean, random: () => number = Math.random): boolean {
  const before = v.mood;
  v.moodTimer -= dt;

  switch (v.mood) {
    case 'FOKUS':
      v.energy -= 0.8 * dt;
      v.stress += 0.3 * dt;
      if (seated) {
        if (v.stress >= 80) enter(v, 'MARAH', 9);
        else if (v.energy <= 12) enter(v, 'TIDUR');
        else if (v.energy <= 38) enter(v, 'LELAH');
        else if (random() < 0.005 * dt) enter(v, 'MALAS', 14 + random() * 16);
      }
      break;
    case 'LELAH':
      v.energy -= 0.8 * dt;
      v.stress += 0.4 * dt;
      if (v.energy <= 12) enter(v, 'TIDUR');
      else if (random() < 0.01 * dt) enter(v, 'MALAS', 14 + random() * 16);
      else if (v.energy > 38) enter(v, 'FOKUS');
      break;
    case 'MALAS':
      v.energy += 1.2 * dt;
      v.stress -= 1.5 * dt;
      if (v.moodTimer <= 0) enter(v, 'FOKUS');
      break;
    case 'TIDUR':
      v.energy += 5 * dt;
      v.stress -= 2 * dt;
      if (v.energy >= 90) enter(v, 'FOKUS');
      break;
    case 'MARAH':
      v.stress -= 4 * dt;
      if (v.moodTimer <= 0) enter(v, 'FOKUS');
      break;
    case 'TAKUT':
      if (v.moodTimer <= 0) enter(v, 'FOKUS');
      break;
    case 'SENANG':
      v.stress -= 3 * dt;
      if (v.moodTimer <= 0) enter(v, 'FOKUS');
      break;
  }

  v.energy = clamp(v.energy);
  v.stress = clamp(v.stress);
  return v.mood !== before;
}

/** A whip gets lazy people back to work; on anyone else it only builds resentment. */
export function whip(v: Vitals): WhipOutcome {
  v.whips += 1;
  if (isLazy(v.mood)) {
    v.energy = clamp(Math.max(v.energy, 55));
    v.stress = clamp(v.stress + 15);
    enter(v, 'TAKUT', 5);
    return 'WOKE';
  }
  v.stress = clamp(v.stress + 12);
  if (v.mood === 'MARAH') {
    v.moodTimer += 4;
    return 'ANGRY';
  }
  if (v.stress >= 80) {
    enter(v, 'MARAH', 9);
    return 'ANGRY';
  }
  return 'PROTEST';
}

/** Real telemetry means the agent is working, so the person on screen must be too. */
export function applyWork(v: Vitals, isError: boolean): void {
  v.energy = clamp(v.energy - 2);
  if (isError) {
    v.stress = clamp(v.stress + 25);
    if (v.stress >= 80) {
      enter(v, 'MARAH', 9);
      return;
    }
  }
  if (isLazy(v.mood)) enter(v, 'FOKUS');
}

/** Coffee or a pet: lowers stress and cheers up anyone who isn't asleep or furious. */
export function comfort(v: Vitals, energyGain: number): void {
  v.energy = clamp(v.energy + energyGain);
  v.stress = clamp(v.stress - 20);
  if (v.mood === 'FOKUS' || v.mood === 'LELAH') enter(v, 'SENANG', 6);
}
