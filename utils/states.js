// Single source of truth for the four day states (label + color).
// The calendar grid, legend, stats, and action sheet all read from here.
const STATES = {
  office: { label: 'Office', color: '#388e3c' },
  home: { label: 'Home', color: '#1976d2' },
  leave: { label: 'Leave', color: '#9e9e9e' },
  trip: { label: 'Trip', color: '#f57c00' },
};

module.exports = { STATES };