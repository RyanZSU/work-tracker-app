# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

A native WeChat Mini Program (微信小程序), "Work Location Tracker": records each day as in-office / home / leave / holiday and shows a color-coded month calendar with per-month stats bars. **Local-only by design** — no server, no cloud, no network requests, no npm dependencies, no build step. Everything runs on `wx.*` APIs plus the device's synchronous local storage.

Design spec and implementation plan live in `docs/superpowers/specs/` and `docs/superpowers/plans/`. The plan is the authoritative description of how the app is built and stays in sync with the code.

## Commands

There is no `package.json`, linter, or build step. The only runnable "tests" are the node smoke scripts:

- Run all: `node scripts/verify-calendar.js && node scripts/verify-storage.js`
- Run one: `node scripts/verify-calendar.js` or `node scripts/verify-storage.js`

Both use only Node's built-in `assert` (no test framework). `verify-storage.js` installs a tiny in-process `wx` mock before requiring `utils/storage.js`; its mocked `setStorageSync` intentionally throws to exercise the write-failure path, so the `[storage] write failed` log line in its output is expected, not an error.

**UI verification cannot be done from the CLI.** The WXML/WXSS page is only exercisable in WeChat DevTools (Import → select the `wechat-app/` folder; keep the configured appid). Use the `wechatide-skill` for DevTools-driven work (compile, preview, upload, page automation, console/network inspection).

## Architecture

The code is deliberately layered so all pure logic is node-testable while every `wx` call stays isolated:

- `utils/states.js` — `STATES` is the single source of truth mapping the four states (`office | home | leave | holiday`) to `{ label, color }`. The grid, legend, stats, and action sheet all read from it; relabel/recolor in exactly one place. Page-level UI strings (banner, clear action, weekday headers) are hard-coded Chinese.
- `utils/calendar.js` — pure date/grid math with zero `wx` usage: `dateKey` (zero-padded local `YYYY-MM-DD`), `todayDateKey`, `getMonthGrid` (always 42 cells, 6×7, **Monday-first**; each cell `{ key, day, inMonth }`), `toggleMonth`. Keep it pure so the smoke test can `require` it in node.
- `utils/storage.js` — **all** `wx` storage access. Two keys: `attendance_records` is a flat `{ "YYYY-MM-DD": state }` map; `seeded_holiday_months` is a `{ "YYYY-MM": true }` set tracking which months had their weekend Holiday defaults materialized. `getRecords()` falls back to `{}` on corrupt/missing data (never throws); `setRecord(dateKey, state)` returns a boolean and `null` deletes the day.
- `pages/index/index.js` — the only page. Owns month state (`year`/`month`/`todayKey`), renders grid + stats in `renderMonth(year, month)`, and handles navigation and day editing. Carries the app's only concurrency guard: `this._busy` prevents double-firing a save while the action sheet is open.

No second source of truth: every view derives from the one record map — the grid filters by the `YYYY-MM` prefix, stats count values within the visible month.

## Key behaviors to preserve

- **State is record-only**: a day's displayed state is its explicit record when it names a known state, else blank — there is **no derived weekend default** at render time. Weekends become Holiday because `seedWeekendHolidays` (called from `renderMonth`) writes real `holiday` records for each month's Saturdays/Sundays exactly once, tracked in the `seeded_holiday_months` storage set. That once-only guard is what makes clearing a weekend stick: a cleared weekend stays blank instead of being re-defaulted on the next render.
- **Explicit month navigation**: faded leading/trailing cells from adjacent months are non-tappable (`onTapDay` early-returns unless the tapped cell's year+month match the visible month), so no out-of-range writes are possible.
- **Guarded reads**: unknown/tampered state values in storage render as neutral tiles (via a `STATES[...]` truthiness check), never crash.
- **Today refreshes on resume**: `onShow`, not `onLoad`, is the resume hook — the app can sit in WeChat's recents across midnight, so `todayKey` is re-derived there before re-rendering.
- **Failed writes don't misreport**: if `setRecord` returns false, show toast 「保存失败」 and skip the re-render so the UI keeps the in-memory truth.
- **Layout units are rpx**: stats bar heights are computed in rpx capped at 180 so the tallest bar plus labels fit the track.

## Conventions

- CommonJS `require`/`module.exports` (project compiles with `es6: true`).
- Conventional commit messages from git history (`feat:` / `fix:` / `style:` / `docs:`).
- `project.private.config.json` is gitignored — it holds DevTools personal config, not project config.