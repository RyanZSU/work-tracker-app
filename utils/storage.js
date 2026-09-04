// All wx storage access for attendance records lives here.
const KEY = 'attendance_records';
// Months ("YYYY-MM") whose weekend-holiday defaults have been materialized.
const SEEDED_HOLIDAY_KEY = 'seeded_holiday_months';

// Read the full record map. Corrupt or missing data falls back to {}.
// Legacy "trip" values (the state was renamed to "holiday") are normalized
// on read; the next write persists the migration naturally.
function getRecords() {
  try {
    const raw = wx.getStorageSync(KEY);
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
      if (Object.keys(raw).some((k) => raw[k] === 'trip')) {
        const migrated = Object.assign({}, raw);
        Object.keys(migrated).forEach((key) => {
          if (migrated[key] === 'trip') migrated[key] = 'holiday';
        });
        return migrated;
      }
      return raw;
    }
    return {};
  } catch (err) {
    console.error('[storage] read failed', err);
    return {};
  }
}

// Write a state for a date key (e.g. '2026-09-04', 'office').
// Pass null to remove that day's record. Returns true on success.
function setRecord(dateKey, state) {
  const records = Object.assign({}, getRecords());
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

// Months whose weekend defaults were already written as real Holiday records.
// Kept apart from the records map so a weekend the user clears stays blank
// instead of being re-defaulted on the next render.
function getSeededHolidayMonths() {
  try {
    const raw = wx.getStorageSync(SEEDED_HOLIDAY_KEY);
    return raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  } catch (err) {
    console.error('[storage] read failed', err);
    return {};
  }
}

function markSeededHolidayMonth(monthKey) {
  const months = Object.assign({}, getSeededHolidayMonths());
  months[monthKey] = true;
  try {
    wx.setStorageSync(SEEDED_HOLIDAY_KEY, months);
    return true;
  } catch (err) {
    console.error('[storage] write failed', err);
    return false;
  }
}

module.exports = { getRecords, setRecord, getSeededHolidayMonths, markSeededHolidayMonth };