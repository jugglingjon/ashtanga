// Pure helpers for expanding a pose's step list into numbered vinyasas.
// Shared by the app and scripts/validate-data.js, so no imports here.

export const SANSKRIT_COUNT = [
  '', 'Ekam', 'Dve', 'Trini', 'Chatvari', 'Pancha', 'Shat', 'Sapta', 'Ashtau', 'Nava', 'Dasha',
  'Ekadasha', 'Dvadasha', 'Trayodasha', 'Chaturdasha', 'Panchadasha', 'Shodasha', 'Saptadasha',
  'Ashtadasha', 'Ekonavimshatih', 'Vimshatih', 'Ekavimshatih', 'Dvavimshatih', 'Trayovimshatih',
  'Chaturvimshatih', 'Panchavimshatih', 'Shadvimshatih', 'Saptavimshatih', 'Ashtavimshatih',
  'Ekonatrimshat', 'Trimshat'
];

/**
 * Expand template references ("@sun", "@vinyasa", …) and number every counted step.
 * Returns groups for rendering plus the derived total and state vinyasas.
 */
export function expandSteps(pose, templates) {
  const groups = [];
  const states = [];
  let n = 0;

  if (pose.flow) {
    for (const step of pose.steps || []) {
      groups.push({ kind: 'step', n: null, ...step });
    }
    return { groups, total: 0, states };
  }

  for (const entry of pose.steps || []) {
    if (typeof entry === 'string') {
      const key = entry.slice(1);
      const tpl = templates[key];
      if (!tpl) throw new Error(`Unknown step template "${entry}"`);
      const steps = tpl.steps.map((s) => ({ ...s, n: ++n }));
      groups.push({
        kind: 'template',
        key,
        label: tpl.label,
        summary: tpl.summary,
        after: tpl.after,
        from: steps[0].n,
        to: steps[steps.length - 1].n,
        steps
      });
      continue;
    }
    const step = { kind: 'step', ...entry, n: entry.u ? null : ++n };
    if (step.h && step.n) states.push(step.n);
    groups.push(step);
  }

  return { groups, total: n, states };
}
