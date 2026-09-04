// pages/index/index.js
const { STATES } = require('../../utils/states');
const { dateKey, todayDateKey, getMonthGrid, toggleMonth, isWeekend } = require('../../utils/calendar');
const { getRecords, setRecord } = require('../../utils/storage');

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日'];
const CLEAR_TEXT = '清除记录';

function monthLabel(year, month) {
  return year + '年' + month + '月';
}

// Effective state for a calendar day: an explicit record wins (when it names a
// known state); otherwise a Saturday/Sunday defaults to Holiday and a clear
// weekday stays unmarked.
function effectiveState(records, dateKeyStr, year, month, day) {
  const explicit = records[dateKeyStr];
  if (explicit && STATES[explicit]) return explicit;
  return isWeekend(year, month, day) ? 'holiday' : '';
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
    workdays: 0,
    officePct: 0,
    showBanner: false,
    todayKey: '',
    records: {},
  },

  onLoad() {
    const t = todayDateKey();
    const [y, m] = t.split('-').map(Number);
    this.setData({ todayKey: t });
    this.renderMonth(y, m);
  },

  onShow() {
    // The app can sit in WeChat's recents across midnight; onShow (not onLoad)
    // is the resume hook, so refresh "today" and re-render the current month.
    const t = todayDateKey();
    if (t !== this.data.todayKey) {
      this.setData({ todayKey: t });
      this.renderMonth(this.data.year, this.data.month);
    }
  },

  renderMonth(year, month) {
    const records = getRecords();

    // Enrich grid cells with the day's state + color (empty string when unset).
    // Out-of-month cells stay empty; in-month cells take the effective state
    // (explicit record, else Holiday for weekends).
    const cells = getMonthGrid(year, month).map((cell) => {
      const state = cell.inMonth
        ? effectiveState(records, cell.key, year, month, cell.day)
        : '';
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
      const state = effectiveState(records, dateKey(year, month, d), year, month, d);
      if (state && counts[state] !== undefined) {
        counts[state] += 1;
        marked += 1;
      }
    }
    const maxCount = Math.max(1, ...Object.keys(counts).map((k) => counts[k]));
    // Bar heights in rpx, capped so the tallest bar + labels fit the track.
    const stats = Object.keys(STATES).map((key) => ({
      key,
      label: STATES[key].label,
      color: STATES[key].color,
      count: counts[key],
      height: Math.round((counts[key] / maxCount) * 180),
    }));

    // Work-in-office share of the month's working days:
    // office days / (calendar days - leave days - holiday days).
    // Holiday already includes defaulted weekends, so the denominator is the
    // days you could actually have worked (unmarked weekdays included).
    const workdays = total - counts.leave - counts.holiday;
    const officePct = workdays > 0 ? Math.round((counts.office / workdays) * 100) : 0;

    // Today banner: only when viewing the current month and today has no
    // effective state (unrecorded weekday — a weekend already defaults to Holiday).
    const todayKey = this.data.todayKey;
    const [ty, tm, td] = todayKey.split('-').map(Number);
    const todayHandled = !!effectiveState(records, todayKey, ty, tm, td);
    const showBanner = ty === year && tm === month && !todayHandled;

    this.setData({
      year,
      month,
      monthLabel: monthLabel(year, month),
      cells,
      stats,
      marked,
      total,
      workdays,
      officePct,
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
});