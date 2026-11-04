import { Office3DEngine, OfficeSnapshot, PersonSnapshot } from './engine/Office3DEngine';

const container = document.getElementById('canvas-container') as HTMLElement;
const logStream = document.getElementById('log-stream') as HTMLElement;
const fpsMeter = document.getElementById('fps-meter') as HTMLElement;
const telemetryDrawer = document.getElementById('telemetry-drawer') as HTMLElement;
const btnToggleDialogue = document.getElementById('btn-toggle-dialogue');
const btnDrawerCollapse = document.getElementById('btn-drawer-collapse');
const rosterList = document.getElementById('roster-list') as HTMLElement;
const personCard = document.getElementById('person-card') as HTMLElement;

const engine = new Office3DEngine(container);
engine.start();

// Read by tests/visual-review.spec.ts
(window as unknown as { keosEngine: Office3DEngine }).keosEngine = engine;

function appendTelemetryLog(badge: string, roleName: string, message: string): void {
  if (!logStream) return;
  const row = document.createElement('div');
  row.className = 'log-entry';
  const now = new Date().toTimeString().slice(0, 8);

  const cells: [string, string][] = [
    ['log-time', now],
    ['log-tag', badge],
    ['', `${roleName}: ${message}`]
  ];
  cells.forEach(([className, text]) => {
    const cell = document.createElement('span');
    cell.className = className;
    cell.textContent = text;
    row.appendChild(cell);
  });

  logStream.prepend(row);
  while (logStream.children.length > 50) {
    logStream.removeChild(logStream.lastChild!);
  }
}

engine.onLog = appendTelemetryLog;

// Personnel roster: rows are built once per person and updated in place, so focus survives
interface RosterRow {
  row: HTMLElement;
  mood: HTMLElement;
  energy: HTMLElement;
  stress: HTMLElement;
}

const rosterRows = new Map<string, RosterRow>();
let lastRosterTeam = '';

function createRosterRow(person: PersonSnapshot): RosterRow {
  if (person.teamName !== lastRosterTeam) {
    lastRosterTeam = person.teamName;
    const heading = document.createElement('div');
    heading.className = 'roster-division';
    heading.textContent = person.teamName;
    rosterList.appendChild(heading);
  }

  // Clicking the person flies the camera to them; whipping has its own button so it never happens by accident
  const row = document.createElement('div');
  row.className = 'person-row';
  const focus = document.createElement('button');
  focus.className = 'person-focus';
  focus.title = `${person.roleTitle}. Klik untuk mendekat.`;

  const name = document.createElement('span');
  name.className = 'person-name';
  if (person.id === 'bos') {
    const bossTag = document.createElement('span');
    bossTag.className = 'person-device';
    bossTag.style.background = '#DC2626';
    bossTag.style.color = '#FFFFFF';
    bossTag.style.fontWeight = '700';
    bossTag.textContent = '[BOS] ';
    name.appendChild(bossTag);
  }
  name.appendChild(document.createTextNode(`${person.name} `));
  const device = document.createElement('span');
  device.className = 'person-device';
  device.textContent = person.device === 'MAC' ? 'MacBook' : 'PC';
  name.appendChild(device);

  const mood = document.createElement('span');
  const bars = document.createElement('span');
  bars.className = 'bars';
  const energy = document.createElement('i');
  const stress = document.createElement('i');
  [['energy', energy], ['stress', stress]].forEach(([kind, fill]) => {
    const bar = document.createElement('span');
    bar.className = `bar ${kind as string}`;
    bar.appendChild(fill as HTMLElement);
    bars.appendChild(bar);
  });

  focus.append(name, mood, bars);
  focus.addEventListener('click', () => {
    if (engine.isFppActive() && engine.getActiveFppTarget() === person.id) {
      engine.exitFpp();
    } else {
      engine.enterFpp(person.id);
    }
    engine.soundEffects.playButtonClick();
  });

  const whipButton = document.createElement('button');
  whipButton.className = 'btn-row-whip';
  whipButton.textContent = 'Pecut';
  whipButton.title = `Pecut ${person.name}`;
  whipButton.addEventListener('click', () => engine.whipPerson(person.id));

  row.append(focus, whipButton);
  rosterList.appendChild(row);

  return { row, mood, energy, stress };
}

function renderOfficeSnapshot(snapshot: OfficeSnapshot): void {
  setText('stat-productivity', `${snapshot.productivity}%`);
  setText('stat-lazy', String(snapshot.lazyCount));
  setText('stat-whips', String(snapshot.whipCount));

  // The engine reports people in roster order once they have all loaded; wait so teams stay grouped
  if (snapshot.people.length < engine.crewSize) return;

  snapshot.people.forEach((person) => {
    let row = rosterRows.get(person.id);
    if (!row) {
      row = createRosterRow(person);
      rosterRows.set(person.id, row);
    }
    row.row.classList.toggle('lazy', person.lazy);
    row.mood.className = `person-mood ${person.mood}`;
    row.mood.textContent = person.moodLabel;
    row.energy.style.width = `${person.energy}%`;
    row.stress.style.width = `${person.stress}%`;
  });
}

function setText(id: string, text: string): void {
  const element = document.getElementById(id);
  if (element) element.textContent = text;
}

// Hover card
engine.onHover = (target, x, y) => {
  if (!target) {
    personCard.style.display = 'none';
    return;
  }
  personCard.textContent = '';
  const title = document.createElement('strong');
  title.textContent = target.title;
  personCard.appendChild(title);
  if (target.person) {
    const p = target.person;
    const lines = [
      `${p.roleTitle}, tim ${p.teamName}`,
      `Perangkat: ${p.device === 'MAC' ? 'MacBook' : 'PC'}`,
      `Kondisi: ${p.moodLabel}`,
      `Energi ${p.energy}, stres ${p.stress}, dipecut ${p.whips} kali`
    ];
    lines.forEach((line) => {
      const row = document.createElement('div');
      row.textContent = line;
      personCard.appendChild(row);
    });
  }
  personCard.style.display = 'block';
  personCard.style.left = `${Math.min(x + 16, container.clientWidth - 210)}px`;
  personCard.style.top = `${Math.max(y - 20, 4)}px`;
};

// Update FPS meter and roster
setInterval(() => {
  if (fpsMeter) {
    fpsMeter.textContent = `${engine.fps} FPS`;
  }
  renderOfficeSnapshot(engine.getSnapshot());
}, 500);

// Reset Camera Button
document.getElementById('btn-reset-cam')?.addEventListener('click', () => {
  engine.resetCamera();
  engine.soundEffects.playButtonClick();
});

// FPP Mode HUD Wiring
const fppHud = document.getElementById('fpp-hud') as HTMLElement | null;
const fppTargetName = document.getElementById('fpp-target-name') as HTMLElement | null;
const btnExitFpp = document.getElementById('btn-exit-fpp') as HTMLElement | null;

btnExitFpp?.addEventListener('click', () => {
  engine.exitFpp();
  engine.soundEffects.playButtonClick();
});

window.addEventListener('fpp:mode-change', (e: Event) => {
  const customEvent = e as CustomEvent<{
    active: boolean;
    targetId: string | null;
    targetName: string | null;
    targetRole: string | null;
  }>;
  if (customEvent.detail.active) {
    if (fppHud) fppHud.style.display = 'flex';
    if (fppTargetName) fppTargetName.textContent = `${customEvent.detail.targetName} (${customEvent.detail.targetRole})`;
  } else {
    if (fppHud) fppHud.style.display = 'none';
  }
});

// Whip Every Slacker
document.getElementById('btn-whip-all')?.addEventListener('click', () => {
  if (engine.whipAllLazy() === 0) {
    appendTelemetryLog('PECUT', 'Pengawas', 'Tidak ada yang malas saat ini. Semua sedang bekerja.');
  }
});

// Hide / Show Dialogue Drawer Toggle
let dialogueHidden = false;
function toggleDialogueDrawer(): void {
  dialogueHidden = !dialogueHidden;
  if (telemetryDrawer) {
    telemetryDrawer.classList.toggle('collapsed', dialogueHidden);
  }
  if (btnToggleDialogue) {
    btnToggleDialogue.textContent = dialogueHidden ? 'Tampilkan log' : 'Sembunyikan log';
  }
  engine.soundEffects.playButtonClick();
}

btnToggleDialogue?.addEventListener('click', toggleDialogueDrawer);

// Hide / Show Personnel Roster
const roster = document.getElementById('roster');
const btnToggleRoster = document.getElementById('btn-toggle-roster');
let rosterHidden = false;
function toggleRoster(): void {
  rosterHidden = !rosterHidden;
  roster?.classList.toggle('collapsed', rosterHidden);
  if (btnToggleRoster) {
    btnToggleRoster.textContent = rosterHidden ? 'Tampilkan daftar' : 'Sembunyikan daftar';
  }
  engine.soundEffects.playButtonClick();
}

btnToggleRoster?.addEventListener('click', toggleRoster);
document.getElementById('btn-roster-collapse')?.addEventListener('click', toggleRoster);
btnDrawerCollapse?.addEventListener('click', toggleDialogueDrawer);

// Sound Toggle
let audioMuted = false;
const audioBtn = document.getElementById('btn-audio');
audioBtn?.addEventListener('click', () => {
  audioMuted = engine.soundEffects.toggleMute();
  if (audioBtn) {
    audioBtn.textContent = audioMuted ? 'Suara mati' : 'Suara nyala';
    audioBtn.classList.toggle('muted', audioMuted);
  }
});

// Connect to Local Telemetry Bridge
function connectTelemetryBridge(): void {
  const wsIndicator = document.getElementById('ws-indicator');
  try {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host || '127.0.0.1:4040';
    const ws = new WebSocket(`${protocol}//${host}`);

    ws.onopen = () => {
      if (wsIndicator) wsIndicator.textContent = 'Telemetri tersambung';
      appendTelemetryLog('SISTEM', 'Kantor', 'Tersambung ke telemetri agen. Pengawasan dimulai.');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'EVENT' && data.event) {
          const ev = data.event;
          const isError = ev.category === 'ERR_ALERT' || ev.status === 'ERROR';
          engine.handleTelemetryEvent(ev.category || 'io', ev.target || ev.detail, isError);
          appendTelemetryLog(ev.badge || ev.category, ev.role || 'Studio', ev.detail || 'Telemetry event');
        } else if (data.tool || data.category) {
          engine.handleTelemetryEvent(data.tool || data.category, data.target || data.message, false);
          appendTelemetryLog(data.category || 'TASK', 'Studio', data.message || 'Action executed');
        }
      } catch {
        // Fallback for non-JSON signals
      }
    };

    ws.onclose = () => {
      if (wsIndicator) wsIndicator.textContent = 'Mode otomatis';
    };

    ws.onerror = () => {
      if (wsIndicator) wsIndicator.textContent = 'Mode otomatis';
    };
  } catch {
    if (wsIndicator) wsIndicator.textContent = 'Mode otomatis';
  }
}

connectTelemetryBridge();
