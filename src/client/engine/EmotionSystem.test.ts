import { describe, it } from 'node:test';
import assert from 'node:assert';
import { applyWork, comfort, createVitals, stepVitals, whip } from './EmotionSystem';

const neverSlack = () => 1;

describe('EmotionSystem', () => {
  it('tires a focused worker until they fall asleep, then lets them recover', () => {
    const v = createVitals('FOKUS', 40, 0);
    stepVitals(v, 3, true, neverSlack);
    assert.strictEqual(v.mood, 'LELAH');
    for (let i = 0; i < 40 && v.mood === 'LELAH'; i++) stepVitals(v, 1, true, neverSlack);
    assert.strictEqual(v.mood, 'TIDUR');
    for (let i = 0; i < 40 && v.mood === 'TIDUR'; i++) stepVitals(v, 1, true, neverSlack);
    assert.strictEqual(v.mood, 'FOKUS');
  });

  it('does not change a walking person into a sleeping one', () => {
    const v = createVitals('FOKUS', 5, 0);
    stepVitals(v, 1, false, neverSlack);
    assert.strictEqual(v.mood, 'FOKUS');
  });

  it('whip wakes sleeping and slacking people and costs stress', () => {
    for (const mood of ['TIDUR', 'MALAS', 'LELAH'] as const) {
      const v = createVitals(mood, 5, 10);
      assert.strictEqual(whip(v), 'WOKE');
      assert.strictEqual(v.mood, 'TAKUT');
      assert.ok(v.energy >= 55);
      assert.strictEqual(v.stress, 25);
      assert.strictEqual(v.whips, 1);
    }
  });

  it('whipping a working person only provokes them, eventually to anger', () => {
    const v = createVitals('FOKUS', 80, 60);
    assert.strictEqual(whip(v), 'PROTEST');
    assert.strictEqual(v.mood, 'FOKUS');
    assert.strictEqual(whip(v), 'ANGRY');
    assert.strictEqual(v.mood, 'MARAH');
  });

  it('telemetry wakes the person, and errors raise stress', () => {
    const v = createVitals('TIDUR', 20, 0);
    applyWork(v, false);
    assert.strictEqual(v.mood, 'FOKUS');
    const err = createVitals('FOKUS', 80, 60);
    applyWork(err, true);
    assert.strictEqual(err.mood, 'MARAH');
  });

  it('comfort calms a worker but does not wake a sleeper', () => {
    const v = createVitals('FOKUS', 50, 50);
    comfort(v, 10);
    assert.strictEqual(v.mood, 'SENANG');
    assert.strictEqual(v.stress, 30);
    const s = createVitals('TIDUR', 10, 50);
    comfort(s, 0);
    assert.strictEqual(s.mood, 'TIDUR');
  });
});
