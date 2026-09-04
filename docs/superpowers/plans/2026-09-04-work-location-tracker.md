# Work Location Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-page native WeChat Mini Program that records each day as Office / Home / Leave / Trip, showing a color-coded month calendar with per-month stats bars, using only the device's local storage.

**Architecture:** One page (`pages/index`) renders a Monday-first 6×7 calendar month grid plus a stats bar chart. All records live in a single storage key `attendance_records` as a flat `{ "YYYY-MM-DD": state }` map. Pure date/grid math is isolated in `utils/calendar.js`; all `wx` storage access is isolated in `utils/storage.js`; the 4 states' labels/colors are centralized in `utils/states.js`. No third-party dependencies, no build step, no network code.

**Tech Stack:** Native WeChat Mini Program (JavaScript + WXML + WXSS), `wx.setStorageSync`/`wx.getStorageSync` for persistence, `wx.showActionSheet` for day editing, Node.js `assert` for dependency-free smoke tests of the pure modules.

---

## Verification approach

Two kinds of verification, both are part of the tasks:

1. **Node smoke tests** (`scripts/verify-*.js`) — run with `node scripts/<name>.js`. They exercise the pure modules (`utils/calendar.js`, `utils/storage.js`) against a tiny in-process `wx` mock. No test framework, no `package.json`, no dependencies. These are the "red / green" loops.
2. **Manual checks in WeChat DevTools** — the UI cannot be exercised headlessly. For these steps, **ask the user to open the project in WeChat DevTools** (Import → select the `wechat-app/` folder, appid stays as configured) and confirm the described behavior before marking the step done. The user's confirmation is the expected-output signal for these steps.

The spec was explicitly approved with manual DevTools verification; these `scripts/verify-*.js` files are a lightweight addition (dev-time only, never shipped) so the pure logic gets a repeatable check.

---

## File structure

| File | Responsibility |
|---|---|
| `app.json` | Page registry, window styling (single page) |
| `app.js` | Empty app shell (`App({})`) |
| `app.wxss` | Base page styles |
| `sitemap.json` | Standard sitemap |
| `project.config.json` | DevTools config (appid `wxf972873e3c074a04`) |
| `pages/index/index.json` | Page config (no components) |
| `pages/index/index.js` | Page logic: month state, grid render, stats, nav, day editing |
| `pages/index/index.wxml` | Page markup: header, banner, legend, grid, stats |
| `pages/index/index.wxss` | Page styles |
| `utils/states.js` | `STATES` — the 4 states, single source of truth for labels/colors |
| `utils/calendar.js` | Pure date/grid math: `dateKey`, `todayDateKey`, `getMonthGrid`, `toggleMonth` |
| `utils/storage.js` | All `wx` storage access: `getRecords`, `setRecord` |
| `scripts/verify-calendar.js` | Node smoke test for `utils/calendar.js` |
| `scripts/verify-storage.js` | Node smoke test for `utils/storage.js` (with `wx` mock) |

UI strings (banner, today button, clear action) are hard-coded in the page files per the approved spec; state labels come from `utils/states.js` so they can be relabeled in one place.

---

## Task 1: Project scaffold

**Files:**
- Create: `app.json`
- Create: `app.js`
- Create: `app.wxss`
- Create: `sitemap.json`
- Create: `project.config.json`
- Create: `pages/index/index.json`
- Create: `pages/index/index.js`
- Create: `pages/index/index.wxml`
- Create: `pages/index/index.wxss`

- [ ] **Step 1: Create `app.json`**

```json
{
  "pages": ["pages/index/index"],
  "window": {
    "navigationBarBackgroundColor": "#ffffff",
    "navigationBarTitleText": "Work Tracker",
    "navigationBarTextStyle": "black",
    "backgroundColor": "#f7f8fa",
    "backgroundTextStyle": "light"
  },
  "sitemapLocation": "sitemap.json"
}
```

- [ ] **Step 2: Create `app.js`**

```js
App({});
```

- [ ] **Step 3: Create `app.wxss`**

```css
page {
  background: #f7f8fa;
  color: #1f2329;
  font-size: 28rpx;
  font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', 'PingFang SC', sans-serif;
}
```

- [ ] **Step 4: Create `sitemap.json`**

```json
{
  "desc": "See https://developers.weixin.qq.com/miniprogram/dev/framework/sitemap.html",
  "rules": [{ "action": "allow", "page": "*" }]
}
```

- [ ] **Step 5: Create `project.config.json`**

```json
{
  "description": "Work location tracker mini program",
  "compileType": "miniprogram",
  "libVersion": "3.7.8",
  "appid": "wxf972873e3c074a04",
  "projectname": "work-location-tracker",
  "setting": {
    "es6": true,
    "postcss": true,
    "minified": true,
    "urlCheck": true
  }
}
```

- [ ] **Step 6: Create the page files** — `pages/index/index.json`, `index.js`, `index.wxml`, `index.wxss`

`pages/index/index.json`:
```json
{
  "usingComponents": {}
}
```

`pages/index/index.js` (placeholder — real logic lands in Tasks 4–6):
```js
// pages/index/index.js
Page({
  data: {},
});
```

`pages/index/index.wxml`:
```xml
<view class="page">
  <text>Work Tracker</text>
</view>
```

`pages/index/index.wxss`:
```css
.page {
  padding: 24rpx;
}
```

- [ ] **Step 7: Verify scaffold in WeChat DevTools**

Ask the user to open `wechat-app/` in WeChat DevTools. Expected: the app compiles with no errors and shows a page containing the text "Work Tracker" on a light-gray background. If DevTools prompts about the appid, the user should confirm/authorize it.

- [ ] **Step 8: Commit**

```bash
git add app.json app.js app.wxss sitemap.json project.config.json pages/
git commit -m "$(cat <<'EOF'
feat: scaffold single-page mini program shell

Native WeChat Mini Program app shell with one page and no dependencies.

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Calendar + date utilities

**Files:**
- Create: `utils/calendar.js`
- Test: `scripts/verify-calendar.js`

- [ ] **Step 1: Write the failing verification script**

`scripts/verify-calendar.js`:
```js
const assert = require('assert');
const { dateKey, todayDateKey, getMonthGrid, toggleMonth } = require('../utils/calendar');

// dateKey zero-pads year, month, day (month is 1-based)
assert.strictEqual(dateKey(2026, 9, 4), '2026-09-04');
assert.strictEqual(dateKey(2026, 12, 31), '2026-12-31');
assert.strictEqual(dateKey(2026, 1, 1), '2026-01-01');

// todayDateKey always has YYYY-MM-DD shape
assert.match(todayDateKey(), /^\d{4}-\d{2}-\d{2}$/);

// getMonthGrid: always 42 cells (6 rows x 7), Monday-first
const grid = getMonthGrid(2026, 9);
assert.strictEqual(grid.length, 42);
// Sep 1 2026 is a Tuesday, so the grid starts on the preceding Monday
assert.strictEqual(grid[0].key, '2026-08-31');
assert.strictEqual(grid[0].inMonth, false);

// in-month cells cover the full month in order
const inMonth = grid.filter((c) => c.inMonth).map((c) => c.key);
assert.strictEqual(inMonth[0], '2026-09-01');
assert.strictEqual(inMonth[inMonth.length - 1], '2026-09-30');
assert.strictEqual(inMonth.length, 30);

// every cell carries the visible day-of-month number
assert.strictEqual(grid[1].day, 1); // first real day
assert.strictEqual(grid[0].day, 31); // Aug 31 shown in the head slot

// toggleMonth: +1/-1 with year wrap
assert.deepStrictEqual(toggleMonth(2026, 1, -1), { year: 2025, month: 12 });
assert.deepStrictEqual(toggleMonth(2026, 12, 1), { year: 2027, month: 1 });
assert.deepStrictEqual(toggleMonth(2026, 9, 1), { year: 2026, month: 10 });

console.log('verify-calendar: all assertions passed');
```

- [ ] **Step 2: Run it — verify it fails**

Run: `node scripts/verify-calendar.js`
Expected: FAIL — `Cannot find module '../utils/calendar'` because the module doesn't exist yet.

- [ ] **Step 3: Implement `utils/calendar.js`**

```js
// Calendar and date helpers. All months are 1-based (Jan = 1).
// The module is pure: no wx, no page state, so it can be smoke-tested with node.

function pad(n) {
  return n < 10 ? '0' + n : '' + n;
}

// Build a zero-padded local-time date key, e.g. "2026-09-04".
function dateKey(year, month, day) {
  return year + '-' + pad(month) + '-' + pad(day);
}

// Local-time date key for today.
function todayDateKey() {
  const d = new Date();
  return dateKey(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

// Return exactly 42 cells (6 rows x 7, Monday-first) for the month.
// Each cell is { key, day, inMonth }:
//   key     - the date key of the cell's actual date
//   day     - the day-of-month number to display
//   inMonth - true when the cell falls inside the requested month
// Leading/trailing cells belong to the previous/next month (faded in the UI).
function getMonthGrid(year, month) {
  const first = new Date(year, month - 1, 1);
  const mondayOffset = (first.getDay() + 6) % 7; // JS: Sun=0; we want Mon=0
  const daysInMonth = new Date(year, month, 0).getDate();
  const daysInPrevMonth = new Date(year, month - 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < 42; i++) {
    const day = i - mondayOffset + 1; // 1-based position in the grid timeline
    if (day >= 1 && day <= daysInMonth) {
      cells.push({ key: dateKey(year, month, day), day, inMonth: true });
    } else if (day < 1) {
      const py = month === 1 ? year - 1 : year;
      const pm = month === 1 ? 12 : month - 1;
      const d = daysInPrevMonth + day;
      cells.push({ key: dateKey(py, pm, d), day: d, inMonth: false });
    } else {
      const ny = month === 12 ? year + 1 : year;
      const nm = month === 12 ? 1 : month + 1;
      const d = day - daysInMonth;
      cells.push({ key: dateKey(ny, nm, d), day: d, inMonth: false });
    }
  }
  return cells;
}

// Move a month forward (+1) or backward (-1), wrapping the year.
function toggleMonth(year, month, delta) {
  const total = year * 12 + (month - 1) + delta;
  return { year: Math.floor(total / 12), month: (total % 12) + 1 };
}

module.exports = { dateKey, todayDateKey, getMonthGrid, toggleMonth };
```

- [ ] **Step 4: Run the script — verify it passes**

Run: `node scripts/verify-calendar.js`
Expected: prints `verify-calendar: all assertions passed` and exits 0.

- [ ] **Step 5: Commit**

```bash
git add utils/calendar.js scripts/verify-calendar.js
git commit -m "$(cat <<'EOF'
feat: add calendar grid and date utilities

Pure Monday-first month-grid generator with date-key helpers,
covered by a dependency-free node smoke test.

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: States constant + storage module

**Files:**
- Create: `utils/states.js`
- Create: `utils/storage.js`
- Test: `scripts/verify-storage.js`

- [ ] **Step 1: Write the failing verification script**

`scripts/verify-storage.js`:
```js
const assert = require('assert');

// --- minimal in-process wx mock ---
const store = {};
let throwOnWrite = false;
global.wx = {
  getStorageSync: (key) => (key in store ? store[key] : ''),
  setStorageSync: (key, value) => {
    if (throwOnWrite) throw new Error('quota exceeded');
    store[key] = value;
  },
};

const { getRecords, setRecord } = require('../utils/storage');

// empty storage -> empty map
assert.deepStrictEqual(getRecords(), {});

// corrupt storage -> empty map (never throw)
store.attendance_records = '{not valid json';
assert.deepStrictEqual(getRecords(), {});

// valid storage -> parsed map
store.attendance_records = { '2026-09-04': 'office' };
assert.deepStrictEqual(getRecords(), { '2026-09-04': 'office' });

// setRecord writes new days and overwrites existing ones
assert.strictEqual(setRecord('2026-09-05', 'home'), true);
assert.deepStrictEqual(getRecords(), { '2026-09-04': 'office', '2026-09-05': 'home' });
assert.strictEqual(setRecord('2026-09-05', 'leave'), true);
assert.deepStrictEqual(getRecords(), { '2026-09-04': 'office', '2026-09-05': 'leave' });

// setRecord with null clears that day
assert.strictEqual(setRecord('2026-09-05', null), true);
assert.deepStrictEqual(getRecords(), { '2026-09-04': 'office' });

// write failure -> returns false and preserves previous state
throwOnWrite = true;
assert.strictEqual(setRecord('2026-09-06', 'trip'), false);
assert.deepStrictEqual(getRecords(), { '2026-09-04': 'office' });
throwOnWrite = false;

console.log('verify-storage: all assertions passed');
```

- [ ] **Step 2: Run it — verify it fails**

Run: `node scripts/verify-storage.js`
Expected: FAIL — `Cannot find module '../utils/storage'`.

- [ ] **Step 3: Implement `utils/states.js`**

```js
// Single source of truth for the four day states (label + color).
// The calendar grid, legend, stats, and action sheet all read from here.
const STATES = {
  office: { label: 'Office', color: '#388e3c' },
  home: { label: 'Home', color: '#1976d2' },
  leave: { label: 'Leave', color: '#9e9e9e' },
  trip: { label: 'Trip', color: '#f57c00' },
};

module.exports = { STATES };
```

- [ ] **Step 4: Implement `utils/storage.js`**

```js
// All wx storage access for attendance records lives here.
const KEY = 'attendance_records';

// Read the full record map. Corrupt or missing data falls back to {}.
function getRecords() {
  try {
    const raw = wx.getStorageSync(KEY);
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) return raw;
    return {};
  } catch (err) {
    console.error('[storage] read failed', err);
    return {};
  }
}

// Write a state for a date key (e.g. '2026-09-04', 'office').
// Pass null to remove that day's record. Returns true on success.
function setRecord(dateKey, state) {
  const records = getRecords();
  if (state) records[dateKey] = state;
  else delete records[dateKey];
  try {
    wx.setStorageSync(KEY, records);
    return true;
  } catch (err) {
    console.error('[storage] write failed', err);
    return false;
  }
}

module.exports = { getRecords, setRecord };
```

- [ ] **Step 5: Run the script — verify it passes**

Run: `node scripts/verify-storage.js`
Expected: prints `verify-storage: all assertions passed` and exits 0.

- [ ] **Step 6: Commit**

```bash
git add utils/states.js utils/storage.js scripts/verify-storage.js
git commit -m "$(cat <<'EOF'
feat: add record storage and states constants

Centralized wx storage access with corruption fallback and failed-write
signalling, plus the shared STATES label/color constant.

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Render the month grid with navigation

**Files:**
- Modify: `pages/index/index.js`
- Modify: `pages/index/index.wxml`
- Modify: `pages/index/index.wxss`

This wires up the header (‹ › chevrons, 「今天」), the today banner, the legend, and the calendar grid. Stats are computed in JS here and rendered in Task 6 (the WXML `<view class="stats">` block lands there, so this task's markup stays compilable).

- [ ] **Step 1: Implement the page logic**

Replace the placeholder in `pages/index/index.js`:

```js
// pages/index/index.js
const { STATES } = require('../../utils/states');
const { dateKey, todayDateKey, getMonthGrid, toggleMonth } = require('../../utils/calendar');
const { getRecords, setRecord } = require('../../utils/storage');

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日'];
const CLEAR_TEXT = '清除记录';

function monthLabel(year, month) {
  return year + '年' + month + '月';
}

Page({
  data: {
    weekdays: WEEKDAYS,
    statesList: Object.keys(STATES).map((key) => ({
      key,
      label: STATES[key].label,
      color: STATES[key].color,
    })),
    year: 0,
    month: 0,
    monthLabel: '',
    cells: [],
    stats: [],
    marked: 0,
    total: 0,
    showBanner: false,
    todayKey: '',
  },

  onLoad() {
    const t = todayDateKey();
    const [y, m] = t.split('-').map(Number);
    this.setData({ todayKey: t });
    this.renderMonth(y, m);
  },

  renderMonth(year, month) {
    const records = getRecords();

    // Enrich grid cells with the day's state + color (empty string when unset).
    const cells = getMonthGrid(year, month).map((cell) => {
      const state = cell.inMonth && records[cell.key] ? records[cell.key] : '';
      return {
        key: cell.key,
        day: cell.day,
        inMonth: cell.inMonth,
        state,
        color: state ? STATES[state].color : '',
      };
    });

    // Counts for the visible month; bars are sized in px relative to the max.
    const total = new Date(year, month, 0).getDate();
    const counts = {};
    Object.keys(STATES).forEach((key) => {
      counts[key] = 0;
    });
    let marked = 0;
    for (let d = 1; d <= total; d++) {
      const state = records[dateKey(year, month, d)];
      if (state && counts[state] !== undefined) {
        counts[state] += 1;
        marked += 1;
      }
    }
    const maxCount = Math.max(1, ...Object.keys(counts).map((k) => counts[k]));
    const stats = Object.keys(STATES).map((key) => ({
      key,
      label: STATES[key].label,
      color: STATES[key].color,
      count: counts[key],
      height: Math.round((counts[key] / maxCount) * 180),
    }));

    // Today banner: only when viewing the current month and today is unmarked.
    const [ty, tm] = this.data.todayKey.split('-').map(Number);
    const showBanner = ty === year && tm === month && !records[this.data.todayKey];

    this.setData({
      year,
      month,
      monthLabel: monthLabel(year, month),
      cells,
      stats,
      marked,
      total,
      showBanner,
      records,
    });
  },

  prevMonth() {
    const { year, month } = toggleMonth(this.data.year, this.data.month, -1);
    this.renderMonth(year, month);
  },

  nextMonth() {
    const { year, month } = toggleMonth(this.data.year, this.data.month, 1);
    this.renderMonth(year, month);
  },

  goToday() {
    const [y, m] = this.data.todayKey.split('-').map(Number);
    this.renderMonth(y, m);
  },
});
```

- [ ] **Step 2: Update the page markup**

Replace `pages/index/index.wxml`:

```xml
<view class="page">
  <!-- Month navigation -->
  <view class="header">
    <view class="chevron" bindtap="prevMonth">‹</view>
    <view class="month-title">{{monthLabel}}</view>
    <view class="chevron" bindtap="nextMonth">›</view>
    <view class="today-btn" bindtap="goToday">今天</view>
  </view>

  <!-- Unrecorded-today banner -->
  <view wx:if="{{showBanner}}" class="banner">今天还没记录，点一下日期标记</view>

  <!-- Legend -->
  <view class="legend">
    <view class="legend-item" wx:for="{{statesList}}" wx:key="key">
      <view class="legend-dot" style="background: {{item.color}}"></view>
      <text>{{item.label}}</text>
    </view>
  </view>

  <!-- Calendar grid -->
  <view class="grid">
    <view class="weekday-row">
      <text class="weekday" wx:for="{{weekdays}}" wx:key="*this">{{item}}</text>
    </view>
    <view
      class="cell {{item.inMonth ? 'cell-day' : 'cell-faded'}} {{item.state ? 'cell-filled' : ''}} {{item.key === todayKey ? 'cell-today' : ''}}"
      style="{{item.color ? 'background: ' + item.color : ''}}"
      wx:for="{{cells}}"
      wx:key="key"
      data-key="{{item.key}}"
      bindtap="onTapDay"
    >
      <text class="cell-daynum">{{item.day}}</text>
      <view wx:if="{{item.key === todayKey && !item.state}}" class="today-dot"></view>
    </view>
  </view>

  <!-- Stats (rendered in Task 6) -->
  <view class="stats" wx:if="{{false}}"></view>
</view>
```

> The `<view class="stats" wx:if="{{false}}">` line is a placeholder so the page compiles before Task 6 replaces it with the real stats markup.

- [ ] **Step 3: Add the styles**

Replace `pages/index/index.wxss`:

```css
.page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: 24rpx 24rpx 48rpx;
  box-sizing: border-box;
}

/* Header */
.header {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  margin-bottom: 20rpx;
}
.chevron {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48rpx;
  color: #576b95;
}
.month-title {
  min-width: 220rpx;
  text-align: center;
  font-size: 34rpx;
  font-weight: 600;
}
.today-btn {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  font-size: 24rpx;
  color: #576b95;
  border: 2rpx solid #dbe7ff;
  border-radius: 999rpx;
  padding: 8rpx 20rpx;
}

/* Unrecorded-today banner */
.banner {
  background: #fff7e6;
  color: #ad6800;
  border: 2rpx solid #ffe0a3;
  border-radius: 12rpx;
  padding: 14rpx 20rpx;
  font-size: 24rpx;
  margin-bottom: 16rpx;
}

/* Legend */
.legend {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 24rpx;
  margin-bottom: 16rpx;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
  font-size: 24rpx;
  color: #646a73;
}
.legend-dot {
  width: 20rpx;
  height: 20rpx;
  border-radius: 50%;
}

/* Grid */
.grid {
  display: flex;
  flex-wrap: wrap;
  background: #fff;
  border-radius: 16rpx;
  padding: 12rpx 8rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}
.weekday-row {
  display: flex;
  width: 100%;
}
.weekday {
  width: 14.2857%;
  text-align: center;
  font-size: 24rpx;
  color: #8a909a;
  padding: 8rpx 0;
}
.cell {
  width: 14.2857%;
  height: 88rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  box-sizing: border-box;
  border-radius: 12rpx;
}
.cell-daynum {
  font-size: 28rpx;
  color: #1f2329;
}
.cell-faded .cell-daynum {
  color: #c2c7cf;
}
.cell-filled .cell-daynum {
  color: #fff;
  font-weight: 600;
}
.cell-today {
  box-shadow: inset 0 0 0 3rpx #1f2329;
}
.today-dot {
  position: absolute;
  bottom: 8rpx;
  width: 8rpx;
  height: 8rpx;
  border-radius: 50%;
  background: #f57c00;
}
```

- [ ] **Step 4: Verify in WeChat DevTools**

Ask the user to confirm in DevTools:
1. Opens to **September 2026** (today's month), header reads 「2026年9月」.
2. The banner 「今天还没记录，点一下日期标记」 is visible (today is unmarked).
3. The grid starts with a faded **31** (Aug 31) in the first cell; day 1 is under the appropriate weekday column; headers are 一–日.
4. **Today (4)** has a dark outline and a small orange dot under the number.
5. Tapping **‹** shows August 2026 (banner disappears); tapping **›** returns to September.
6. Tapping **今天** jumps back to September.

Expected: all six behaviors. If any differ, fix and re-check before committing.

- [ ] **Step 5: Commit**

```bash
git add pages/index/
git commit -m "$(cat <<'EOF'
feat: render month grid with navigation

Color-coded Monday-first calendar grid, month chevrons, today jump,
unrecorded-today banner, and shared legend.

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Record and clear days via action sheet

**Files:**
- Modify: `pages/index/index.js`

Tapping a day in the visible month opens WeChat's native action sheet with the four states (plus 「清除记录」 when the day is already set). Picking one saves and re-renders in place.

> Note: `wx.showActionSheet` is the system sheet and cannot render the colored dots from the mockup — the state **labels** are shown instead. Functionally identical; this is the intended behavior for a zero-dependency app.

- [ ] **Step 1: Add the tap handlers to `pages/index/index.js`**

Append to the `Page({ ... })` object (after `goToday`, before the closing `});`):

```js
  onTapDay(event) {
    const key = event.currentTarget.dataset.key;
    if (!key) return;
    const [y, m] = key.split('-').map(Number);
    // Only cells in the visible month are recordable.
    if (y !== this.data.year || m !== this.data.month) return;
    if (this._busy) return;
    this._busy = true;

    const current = this.data.records[key];
    const itemList = Object.keys(STATES).map((k) => STATES[k].label);
    if (current) itemList.push(CLEAR_TEXT);

    wx.showActionSheet({
      itemList,
      itemColor: '#1f2329',
      success: (res) => {
        const picked = itemList[res.tapIndex];
        if (picked === CLEAR_TEXT) {
          this.applyRecord(key, null, current);
        } else {
          const stateKey = Object.keys(STATES).find((k) => STATES[k].label === picked);
          this.applyRecord(key, stateKey, current);
        }
      },
      complete: () => {
        this._busy = false;
      },
    });
  },

  applyRecord(key, state, previous) {
    if (state === previous) return; // nothing changed
    if (!setRecord(key, state)) {
      wx.showToast({ title: '保存失败', icon: 'none' });
      return;
    }
    this.renderMonth(this.data.year, this.data.month);
  },
```

Also add `records: {}` to the `data` object (next to `todayKey: ''`) so `renderMonth`'s `records` setData and `onTapDay`'s `this.data.records` both reference a declared field.

- [ ] **Step 2: Verify in WeChat DevTools**

Ask the user to confirm:
1. Tap **3** → an action sheet appears with `Office, Home, Leave, Trip`.
2. Pick **Home** → day 3 fills blue, legend unchanged, stats area still hidden (Task 6), banner still visible, and the storage panel in DevTools shows `attendance_records` = `{"2026-09-03":"home"}`.
3. Tap **3** again → the sheet now also shows **清除记录**.
4. Pick **清除记录** → day 3 reverts to neutral and the stored value is removed.
5. Tap **Office** on day 3, then re-tap and change to **Leave** → the tile recolors and storage updates.
6. Tap a faded edge cell (e.g. the 31 at the top) → nothing happens, no sheet.

Expected: all six behaviors.

- [ ] **Step 3: Commit**

```bash
git add pages/index/index.js
git commit -m "$(cat <<'EOF'
feat: record and clear day states via action sheet

Tap a day to pick Office/Home/Leave/Trip (or clear an existing record)
through the native action sheet, saving to local storage.

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Monthly stats bars

**Files:**
- Modify: `pages/index/index.wxml`
- Modify: `pages/index/index.wxss`

The `stats` array, `marked`, and `total` are already computed in `renderMonth`. This task renders them.

- [ ] **Step 1: Replace the stats placeholder in `pages/index/index.wxml`**

Replace:

```xml
  <!-- Stats (rendered in Task 6) -->
  <view class="stats" wx:if="{{false}}"></view>
```

with:

```xml
  <!-- Monthly stats -->
  <view class="stats">
    <view class="stats-bars">
      <view class="bar-col" wx:for="{{stats}}" wx:key="key">
        <text class="bar-count">{{item.count}}</text>
        <view class="bar" style="height: {{item.height}}px; background: {{item.color}}"></view>
        <text class="bar-label">{{item.label}}</text>
      </view>
    </view>
    <view class="marked-line">{{marked}} / {{total}} days marked</view>
  </view>
```

- [ ] **Step 2: Add stats styles to `pages/index/index.wxss`**

Append:

```css
/* Stats */
.stats {
  margin-top: 24rpx;
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx 24rpx 20rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}
.stats-bars {
  display: flex;
  justify-content: space-around;
  height: 240rpx;
}
.bar-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  gap: 8rpx;
}
.bar-count {
  font-size: 26rpx;
  font-weight: 600;
  color: #1f2329;
}
.bar {
  width: 48rpx;
  border-radius: 8rpx 8rpx 0 0;
}
.bar-label {
  font-size: 22rpx;
  color: #646a73;
}
.marked-line {
  text-align: center;
  margin-top: 16rpx;
  font-size: 24rpx;
  color: #8a909a;
}
```

- [ ] **Step 3: Verify in WeChat DevTools**

Ask the user to confirm, starting from a fresh state (clear `attendance_records` in the Storage panel, then re-open):
1. In September 2026 with no records: all four bars are 0-height, labels show Office/Home/Leave/Trip, and the line reads **`0 / 30 days marked`**.
2. Mark 3 office days, 2 home days, 1 leave day, 0 trips → bars show heights proportional to the counts (Office tallest), counts read 3/2/1/0, and the line reads **`6 / 30 days marked`**.
3. Navigate to August 2026 → bars show that month's (empty) counts and **`0 / 31 days marked`**.
4. Navigate back to September → counts and bar heights are restored.
5. Also check the **empty 6th row** of the grid still renders aligned (faded next-month days).

Expected: all five behaviors.

- [ ] **Step 4: Commit**

```bash
git add pages/index/index.wxml pages/index/index.wxss
git commit -m "$(cat <<'EOF'
feat: add monthly stats bars

Per-state count bars for the visible month plus a marked-days summary
line, reusing the stats computed by renderMonth.

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Style polish + full spec checklist

**Files:**
- Modify: `pages/index/index.wxss` (and any page files that the checklist reveals need fixing)

This task does the final pass and runs the end-to-end checklist from the spec.

- [ ] **Step 1: Confirm the spec's full checklist in DevTools**

Ask the user to walk through the complete checklist from `docs/superpowers/specs/2026-09-04-work-location-tracker-design.md`:

1. Mark each of the 4 states; verify grid color + stats counts update immediately.
2. Clear a record; verify the tile reverts to neutral and the count drops.
3. Navigate across a month boundary; verify faded cells and that stats switch months.
4. Jump back to the current month via 「今天」; verify today's outline/dot.
5. Corrupt storage manually (set `attendance_records` to a non-JSON value, e.g. a plain string `"oops"`, in the DevTools Storage panel); verify the app still opens and shows an empty grid (graceful fallback, no crash).
6. Verify the app opens and renders with no records at all (first-launch state).

Also confirm the small-device layout: run the simulator at a phone width (iPhone 6/7/8 is a good proxy) and verify the grid, header, and stats all fit without overflow or clipping.

- [ ] **Step 2: Fix anything the checklist surfaces**

If any check fails, fix the corresponding file(s) and re-verify that specific check. Do not mark failed checks green.

- [ ] **Step 3: Run both smoke tests one final time**

Run: `node scripts/verify-calendar.js && node scripts/verify-storage.js`
Expected: both print `...: all assertions passed`.

- [ ] **Step 4: Commit final state**

```bash
git add -A
git commit -m "$(cat <<'EOF'
style: polish calendar page and run full checklist

Final visual pass and end-to-end verification against the approved spec,
including corrupt-storage fallback.

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

## Self-review notes (plan author)

- **Spec coverage:** storage key/format matches spec §Data model; `STATES` single source of truth; Monday-first 6×7 grid with non-tappable faded cells; today outline + unrecorded-today dot; banner text verbatim from spec; action sheet with conditional clear; stats per visible month + "X / Y days marked"; corrupt-storage fallback; write-failure toast; busy guard against double taps. All spec items map to a task.
- **Known intentional deviations:** (1) `wx.showActionSheet` cannot render colored dots — state labels are shown instead (noted in Task 5); (2) dev-only node smoke scripts were added beyond the spec's "manual verification" to give the pure modules a repeatable check — they add no runtime dependencies and are never shipped.
- **Type consistency:** `dateKey`, `todayDateKey`, `getMonthGrid`, `toggleMonth`, `getRecords`, `setRecord`, and `STATES` are introduced in Tasks 2–3 and used identically in Tasks 4–6. Cell shape `{ key, day, inMonth }` matches what `renderMonth` enriches.