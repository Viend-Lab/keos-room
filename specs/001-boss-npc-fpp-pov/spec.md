# Feature Specification: Boss NPC Autonomous Routine & Universal First-Person (FPP) POV

**Feature Branch**: `001-boss-npc-fpp-pov`

**Created**: 2026-11-04

**Status**: Draft

**Input**: User description: "tambahkan karakter bernama bos, jadi dia juga punya kesadaran untuk memarahi karyawannya yang malas, mengantuk, dll, dia bisa diam di ruangannya, bisa keliling keliling sambil mengecek karyawannya kemudian bisa memaki atau bahkan mengapresiasi dengan memberikan kopi kepada karyawan yang tugasnya sedang bagus/improve. dan juga berikan fitur pov bos jadi kita bisa melihat pov bos dalam first person perspective untuk karyawan lain juga gitu. untuk saat ini ketika kita klik karyawannya di daftar karyawan kan tidak pov dia tapi hanya menyoroti nah ubah jadi pov fpp kemudian bosnya juga paham?"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Universal First-Person Perspective (FPP POV) for Any Employee & Boss (Priority: P1)

As a virtual office observer, when I click any employee name or the Boss in the roster panel, I want the camera to switch seamlessly into that character's First-Person Perspective (FPP POV), so that I can see the office and work environment through their eyes in real time.

**Why this priority**: Directly transforms the current distant focus mechanism into an immersive first-person viewpoint, delivering standalone value and laying the camera foundation for both regular employees and the Boss.

**Independent Test**: Can be tested independently by opening the employee list, clicking any employee or the Boss, and verifying that the camera immediately attaches to their eye level facing forward, with a visible "Exit POV" HUD option that restores free camera.

**Acceptance Scenarios**:

1. **Given** the free camera is active and the employee roster is open, **When** the user clicks any employee name or the Boss, **Then** the camera smoothly shifts to the character's eye position in first-person perspective, following their position and movement.
2. **Given** the camera is in FPP POV mode of a character, **When** the user drags the mouse or moves the pointer, **Then** the view rotates around the character's head orientation to look around.
3. **Given** the camera is in FPP POV mode, **When** the user presses the `Escape` key or clicks the "Exit POV" button on the UI overlay, **Then** the camera exits FPP mode and returns to the default overhead/free camera.
4. **Given** the camera is in FPP POV mode of Employee A, **When** the user clicks Employee B in the roster, **Then** the camera transitions directly to Employee B's first-person perspective without needing to manually exit first.

---

### User Story 2 - Autonomous Boss Routine & Office Patrol (Priority: P2)

As a virtual office observer, I want an autonomous Boss character stationed in a designated executive office who alternates between resting/working at the executive desk and patrolling the open office floor, so that the workplace feels dynamic and actively supervised.

**Why this priority**: Introduces the physical presence and autonomous behavior cycles of the Boss character, providing the movement foundation required for interactive evaluations.

**Independent Test**: Can be tested independently by observing the Boss over several minutes; the Boss should transition between resting in the executive office, walking out to patrol the desk pods, and returning to the office.

**Acceptance Scenarios**:

1. **Given** the simulation starts, **When** the virtual office loads, **Then** the Boss character is spawned with an executive outfit in the designated Boss office area and appears in the roster panel with a "BOS" leadership tag.
2. **Given** the Boss is in the office, **When** the patrol timer elapses, **Then** the Boss autonomously stands up, exits the office, and walks a patrol path along the employee desk pods.
3. **Given** the Boss completes the desk inspection cycle without finding urgent employee states, **When** the patrol route finishes, **Then** the Boss walks back to the executive office and sits at the desk.

---

### User Story 3 - Boss Dynamic Reactions: Scolding Slackers & Rewarding High Performers (Priority: P3)

As a virtual office observer, I want the Boss to actively inspect nearby employees during patrols—scolding those who are sleeping, tired, or idle, and gifting coffee to those with active high performance or improvements—so that office morale and productivity dynamics are enforced autonomously.

**Why this priority**: Delivers the behavioral intelligence and humor of the virtual office, creating reactive feedback loops between agent telemetry, employee states, and the Boss's interventions.

**Independent Test**: Can be tested by forcing an employee into an idle/exhausted state (verifying the Boss scolds them) and triggering active telemetry events on an employee (verifying the Boss hands them coffee).

**Acceptance Scenarios**:

1. **Given** the Boss is patrolling near an employee whose state is idle, sleeping, or fatigued, **When** the Boss stops in front of their desk, **Then** the Boss delivers a scolding dialogue with a `[SCOLD]` badge, waking them up and forcing them back to work while temporarily increasing their stress.
2. **Given** the Boss is patrolling near an employee who has recent active telemetry activity or performance improvements (e.g., active code write, successful tests, or high energy), **When** the Boss approaches their desk, **Then** the Boss delivers an appreciative dialogue with a `[COFFEE_GIFT]` badge, granting them a cup of coffee that boosts energy and reduces stress.
3. **Given** an employee was scolded or received coffee, **When** the Boss moves on to the next workstation, **Then** an interaction cooldown prevents the Boss from immediately repeating the same action on the same employee.

---

### Edge Cases

- **Desk Obstructions & Seated FPP**: When viewing an employee in FPP who is seated at a desk typing, the camera eye height must sit naturally above the chair and keyboard without clipping through the computer monitor or desk surface.
- **Rapid Navigation Clicks**: If the user clicks multiple employee names in rapid succession while in FPP mode, previous camera tweens must cancel gracefully and lock cleanly onto the latest selected character.
- **Boss Pathfinding Around Wandering Pets**: If office pets (Mochi, Oreo, Kopi, Tahu) wander into the Boss's patrol corridor, the Boss must smoothly avoid or wait without getting stuck in an infinite navigation loop.
- **FPP Perspective During Physical Interactions**: If the user is in the FPP POV of an employee being scolded or gifted coffee by the Boss, the Boss must face directly towards the camera, allowing the user to experience the reprimand or coffee gift from the recipient's eyes.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST add a dedicated character entity named "Bos" with distinct visual styling (executive attire), positioned with a dedicated executive office room.
- **FR-002**: The system MUST include "Bos" in the employee list panel with a distinct leadership badge.
- **FR-003**: The system MUST implement an autonomous state machine for the Boss comprising at least three states: `IN_OFFICE` (desk work / resting), `PATROLLING` (inspecting desk aisles), and `INTERACTING` (evaluating a specific employee).
- **FR-004**: When the Boss detects an employee within interaction range whose state is `sleeping`, `slacking`, or `exhausted`, the Boss MUST trigger a disciplinary interaction displaying a structured scold dialog and a `[SCOLD]` monospace badge.
- **FR-005**: A scold interaction MUST reset the target employee's state from sleeping/slacking back to active working.
- **FR-006**: When the Boss detects an employee within interaction range who has recent positive telemetry activity (e.g., successful tests, commits, active coding) or high productivity, the Boss MUST trigger an appreciative interaction displaying an encouragement dialogue, a `[COFFEE_GIFT]` badge, and provide an energy boost.
- **FR-007**: The system MUST enforce an interaction cooldown per employee so the Boss does not repeatedly target the same employee during a single patrol sweep.
- **FR-008**: Clicking any employee name or the Boss in the roster panel MUST switch the camera into that character's First-Person Perspective (FPP POV) attached to their head/eye level.
- **FR-009**: While in FPP POV mode, the camera MUST continuously track the target character's position as they move around the office.
- **FR-010**: While in FPP POV mode, the user MUST be able to rotate the view (look around) via mouse drag.
- **FR-011**: While in FPP POV mode, the UI MUST display an explicit "Keluar POV / Exit POV" button and support the `Escape` key to instantly return to the default free overhead camera.
- **FR-012**: In compliance with the project constitution, all notification badges and status markers MUST use uppercase monospace token tags (e.g., `[SCOLD]`, `[COFFEE_GIFT]`, `[POV_FPP]`, `[PATROL]`) with 100% Zero-Emoji policy.

### Key Entities

- **Boss Entity (`BossCharacter`)**: Represents the office leader; manages location, patrol waypoints, inspection timing, and dialogue lines.
- **FPP Camera Controller (`FppCameraController`)**: Manages first-person camera attachment to target character heads, smooth look-around rotation limits, and transition between Free Camera and FPP mode.
- **Workplace Evaluation System (`EmployeeEvaluator`)**: Analyzes employee status, fatigue, and recent telemetry events to determine whether an employee deserves a reprimand, coffee appreciation, or standard continuation.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Clicking any character in the roster switches the camera to full FPP POV in less than 300ms without camera stutter or rendering artifacts.
- **SC-002**: Exiting FPP POV via `Escape` key or "Exit POV" button returns to standard camera view within 200ms.
- **SC-003**: The Boss character autonomously cycles through office resting and aisle patrol sweeps every 1 to 3 minutes without getting stuck or idle forever.
- **SC-004**: 100% of employees in sleeping or slacking states encountered during a patrol are successfully awakened and transitioned to working state.
- **SC-005**: 100% compliance with the Zero-Emoji standard across all new Boss dialogues, badges, and HUD notifications.

## Assumptions

- **Camera Rotation in FPP**: Horizontal mouse drag allows 360-degree yaw rotation; vertical pitch is clamped between -45 and +45 degrees to prevent disorienting camera flips.
- **Movement Control in FPP**: The user is an observer in FPP POV; the character remains controlled by their own AI/routine rather than WASD direct player movement.
- **Boss Performance Metric**: "Improving/good work" is determined by recent AI telemetry ingestion events linked to that character's jobdesk within the last 60 seconds (or current energy > 80% with active tasks).
- **Audio Feedback**: Boss scolding and coffee gifting use existing retro Web Audio synthesizer SFX channels with distinct pitch profiles (e.g. sharp buzzer for scold, chime for coffee).
