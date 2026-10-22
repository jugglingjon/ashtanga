import './styles/main.scss';
import { getSeries, poses } from './lib/data.js';
import { parseRoute, href, navigate } from './router.js';
import { renderHome } from './views/home.js';
import { renderSeries } from './views/series.js';
import { openPoseSheet, openAboutSheet, closeSheet, isSheetOpen, TABS } from './views/sheet.js';

const app = document.getElementById('app');
const root = document.documentElement;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

let screen = null; // { kind: 'home' } | { kind: 'series', series, controller }
let current = null; // the row shown in the sheet
// True when the sheet's URL was pushed by an in-app tap, so closing can use history.back().
let sheetPushed = false;
let enteredFromHome = false;
let renderId = 0;

function setAccent(series) {
  if (series) {
    root.style.setProperty('--accent', series.accent);
    root.style.setProperty('--accent-2', series.accent2);
    root.dataset.series = series.id;
  } else {
    root.style.removeProperty('--accent');
    root.style.removeProperty('--accent-2');
    delete root.dataset.series;
  }
}

/** Swap screens inside a view transition where supported. Resolves once the DOM is updated. */
async function swap(update, direction) {
  if (!direction || !document.startViewTransition || reducedMotion.matches) return update();
  root.dataset.nav = direction;
  const transition = document.startViewTransition(() => {
    const top = app.getBoundingClientRect().top;
    update();
    // The new screen starts at the top; keep the old snapshot where it was scrolled to.
    root.style.setProperty('--vt-old-y', `${top - app.getBoundingClientRect().top}px`);
  });
  transition.finished.finally(() => {
    delete root.dataset.nav;
    root.style.removeProperty('--vt-old-y');
  });
  await transition.updateCallbackDone;
}

function showHome() {
  if (screen?.kind === 'home') return;
  return swap(() => {
    screen?.controller?.destroy();
    renderHome(app);
    setAccent(null);
    screen = { kind: 'home' };
    window.scrollTo(0, 0);
  }, screen && 'back');
}

function showSeries(series) {
  if (screen?.kind === 'series' && screen.series.id === series.id) return;
  return swap(() => {
    screen?.controller?.destroy();
    const controller = renderSeries(app, series, {
      onOpen: (item, tab) => {
        current = item;
        sheetPushed = true;
        navigate(href(series.id, item.pose.id, tab));
      },
      onBack: () => {
        if (enteredFromHome) history.back();
        else navigate(href(), { replace: true });
      }
    });
    setAccent(series);
    screen = { kind: 'series', series, controller };
    window.scrollTo(0, 0);
  }, screen && 'forward');
}

function closeFromSheet() {
  const base = screen?.kind === 'series' ? href(screen.series.id) : href();
  if (sheetPushed) {
    sheetPushed = false;
    history.back();
  } else {
    navigate(base, { replace: true });
  }
}

function showPose(series, poseId, tab) {
  const { controller } = screen;
  // Keep the row the user tapped (a pose can appear twice, e.g. Paschimottanasana).
  const item = current?.pose.id === poseId ? current : controller.find(poseId);
  if (!item) return navigate(href(series.id), { replace: true });
  if (!sheetPushed && current !== item) controller.reveal(item); // deep link
  current = item;
  const tabId = TABS.some((t) => t.id === tab) ? tab : 'photo';
  const i = controller.list.indexOf(item);
  openPoseSheet(
    { item, tab: tabId, prev: controller.list[i - 1], next: controller.list[i + 1], accent: series.accent },
    {
      onClose: closeFromSheet,
      onTab: (t) => navigate(href(series.id, item.pose.id, t), { replace: true }),
      onNav: (dir) => {
        const target = controller.list[i + (dir === 'next' ? 1 : -1)];
        if (!target) return;
        current = target;
        controller.reveal(target);
        navigate(href(series.id, target.pose.id, tabId), { replace: true });
      }
    }
  );
  document.title = `${item.pose.sanskrit} · ${series.name}`;
}

async function render() {
  const id = ++renderId;
  const route = parseRoute();

  if (!route.series || route.series === 'about') {
    const about = route.series === 'about';
    if (!about && isSheetOpen()) closeSheet();
    enteredFromHome = false;
    await showHome();
    if (id !== renderId) return;
    document.title = 'Ashtanga · The Four Series';
    if (about) openAboutSheet({ onClose: closeFromSheet });
    return;
  }

  const series = getSeries(route.series);
  if (!series) return navigate(href(), { replace: true });
  if (screen?.kind === 'home') enteredFromHome = true;
  await showSeries(series);
  if (id !== renderId) return;

  if (route.pose && poses[route.pose]) {
    showPose(series, route.pose, route.tab);
  } else {
    current = null;
    sheetPushed = false;
    if (isSheetOpen()) closeSheet();
    document.title = `${series.name} · Ashtanga`;
  }
}

// Remember an in-app tap on "About" so closing it goes back rather than adding history.
app.addEventListener('click', (e) => {
  if (e.target.closest(`a[href="${href('about')}"]`)) sheetPushed = true;
});

window.addEventListener('hashchange', render);
render();
