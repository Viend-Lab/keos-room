<!--
SYNC IMPACT REPORT
==================
- Version change: Unratified Template -> 1.0.0
- Bump Rationale: Initial ratification of Keos Room project constitution based on project architecture, focusing on modularity, clean code, and Playwright automated testing.
- Modified Principles:
  * [PRINCIPLE_1_NAME] -> I. Modularity & Architectural Separation of Concerns
  * [PRINCIPLE_2_NAME] -> II. Clean Code & Zero-Emoji Standard
  * [PRINCIPLE_3_NAME] -> III. Playwright E2E & Comprehensive Test Discipline (NON-NEGOTIABLE)
  * [PRINCIPLE_4_NAME] -> IV. Unified Single-Process Architecture & Shared Contracts
  * [PRINCIPLE_5_NAME] -> V. Telemetry Observability & Resilient Boundary Ingestion
- Added Sections:
  * Technology Stack & Environmental Constraints
  * Development Workflow & Quality Gates
- Removed Sections: None (replaced template placeholders)
- Follow-up TODOs: None
-->

# Keos Room Constitution

## Core Principles

### I. Modularity & Architectural Separation of Concerns
Every component within Keos Room MUST adhere to strict domain boundaries and modular design:
- Telemetry ingestion (REST API, WebSocket hub, filesystem watchers, and stdio MCP server) MUST remain decoupled from rendering and client presentation logic.
- Client architecture MUST clearly segregate the 3D/2D Canvas rendering engine, state management, employee/character life-cycle, UI overlays, and Web Audio SFX subsystems.
- Business logic and harness parsing logic MUST reside in dedicated modules with explicit TypeScript interfaces, enabling standalone execution and unit testing without requiring an active browser or running canvas.

### II. Clean Code & Zero-Emoji Standard
Code quality, readability, and stylistic consistency are non-negotiable standards across the entire repository:
- **Strict TypeScript**: All modules MUST use explicit typings. Unbounded `any` types and ambiguous casts are strictly prohibited without documented architectural rationale.
- **100% Zero-Emoji Policy**: Unicode emojis MUST NOT appear in server logs, terminal output, telemetry notifications, source code identifiers, or UI badges. Statuses and notifications MUST use uppercase monospace token badges (e.g., `[PLAN]`, `[IO_WRITE]`, `[EXEC_TEST]`, `[ERR_ALERT]`, `[SUB_SPAWN]`).
- **Simplicity & YAGNI**: Avoid premature abstractions and bloated external dependencies. Code MUST prioritize clarity, low cognitive load, and explicit domain naming aligned with the virtual office metaphor.

### III. Playwright E2E & Comprehensive Test Discipline (NON-NEGOTIABLE)
Quality verification is an integral part of development and MUST be automated before shipping changes:
- **Playwright Test Mandate**: All UI interactions, canvas visual regressions, employee behavioral states, and end-to-end telemetry workflows MUST be validated through Playwright test suites (`npm run test:visual`).
- **Test-First & Red-Green Cycle**: Bug fixes and new telemetry capabilities MUST include reproducing tests before implementation. Tests must fail against broken behavior and pass upon correct implementation.
- **Fast Unit Tests**: Data parsers, harness state reducers, and ingestion endpoints MUST be covered by fast unit tests executed via `npm test`.
- All tests MUST be deterministic, self-cleaning, and independent of persistent external state.

### IV. Unified Single-Process Architecture & Shared Contracts
Keos Room is designed for immediate zero-friction developer experience:
- The backend server and frontend client MUST continue to launch and operate synchronously within a single process on a single configurable port (default `4040`), via `npm start` or `npm run dev`.
- Telemetry data structures shared between client and server MUST be governed by unified, versioned TypeScript contracts and schemas to prevent runtime deserialization drift.
- REST (`/api/ingest`), WebSocket (`ws://`), and MCP protocols MUST process telemetry events through a shared canonical event model.

### V. Telemetry Observability & Resilient Boundary Ingestion
As a telemetry aggregator receiving event streams from diverse AI coding harnesses:
- All external inputs from multi-harness sources (AGY, Claude Code, OpenCode, Codex, Kiro, Aider, Cline) MUST be validated and sanitized at the ingestion boundary.
- Telemetry parsing errors or unexpected agent log formats MUST NOT crash the server or freeze the client rendering loop; errors MUST be logged as structured diagnostic events (`[ERR_ALERT]`).
- Logs MUST provide structured, traceable output facilitating quick diagnosis during live sessions.

## Technology Stack & Environmental Constraints

- **Runtime**: Node.js v18+ with TypeScript (executed via `tsx` for backend runtime and `vite` for client bundling).
- **Frontend Stack**: Three.js / Canvas 2D engine with standard Web APIs (AudioContext, WebSocket).
- **Backend Stack**: Express 4.x, WebSocket (`ws`), and Chokidar for filesystem watching.
- **Automated Testing Stack**: `@playwright/test` for browser E2E and visual validation; native Node.js test runner via `tsx --test` for unit testing.
- **No Heavy Framework Overhead**: Avoid heavy frontend state frameworks when native DOM and canvas state suffice.

## Development Workflow & Quality Gates

1. **Pre-Implementation Verification**: Any architectural change or new feature MUST be accompanied by an assessment of modular impact and contract definition.
2. **Quality Gates for Code Changes**:
   - `npm test`: All unit tests MUST pass with zero failures.
   - `npm run test:visual`: Playwright automated tests MUST pass, verifying visual layout and behavioral integrity.
   - Typecheck and build verification: `npm run build` MUST compile cleanly without TypeScript or Vite errors.
   - Code inspection MUST verify compliance with the Zero-Emoji Policy and explicit typing standards.

## Governance

This Constitution serves as the binding architectural authority for Keos Room:
- The principles defined herein supersede informal guidelines or ad-hoc practices.
- AI coding agents and human contributors MUST respect these principles across all planning, specification, tasking, and implementation phases.
- Any amendment to these principles requires an explicit version bump, rationale documentation, and a migration plan if existing code or tests are impacted.

**Version**: 1.0.0 | **Ratified**: 2026-11-04 | **Last Amended**: 2026-11-04
