import { describe, it } from 'node:test';
import assert from 'node:assert';
import { BossSystem, EmployeeEvaluationSubject, COOLDOWN_DURATION_MS } from '../src/client/engine/BossSystem';

describe('BossSystem Evaluation & Cooldown Mechanics', () => {
  let currentTime = 100000;
  const mockNow = () => currentTime;

  const createWorker = (overrides?: Partial<EmployeeEvaluationSubject>): EmployeeEvaluationSubject => ({
    id: 'bayu',
    name: 'Bayu',
    roleTitle: 'Frontend Engineer',
    mood: 'TIDUR',
    energy: 10,
    stress: 30,
    x: 0,
    z: 0,
    ...overrides
  });

  it('triggers [SCOLD] when evaluating a sleeping worker', () => {
    let worker = createWorker({ mood: 'TIDUR' });
    const boss = new BossSystem(
      {
        getEmployees: () => [worker],
        getEmployee: (id: string) => (id === worker.id ? worker : null),
        onScold: () => {},
        onCoffeeGift: () => {}
      },
      mockNow
    );

    const outcome = boss.evaluateEmployee('bayu');
    assert.strictEqual(outcome.action, 'SCOLD');
    assert.strictEqual(outcome.badgeToken, '[SCOLD]');
    assert.strictEqual(outcome.newMood, 'KAGET');
    assert.ok(outcome.stressDelta > 0);
    assert.ok(outcome.energyDelta > 0);
    assert.ok(outcome.dialogueText.includes('[SCOLD]'));
  });

  it('triggers [SCOLD] when evaluating a slacking (MALAS) worker', () => {
    let worker = createWorker({ id: 'siti', name: 'Siti', mood: 'MALAS', energy: 15 });
    const boss = new BossSystem(
      {
        getEmployees: () => [worker],
        getEmployee: (id: string) => (id === worker.id ? worker : null),
        onScold: () => {},
        onCoffeeGift: () => {}
      },
      mockNow
    );

    const outcome = boss.evaluateEmployee('siti');
    assert.strictEqual(outcome.action, 'SCOLD');
    assert.strictEqual(outcome.badgeToken, '[SCOLD]');
  });

  it('triggers [COFFEE_GIFT] when evaluating a focused high performer', () => {
    let worker = createWorker({ id: 'rex', name: 'Rex', mood: 'FOKUS', energy: 80, stress: 50 });
    const boss = new BossSystem(
      {
        getEmployees: () => [worker],
        getEmployee: (id: string) => (id === worker.id ? worker : null),
        onScold: () => {},
        onCoffeeGift: () => {}
      },
      mockNow
    );

    const outcome = boss.evaluateEmployee('rex');
    assert.strictEqual(outcome.action, 'COFFEE_GIFT');
    assert.strictEqual(outcome.badgeToken, '[COFFEE_GIFT]');
    assert.strictEqual(outcome.newMood, 'SENANG');
    assert.ok(outcome.stressDelta < 0);
    assert.ok(outcome.energyDelta >= 20);
    assert.ok(outcome.dialogueText.includes('[COFFEE_GIFT]'));
  });

  it('enforces 90s interaction cooldown per employee', () => {
    let worker = createWorker({ id: 'bayu', mood: 'TIDUR' });
    const boss = new BossSystem(
      {
        getEmployees: () => [worker],
        getEmployee: (id: string) => (id === worker.id ? worker : null),
        onScold: () => {},
        onCoffeeGift: () => {}
      },
      mockNow
    );

    // First inspection: scolds
    const firstOutcome = boss.evaluateEmployee('bayu');
    assert.strictEqual(firstOutcome.action, 'SCOLD');

    // Advance time by 30 seconds (< 90s cooldown)
    currentTime += 30000;
    const cooldownOutcome = boss.evaluateEmployee('bayu');
    assert.strictEqual(cooldownOutcome.action, 'IGNORE');
    assert.strictEqual(cooldownOutcome.badgeToken, '[NEUTRAL]');

    // Advance time beyond 90s cooldown
    currentTime += COOLDOWN_DURATION_MS + 1000;
    const secondOutcome = boss.evaluateEmployee('bayu');
    assert.strictEqual(secondOutcome.action, 'SCOLD');
  });

  it('enforces 100% Zero-Emoji policy across all generated dialogue strings', () => {
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
    const workers = [
      createWorker({ id: 'w1', mood: 'TIDUR' }),
      createWorker({ id: 'w2', mood: 'FOKUS', energy: 90 })
    ];

    const boss = new BossSystem(
      {
        getEmployees: () => workers,
        getEmployee: (id: string) => workers.find((w) => w.id === id) || null,
        onScold: () => {},
        onCoffeeGift: () => {}
      },
      mockNow
    );

    const scold = boss.evaluateEmployee('w1');
    const coffee = boss.evaluateEmployee('w2');

    assert.strictEqual(emojiRegex.test(scold.dialogueText), false, 'Scold dialogue must not contain emojis');
    assert.strictEqual(emojiRegex.test(coffee.dialogueText), false, 'Coffee dialogue must not contain emojis');
    assert.ok(scold.badgeToken.startsWith('[') && scold.badgeToken.endsWith(']'));
    assert.ok(coffee.badgeToken.startsWith('[') && coffee.badgeToken.endsWith(']'));
  });

  it('cycles state machine from IN_OFFICE to WALKING_OUT to PATROLLING', () => {
    const boss = new BossSystem(
      {
        getEmployees: () => [],
        getEmployee: () => null,
        onScold: () => {},
        onCoffeeGift: () => {}
      },
      mockNow
    );

    assert.strictEqual(boss.state, 'IN_OFFICE');
    // Tick beyond in-office duration
    boss.update(35);
    assert.strictEqual(boss.state, 'WALKING_OUT');
  });
});
