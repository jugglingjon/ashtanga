import { storage } from './storage.js';

// "Add to Home Screen". Chromium browsers fire beforeinstallprompt and can show their own
// install dialog from a tap. iOS has no install API, so there we explain the Share-sheet steps.

const DISMISSED = 'ashtanga:install-dismissed';
const listeners = new Set();
let deferred = null;

const ua = navigator.userAgent;
// iPadOS reports itself as a Mac; touch support tells them apart.
export const isIOS = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
export const isMobile = isIOS || /Android/.test(ua);

export function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
}

/** 'prompt' when a tap can open the browser's install dialog, 'ios' for instructions, otherwise null. */
export function installMode() {
  if (isStandalone() || storage.get(DISMISSED)) return null;
  if (deferred) return 'prompt';
  return isIOS ? 'ios' : null;
}

/** Calls `fn` whenever installMode() may have changed. */
export function onInstallChange(fn) {
  listeners.add(fn);
}

const notify = () => listeners.forEach((fn) => fn());

export async function promptInstall() {
  const event = deferred;
  // An event can only prompt once.
  deferred = null;
  notify();
  await event?.prompt();
}

export function dismissInstall() {
  storage.set(DISMISSED, '1');
  notify();
}

window.addEventListener('beforeinstallprompt', (e) => {
  // Keep the browser's own install banner from showing; ours offers the same dialog.
  e.preventDefault();
  deferred = e;
  notify();
});

window.addEventListener('appinstalled', () => {
  deferred = null;
  notify();
});
