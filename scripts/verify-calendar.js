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