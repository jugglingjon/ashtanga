import { seriesList, getSeries } from '../lib/data.js';
import { escapeHtml } from '../lib/search.js';
import { href } from '../router.js';
import { installMode, onInstallChange, promptInstall, dismissInstall, isMobile } from '../lib/install.js';
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

function installBanner(mode) {
  if (!mode) return '';
  const [label, verb] = isMobile ? ['Add to Home Screen', 'Add'] : ['Install as an app', 'Install'];
  // iOS can't install from a tap, so the button opens the steps instead.
  const action = mode === 'ios'
    ? `<a class="install-btn" href="${href('install')}" aria-label="${label}">${verb}</a>`
    : `<button type="button" class="install-btn" data-install aria-label="${label}">${verb}</button>`;
  return `<div class="install">
    <img class="install-icon" src="icons/icon-192.png" alt="" width="44" height="44">
    <p class="install-text"><b>${label}</b><span>Full screen, works offline</span></p>
    ${action}
    <button type="button" class="install-dismiss" data-dismiss aria-label="Not now">${icon('close')}</button>
  </div>`;
}

let installSlot = null;

function renderInstall() {
  if (installSlot?.isConnected) installSlot.innerHTML = installBanner(installMode());
}

// The install prompt can arrive after the screen is drawn.
onInstallChange(renderInstall);

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
    <div class="install-slot"></div>
    <ul class="series-cards" role="list">${seriesList.map(card).join('')}</ul>
    <p class="home-foot">A study aid, not a substitute for a teacher.</p>
  </div>`;

  installSlot = root.querySelector('.install-slot');
  renderInstall();
  installSlot.addEventListener('click', (e) => {
    if (e.target.closest('[data-install]')) promptInstall();
    else if (e.target.closest('[data-dismiss]')) dismissInstall();
  });
}
