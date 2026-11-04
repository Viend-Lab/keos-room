# Contract: Roster List Interaction Contract

**Contract ID**: `CTR-ROSTER-003`
**Consumer**: DOM Roster UI (`index.html`, `main.ts`)
**Provider**: `Office3DEngine.ts`

## 1. Roster Click Behavior Shift

### Current Behavior:
```typescript
focus.addEventListener('click', () => engine.focusPerson(person.id));
// Flies free camera to a distant overview position near the person
```

### New Contract Behavior:
```typescript
focus.addEventListener('click', () => {
  // If already in FPP of this person, exit to free camera
  if (engine.isFppActive() && engine.getActiveFppTarget() === person.id) {
    engine.exitFpp();
  } else {
    // Directly enter first-person perspective (FPP POV) of this person
    engine.enterFpp(person.id);
  }
});
```

## 2. Roster UI Badges & Executive Header
- The Boss is displayed at the top of the roster list under an `Executive` / `Direksi` heading.
- Boss row contains:
  - Role: `Direktur Utama`
  - Color badge: `#DC2626`
  - Current status indicator: `[IN_OFFICE]` or `[PATROL]`
  - Focus button triggers FPP view of the Boss as he walks or works.
