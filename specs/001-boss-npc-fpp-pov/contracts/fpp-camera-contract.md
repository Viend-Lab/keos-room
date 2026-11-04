# Contract: FPP Camera Controller API

**Contract ID**: `CTR-FPP-001`
**Consumer**: UI Roster List, Canvas Render Loop, Keyboard/Pointer Handler
**Provider**: `FreeCamera.ts` / `Office3DEngine.ts`

## 1. Interface Definition

```typescript
export interface IFppCameraController {
  /**
   * Switches camera mode into First-Person Perspective for a specific character.
   * If targetId is null, switches back to free camera.
   */
  setFppTarget(targetId: string | null): void;

  /**
   * Returns whether the camera is currently in First-Person Perspective.
   */
  isFppActive(): boolean;

  /**
   * Returns the ID of the currently tracked character, or null if free camera.
   */
  getActiveFppTarget(): string | null;

  /**
   * Updates camera position and orientation each frame.
   * In FPP mode, locks to target character head position + mouse look delta.
   * In FREE mode, handles standard free flight / WASD.
   */
  update(delta: number): void;

  /**
   * Immediately exits FPP mode and returns to Free Camera.
   */
  exitFpp(): void;
}
```

## 2. Event Dispatch Contracts

### 2.1 Mode Change Event (`fpp:mode-change`)
Dispatched when entering or exiting FPP mode to toggle HUD overlays.

```typescript
export interface FppModeChangeEventDetail {
  active: boolean;
  targetId: string | null;
  targetName: string | null;
  targetRole: string | null;
}
// window.dispatchEvent(new CustomEvent('fpp:mode-change', { detail: ... }));
```

## 3. Keyboard & Input Protocol

- **`Escape` Key**: If `isFppActive()` is `true`, intercepts event and triggers `exitFpp()`.
- **Mouse Drag (`PointerEvent`)**:
  - Horizontal drag adjusts `yawOffset` continuously.
  - Vertical drag adjusts `pitchOffset` within `[-0.75, +0.75]` radians.
- **Scroll Wheel**: In FPP mode, wheel does not translate position through the character's body; it adjusts FOV slightly (zoom in/out between 45° and 65°) or is safely ignored.
