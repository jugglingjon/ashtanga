import templates from '../data/templates.json';
import sequences from '../data/sequences.json';
import sharedPoses from '../data/poses/shared.json';
import primaryPoses from '../data/poses/primary.json';
import intermediatePoses from '../data/poses/intermediate.json';
import thirdPoses from '../data/poses/third.json';
import fourthPoses from '../data/poses/fourth.json';
import primary from '../data/series/primary.json';
import intermediate from '../data/series/intermediate.json';
import third from '../data/series/third.json';
import fourth from '../data/series/fourth.json';
import { expandSteps } from './steps.js';

export const poses = Object.fromEntries(
  Object.entries({
    ...sharedPoses,
    ...primaryPoses,
    ...intermediatePoses,
    ...thirdPoses,
    ...fourthPoses
  }).map(([id, pose]) => [id, { id, ...pose }])
);

export const seriesList = [primary, intermediate, third, fourth].sort((a, b) => a.order - b.order);

const expanded = new Map();

/** Numbered step groups for a pose, cached. */
export function getSteps(pose) {
  if (!expanded.has(pose.id)) expanded.set(pose.id, expandSteps(pose, templates));
  return expanded.get(pose.id);
}

/** For a pose that is part of another's count ("of"), the parent and the vinyasa numbers it occupies. */
export function getParentCount(pose) {
  if (!pose.of) return null;
  const parent = poses[pose.of];
  const { groups, total } = getSteps(parent);
  const at = groups.filter((g) => g.kind === 'step' && g.p === pose.id && g.n).map((g) => g.n);
  return { parent, total, at };
}

/** What the count pill shows on a row. */
export function countBadge(pose) {
  if (pose.of) {
    const { total, at } = getParentCount(pose);
    return { value: at[0] ?? '–', unit: `of ${total}`, label: `Vinyasa ${at.join(', ')} of ${total}` };
  }
  if (pose.flow) {
    const hold = pose.steps.find((s) => s.h)?.h;
    if (!hold) return { value: '~', unit: 'flow', label: 'Part of a continuous sequence' };
    if (typeof hold === 'string' && hold.includes('min')) {
      return { value: hold.replace(/\s*min/, ''), unit: 'min', label: `Rest ${hold}` };
    }
    return { value: hold, unit: 'br', label: `Hold ${hold} breaths` };
  }
  const { total } = getSteps(pose);
  return { value: total, unit: 'vin', label: `${total} vinyasas` };
}

/** Resolve a series' sections into concrete pose lists with unique row keys. */
export function getSeries(id) {
  const series = seriesList.find((s) => s.id === id);
  if (!series) return null;
  const sections = series.sections.map((section) => {
    const def = section.ref ? { id: section.ref, shared: true, ...sequences[section.ref] } : section;
    const items = def.poses.map((poseId, i) => ({
      key: `${def.id}-${i + 1}`,
      index: i + 1,
      pose: poses[poseId]
    }));
    return { id: def.id, title: def.title, subtitle: def.subtitle, shared: !!def.shared, items };
  });
  const own = sections.filter((s) => !s.shared).reduce((sum, s) => sum + s.items.length, 0);
  return { ...series, sections, ownCount: own };
}

export function youtubeUrl(pose) {
  if (pose.video) return `https://www.youtube.com/watch?v=${pose.video}`;
  const q = `Kino MacGregor ${pose.sanskrit} ashtanga`;
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
}
