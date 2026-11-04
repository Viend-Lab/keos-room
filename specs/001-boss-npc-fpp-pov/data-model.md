# Data Model: Boss NPC & Universal First-Person (FPP) POV

**Feature**: `001-boss-npc-fpp-pov`
**Date**: 2026-11-04

## 1. Entities & Interfaces

### 1.1 Boss Entity (`BossCharacter`)
Extends `Character3D` with executive patrol state and evaluation mechanics.

```typescript
export type BossBehaviorState = 
  | 'IN_OFFICE'          // Working / thinking at executive desk
  | 'WALKING_OUT'        // Exiting executive office towards the spine
  | 'PATROLLING'         // Walking through desk pods
  | 'INSPECTING_WORKER'  // Pausing in front of a worker's desk
  | 'SCOLDING'           // Reprimanding slacking / sleeping worker
  | 'GIFTING_COFFEE'     // Rewarding productive worker with coffee
  | 'RETURNING';         // Heading back to executive office

export interface BossEntity {
  id: 'bos';
  name: 'Bos';
  roleTitle: 'Direktur Utama';
  roleColor: '#DC2626';
  state: BossBehaviorState;
  stateTimer: number;             // Time remaining in current state (seconds)
  currentWaypointIndex: number;   // Current patrol waypoint
  targetEmployeeId: string | null;// Current employee being evaluated
  inspectionCooldowns: Map<string, number>; // employeeId -> timestamp of last inspection
}
```

### 1.2 Universal FPP Camera State (`FppCameraState`)
Manages camera attachment and first-person orientation.

```typescript
export type CameraMode = 'FREE' | 'FPP';

export interface FppCameraState {
  mode: CameraMode;
  targetId: string | null;         // ID of character currently observed
  targetName: string | null;       // Display name for HUD overlay
  targetRole: string | null;       // Role title for HUD overlay
  eyeHeightSitting: number;        // Default 1.15m (above chair)
  eyeHeightStanding: number;       // Default 1.60m (eye level)
  forwardOffset: number;           // Default 0.16m (avoids inner facial mesh clipping)
  yawOffset: number;               // User mouse look yaw delta (radians)
  pitchOffset: number;             // User mouse look pitch delta clamped to [-0.75, +0.75]
}
```

### 1.3 Inspection & Evaluation Outcome (`InspectionOutcome`)
Models the decision engine when the Boss checks an employee.

```typescript
export type EvaluationAction = 'IGNORE' | 'SCOLD' | 'COFFEE_GIFT';

export interface InspectionOutcome {
  targetId: string;
  action: EvaluationAction;
  dialogueText: string;
  badgeToken: '[SCOLD]' | '[COFFEE_GIFT]' | '[NEUTRAL]';
  stressDelta: number;
  energyDelta: number;
  newMood: 'FOKUS' | 'KAGET' | 'SENANG';
}
```

---

## 2. State Machine & Transitions

### Boss Behavior State Transitions

```text
[IN_OFFICE]
   │ (timer expires, e.g. 45s)
   ▼
[WALKING_OUT]
   │ (reaches spine walkway)
   ▼
[PATROLLING] ◄────────────────────────────────────────┐
   │                                                  │
   ├─► [Found slacker / sleeper] ──► [SCOLDING] ──────┤
   │                                                  │
   ├─► [Found high performer]  ──► [GIFTING_COFFEE] ──┘
   │
   │ (patrol waypoints complete)
   ▼
[RETURNING]
   │ (reaches executive desk)
   ▼
[IN_OFFICE]
```

### Camera Mode Transitions

```text
[FREE CAMERA] (Default fly/pan/orbit view)
   │
   │ User clicks employee row in roster
   ▼
[FPP POV MODE]
   │  - Attach position to character eye level each frame
   │  - User mouse drag rotates local view
   │  - HUD displays "[POV_FPP]: <Name> ([ KELUAR POV (ESC) ])"
   │
   ├─► User clicks another employee in roster ─► Transition target to new character
   │
   │ User presses 'Escape' key OR clicks 'Keluar POV' button
   ▼
[FREE CAMERA] (Smoothly blends out to previous or overhead vantage)
```

---

## 3. Validation Rules

1. **Constitutional Zero-Emoji Rule**: All dialogue strings and status badges in `InspectionOutcome` MUST NOT contain Unicode emoji characters. Badges MUST be exact uppercase ASCII tokens like `[SCOLD]` or `[COFFEE_GIFT]`.
2. **Interaction Cooldown**: A single employee CANNOT be evaluated again until at least 90 seconds have elapsed since their last interaction.
3. **Camera Pitch Clamping**: FPP `pitchOffset` MUST be clamped strictly between `-0.75` rad (~ -43°) and `+0.75` rad (~ +43°) to prevent camera inversion.
4. **FPP Target Validity**: If `targetId` is removed or destroyed, camera mode MUST instantly fallback to `FREE` mode safely without throwing null pointer exceptions.
