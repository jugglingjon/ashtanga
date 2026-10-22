// Inline stroke icons (24px grid, currentColor).
const paths = {
  back: '<path d="M15 5l-7 7 7 7"/>',
  chevron: '<path d="M9 6l6 6-6 6"/>',
  down: '<path d="M6 9l6 6 6-6"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.01"/>',
  photo: '<rect x="3.5" y="5.5" width="17" height="13" rx="3"/><circle cx="9" cy="10.5" r="1.6"/><path d="M20.5 15.5l-4.5-4.5-8 7.5"/>',
  align: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r=".6"/>',
  modify: '<path d="M5 7h9M18 7h1M5 17h3M12 17h7"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>',
  play: '<rect x="3" y="5.5" width="18" height="13" rx="4"/><path d="M10.5 9.5v5l4.2-2.5z" fill="currentColor"/>',
  prev: '<path d="M14 6l-6 6 6 6"/>',
  next: '<path d="M10 6l6 6-6 6"/>',
  eye: '<path d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12s-3.5 6.5-9.5 6.5S2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.6"/>',
  sides: '<path d="M8 7l-4 5 4 5M16 7l4 5-4 5M4 12h16"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  external: '<path d="M14 5h5v5M19 5l-8 8M17 14v4a1 1 0 01-1 1H6a1 1 0 01-1-1V8a1 1 0 011-1h4"/>'
};

export function icon(name, cls = 'icon') {
  return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]}</svg>`;
}

// Placeholder figure used until real posture photos are added.
export const figure = `<svg class="figure" viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <circle cx="60" cy="27" r="9"/>
  <path d="M60 37c-3 13-3 24 0 37"/>
  <path d="M60 45c-10 4-16 12-18 24 4 5 10 7 16 7"/>
  <path d="M60 45c10 4 16 12 18 24-4 5-10 7-16 7"/>
  <path d="M28 87c15-11 49-11 64 0-15 7-49 7-64 0z"/>
</svg>`;
