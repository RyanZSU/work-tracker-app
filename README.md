# Work Location Tracker

A native WeChat Mini Program (微信小程序) that records each day as **in-office / home / leave / holiday** and shows a color-coded month calendar with per-month stats bars.

**Local-only by design** — no server, no cloud, no network requests, no npm dependencies, no build step. Everything runs on `wx.*` APIs plus the device's synchronous local storage.

## Features

- **Daily tracking** — tap any day in the current month to mark it as one of four states:
  - 🟢 **Office** — worked in the office
  - 🔵 **Home** — worked from home
  - 🟠 **Leave** — day off / PTO
  - ⚪ **Holiday** — weekend or public holiday
- **Color-coded month calendar** — Monday-first 6×7 grid; leading/trailing cells from adjacent months are faded and non-interactive
- **Per-month stats** — bars showing how many days fall in each state, plus your **in-office percentage** of the month's working days (calendar days minus leave minus holiday)
- **Weekend defaults** — weekends are materialized as real `holiday` records the first time a month is viewed, but you can clear them (a cleared weekend stays blank)
- **Today banner** — prompts you to record today when it's not yet marked
- **Midnight-safe** — "today" refreshes on resume (`onShow`), so it stays correct even if the app sits in WeChat's recents across midnight

## Getting Started

Open the project in [WeChat DevTools](https://developers.weixin.qq.com/miniprogram/en/dev/devtools/download.html):

1. Launch WeChat DevTools (it shows this repo as a known project — or Import it directly)
2. **Import** — not "New Project" — and select this repository root
3. Keep the configured `appid` (`wxf972873e3c074a04`) or switch to your own
4. Compile and run in the simulator

There is no `npm install`, no build step, and no backend to stand up — the app is self-contained.

## Project Structure

```
├── app.js                 # App entry
├── app.json               # Page registration, window config
├── app.wxss               # Global styles
├── pages/index/           # The only page
│   ├── index.js           # Month state, render, navigation, day editing
│   ├── index.wxml         # Calendar grid, legend, stats, action sheet
│   ├── index.wxss         # rpx-based layout
│   └── index.json
├── utils/
│   ├── states.js          # Single source of truth: state → { label, color }
│   ├── calendar.js        # Pure date/grid math (no wx usage)
│   └── storage.js         # All wx storage access
├── scripts/
│   ├── verify-calendar.js # Node smoke test for the calendar math
│   └── verify-storage.js  # Node smoke test for storage (with in-process wx mock)
└── docs/superpowers/
    ├── specs/             # Design spec
    └── plans/             # Implementation plan (authoritative build description)
```

## Architecture

The code is deliberately layered so all pure logic is node-testable while every `wx` call stays isolated:

- **`utils/states.js`** — `STATES` maps the four states to `{ label, color }`. The grid, legend, stats, and day-picker all read from it, so you relabel or recolor in exactly one place.
- **`utils/calendar.js`** — pure date math: `dateKey`, `todayDateKey`, `getMonthGrid` (always 42 cells, Monday-first), `toggleMonth`, `isWeekend`. No `wx` usage, so it runs under plain node.
- **`utils/storage.js`** — the only module that touches storage. Two keys:
  - `attendance_records` — flat `{ "YYYY-MM-DD": state }` map
  - `seeded_holiday_months` — `{ "YYYY-MM": true }` set tracking which months have had their weekend Holiday defaults materialized
  - Reads never throw (corrupt/missing data falls back to `{}`); writes return a boolean.
- **`pages/index/index.js`** — owns month state, renders grid + stats, handles navigation and day editing, and carries the app's only concurrency guard (`_busy`) to prevent double-firing a save while the day-picker is open.

There is no second source of truth: every view derives from the one record map.

### Data model

Records are keyed by zero-padded local date (`2026-09-05`). A day's displayed state is **its explicit record when it names a known state, else blank** — there is no derived weekend default at render time. Weekends become Holiday because `seedWeekendHolidays` writes real `holiday` records for each month's Saturdays and Sundays exactly once (tracked in `seeded_holiday_months`). That once-only guard is what makes clearing a weekend stick.

Legacy `trip` values (the state was renamed to `holiday`) are normalized on read; the next write persists the migration naturally. Unknown/tampered state values render as neutral tiles and never crash.

## Testing

The only runnable "tests" are node smoke scripts using Node's built-in `assert`:

```bash
# Run all
node scripts/verify-calendar.js && node scripts/verify-storage.js

# Or individually
node scripts/verify-calendar.js
node scripts/verify-storage.js
```

`verify-storage.js` installs a tiny in-process `wx` mock before requiring `utils/storage.js`; its mocked `setStorageSync` intentionally throws to exercise the write-failure path, so the `[storage] write failed` log line in its output is expected, not an error.

UI verification can only be done in WeChat DevTools (the WXML/WXSS page isn't exercisable from the CLI).

## Conventions

- CommonJS `require`/`module.exports` (the project compiles with `es6: true`)
- Conventional commit messages (`feat:` / `fix:` / `style:` / `docs:`)
- All layout units are `rpx`; page-level UI strings are hard-coded Chinese

## Design Docs

- [`docs/superpowers/specs/`](docs/superpowers/specs/) — design spec
- [`docs/superpowers/plans/`](docs/superpowers/plans/) — implementation plan; the authoritative description of how the app is built, kept in sync with the code

## License

Private project — all rights reserved.