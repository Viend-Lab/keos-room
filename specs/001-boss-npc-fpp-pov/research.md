# Research: Boss NPC Autonomous Routine & Universal First-Person (FPP) POV

**Feature**: `001-boss-npc-fpp-pov`
**Date**: 2026-11-04

## Topic 1: Universal First-Person Perspective (FPP) Camera Architecture

### Context
Currently, `Office3DEngine.ts` uses `FreeCamera.ts` which manages flying, WASD walking, and mouse drag. When a roster entry is clicked, `engine.focusPerson(id)` computes an offset position (`c.x + 0.6, 1.55, c.z + 1.25`) and calls `freeCamera.flyTo()`. The user desires clicking any person to immediately switch the camera to full first-person perspective (FPP POV) attached to their head/eyes, with mouse look and a clean exit mechanism.

### Decision
Extend camera management to support an explicit mode: `FREE` vs `FPP`.
- When in `FPP` mode, camera position is locked each frame to the target character's head position (approx. `Y = 1.15` when sitting at desk, `Y = 1.60` when standing/walking) slightly forward in their facing direction (`+ 0.15m`) to prevent interior mesh clipping.
- Mouse drag in FPP controls view orientation relative to the character's facing angle (Yaw 360°, Pitch clamped to [-45°, +45°]).
- Provide `setFppTarget(characterId | null)`. Setting to `null` or pressing `Escape` / clicking "Exit POV" button transitions back to `FREE` camera smoothly.
- When in FPP mode, hide the target character's own head or offset near-plane (`camera.near = 0.05`) so their own head geometry does not obstruct the view.

### Alternatives Considered
- *Separate FppCamera class*: Rejected because `FreeCamera` already manages pointer events, mouse drag listeners, projection matrix, and lerp transitions. Integrating FPP mode into `FreeCamera` or an engine-level coordinator avoids event listener conflicts on the canvas element.
- *Strict Lock (No Mouse Look)*: Rejected because watching a static forward vector feels unnatural and claustrophobic in 3D; giving free look-around around the character's gaze provides superior immersion.

---

## Topic 2: Boss Entity & Office Layout Placement

### Context
The virtual office currently has two Project Managers (`Blaze` and `Nova`) in the PM zone at `x: 12.3, cz: -1.4`. The user requested adding a character specifically named "Bos" with an executive office who can stay in his room or wander around inspecting employees.

### Decision
- Add a new crew member `bos` (`id: 'bos', name: 'Bos', roleTitle: 'Direktur Utama / Boss', roleColor: '#DC2626'`) to `CREW` in `officeLayout.ts`.
- Place an executive desk in the dedicated boss zone (`x: 14.2, z: -3.5` or within the executive area of the east wing), with executive furniture accents (leather chair, mahogany desk props).
- Give Bos distinct styling (`crewAsset('male-base')` or `crewAsset('dohun')` with darker executive formal textures/tinting).
- Add Bos to the roster UI under an "Executive / Direksi" division header at the top of the list.

### Alternatives Considered
- *Replacing Blaze with Bos*: Rejected because Blaze is part of existing test fixtures and dialogue roles. Adding Bos as a dedicated leadership character preserves backward compatibility with existing tests.

---

## Topic 3: Boss Autonomous AI State Machine & Patrol Waypoints

### Context
The Boss must possess "awareness" to stay in his room, patrol desk aisles, and react to employees.

### Decision
Implement a lightweight, deterministic state machine for the Boss within the client engine:
1. `IN_OFFICE`: Boss sits at the executive desk working/thinking for 30–60 seconds.
2. `WALKING_TO_AISLE`: Boss stands up and follows predefined access waypoints out of the office onto `SPINE_X` and into employee desk pods (Frontend pod, Backend pod, QA pod, Designer pod).
3. `PATROLLING`: Boss walks along aisles between desk pods, scanning nearby employees within 2.0 meters.
4. `INTERACTING`: If an employee meets inspection criteria, Boss pauses, turns to face the employee, and triggers an interaction (`SCOLD` or `COFFEE_GIFT`).
5. `RETURNING`: Boss walks back along `SPINE_X` to the executive desk.

### Alternatives Considered
- *Complex A* Pathfinding*: Rejected as over-engineering. The office layout already uses clean deterministic Manhattan waypoints (`access` points connecting to `SPINE_X`) which pets and characters already use without colliding with furniture.

---

## Topic 4: Employee Evaluation Criteria (Scolding vs Coffee Appreciation)

### Context
The user specified:
- Scold employees who are lazy, sleepy, etc.
- Appreciate with coffee employees whose work is good/improving.

### Decision
Leverage `EmotionSystem.ts` and telemetry history:
- **Scold Trigger**: Target employee mood is `TIDUR` (sleeping) or `MALAS` (slacking), or energy < 20.
  - Interaction: Boss stops, plays an animated exclamation / gesture, triggers dialogue with `[SCOLD]` badge and a buzzer retro SFX.
  - Effect: Target employee energy is jolted to 60, mood changes to `KAGET` -> `FOKUS`, employee resumes typing. Target stress increases (+25).
- **Coffee Gift Trigger**: Target employee has recent positive telemetry activity within 60s (e.g. `[EXEC_TEST]`, `[IO_WRITE]`, or mood `FOKUS` with energy > 70).
  - Interaction: Boss pauses, triggers appreciative dialogue with `[COFFEE_GIFT]` badge and a chime retro SFX.
  - Effect: Spawns steam particle / coffee mug at employee desk, boosts energy to 100, reduces stress (-30).
- **Cooldown**: 90-second cooldown per employee ID so the Boss does not repeatedly scold or pamper the same person in a single patrol.

### Alternatives Considered
- *Random inspection*: Rejected because reacting to real telemetry states makes the simulation authentic and directly connects to the AI harness activity.

---

## Topic 5: UI & UX Standards (100% Zero-Emoji & Monospace Badges)

### Context
Constitution Article II strictly forbids Unicode emojis across all logs, HUD elements, and dialogue.

### Decision
- All Boss dialogue bubbles and notifications MUST use uppercase monospace token tags:
  - Reprimand: `[SCOLD]`, `[ALERT_IDLE]`, `[WAKE_UP]`
  - Coffee Reward: `[COFFEE_GIFT]`, `[BONUS_ENERGY]`, `[GOOD_JOB]`
  - FPP Camera HUD: `[POV_FPP]`, `[VIEW_EYES]`
  - Status Indicators: `[PATROL]`, `[IN_OFFICE]`
- Add a floating FPP HUD bar at the top-center of the screen during FPP mode:
  - Displays: `[POV_FPP]: <NAMA KARAKTER> (<ROLE>)`
  - Button: `[ KELUAR POV (ESC) ]`

### Alternatives Considered
- *Using coffee cup / angry face emojis*: Rejected under Constitution Article II.
