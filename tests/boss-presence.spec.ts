import { test, expect } from '@playwright/test';

interface EngineProbe {
  keosEngine: {
    crewSize: number;
    characters: Map<string, { id: string; name: string; roleTitle: string }>;
    isFppActive?: () => boolean;
  };
}

test.describe('Boss Character Presence & Autonomous Routine', () => {
  test('spawns Bos in executive division and enables FPP perspective on Bos', async ({ page }) => {
    test.setTimeout(90000);
    await page.goto('/');

    const canvas = page.locator('#canvas-container canvas');
    await expect(canvas).toBeVisible({ timeout: 10000 });

    // Wait until all 19 characters load
    await page.waitForFunction(
      () => {
        const engine = (window as unknown as EngineProbe).keosEngine;
        return engine && engine.characters && engine.characters.size >= 19;
      },
      undefined,
      { timeout: 60000 }
    );

    // Verify Executive division heading is visible
    const executiveDivision = page.locator('.roster-division', { hasText: 'Executive / Direksi' });
    await expect(executiveDivision).toBeVisible();

    // Verify Bos row is visible with [BOS] badge
    const bossRow = page.locator('.person-row', { hasText: 'Bos' });
    await expect(bossRow).toBeVisible();
    await expect(bossRow).toContainText('[BOS]');

    // Click Bos to enter FPP
    await bossRow.locator('.person-focus').click();

    const fppHud = page.locator('#fpp-hud');
    await expect(fppHud).toBeVisible({ timeout: 5000 });
    await expect(fppHud).toContainText('Bos');
    await expect(fppHud).toContainText('Direktur Utama');

    // Exit FPP via button
    await page.locator('#btn-exit-fpp').click();
    await expect(fppHud).toBeHidden();
  });
});
