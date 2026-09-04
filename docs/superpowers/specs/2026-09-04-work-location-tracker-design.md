# Work Location Tracker — Design Spec

- **Date:** 2026-09-04
- **Status:** Approved by user (awaiting spec review)

## Summary

A personal WeChat Mini Program that records, for each day, whether the user worked **in the office**, **at home**, took **leave**, or was on a **business trip**. All data is stored locally on the device — no server, no cloud, no network code. The main (and only) screen shows a color-coded month calendar with a per-month stats bar chart below it. The user's stated goal is to understand their own office-vs-home patterns over time.

## Goals / Non-goals

**Goals**
- Record one state per day in at most two taps (tap the day, pick the state)
- Clear monthly visualization of recorded states (calendar grid) + monthly counts (stats bars)
- Zero external dependencies, no build step, works fully offline, data private to the device

**Non-goals (explicitly out of scope)**
- Reminders / push notifications (require a server or cloud function — contradicts local-only storage)
- Export / share, cloud sync, multiple users / accounts
- Half-day records, per-day free-text notes, holiday auto-detection
- Settings page, multi-select / batch editing

## Data model

- **Single storage key** `attendance_records` in `wx.setStorageSync`.
- **Value:** flat object map `{ "YYYY-MM-DD": "office" }`.
- **State values (fixed strings):** `office | home | leave | trip`.
- **`STATES` constant:** label + color per state, defined once and shared by the grid, legend, action sheet, and stats — the single source of truth for presentation.
- **Date keys:** local time, zero-padded (`2026-09-04`).
- **No second source of truth:** every view derives from the one map. The month grid filters by the `YYYY-MM` prefix; stats count values within the current visible month.

## Project structure

```
wechat-app/
├── app.js / app.json / app.wxss     # app shell — single-page app
├── project.config.json              # DevTools config (user's appid)
├── sitemap.json
├── utils/
│   ├── storage.js                   # all record read/write lives here
│   └── calendar.js                  # month-grid generation + date helpers
└── pages/
    └── index/
        ├── index.js / .wxml / .wxss / .json
```

No npm dependencies, no build step, no network requests.

## UI

Page layout, top to bottom:

1. **Month header** — `◀ September 2026 ▶` chevrons plus a 「今天」 button that jumps back to the current month. No date-picker navigation (YAGNI).
2. **Legend row** — color swatches + labels for the 4 states.
3. **Calendar grid** — weeks start **Monday**, 6 rows × 7 columns:
   - Current-month days render as neutral tiles; a recorded day fills with its state color (white day number).
   - **Today** gets a dark outline; an unrecorded today shows a small dot so it reads as needing a record.
   - Days from the previous/next month appear faded and are **not tappable** — month navigation stays explicit.
4. **Stats bars** — one vertical colored bar per state with its **count** for the visible month, plus the line *"X / Y days marked"*.

**Today banner** — when today is unrecorded, a slim banner above the grid reads 「今天还没记录，点一下日期标记」.

## Interactions

- **Tap any current-month day** → native action sheet with the four states (each with its color dot) plus **清除记录** (only shown when the day already has a record).
- Picking a state saves the record and **re-renders the grid + stats in place** — no page navigation.
- 清除记录 removes that day's entry and reverts the tile to neutral.
- No pull-to-refresh, no settings page, no multi-select.

## Stats

- Bars always reflect the **visible month** — the header chevrons double as stats navigation.
- **"X / Y days marked"** counts marked days vs total days in that month; an empty month reads as visibly empty rather than silently zero.

## Error handling & edge cases

- **Corrupt storage** (invalid JSON): `getRecords()` catches, falls back to `{}`, logs — the app never crashes on bad data.
- **Write failure** (storage quota exceeded): `wx.showToast('保存失败')`, keep the previous in-memory state so the UI doesn't misreport.
- **Month boundaries:** faded out-of-month cells are not tappable, so no out-of-range writes are possible.
- **Fast repeated taps:** the action sheet is modal, and a single busy-guard in the page prevents double-firing a save.
- **Missed days** stay unmarked (gray) — no "unrecorded = office" assumption.

## Testing

No unit-test infrastructure — manual verification checklist in WeChat DevTools:

1. Mark each of the 4 states; verify grid color + stats counts update immediately.
2. Clear a record; verify tile reverts to neutral and the count drops.
3. Navigate across a month boundary; verify faded cells and that stats switch months.
4. Jump back to the current month via 「今天」; verify today's outline/dot.
5. Corrupt storage manually (set a bad value in the DevTools storage panel); verify graceful fallback to an empty grid.
6. Verify the app opens and renders with no records at all (first launch).

## Out of scope

See **Non-goals** above. Built exactly to the approved requirements; anything outside them is intentionally not designed.