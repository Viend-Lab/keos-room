# Tasks: Boss NPC Autonomous Routine & Universal First-Person (FPP) POV

**Input**: Design documents from `/specs/001-boss-npc-fpp-pov/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description with file path`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- All descriptions include explicit file paths

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Shared types and sound asset registrations for Boss and FPP camera

- [X] T001 [P] Define Boss behavior states (`BossBehaviorState`), camera modes (`CameraMode`), and evaluation types (`InspectionOutcome`) in src/types.ts
- [X] T002 [P] Register buzzer reprimand and coffee chime synthesizer sound effect profiles in src/client/services/SoundEffects.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core camera and layout infrastructure that MUST be completed before user stories can be integrated

- [X] T003 [P] Add FPP camera mode, head attachment tracking, and mouse look yaw/pitch clamping to src/client/engine/FreeCamera.ts
- [X] T004 [P] Define executive office room boundaries, boss desk seat coordinates, and patrol aisle access paths in src/client/engine/officeLayout.ts
- [X] T005 [P] Add executive desk 3D model, chair, and office props generation in src/client/engine/officeProps.ts

**Checkpoint**: Core camera and layout foundations ready - user story implementation can proceed.

---

## Phase 3: User Story 1 - Universal First-Person Perspective (FPP POV) (Priority: P1) [MVP]

**Goal**: Enable clicking any roster entry to enter First-Person Perspective (FPP POV) of that character with mouse look and an exit mechanism.

**Independent Test**: Click Rex or any employee in the roster list; camera smoothly attaches to their head/eye level, floating HUD shows `[POV_FPP]: <Name> (<Role>)`, mouse drag looks around, and pressing `Escape` or clicking "Keluar POV" returns to free camera.

### Tests for User Story 1

- [X] T006 [P] [US1] Create Playwright E2E test for roster FPP camera activation, mouse look, and escape key exit in tests/fpp-camera.spec.ts

### Implementation for User Story 1

- [X] T007 [US1] Implement `enterFpp(id)` and `exitFpp()` methods, target tracking update loop, and character head hiding in src/client/engine/Office3DEngine.ts
- [X] T008 [US1] Add floating HUD bar overlay `#fpp-hud` with target badge and "Keluar POV (ESC)" button in index.html
- [X] T009 [US1] Update roster click handlers to toggle FPP POV and register `Escape` keyboard shortcut in src/client/main.ts

**Checkpoint**: At this point, User Story 1 is fully functional and testable independently as the core MVP.

---

## Phase 4: User Story 2 - Autonomous Boss Routine & Office Patrol (Priority: P2)

**Goal**: Spawn Boss character in executive office and implement autonomous routine (office work, hallway patrol, return).

**Independent Test**: Launch simulation, verify Boss spawns in executive room, appears in roster under `Executive` division, and cycles between desk work and aisle patrol.

### Tests for User Story 2

- [X] T010 [P] [US2] Create Playwright test verifying Boss spawn in executive room and roster presence under Executive heading in tests/boss-presence.spec.ts

### Implementation for User Story 2

- [X] T011 [US2] Add `bos` CrewSpec entry (`id: 'bos', name: 'Bos', roleTitle: 'Direktur Utama'`) and team configuration in src/client/engine/officeLayout.ts
- [X] T012 [US2] Implement `BossSystem` state machine managing `IN_OFFICE`, `WALKING_OUT`, `PATROLLING`, and `RETURNING` cycles in src/client/engine/BossSystem.ts
- [X] T013 [US2] Integrate `BossSystem` update loop, waypoint walking, and 3D character animation in src/client/engine/Office3DEngine.ts
- [X] T014 [US2] Render `Executive` division header and Boss card with leadership badge in src/client/main.ts

**Checkpoint**: User Stories 1 and 2 both work independently and integrate seamlessly (user can observe Boss in FPP POV).

---

## Phase 5: User Story 3 - Boss Dynamic Reactions: Scolding & Rewarding (Priority: P3)

**Goal**: Boss actively inspects employees during patrol—scolding slackers/sleepers and rewarding high performers with coffee.

**Independent Test**: Force an employee into `TIDUR` or `MALAS` state and verify Boss triggers scold dialogue with `[SCOLD]`; simulate active coding/testing and verify Boss hands coffee with `[COFFEE_GIFT]`.

### Tests for User Story 3

- [X] T015 [P] [US3] Create unit tests for employee state evaluation, cooldown logic, and energy/stress updates in tests/boss-evaluation.test.ts

### Implementation for User Story 3

- [X] T016 [US3] Implement `evaluateEmployee()` in src/client/engine/BossSystem.ts checking target state (`TIDUR`/`MALAS` -> scold; active telemetry/`FOKUS` -> coffee gift) with 90s cooldown
- [X] T017 [US3] Add structured zero-emoji Boss scold and coffee gift dialogue entries in src/client/services/DialogueEngine.ts
- [X] T018 [US3] Implement scolding animation/sfx and coffee gifting particle/mug spawn in src/client/engine/Office3DEngine.ts

**Checkpoint**: All three user stories are complete and functioning autonomously.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Quality gates, zero-emoji verification, and comprehensive testing

- [X] T019 [P] Verify 100% Zero-Emoji policy across all new dialogues, notifications, and HUD elements in src/client/engine/BossSystem.ts and src/client/services/DialogueEngine.ts
- [X] T020 Run full test suite (`npm test` and `npm run test:visual`) and execute all validation scenarios in specs/001-boss-npc-fpp-pov/quickstart.md
- [X] T021 [P] Update README.md documenting the Boss character, autonomous patrol behaviors, and FPP camera controls

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup (Phase 1) - BLOCKS all user stories
- **User Story 1 (Phase 3 - P1)**: Depends on Foundational (Phase 2)
- **User Story 2 (Phase 4 - P2)**: Depends on Foundational (Phase 2); integrates with US1 for Boss FPP POV
- **User Story 3 (Phase 5 - P3)**: Depends on US2 (Boss entity & patrol path)
- **Polish (Phase 6)**: Depends on completion of all user stories

### Parallel Opportunities

- `T001` and `T002` can run concurrently in Setup.
- `T003`, `T004`, and `T005` can run concurrently in Foundational.
- In US1: `T006` (test) runs first, `T007` and `T008` can be developed concurrently before `T009`.
- In US2: `T010` (test) runs first, `T011` and `T012` can be developed in parallel before `T013` and `T014`.
- In US3: `T015` (unit test) runs first, `T016` and `T017` can run in parallel before `T018`.
- In Polish: `T019` and `T021` can run concurrently with `T020`.

---

## Implementation Strategy

### MVP First (User Story 1 Only)
1. Complete Phase 1 (Setup) & Phase 2 (Foundational).
2. Complete Phase 3 (User Story 1 - Universal FPP POV).
3. **Validate**: Click any employee in roster, enter FPP POV, look around with mouse, exit via ESC.
4. Deliver MVP increment.

### Incremental Delivery
- **Increment 1**: FPP POV for all existing 18 crew members (US1).
- **Increment 2**: Boss character spawning in executive room with patrol routines (US2) + FPP POV of the Boss.
- **Increment 3**: Scolding lazy/sleepy employees & rewarding high performers with coffee (US3).
- **Increment 4**: Verification, automated visual Playwright tests, and documentation.
