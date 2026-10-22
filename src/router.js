// Hash routes: #/ · #/about · #/<series> · #/<series>/<pose>/<tab>
export function parseRoute(hash = location.hash) {
  const [series = null, pose = null, tab = null] = hash
    .replace(/^#\/?/, '')
    .split('/')
    .filter(Boolean)
    .map(decodeURIComponent);
  return { series, pose, tab };
}

export function href(...parts) {
  return '#/' + parts.filter(Boolean).map(encodeURIComponent).join('/');
}

export function navigate(path, { replace = false } = {}) {
  if (replace) location.replace(path);
  else location.hash = path;
}
