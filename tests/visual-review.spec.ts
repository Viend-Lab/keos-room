import { test, expect, Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

interface EngineProbe {
  keosEngine: {
    crewSize: number;
    characters: Map<string, unknown>;
    getSnapshot(): { lazyCount: number; whipCount: number; people: { id: string; mood: string; lazy: boolean; whips: number }[] };
    getScreenPositionOf(id: string): { x: number; y: number } | null;
    focusPerson(id: string): void;
  };
}

const person = (page: Page, id: string) =>
  page.evaluate((personId) => {
    const engine = (window as unknown as EngineProbe).keosEngine;
    return engine.getSnapshot().people.find((p) => p.id === personId);
  }, id);

test.describe('Keos Room corporate office', () => {
  const reportsDir = path.resolve('reports/visual-snapshots');

  test.beforeAll(() => {
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
  });

  test('renders every division, whips a slacker back to work, and keeps the controls working', async ({ page }) => {
    test.setTimeout(120000);
    const pageErrors: Error[] = [];
    page.on('pageerror', (err) => pageErrors.push(err));

    await page.goto('/');

    const canvas = page.locator('#canvas-container canvas');
    await expect(canvas).toBeVisible({ timeout: 10000 });

    await page.waitForFunction(
      () => {
        const engine = (window as unknown as EngineProbe).keosEngine;
        return engine.characters.size === engine.crewSize;
      },
      undefined,
      { timeout: 60000 }
    );
    await page.waitForTimeout(1500);

    // Zero-Emoji Audit on full DOM
    const bodyText = await page.innerText('body');
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
    expect(emojiRegex.test(bodyText)).toBeFalsy();

    // Every division and every person is listed
    for (const team of ['Project Manager', 'Frontend', 'Backend', 'Quality Assurance', 'Designer', 'Security & DevOps']) {
      await expect(page.locator('.roster-division', { hasText: team })).toBeVisible();
    }
    await expect(page.locator('.person-row')).toHaveCount(18);
    await expect(page.locator('.person-device', { hasText: 'MacBook' })).toHaveCount(9);
    await expect(page.locator('.person-device', { hasText: /^PC$/ })).toHaveCount(9);

    await page.screenshot({ path: path.join(reportsDir, 'office-overview.png') });

    // Clicking the sleeping person in the 3D scene wakes them
    expect((await person(page, 'bayu'))?.mood).toBe('TIDUR');
    await page.evaluate(() => (window as unknown as EngineProbe).keosEngine.focusPerson('bayu'));
    await page.waitForTimeout(3000);
    const point = await page.evaluate(() => (window as unknown as EngineProbe).keosEngine.getScreenPositionOf('bayu'));
    const box = await canvas.boundingBox();
    await page.mouse.click(box!.x + point!.x, box!.y + point!.y);
    await expect(page.locator('.stamp')).toHaveText('DIPECUT');
    await page.screenshot({ path: path.join(reportsDir, 'office-whip.png') });

    const whipped = await person(page, 'bayu');
    expect(whipped?.mood).toBe('TAKUT');
    expect(whipped?.whips).toBe(1);

    // Roster: the name flies the camera there, the Pecut button whips
    const ekaRow = page.locator('.person-row', { hasText: 'Eka' });
    await ekaRow.locator('.person-focus').click();
    expect((await person(page, 'eka'))?.whips).toBe(0);
    if ((await person(page, 'eka'))?.lazy) {
      await ekaRow.locator('.btn-row-whip').click();
      expect((await person(page, 'eka'))?.mood).toBe('TAKUT');
    }

    await page.locator('#btn-toggle-roster').click();
    await expect(page.locator('#roster')).toBeHidden();
    await page.locator('#btn-toggle-roster').click();
    await expect(page.locator('#roster')).toBeVisible();

    // Drawer toggle
    await page.locator('#btn-toggle-dialogue').click();
    await expect(page.locator('#telemetry-drawer')).toHaveClass(/collapsed/);

    // Close-up of one person
    await page.evaluate(() => (window as unknown as EngineProbe).keosEngine.focusPerson('sari'));
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(reportsDir, 'office-room-closeup.png') });

    // Reset Camera interaction
    await page.locator('#btn-reset-cam').click();

    expect(pageErrors).toEqual([]);
  });

  test('live telemetry reaches the office and wakes the matching division', async ({ page, request }) => {
    test.setTimeout(120000);
    await page.goto('/');
    await page.waitForFunction(
      () => {
        const engine = (window as unknown as EngineProbe).keosEngine;
        return engine.characters.size === engine.crewSize;
      },
      undefined,
      { timeout: 60000 }
    );
    await expect(page.locator('#ws-indicator')).toHaveText('Telemetri tersambung');

    const response = await request.post('/api/ingest', {
      data: { harness: 'KIRO', tool: 'write_file', target: 'src/app.ts', message: 'telemetry-probe' }
    });
    expect(response.ok()).toBeTruthy();

    await expect(page.locator('.log-entry').first()).not.toHaveText(/Pengawasan dimulai/, { timeout: 5000 });
  });
});
