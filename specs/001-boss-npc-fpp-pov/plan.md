# Implementation Plan: Boss NPC Autonomous Routine & Universal First-Person (FPP) POV

**Branch**: `001-boss-npc-fpp-pov` | **Date**: 2026-11-04 | **Spec**: [specs/001-boss-npc-fpp-pov/spec.md](spec.md)

**Input**: Feature specification from `/specs/001-boss-npc-fpp-pov/spec.md`

## Summary

Implement an autonomous Boss NPC character stationed in an executive office who cycles between desk work, office aisle patrol, scolding sleeping/slacking employees (`[SCOLD]`), and rewarding high-performing workers with coffee (`[COFFEE_GIFT]`). Simultaneously, upgrade the roster interaction from a distant camera focus to a universal First-Person Perspective (FPP POV) camera controller attached to any employee or the Boss, complete with mouse look and an intuitive escape/exit mechanism.

## Technical Context

**Language/Version**: TypeScript 5.7+ / Node.js 18+ (ES Modules)

**Primary Dependencies**: Three.js (`^0.186.1`), Express 4.x, WebSocket (`ws`), Vite 6.x

**Storage**: In-memory simulation state & client-side character state machines (no database required)

**Testing**: Native Node test runner (`tsx --test`) for unit tests; `@playwright/test` for browser E2E visual verification

**Target Platform**: Modern desktop web browsers (Chrome, Edge, Firefox, Safari) running at 60 FPS WebGL / Canvas

**Project Type**: Single-process client-server web visualizer application

**Performance Goals**: 60 FPS WebGL rendering during FPP camera tracking and multi-character animations; <300ms transition time into FPP POV

**Constraints**: Strict compliance with 100% Zero-Emoji Policy across all notifications and dialogs; single-port unified execution on port `4040`

**Scale/Scope**: 1 office floor, ~19 characters (18 existing crew + 1 Boss), 4 desk pods, 1 executive room, 4 roaming pets

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

- **Principle I: Modularity & Separation of Concerns**: PASSED. Camera controller (`FreeCamera.ts`), Boss state machine, and employee emotion evaluators are decoupled into modular TypeScript classes with explicit interfaces.
- **Principle II: Clean Code & Zero-Emoji Standard**: PASSED. All dialogue text and HUD notification tags use uppercase monospace ASCII tokens (`[SCOLD]`, `[COFFEE_GIFT]`, `[POV_FPP]`, `[PATROL]`). Zero Unicode emojis.
- **Principle III: Playwright E2E & Comprehensive Test Discipline**: PASSED. Automated visual Playwright test scenarios defined in `quickstart.md` and planned for `tests/`; unit tests planned for Boss state evaluation logic.
- **Principle IV: Unified Single-Process Architecture**: PASSED. Changes operate entirely within the existing client 3D engine and single-port `4040` architecture without introducing secondary processes.
- **Principle V: Telemetry Observability & Resilient Ingestion**: PASSED. Boss evaluation consumes existing telemetry activity without crashing or blocking the render loop.

## Project Structure

### Documentation (this feature)

```text
specs/001-boss-npc-fpp-pov/
├── spec.md              # Feature specification
├── plan.md              # This implementation plan
├── research.md          # Technical research & architectural decisions
├── data-model.md        # Entities, state machines & transitions
├── quickstart.md        # Runnable verification guide
├── contracts/           # API contracts (FPP camera, Boss routine, Roster UI)
│   ├── fpp-camera-contract.md
│   ├── boss-system-contract.md
│   └── roster-interaction-contract.md
├── checklists/
│   └── requirements.md  # Quality checklist
└── tasks.md             # Actionable task list (generated via /speckit-tasks)
```

### Source Code Layout

```text
src/
├── client/
│   ├── engine/
│   │   ├── FreeCamera.ts             # Extend with FPP camera attachment & mouse look
│   │   ├── officeLayout.ts           # Add Boss crew spec, executive office zone & desk seat
│   │   ├── officeProps.ts            # Executive desk props & mahogany decorations
│   │   ├── Office3DEngine.ts         # Boss lifecycle, patrol waypoints, FPP transitions
│   │   └── BossSystem.ts             # Boss behavior state machine & employee evaluator
│   ├── services/
│   │   ├── DialogueEngine.ts         # Add Boss scold & coffee gift dialogue templates
│   │   └── SoundEffects.ts           # Buzzer & chime retro synthesizer SFX
│   └── main.ts                       # Roster click -> FPP switch, HUD overlay & ESC handler
index.html                            # Floating FPP HUD element ([POV_FPP]: Name [Exit])
tests/
├── visual.spec.ts                    # Playwright visual test for FPP switch & Boss presence
└── boss-evaluation.test.ts           # Unit tests for Boss employee evaluation logic
```

**Structure Decision**: Retains the existing single-project structure under `src/client/` and `tests/`, expanding `FreeCamera.ts`, adding a modular `BossSystem.ts`, and updating the roster interaction in `main.ts` and `index.html`.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| *None* | No architectural violations identified. Fully conforms to all 5 articles of the Constitution. | N/A |
