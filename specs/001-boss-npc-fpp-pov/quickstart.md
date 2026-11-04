# Quickstart & Verification Guide: Boss NPC & Universal First-Person (FPP) POV

**Feature**: `001-boss-npc-fpp-pov`
**Date**: 2026-11-04

This guide defines how to run, verify, and validate the Boss character and Universal First-Person Perspective (FPP POV) features end-to-end.

---

## 1. Prerequisites & Launch

Ensure dependencies are installed and start the unified server:

```powershell
npm run dev
```

Open your browser at **[http://localhost:4040](http://localhost:4040)**.

---

## 2. Interactive Validation Scenarios

### Scenario A: Universal FPP POV from Roster List
1. Open the Employee Roster panel on the right side of the screen.
2. Click on **Rex** (Frontend Engineer).
3. **Verify**:
   - Camera immediately locks to Rex's eye level looking out across his dual monitors and desk.
   - A floating HUD bar appears at top-center: `[POV_FPP]: Rex (Frontend Engineer) [ KELUAR POV (ESC) ]`.
4. Click and drag the mouse across the screen.
   - **Verify**: The view pans horizontally and tilts vertically as if looking through Rex's eyes.
5. Press the `Escape` key on your keyboard.
   - **Verify**: Camera exits FPP mode smoothly and returns to the default overhead free camera. The HUD bar disappears.

### Scenario B: Switching Between Characters in FPP
1. Click **Bayu** in the roster list (entering Bayu's FPP).
2. Without exiting, click **Viper** (QA Lead) in the roster.
3. **Verify**:
   - Camera immediately transitions to Viper's eye level in the QA desk pod.
   - HUD updates to `[POV_FPP]: Viper (QA Lead)`.

### Scenario C: Boss Character & Executive Room Verification
1. Inspect the eastern wing of the office floor.
2. **Verify**:
   - The Boss character is stationed in his executive office at the executive desk.
   - The Boss appears at the very top of the roster list under an `Executive` division.
3. Click **Bos** in the roster list.
   - **Verify**: Camera enters the Boss's FPP view, looking out from the executive office toward the main room.

### Scenario D: Boss Autonomous Patrol & Employee Interventions
1. Observe the Boss over 1-2 minutes.
2. **Verify**:
   - The Boss stands up from his desk and walks through the door into the main hallway (`SPINE_X`).
   - The Boss patrols down the aisles between desk pods.
3. Observe when the Boss encounters **Bayu** or **Joko** (who start in `TIDUR` state):
   - **Verify**: The Boss stops in front of them, plays a scold animation, displays a dialog box with `[SCOLD]`, and plays a buzzer SFX. The sleeping employee wakes up with `[KAGET]` and begins typing.
4. Send a mock telemetry ingest or observe a high-energy focused employee (**Rex** or **Nova**):
   - **Verify**: When the Boss stops at their desk, he displays an appreciative dialog with `[COFFEE_GIFT]`, a coffee steam particle appears, and the employee's energy tops up to 100%.

---

## 3. Automated Playwright Visual Test

Run the automated test suite to confirm visual stability and zero regressions:

```powershell
npm run test:visual
```

To run unit tests verifying emotion and boss state transitions:

```powershell
npm test
```
