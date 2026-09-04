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