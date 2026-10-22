import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { normalize, matches, highlight } from '../src/lib/search.js';
import { expandSteps } from '../src/lib/steps.js';

const templates = JSON.parse(readFileSync(new URL('../src/data/templates.json', import.meta.url)));
const primary = JSON.parse(readFileSync(new URL('../src/data/poses/primary.json', import.meta.url)));

test.describe('search', () => {
  test('ignores case, accents, spaces and hyphens', () => {
    expect(normalize('Supta Kūrmāsana')).toBe('suptakurmasana');
    expect(matches('Supta Kurmasana', 'supta kurma')).toBe(true);
    expect(matches('Supta Kurmasana', 'suptakurm')).toBe(true);
    expect(matches('Supta Kurmasana', 'KURMASANA')).toBe(true);
    expect(matches('Supta Kurmasana', 'kapota')).toBe(false);
    expect(matches('Anything', '   ')).toBe(true);
  });

  test('highlights the match in the original text and escapes HTML', () => {
    expect(highlight('Supta Kurmasana', 'akurma')).toBe('Supt<mark>a Kurma</mark>sana');
    expect(highlight('<b>Pose</b>', 'pose')).toBe('&lt;b&gt;<mark>Pose</mark>&lt;/b&gt;');
    expect(highlight('Navasana', '')).toBe('Navasana');
  });
});

test.describe('vinyasa count', () => {
  test('numbers steps through templates and finds the state', () => {
    const { total, states, groups } = expandSteps(primary.paschimottanasana, templates);
    expect(total).toBe(16);
    expect(states).toEqual([9]);
    expect(groups[0]).toMatchObject({ kind: 'template', key: 'sun', from: 1, to: 6 });
    expect(groups.at(-1)).toMatchObject({ kind: 'template', key: 'close', from: 15, to: 16 });
  });

  test('unnumbered transitions do not advance the count', () => {
    const { total, states } = expandSteps(primary['utthita-hasta-padangusthasana'], templates);
    expect(total).toBe(14);
    expect(states).toEqual([2, 4, 7, 9, 11, 14]);
  });

  test('two-sided seated postures have a state on each side', () => {
    const { total, states } = expandSteps(primary['janu-sirsasana-a'], templates);
    expect(total).toBe(22);
    expect(states).toEqual([8, 15]);
  });
});
