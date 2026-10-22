import { youtubeUrl } from '../lib/data.js';
import { escapeHtml } from '../lib/search.js';
import { icon, figure } from '../icons.js';

export const TABS = [
  { id: 'photo', label: 'Photo' },
  { id: 'alignment', label: 'Alignment' },
  { id: 'modifications', label: 'Modifications' }
];

const dialog = document.getElementById('sheet');
const wide = window.matchMedia('(min-width: 1024px)');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let handlers = {};
let closing = false;

const pendingNote = `<p class="pending">Detailed cues for this posture haven't been written yet.
  Advanced postures are best learned directly from your teacher.</p>`;

function list(items, iconName) {
  return `<ul class="cue-list">${items.map((t) => `<li>${icon(iconName)}<span>${escapeHtml(t)}</span></li>`).join('')}</ul>`;
}

function panel(pose, tab) {
  if (tab === 'photo') {
    if (pose.image) {
      return `<figure class="photo"><img src="${escapeHtml(pose.image.src)}" alt="${escapeHtml(pose.image.alt || pose.sanskrit)}" loading="lazy">
        ${pose.image.credit ? `<figcaption>${escapeHtml(pose.image.credit)}</figcaption>` : ''}</figure>`;
    }
    return `<figure class="photo is-placeholder">
      ${figure}
      <figcaption><b>Photo coming soon</b><span>${escapeHtml(pose.sanskrit)}</span></figcaption>
    </figure>`;
  }
  const drishti = `<p class="drishti">${icon('eye')}<span><b>Drishti</b> ${escapeHtml(pose.drishti)}</span></p>`;
  if (tab === 'alignment') {
    return drishti + (pose.alignment?.length ? list(pose.alignment, 'check') : pendingNote);
  }
  return pose.modifications?.length ? list(pose.modifications, 'modify') : pendingNote;
}

function poseContent({ item, tab, prev, next }) {
  const { pose, section, index } = item;
  const tabIndex = Math.max(0, TABS.findIndex((t) => t.id === tab));
  return `<div class="sheet-grab" aria-hidden="true"></div>
    <header class="sheet-head">
      <div class="sheet-titles">
        <p class="eyebrow">${escapeHtml(section.title)} · ${index} of ${section.items.length}</p>
        <h2 id="sheet-title" lang="sa-Latn" tabindex="-1" autofocus>${escapeHtml(pose.sanskrit)}</h2>
        <p class="sheet-sub">${escapeHtml(pose.english)}</p>
      </div>
      <button type="button" class="icon-btn sheet-close" aria-label="Close">${icon('close')}</button>
    </header>
    <div class="segmented" role="tablist" aria-label="Reference" style="--i:${tabIndex}">
      <span class="segmented-thumb" aria-hidden="true"></span>
      ${TABS.map((t, i) => `<button type="button" role="tab" id="tab-${t.id}" data-tab="${t.id}"
        aria-selected="${i === tabIndex}" aria-controls="sheet-panel" tabindex="${i === tabIndex ? 0 : -1}">${t.label}</button>`).join('')}
    </div>
    <div class="sheet-body" id="sheet-panel" role="tabpanel" aria-labelledby="tab-${TABS[tabIndex].id}" tabindex="0">
      ${panel(pose, TABS[tabIndex].id)}
    </div>
    <footer class="sheet-foot">
      <a class="video-btn" href="${youtubeUrl(pose)}" target="_blank" rel="noopener">
        ${icon('play')}<span>Watch Kino MacGregor teach it</span>${icon('external', 'icon icon-sm')}
      </a>
      <nav class="pager" aria-label="Posture navigation">
        <button type="button" class="pager-btn" data-nav="prev" ${prev ? '' : 'disabled'}>
          ${icon('prev')}<span><small>Previous</small>${prev ? escapeHtml(prev.pose.sanskrit) : '—'}</span>
        </button>
        <button type="button" class="pager-btn is-next" data-nav="next" ${next ? '' : 'disabled'}>
          <span><small>Next</small>${next ? escapeHtml(next.pose.sanskrit) : '—'}</span>${icon('next')}
        </button>
      </nav>
    </footer>`;
}

const glossary = [
  ['Nasagrai', 'tip of the nose'],
  ['Broomadhya', 'third eye, between the eyebrows'],
  ['Nabi chakra', 'navel'],
  ['Hastagrai', 'hand'],
  ['Padhayoragrai', 'toes'],
  ['Parsva', 'far to the side, right or left'],
  ['Angusta ma dyai', 'thumbs'],
  ['Urdhva', 'up, toward the sky']
];

function aboutContent() {
  return `<div class="sheet-grab" aria-hidden="true"></div>
    <header class="sheet-head">
      <div class="sheet-titles">
        <p class="eyebrow">About</p>
        <h2 id="sheet-title" tabindex="-1" autofocus>How to use this guide</h2>
      </div>
      <button type="button" class="icon-btn sheet-close" aria-label="Close">${icon('close')}</button>
    </header>
    <div class="sheet-body prose" tabindex="0">
      <h3>Reading a count</h3>
      <p>Each number is one <em>vinyasa</em>: a single movement linked to one breath,
        <span class="breath breath-in">↑ Inhale</span> or <span class="breath breath-ex">↓ Exhale</span>.
        Highlighted rows are the <em>state</em> of the posture, where you stay for the breaths shown.
        Grouped rows such as <b>Sun Salutation entry</b> or <b>Vinyasa</b> expand to show every step.</p>
      <h3>About the counts</h3>
      <p>Counts follow the traditional full-vinyasa method, counted from Samasthitih and back,
        as taught by Sharath Jois and Kino MacGregor. The Primary Series totals match the traditional count.
        Intermediate, Third and Fourth Series counts use the same pattern and may differ from published charts.
        In daily Mysore practice you usually flow from Down Dog straight into the next posture.</p>
      <h3>Drishti (gaze points)</h3>
      <dl class="glossary">${glossary.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>
      <h3>Photos and videos</h3>
      <p>Posture photos are placeholders for now. Video links open a YouTube search for
        Kino MacGregor teaching that posture.</p>
      <h3>Practice safely</h3>
      <p>This guide is a study aid, not a substitute for a qualified teacher or medical advice.
        Traditionally, each new posture is given by a teacher once the previous one is steady.</p>
    </div>`;
}

function lockScroll(lock) {
  document.documentElement.classList.toggle('sheet-open', lock);
}

function show() {
  closing = false;
  dialog.classList.remove('is-closing');
  if (!dialog.open) {
    if (wide.matches) dialog.show();
    else dialog.showModal();
  }
  lockScroll(true);
}

function setContent(html) {
  const inner = dialog.querySelector('.sheet-inner');
  // Reuse the open sheet's container so swapping content doesn't replay the entrance animation.
  if (dialog.open && !closing && inner) {
    inner.innerHTML = html;
    inner.style.removeProperty('transform');
  } else {
    dialog.innerHTML = `<div class="sheet-inner">${html}</div>`;
  }
}

function setTab(pose, tab) {
  const i = Math.max(0, TABS.findIndex((t) => t.id === tab));
  const seg = dialog.querySelector('.segmented');
  seg.style.setProperty('--i', i);
  seg.querySelectorAll('[role="tab"]').forEach((btn, j) => {
    btn.setAttribute('aria-selected', String(j === i));
    btn.tabIndex = j === i ? 0 : -1;
  });
  const body = dialog.querySelector('.sheet-body');
  body.setAttribute('aria-labelledby', `tab-${TABS[i].id}`);
  body.innerHTML = panel(pose, TABS[i].id);
  body.scrollTop = 0;
}

/** Render a posture into the sheet and open it. */
export function openPoseSheet(state, on) {
  handlers = on;
  const { item } = state;
  if (dialog.open && !closing && dialog.dataset.kind === 'pose' && dialog.dataset.key === item.key) {
    setTab(item.pose, state.tab);
    return;
  }
  setContent(poseContent(state));
  dialog.dataset.kind = 'pose';
  dialog.dataset.key = item.key;
  dialog.style.setProperty('--accent', state.accent);
  show();
}

export function openAboutSheet(on) {
  handlers = on;
  setContent(aboutContent());
  dialog.dataset.kind = 'about';
  delete dialog.dataset.key;
  show();
}

/** Close with an exit animation. Resolves once the dialog is closed. */
export function closeSheet() {
  if (!dialog.open || closing) return Promise.resolve();
  closing = true;
  lockScroll(false);
  return new Promise((resolve) => {
    const done = () => {
      dialog.close();
      dialog.classList.remove('is-closing');
      dialog.querySelector('.sheet-inner')?.style.removeProperty('transform');
      closing = false;
      resolve();
    };
    if (reducedMotion.matches) return done();
    dialog.classList.add('is-closing');
    setTimeout(done, 240);
  });
}

export const isSheetOpen = () => dialog.open && !closing;

// Interaction ----------------------------------------------------------------

dialog.addEventListener('cancel', (e) => {
  e.preventDefault();
  handlers.onClose?.();
});

dialog.addEventListener('click', (e) => {
  if (e.target === dialog) return handlers.onClose?.();
  if (e.target.closest('.sheet-close')) return handlers.onClose?.();
  const tab = e.target.closest('[data-tab]');
  if (tab) return handlers.onTab?.(tab.dataset.tab);
  const nav = e.target.closest('[data-nav]');
  if (nav && !nav.disabled) return handlers.onNav?.(nav.dataset.nav);
});

// Arrow keys move between tabs (WAI-ARIA tabs pattern).
dialog.addEventListener('keydown', (e) => {
  const tab = e.target.closest('[role="tab"]');
  if (!tab || !['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
  const i = TABS.findIndex((t) => t.id === tab.dataset.tab);
  const nextTab = TABS[(i + (e.key === 'ArrowRight' ? 1 : TABS.length - 1)) % TABS.length];
  handlers.onTab?.(nextTab.id);
  requestAnimationFrame(() => dialog.querySelector(`[data-tab="${nextTab.id}"]`)?.focus());
});

// Drag the handle or header down to dismiss.
let drag = null;
dialog.addEventListener('pointerdown', (e) => {
  if (wide.matches || !e.target.closest('.sheet-grab, .sheet-head') || e.target.closest('button')) return;
  const inner = dialog.querySelector('.sheet-inner');
  drag = { y: e.clientY, t: performance.now(), dy: 0, inner, id: e.pointerId };
  inner.setPointerCapture(e.pointerId);
  inner.style.transition = 'none';
});

dialog.addEventListener('pointermove', (e) => {
  if (!drag || e.pointerId !== drag.id) return;
  drag.dy = Math.max(0, e.clientY - drag.y);
  drag.inner.style.transform = `translateY(${drag.dy}px)`;
});

function endDrag(e) {
  if (!drag || e.pointerId !== drag.id) return;
  const { dy, t, inner } = drag;
  drag = null;
  inner.style.transition = '';
  const velocity = dy / (performance.now() - t);
  if (dy > 120 || (dy > 40 && velocity > 0.6)) {
    handlers.onClose?.();
  } else {
    inner.style.transform = '';
  }
}
dialog.addEventListener('pointerup', endDrag);
dialog.addEventListener('pointercancel', endDrag);

// Re-open in the right mode when crossing the wide breakpoint.
wide.addEventListener('change', () => {
  if (!dialog.open) return;
  dialog.close();
  show();
});
