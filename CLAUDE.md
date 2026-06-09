# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

A static GitHub Pages portfolio site for Andrew Young — no build step, no framework, no package manager. The site is a single HTML page with vanilla JS and CSS, deployed directly from the `main` branch.

## Development

Open `index.html` directly in a browser, or serve it locally:

```powershell
python -m http.server 8080
```

There are no tests, no linting config, and no compile step.

## Architecture

**Front-end (single-page):**
- `index.html` — all page structure and content
- `styles.css` — all styles (dark theme only; light-theme class exists in CSS but is intentionally disabled)
- `script.js` — all interactivity, organized into `init*` functions called on `DOMContentLoaded`:
  - `initCanvasParticles` — animated aurora curtain background drawn on `<canvas id="bg-canvas">`
  - `initTerminal` — simulated CLI terminal in the hero section
  - `initActivityDashboard` — reads `assets/data/*.json` to render Strava and Chess.com widgets
  - `initProjectFilters`, `initScrollAnimations`, `initArchitectureModal`, `initContactForm`
- `yahtzee.js` — standalone Yahtzee game logic (separate from portfolio JS)

**Data files** (`assets/data/`):
- `activities.json` — Strava workout data, auto-synced by GitHub Actions
- `chess.json` — Chess.com stats, auto-synced by GitHub Actions
- `linkedin-games.json` — LinkedIn game streaks, populated via bookmarklet (`scripts/linkedin_bookmarklet.js`)

## Data Sync Scripts

| Script | How it runs | Output |
|--------|-------------|--------|
| `scripts/sync_strava.py` | GitHub Actions (twice daily) | `assets/data/activities.json` |
| `scripts/sync_chess.py` | GitHub Actions (twice daily) | `assets/data/chess.json` |
| `scripts/linkedin_bookmarklet.js` | Browser bookmarklet on linkedin.com/games | `assets/data/linkedin-games.json` via GitHub API |

**GitHub Actions workflow** (`.github/workflows/update_data.yml`) runs `sync_strava.py` and `sync_chess.py` on a schedule. Requires secrets: `STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET`, `STRAVA_REFRESH_TOKEN`, `PAT_TOKEN`.

## Key Design Decisions

- Dark theme is the only supported theme. `initTheme()` actively removes any cached `light-theme` class on every page load.
- The aurora particle background uses canvas `globalCompositeOperation = 'screen'` to make overlapping curtains glow; it requires a CSS blur filter on the canvas element to diffuse the lines smoothly.
