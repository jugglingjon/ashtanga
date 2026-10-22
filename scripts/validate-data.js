// Checks the posture data for broken references and count mistakes.
// Run with `npm run validate` (also runs before every build).
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expandSteps } from '../src/lib/steps.js';

const dataDir = join(dirname(fileURLToPath(import.meta.url)), '../src/data');
const load = (...p) => JSON.parse(readFileSync(join(dataDir, ...p), 'utf8'));

const templates = load('templates.json');
const sequences = load('sequences.json');
const errors = [];
const warnings = [];

const poses = {};
for (const file of readdirSync(join(dataDir, 'poses'))) {
  for (const [id, pose] of Object.entries(load('poses', file))) {
    if (poses[id]) errors.push(`${id}: defined twice (${poses[id].file} and ${file})`);
    poses[id] = { ...pose, id, file };
  }
}

const used = new Set();
const checkList = (where, list) => {
  for (const id of list) {
    if (!poses[id]) errors.push(`${where}: unknown pose "${id}"`);
    used.add(id);
  }
};

for (const [key, seq] of Object.entries(sequences)) checkList(`sequence ${key}`, seq.poses);

for (const file of readdirSync(join(dataDir, 'series'))) {
  const series = load('series', file);
  for (const section of series.sections) {
    if (section.ref) {
      if (!sequences[section.ref]) errors.push(`${series.id}: unknown sequence "${section.ref}"`);
    } else {
      checkList(`${series.id}/${section.id}`, section.poses);
    }
  }
}

for (const pose of Object.values(poses)) {
  const { id } = pose;
  for (const field of ['sanskrit', 'english', 'drishti']) {
    if (!pose[field]) errors.push(`${id}: missing ${field}`);
  }
  if (!pose.pending) {
    for (const field of ['alignment', 'modifications']) {
      if (!Array.isArray(pose[field]) || !pose[field].length) errors.push(`${id}: missing ${field}`);
    }
  }
  if (!used.has(id)) warnings.push(`${id}: not used in any series`);

  if (pose.of) {
    const parent = poses[pose.of];
    if (!parent) {
      errors.push(`${id}: "of" points to unknown pose "${pose.of}"`);
      continue;
    }
    const { groups } = expandSteps(parent, templates);
    if (!groups.some((g) => g.kind === 'step' && g.p === id && g.n)) {
      errors.push(`${id}: parent ${pose.of} has no counted step tagged "p": "${id}"`);
    }
    continue;
  }

  if (!Array.isArray(pose.steps) || !pose.steps.length) {
    errors.push(`${id}: no steps`);
    continue;
  }

  let result;
  try {
    result = expandSteps(pose, templates);
  } catch (err) {
    errors.push(`${id}: ${err.message}`);
    continue;
  }
  if (!pose.flow) {
    if (pose.vinyasas && pose.vinyasas !== result.total) {
      errors.push(`${id}: steps add up to ${result.total} vinyasas but "vinyasas" says ${pose.vinyasas}`);
    }
    if (!result.states.length && !pose.dynamic) warnings.push(`${id}: no held (state) vinyasa`);
  }
  for (const step of pose.steps) {
    if (typeof step === 'object' && !['in', 'ex'].includes(step.b)) {
      errors.push(`${id}: step "${step.m}" has breath "${step.b}"`);
    }
  }
}

for (const w of warnings) console.warn(`warn  ${w}`);
for (const e of errors) console.error(`error ${e}`);
console.log(`${Object.keys(poses).length} poses checked: ${errors.length} errors, ${warnings.length} warnings`);
process.exit(errors.length ? 1 : 0);
