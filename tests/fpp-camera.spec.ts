import { test, expect } from '@playwright/test';

interface EngineProbe {
  keosEngine: {
    crewSize: number;
    characters: Map<string, unknown>;
    isFppActive?: () => boolean;
    getActiveFppTarget?: () => string | null;
  };
}

test.describe('Universal First-Person (FPP) POV Camera', () => {
  test('switches into FPP POV on roster click, updates HUD, and exits via Escape key', async ({ page }) => {
    test.setTimeout(90000);
    await page.goto('/');

    const canvas = page.locator('#canvas-container canvas');
    await expect(canvas).toBeVisible({ timeout: 10000 });

    // Wait until characters load
    await page.waitForFunction(
      () => {
        const engine = (window as unknown as EngineProbe).keosEngine;
        return engine && engine.characters && engine.characters.size >= 18;
      },
      undefined,
      { timeout: 60000 }
    );

    // Initial state: FPP HUD should not be active
    const fppHud = page.locator('#fpp-hud');
    await expect(fppHud).toBeHidden();

    // Click on Rex in roster
    const rexRow = page.locator('.person-row', { hasText: 'Rex' });
    await expect(rexRow).toBeVisible();
    await rexRow.locator('.person-focus').click();

    // Verify FPP HUD is now visible and shows Rex
    await expect(fppHud).toBeVisible({ timeout: 5000 });
    await expect(fppHud).toContainText('Rex');
    await expect(fppHud).toContainText('[POV_FPP]');

    // Verify engine state reports FPP active for Rex
    const isFpp = await page.evaluate(() => {
      const engine = (window as unknown as EngineProbe).keosEngine;
      return engine.isFppActive ? engine.isFppActive() : false;
    });
    expect(isFpp).toBe(true);

    // Mouse drag on canvas
    const box = await canvas.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width / 2 + 50, box.y + box.height / 2 + 20);
      await page.mouse.up();
    }

    // Press Escape to exit FPP
    await page.keyboard.press('Escape');
    await expect(fppHud).toBeHidden({ timeout: 5000 });

    const isFppAfterEsc = await page.evaluate(() => {
      const engine = (window as unknown as EngineProbe).keosEngine;
      return engine.isFppActive ? engine.isFppActive() : false;
    });
    expect(isFppAfterEsc).toBe(false);

    // Click on Bayu in roster to re-enter FPP
    const bayuRow = page.locator('.person-row', { hasText: 'Bayu' });
    await bayuRow.locator('.person-focus').click();
    await expect(fppHud).toBeVisible();
    await expect(fppHud).toContainText('Bayu');

    // Click exit button on HUD
    await page.locator('#btn-exit-fpp').click();
    await expect(fppHud).toBeHidden();
  });
});
