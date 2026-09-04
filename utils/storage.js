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

module.exports = { getRecords, setRecord };