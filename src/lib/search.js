// Accent-, case- and spacing-insensitive matching so "supta kurma",
// "suptakurm" and "kurmasana" all find Supta Kurmasana.

const COMBINING = /[̀-ͯ]/g;

function foldChar(ch) {
  return ch.normalize('NFD').replace(COMBINING, '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function normalize(text) {
  return foldChar(text);
}

/** Folded text plus, for each folded character, its index in the original string. */
function fold(text) {
  let folded = '';
  const map = [];
  for (let i = 0; i < text.length; i++) {
    const f = foldChar(text[i]);
    for (const c of f) {
      folded += c;
      map.push(i);
    }
  }
  return { folded, map };
}

export function matches(text, query) {
  const q = normalize(query);
  return !q || normalize(text).includes(q);
}

const escapeMap = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => escapeMap[c]);

/** Escaped HTML with the first match wrapped in <mark>. */
export function highlight(text, query) {
  const q = normalize(query);
  if (!q) return escapeHtml(text);
  const { folded, map } = fold(text);
  const at = folded.indexOf(q);
  if (at < 0) return escapeHtml(text);
  const start = map[at];
  const end = map[at + q.length - 1] + 1;
  return (
    escapeHtml(text.slice(0, start)) +
    '<mark>' + escapeHtml(text.slice(start, end)) + '</mark>' +
    escapeHtml(text.slice(end))
  );
}
