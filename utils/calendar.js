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

// True when the given day falls on Saturday or Sunday. Used to seed the
// weekend Holiday default (see seedWeekendHolidays in pages/index/index.js).
function isWeekend(year, month, day) {
  const dow = new Date(year, month - 1, day).getDay(); // JS: 0 = Sun, 6 = Sat
  return dow === 0 || dow === 6;
}

module.exports = { dateKey, todayDateKey, getMonthGrid, toggleMonth, isWeekend };