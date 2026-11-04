# Contract: Boss NPC Routine & Inspection API

**Contract ID**: `CTR-BOSS-002`
**Consumer**: `Office3DEngine.ts`, Dialogue / SFX Service
**Provider**: Boss Simulation Subsystem / `officeLayout.ts`

## 1. Interface Definition

```typescript
export interface IBossManager {
  /**
   * Initializes the Boss character and spawns executive desk props.
   */
  initBoss(): void;

  /**
   * Ticks the Boss state machine by delta seconds.
   */
  update(delta: number): void;

  /**
   * Evaluates a candidate employee in inspection range.
   * Returns an InspectionOutcome determining whether to scold, gift coffee, or ignore.
   */
  evaluateEmployee(employeeId: string): InspectionOutcome | null;

  /**
   * Returns the current Boss state for UI / telemetry inspection.
   */
  getBossState(): BossBehaviorState;
}
```

## 2. Telemetry & Dialogue Contracts

### 2.1 Scold Interaction
- **Trigger**: Target employee mood is `TIDUR` or `MALAS`, or energy < 20.
- **Badge**: `[SCOLD]`
- **Sample Lines (Zero-Emoji)**:
  - `"[SCOLD] Hey, bangun! Jam kerja bukan buat tidur!"`
  - `"[SCOLD] Jangan malas-malasan, deploy deadline sebentar lagi!"`
- **Side Effects**:
  - Employee status changes to `KAGET`, then transitions to `FOKUS`.
  - SFX: `buzzer` retro audio clip.

### 2.2 Coffee Gift Interaction
- **Trigger**: Target employee has recent activity in last 60s or energy > 70 with active task.
- **Badge**: `[COFFEE_GIFT]`
- **Sample Lines (Zero-Emoji)**:
  - `"[COFFEE_GIFT] Kerja bagus! Ini kopi spesial buat kamu, teruskan performanya."`
  - `"[COFFEE_GIFT] Mantap progressnya cepat dan rapi. Istirahat sejenak sambil minum kopi."`
- **Side Effects**:
  - Employee energy boosts to 100, stress decreases by 30.
  - Spawns coffee cup steam particle.
  - SFX: `chime` retro audio clip.
