import { getSteps, getParentCount, countBadge, youtubeUrl } from '../lib/data.js';
import { escapeHtml, highlight, matches } from '../lib/search.js';
import { renderSteps, holdLabel } from './steps.js';
import { storage } from '../lib/storage.js';
import { icon } from '../icons.js';

const collapseKey = (seriesId, sectionId) => `ashtanga:collapsed:${seriesId}:${sectionId}`;

function isCollapsed(series, section) {
  const saved = storage.get(collapseKey(series.id, section.id));
  if (saved !== null) return saved === '1';
  return section.shared && series.id !== 'primary';
}

function row(item) {
  const { pose, key, index } = item;
  const badge = countBadge(pose);
  return `<li class="pose" data-key="${key}">
    <button type="button" class="pose-row" aria-expanded="false" aria-controls="panel-${key}" id="row-${key}">
      <span class="pose-idx">${index}</span>
      <span class="pose-names">
        <span class="pose-sk" lang="sa-Latn">${escapeHtml(pose.sanskrit)}</span>
        <span class="pose-en">${escapeHtml(pose.english)}</span>
      </span>
      <span class="pill" title="${escapeHtml(badge.label)}">
        <b>${escapeHtml(badge.value)}</b><small>${badge.unit}</small>
        <span class="sr-only">${escapeHtml(badge.label)}</span>
      </span>
      ${icon('down', 'icon row-chevron')}
    </button>
    <div class="pose-panel" id="panel-${key}" role="region" aria-labelledby="row-${key}" inert>
      <div class="pose-panel-inner"></div>
    </div>
  </li>`;
}

function section(series, sec) {
  const collapsed = isCollapsed(series, sec);
  return `<section class="section${collapsed ? ' is-collapsed' : ''}${sec.shared ? ' is-shared' : ''}" data-section="${sec.id}">
    <h2 class="section-head">
      <button type="button" class="section-toggle" aria-expanded="${!collapsed}">
        <span class="section-titles">
          <span class="section-title">${escapeHtml(sec.title)}</span>
          ${sec.subtitle ? `<span class="section-sub">${escapeHtml(sec.subtitle)}</span>` : ''}
        </span>
        <span class="section-count" data-total="${sec.items.length}">${sec.items.length}</span>
        ${icon('down', 'icon section-chevron')}
      </button>
    </h2>
    <ol class="pose-list" role="list">${sec.items.map(row).join('')}</ol>
  </section>`;
}

function meta(label, value, iconName, wide = false) {
  return `<div class="meta-item${wide ? ' is-wide' : ''}">${icon(iconName)}<dt>${label}</dt><dd>${escapeHtml(value)}</dd></div>`;
}

function detail(item) {
  const { pose } = item;
  const items = [];
  let lead = '';
  let steps;

  if (pose.of) {
    const { parent, total, at } = getParentCount(pose);
    items.push(meta('Vinyasa', `${at.join(' · ')} of ${total}`, 'align'));
    lead = `<p class="detail-lead">Counted within <b>${escapeHtml(parent.sanskrit)}</b>. This posture's steps are highlighted.</p>`;
    steps = renderSteps(getSteps(parent), { focus: pose.id });
  } else if (pose.flow) {
    const hold = pose.steps.find((s) => s.h)?.h;
    items.push(meta('Count', 'Continuous flow', 'align'));
    if (hold) items.push(meta('Hold', holdLabel(hold), 'check'));
    steps = renderSteps(getSteps(pose));
  } else {
    const { total, states } = getSteps(pose);
    items.push(meta('Vinyasas', String(total), 'align'));
    if (states.length) items.push(meta('State', states.join(' · '), 'check'));
    steps = renderSteps(getSteps(pose));
  }
  if (pose.sides) items.push(meta('Sides', 'Right, then left', 'sides'));
  items.push(meta('Drishti', pose.drishti, 'eye', true));

  return `<div class="detail">
    ${pose.meaning ? `<p class="detail-meaning">“${escapeHtml(pose.meaning)}”</p>` : ''}
    <dl class="meta">${items.join('')}</dl>
    ${lead}
    ${steps}
    ${pose.note ? `<p class="detail-note">${escapeHtml(pose.note)}</p>` : ''}
    <div class="actions">
      <button type="button" class="action" data-open="photo">${icon('photo')}<span>Photo</span></button>
      <button type="button" class="action" data-open="alignment">${icon('align')}<span>Alignment</span></button>
      <button type="button" class="action" data-open="modifications">${icon('modify')}<span>Modify</span></button>
      <a class="action" href="${youtubeUrl(pose)}" target="_blank" rel="noopener">${icon('play')}<span>Video</span></a>
    </div>
  </div>`;
}

/**
 * Renders the series screen and returns a small controller.
 * `onOpen(item, tab)` is called when one of the reference buttons is tapped.
 */
export function renderSeries(root, series, { onOpen, onBack }) {
  root.innerHTML = `<div class="view series-view">
    <header class="topbar">
      <div class="topbar-row">
        <button type="button" class="icon-btn back-btn" aria-label="Back to all series">${icon('back')}</button>
        <div class="topbar-title">
          <h1>${escapeHtml(series.name)}</h1>
          <p>${escapeHtml(series.sanskrit)} · ${escapeHtml(series.meaning)}</p>
        </div>
        <span class="topbar-count">${series.ownCount}<small>postures</small></span>
      </div>
      <div class="search" role="search">
        ${icon('search')}
        <input type="search" placeholder="Search postures" aria-label="Search postures" autocomplete="off"
               autocorrect="off" autocapitalize="off" spellcheck="false" enterkeyhint="search">
        <button type="button" class="search-clear" aria-label="Clear search" hidden>${icon('close')}</button>
      </div>
    </header>
    <p class="series-note">${icon('info')}<span>${escapeHtml(series.countNote)}</span></p>
    <div class="sections">${series.sections.map((s) => section(series, s)).join('')}</div>
    <p class="empty" hidden></p>
    <p class="sr-only" aria-live="polite" data-status></p>
  </div>`;

  const view = root.querySelector('.series-view');
  const topbar = view.querySelector('.topbar');
  const input = view.querySelector('.search input');
  const clear = view.querySelector('.search-clear');
  const empty = view.querySelector('.empty');
  const status = view.querySelector('[data-status]');

  const flat = series.sections.flatMap((sec) => sec.items.map((item) => ({ ...item, section: sec })));
  const byKey = new Map(flat.map((item) => [item.key, item]));
  const rows = [...view.querySelectorAll('.pose')].map((el) => ({ el, item: byKey.get(el.dataset.key) }));
  let openKey = null;

  // Keep sticky offsets in sync with the header height.
  const resize = new ResizeObserver(() => {
    view.style.setProperty('--header-h', `${topbar.offsetHeight}px`);
  });
  resize.observe(topbar);

  function setOpen(key, open) {
    const el = view.querySelector(`.pose[data-key="${key}"]`);
    if (!el) return;
    const btn = el.querySelector('.pose-row');
    const panel = el.querySelector('.pose-panel');
    if (open) {
      const inner = panel.querySelector('.pose-panel-inner');
      if (!inner.childElementCount) inner.innerHTML = detail(byKey.get(key));
      panel.inert = false;
    } else {
      panel.inert = true;
    }
    el.classList.toggle('is-open', open);
    btn.setAttribute('aria-expanded', String(open));
  }

  function toggle(key) {
    if (openKey && openKey !== key) setOpen(openKey, false);
    const opening = openKey !== key;
    setOpen(key, opening);
    openKey = opening ? key : null;
    if (opening) {
      const el = view.querySelector(`.pose[data-key="${key}"]`);
      setTimeout(() => el.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 280);
    }
  }

  function setSectionCollapsed(secEl, collapsed) {
    secEl.classList.toggle('is-collapsed', collapsed);
    secEl.querySelector('.section-toggle').setAttribute('aria-expanded', String(!collapsed));
    storage.set(collapseKey(series.id, secEl.dataset.section), collapsed ? '1' : '0');
  }

  function filter(query) {
    const q = query.trim();
    let total = 0;
    view.classList.toggle('is-searching', !!q);
    for (const secEl of view.querySelectorAll('.section')) {
      let visible = 0;
      for (const li of secEl.querySelectorAll('.pose')) {
        const { pose } = byKey.get(li.dataset.key);
        const hit = !q || matches(pose.sanskrit, q) || matches(pose.english, q);
        li.hidden = !hit;
        if (hit) visible++;
        li.querySelector('.pose-sk').innerHTML = highlight(pose.sanskrit, q);
        li.querySelector('.pose-en').innerHTML = highlight(pose.english, q);
      }
      secEl.hidden = visible === 0;
      const count = secEl.querySelector('.section-count');
      count.textContent = q ? `${visible}/${count.dataset.total}` : count.dataset.total;
      total += visible;
    }
    clear.hidden = !q;
    empty.hidden = !q || total > 0;
    if (q && !total) empty.textContent = `No postures match “${q}”`;
    status.textContent = q ? `${total} posture${total === 1 ? '' : 's'} found` : '';
  }

  view.addEventListener('click', (e) => {
    const t = e.target;
    if (t.closest('.back-btn')) return onBack();

    const rowBtn = t.closest('.pose-row');
    if (rowBtn) return toggle(rowBtn.closest('.pose').dataset.key);

    const secBtn = t.closest('.section-toggle');
    if (secBtn) {
      if (view.classList.contains('is-searching')) return;
      const secEl = secBtn.closest('.section');
      return setSectionCollapsed(secEl, !secEl.classList.contains('is-collapsed'));
    }

    const groupBtn = t.closest('.step-group-toggle');
    if (groupBtn) {
      const list = groupBtn.nextElementSibling;
      const expanded = groupBtn.getAttribute('aria-expanded') === 'true';
      groupBtn.setAttribute('aria-expanded', String(!expanded));
      list.hidden = expanded;
      return;
    }

    const openBtn = t.closest('[data-open]');
    if (openBtn) return onOpen(byKey.get(openBtn.closest('.pose').dataset.key), openBtn.dataset.open);
  });

  input.addEventListener('input', () => filter(input.value));
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && input.value) {
      e.stopPropagation();
      input.value = '';
      filter('');
    }
    if (e.key === 'Enter') input.blur();
  });
  clear.addEventListener('click', () => {
    input.value = '';
    filter('');
    input.focus();
  });

  return {
    list: flat,
    /** First row showing this pose, for deep links. */
    find(poseId) {
      return flat.find((item) => item.pose.id === poseId) || null;
    },
    /** Expand a row (used when arriving from a deep link or the sheet pager). */
    reveal(item) {
      const secEl = view.querySelector(`.section[data-section="${item.section.id}"]`);
      if (secEl?.classList.contains('is-collapsed')) setSectionCollapsed(secEl, false);
      if (openKey !== item.key) toggle(item.key);
    },
    destroy() {
      resize.disconnect();
    }
  };
}
