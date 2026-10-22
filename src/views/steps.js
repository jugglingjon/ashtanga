import { SANSKRIT_COUNT } from '../lib/steps.js';
import { escapeHtml } from '../lib/search.js';
import { icon } from '../icons.js';

export function holdLabel(h) {
  return typeof h === 'string' && /[a-z]/i.test(h) ? h : `${h} breaths`;
}

function step(s, focus) {
  const cls = ['step'];
  if (!s.n) cls.push('is-between');
  if (s.h) cls.push('is-state');
  if (focus && s.p === focus) cls.push('is-focus');
  const breath = s.b === 'in' ? 'Inhale' : 'Exhale';
  return `<li class="${cls.join(' ')}">
    <span class="step-n">${s.n ?? ''}</span>
    <span class="step-body">
      <span class="breath breath-${s.b}"><span aria-hidden="true">${s.b === 'in' ? '↑' : '↓'}</span> ${breath}</span>
      ${s.n && SANSKRIT_COUNT[s.n] ? `<span class="count-word" lang="sa-Latn">${SANSKRIT_COUNT[s.n]}</span>` : ''}
      <span class="step-m">${escapeHtml(s.m)}</span>
      ${s.h ? `<span class="hold">${holdLabel(s.h)}</span>` : ''}
    </span>
  </li>`;
}

function group(g) {
  return `<li class="step-group">
    <button type="button" class="step-group-toggle" aria-expanded="false">
      <span class="step-n is-range">${g.from}–${g.to}</span>
      <span class="step-body">
        <span class="group-label">${escapeHtml(g.label)}</span>
        <span class="group-summary">${escapeHtml(g.summary)}</span>
      </span>
      ${icon('down', 'icon group-chevron')}
    </button>
    <ol class="steps is-nested" hidden>${g.steps.map((s) => step(s)).join('')}</ol>
    ${g.after ? `<p class="step-after">${escapeHtml(g.after)}</p>` : ''}
  </li>`;
}

/** Numbered vinyasa list. `focus` highlights the steps that belong to a sub-posture. */
export function renderSteps({ groups }, { focus } = {}) {
  return `<ol class="steps">${groups
    .map((g) => (g.kind === 'template' ? group(g) : step(g, focus)))
    .join('')}</ol>`;
}
