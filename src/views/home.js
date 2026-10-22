import { seriesList, getSeries } from '../lib/data.js';
import { escapeHtml } from '../lib/search.js';
import { href } from '../router.js';
import { icon } from '../icons.js';

function card(s) {
  const { ownCount } = getSeries(s.id);
  return `<li>
    <a class="series-card" href="${href(s.id)}" data-series="${s.id}"
       style="--accent:${s.accent};--accent-2:${s.accent2}">
      <span class="card-num" aria-hidden="true">${s.order}</span>
      <span class="card-body">
        <span class="card-kicker">${escapeHtml(s.sanskrit)} · ${escapeHtml(s.meaning)}</span>
        <span class="card-title">${escapeHtml(s.name)}${s.alt ? ` <span class="card-alt">${escapeHtml(s.alt)}</span>` : ''}</span>
        <span class="card-blurb">${escapeHtml(s.blurb)}</span>
        <span class="card-meta">${ownCount} postures</span>
      </span>
      ${icon('chevron', 'icon card-chevron')}
    </a>
  </li>`;
}

export function renderHome(root) {
  root.innerHTML = `<div class="view home-view">
    <header class="home-head">
      <div>
        <p class="eyebrow">Ashtanga Yoga</p>
        <h1 class="home-title">The Four Series</h1>
        <p class="lede">The vinyasa count, alignment cues and modifications for every posture.</p>
      </div>
      <a class="icon-btn" href="${href('about')}" aria-label="About this app">${icon('info')}</a>
    </header>
    <ul class="series-cards" role="list">${seriesList.map(card).join('')}</ul>
    <p class="home-foot">A study aid, not a substitute for a teacher.</p>
  </div>`;
}
