# Ashtanga · The Four Series

A phone-first reference for the first four series of Ashtanga Yoga: Primary, Intermediate, Third (Advanced A) and Fourth (Advanced B). It shows the traditional vinyasa count for every posture, with drishti, alignment cues and modifications, and a link to Kino MacGregor teaching each posture on YouTube.

Built with plain HTML, SCSS and vanilla JavaScript (ES modules), bundled with Vite. It installs to the home screen and works offline.

## Features

- **Home**: the four series as liquid-glass cards.
- **Series screen**: every posture in order, with Sanskrit and English names. Sun Salutations, the fundamental standing sequence and the finishing sequence are shared by all four series and fold away (folded by default for the Intermediate, Third and Fourth series).
- **Tap a posture** to expand its vinyasa count. Each count shows its number, Sanskrit count word, breath (inhale or exhale) and movement. The state of the posture is highlighted. Standard runs ("Sun Salutation entry", "Vinyasa", "Return to standing") collapse into one line that expands on tap.
- **Reference sheet** (Photo · Alignment · Modifications) opens as a bottom sheet on phones and as a docked side panel on wide screens. It has previous/next buttons for the whole practice and a YouTube link. Swipe down, tap ×, press Esc or use the phone's back gesture to close it.
- **Search** filters the list as you type. Matching ignores case, accents, spaces and hyphens, so `supta kurma`, `suptakurm` and `tortoise` all find Supta Kurmasana. Collapsed sections are searched too.
- **Deep links**: every screen, posture and tab has its own URL, e.g. `#/primary/navasana/alignment`.
- **Add to Home Screen**: a banner on the home screen opens the browser's install dialog on Android and in desktop Chrome or Edge. iPhone and iPad have no install API, so there it shows the Share → Add to Home Screen steps (`#/install`). The banner hides once the app is installed, when it runs from the Home Screen, or after **×**.
- Light and dark mode, `prefers-reduced-motion`, `prefers-reduced-transparency`, safe-area insets and 44px tap targets.

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # validates the data, then builds to dist/
npm run preview    # serve the production build
npm run validate   # check the posture data only
npm test           # Playwright tests (phone + desktop)
```

## Project structure

```
index.html
src/
  main.js            screen routing, view transitions, sheet history
  router.js          hash routes: #/ · #/about · #/<series>/<pose>/<tab>
  icons.js           inline SVG icons + placeholder figure
  lib/data.js        loads JSON, resolves series sections, count badges
  lib/steps.js       expands step templates and numbers each vinyasa
  lib/search.js      accent-insensitive matching and highlighting
  lib/install.js     Add to Home Screen: install prompt, iOS detection, dismissal
  lib/storage.js     localStorage that fails quietly
  views/home.js      home screen
  views/series.js    series screen, accordion, search
  views/steps.js     vinyasa list markup
  views/sheet.js     bottom sheet / side panel, about sheet
  styles/            SCSS: tokens, glass mixins, screens
  data/
    templates.json   reusable step runs (@sun, @vinyasa, @close, …)
    sequences.json   shared sections (sun salutations, standing, finishing)
    series/*.json    the four series
    poses/*.json     posture library
scripts/
  validate-data.js   data checks (runs before every build)
  make-icons.js      renders PNG app icons from public/icons/icon.svg
tests/               Playwright tests
```

## Posture data

Each posture is defined once and referenced by id from the series files.

```json
"paschimottanasana": {
  "sanskrit": "Paschimottanasana",
  "english": "Seated Forward Bend",
  "meaning": "Intense stretch of the west (back of the body)",
  "drishti": "Padhayoragrai (toes)",
  "vinyasas": 16,
  "steps": [
    "@sun",
    { "b": "in", "m": "Jump or step through to sit in Dandasana", "p": "dandasana" },
    { "b": "in", "m": "Hold the big toes, lift the chest and look up" },
    { "b": "ex", "m": "Fold forward over the legs", "h": 5 },
    { "b": "in", "m": "Lift the head and chest" },
    "@vinyasa",
    "@close"
  ],
  "alignment": ["…"],
  "modifications": ["…"]
}
```

| Field | Meaning |
| --- | --- |
| `steps` | Each object is one vinyasa: `b` breath (`in`/`ex`), `m` movement, `h` breaths held (marks the state), `u: true` for a transition that isn't counted, `p` the id of a sub-posture this step belongs to. Strings starting with `@` insert a template from `templates.json`. |
| `vinyasas` | Optional documented total. The validator fails if the steps don't add up to it. |
| `of` | For a posture counted inside another (Supta Kurmasana inside Kurmasana): the parent's id. Its steps are shown with this posture's vinyasas highlighted. |
| `flow` | For the finishing sequence: steps are shown without numbers. |
| `sides` | `true` if practiced on both sides. |
| `pending` | `true` when cues haven't been written yet; the sheet shows a note instead. |
| `image` | `{ "src": "images/poses/navasana.jpg", "alt": "…", "credit": "…" }`. Put files in `public/images/poses/`. Until then the app shows a placeholder. |
| `video` | A YouTube video id. Without one, the link opens a YouTube search for "Kino MacGregor + posture". |

## About the counts

- **Method**: counts use the traditional full-vinyasa method, counted from Samasthitih and back, as taught at KPJAYI (Sharath Jois). Kino MacGregor teaches the same method. Her and Matthew Sweeney's posture-by-posture charts aren't freely available, so this app uses the KPJAYI count.
- **Primary Series**: totals and state numbers follow the traditional count (`vinyasas` is set and checked).
- **Intermediate, Third and Fourth**: counts are built with the same full-vinyasa pattern and may differ from published charts.
- **Fourth Series**: the posture list varies the most between sources, especially after Marichyasana H, and several postures are marked `pending`.

Everything should be reviewed by a qualified teacher before you rely on it.

## Deploying

`.github/workflows/deploy.yml` publishes `dist/` to GitHub Pages on every push to any branch, so the site always shows the most recently pushed branch. Each run is named after its branch in the Actions tab. To deploy a branch again without pushing, run the workflow from the Actions tab and pick the branch.

Setup:

1. **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. **Settings → Environments → github-pages → Deployment branches and tags: No restriction**. By default only `main` may deploy, and runs from other branches fail at the deploy step.

The build uses relative paths, so it works from `/<repo>/` or any other sub-path.
