# Keos Room

> Interactive 3D Virtual Office & Multi-Harness AI Agent Telemetry Visualizer

[![GitHub Organization](https://img.shields.io/badge/Organization-Viend--Lab-181717?style=flat&logo=github)](https://github.com/Viend-Lab)
[![Repository](https://img.shields.io/badge/Repository-Viend--Lab%2Fkeos--room-2563EB?style=flat&logo=github)](https://github.com/Viend-Lab/keos-room)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Three.js](https://img.shields.io/badge/Three.js-r186-000000?style=flat&logo=three.js&logoColor=white)](https://threejs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=flat&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)

Keos Room transforms background autonomous AI coding agent workflows—reading files, writing code, running unit tests, executing browser tasks, resolving compiler errors, and dispatching subagents—into a living, real-time 3D collaborative engineering headquarters.

Developed by **[Viend Lab](https://github.com/Viend-Lab)**, Keos Room serves as both a central telemetry dashboard and an ambient visualizer for developers operating multi-agent coding harnesses.

---

## Overview

Modern software development increasingly relies on autonomous agent harnesses operating concurrently in the background. While these tools output verbose terminal logs, developers often lack high-level situational awareness of what each agent is performing in real time.

Keos Room addresses this by modeling an entire autonomous software agency inside a 3D WebGL virtual studio:
- **10 Specialized Humanoid Engineers** operate dedicated workstations, boardrooms, and testing pods.
- **Universal Multi-Harness Ingestion** continuously listens for events across Google Antigravity (AGY), Claude Code, OpenCode/Codex, Kiro/Kilo, Aider, Cline, and Roo Code.
- **Dynamic Emotion & Work Simulation** models cognitive energy, focus cycles, fatigue, stress, slacking, and recovery.
- **Interactive Supervisory Tools** allow operators to inspect telemetry, navigate with orbital or first-person cameras, and interact with the team.

```
                      +-----------------------------------+
                      |   Multi-Harness Agent Ecosystem   |
                      | (Antigravity, Claude, Codex, Kiro)|
                      +-----------------+-----------------+
                                        | File/WebSocket
                                        v
                      +-----------------+-----------------+
                      |     Keos Server & Normalizer      |
                      |  (Express, WS Hub, Watcher, MCP)  |
                      +-----------------+-----------------+
                                        | WebSocket (ws://:4040)
                                        v
                      +-----------------+-----------------+
                      |    Keos 3D WebGL Client Engine    |
                      |  - Three.js Cutaway Architecture  |
                      |  - 10 Animated Humanoid Crew      |
                      |  - Emotion & Discipline Mechanics |
                      |  - Dual Camera (Orbit & Free-Cam) |
                      +-----------------------------------+
```

---

## Key Features

### 1. Interactive 3D Architectural Studio
- **Cutaway Loft Architecture**: High-ceiling open-plan office featuring Scandinavian oak parquet flooring, exposed structural steel beams, iron-grid industrial windows, and warm ambient sunlight.
- **Functional Office Zones**:
  - **Executive Boardroom**: Glass-partitioned conference table for PM, Tech Lead, and Security planning reviews.
  - **Engineering Pods**: Six ergonomic workstations equipped with dual displays showing syntax-highlighted code activity, mechanical keyboards, and task chairs.
  - **Design & R&D Lounge**: Designer sofa, armchair, and coffee table for reflective thinking and design ideation.
  - **Kitchenette Pantry**: Stainless steel espresso machine, water dispenser, and coffee mugs.
  - **Enterprise Server Rack**: Active rack hardware stationed in the technical infrastructure zone.
  - **Urban Skyline Backdrop**: Exterior cityscape visible through loft windows with illuminated skyscrapers.
- **Rendering Quality**: Three.js WebGL pipeline with ACES Filmic tone mapping, soft directional shadows (`PCFShadowMap`), and atmospheric haze.

### 2. 10 Canonical AI Engineering Specialists
The virtual office is staffed by ten canonical department specialists with dedicated 3D models and skeletal rigs:

| Specialist | Name | Department Role | Primary Telemetry Triggers |
| :--- | :--- | :--- | :--- |
| **PM** | Blaze | Project Manager & Scrum Lead | High-level planning, workflow coordination, milestones |
| **Tech Lead** | Nova | System Architect & Lead | Architectural refactoring, design decisions, code review |
| **Frontend** | Rex | Frontend Specialist | UI templates, styling, client state, component creation |
| **Backend** | Kael | Backend Systems Engineer | Server routes, database models, microservices, APIs |
| **QA Lead** | Viper | Test Automation Lead | Test runner executions, test assertions, test reports |
| **QC / Tester** | Echo | Quality Control & User Testing | Visual validation, browser end-to-end tests, edge verification |
| **UI/UX** | Aura | Interface & Visual Designer | CSS design tokens, typography, visual polish, layouts |
| **DevOps** | Tark | Infrastructure & Reliability | CI/CD pipelines, Docker containerization, deployments |
| **Security** | Rook | Security & Compliance Officer | Secret detection, OWASP audits, permission verification |
| **R&D** | Zero | Research & Deep Problem Solver | Web research, algorithm spikes, experimental features |

### 3. Emotion, Energy & Discipline Simulation (`EmotionSystem`)
Specialists do not act like static robots; their productivity and behavior follow an emotional state machine:
- **Focus & Fatigue**: Continuous heavy coding depletes stamina over time, transitioning developers from energetic focus to fatigue and eventually sleep.
- **Slacking & Napping**: Exhausted engineers will put their heads down on desks to snooze or wander over to the lounge or pantry.
- **Stress & Burnout**: Failed unit tests or pipeline error spikes (`ERR_ALERT`) elevate worker stress levels, triggering anxious pacing or angry venting.
- **Interactive Discipline ("The Whip")**: Click the discipline tool to immediately snap slacking or sleeping specialists back to active duty. Use with caution: disciplining an engineer who is already working hard raises their stress and risks triggering an anger state.
- **Office Pets (Morale Boosters)**: Friendly pets (**Mochi**, **Oreo**, **Kopi**, and **Tahu**) roam the office floor. Proximity to pets naturally reduces developer stress and prevents burnout.

### 4. Dual Camera Navigation
- **Orbital Studio Camera (Default)**: Inertia-damped orbit controls. Left-click to rotate, right-click to pan, scroll to zoom.
- **Free-Roam Fly Camera (FPS Mode)**: Switch seamlessly to full first-person control using `WASD` navigation, `Q`/`E` vertical movement, `Shift` sprint boost, and pointer-lock mouse look.
- **Quick-Focus Jump**: Click any engineer in the employee drawer to smoothly fly the camera straight to their workstation.

### 5. Universal Multi-Harness Auto-Discovery
Keos Room includes background filesystem watchers that automatically detect active developer sessions from major agent harnesses:
- **Google Antigravity (AGY)**: `~/.gemini/antigravity-*/brain/`
- **Claude Code**: `~/.claude/projects/`
- **OpenCode & Codex**: `~/.opencode/`, `~/.codex/`
- **Kiro & Kilo**: `~/.kiro/`, `~/.kilo/`
- **Aider**: `.aider.chat.history.md`
- **Cline & Roo Code**: `%APPDATA%/Code/User/globalStorage/`

### 6. Real-Time Telemetry Bridge & Ingestion
- **WebSocket Gateway**: High-throughput duplex WebSocket broadcast (`ws://localhost:4040`) delivering normalized agent events to all connected clients.
- **REST Ingest API**: Simple HTTP endpoint (`POST /api/ingest`) for CI/CD pipelines, git commit hooks, or custom developer scripts.
- **Native MCP Server**: Fully compliant with Model Context Protocol (stdio transport) for agents that self-report their actions.

---

## Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- A modern web browser with WebGL 2.0 support (Chrome, Edge, Firefox, Safari)

### Quick Start (Single Command)

Clone the repository and launch both the backend server and Vite frontend client simultaneously:

```bash
# Clone repository from Viend Lab
git clone https://github.com/Viend-Lab/keos-room.git
cd keos-room

# Install dependencies
npm install

# Start development server and visualizer
npm start
```

Once started, open your browser at:
```
http://localhost:4040
```

> [!TIP]
> You can run Keos Room on a custom port by defining the `PORT` environment variable:
> ```bash
> PORT=4200 npm start
> ```

---

## Controls & Shortcuts

| Action | Control (Orbit Mode) | Control (Free-Roam Mode) |
| :--- | :--- | :--- |
| **Orbit / Look** | Left Click + Drag | Mouse Movement (Pointer Lock) |
| **Pan Camera** | Right Click + Drag | Mouse Movement |
| **Zoom In / Out** | Mouse Scroll Wheel | Scroll Wheel |
| **Forward / Back** | - | `W` / `S` |
| **Strafe Left / Right**| - | `A` / `D` |
| **Ascend / Descend** | - | `E` / `Q` (or `Space` / `C`) |
| **Sprint Boost** | - | Hold `Shift` |
| **Toggle Free-Roam** | Click "Free Camera" in header | Press `Escape` to release mouse |
| **Reset View** | Click "Reset Camera" | Click "Reset Camera" |
| **Whip / Discipline**| Click worker or button in drawer | Click worker |
| **Pet Animals** | Click animal on floor | Click animal |
| **Toggle Drawer** | Click "Hide Dialogue" / "Show Dialogue" | Click drawer button |

---

## Telemetry Ingest API

Send custom events into Keos Room from any script, shell command, or CI/CD workflow:

### Endpoint
`POST http://localhost:4040/api/ingest`

### Payload Schema
```json
{
  "harness": "CLAUDE",
  "account": "engineer@viend.my.id",
  "project": "keos-room",
  "tool": "edit_file",
  "target": "src/client/engine/Office3DEngine.ts",
  "message": "Optimized skeletal animation cross-fading and tone mapping",
  "category": "FRONTEND"
}
```

### Supported Categories & Automatic Role Dispatch
- `PLANNING` or `PM` -> **Blaze** (Engineering PM)
- `ARCHITECTURE` or `LEAD` -> **Nova** (Tech Lead)
- `FRONTEND` or `UI` -> **Rex** (Frontend Engineer)
- `BACKEND` or `API` -> **Kael** (Backend Engineer)
- `TEST` or `QA` -> **Viper** (QA Lead)
- `QC` or `E2E` -> **Echo** (QC / User Tester)
- `DESIGN` -> **Aura** (UI/UX Designer)
- `DEVOPS` or `DEPLOY` -> **Tark** (DevOps Specialist)
- `SECURITY` or `AUDIT` -> **Rook** (Security Officer)
- `RESEARCH` or `RND` -> **Zero** (R&D Specialist)
- `ERR_ALERT` -> Triggers team alert and elevates department stress levels.

### Quick Ingest Example (cURL)
```bash
curl -X POST http://localhost:4040/api/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "harness": "ANTIGRAVITY",
    "account": "farhan@viend.my.id",
    "project": "core-api",
    "tool": "run_command",
    "target": "npm test",
    "message": "Ran test suite across 14 modules: All PASS",
    "category": "QA"
  }'
```

---

## Model Context Protocol (MCP) Setup

Keos Room provides a native Model Context Protocol server, enabling AI assistants to self-report actions into the virtual office.

### Claude Desktop / Cursor / Antigravity Config
Add Keos Room to your assistant's MCP configuration file:

```json
{
  "mcpServers": {
    "keos-room": {
      "command": "npx",
      "args": ["-y", "tsx", "src/server/mcp/KeosMcpServer.ts", "--mcp"],
      "cwd": "/path/to/keos-room"
    }
  }
}
```

### Stdio MCP Direct Test
```bash
npm run mcp
```

---

## Development & Testing

### Project Structure
```
keos-room/
├── public/
│   └── assets/
│       ├── crew/              # CC0 3D Humanoid Specialists (.glb)
│       └── office-3d/         # 3D Architectural & Furniture Assets (.glb)
├── src/
│   ├── client/
│   │   ├── engine/
│   │   │   ├── Office3DEngine.ts      # Core Three.js WebGL engine
│   │   │   ├── EmotionSystem.ts       # Fatigue/focus/stress state machine
│   │   │   ├── FreeCamera.ts          # FPS navigation controller
│   │   │   ├── officeLayout.ts        # Architectural coordinates & bounds
│   │   │   └── officeProps.ts         # Furniture and asset placement
│   │   ├── services/
│   │   │   ├── DialogueEngine.ts      # Natural conversation generator
│   │   │   └── SoundEffects.ts        # Web Audio API procedural synthesis
│   │   └── main.ts                    # Client entry & telemetry bridge
│   └── server/
│       ├── normalizers/               # Universal multi-harness adapters
│       ├── watchers/                  # Filesystem session watchers
│       ├── mcp/                       # Model Context Protocol stdio server
│       └── server.ts                  # Express & WebSocket unified server
├── tests/
│   └── visual-review.spec.ts          # Automated Playwright visual review
├── index.html                         # Client UI shell & HUD
├── package.json
├── tsconfig.json
└── vite.config.ts
```

### Running Test Suites
```bash
# Execute unit test suite (EmotionSystem & UniversalNormalizer)
npm test

# Run visual assertions with Playwright
npm run test:visual

# Compile production client build
npm run build
```

---

## About Viend Lab

**Keos Room** is an open exploration project developed by **[Viend Lab](https://github.com/Viend-Lab)**, an independent software studio and developer collective building practical digital tools, creative visualizers, and agentic workflows.

- **GitHub Organization**: [github.com/Viend-Lab](https://github.com/Viend-Lab)
- **Official Website**: [viend.my.id](https://viend.my.id)
- **Contact**: [team@viend.my.id](mailto:team@viend.my.id)
- **Lead Developer**: [@viend987](https://github.com/viend987)

---

## License

This project is open-source software licensed under the [MIT License](LICENSE). 3D character and furniture models are licensed under CC0 1.0 Universal Public Domain.
