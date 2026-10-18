// Map pin colours by complaint status. Pins themselves come from GET /api/kawasan/pins.
export const PIN_COLORS = {
  Pending: "#B45309",
  "In Progress": "#1D4ED8",
  Resolved: "#15803D",
  Outside: "#9CA3AF",
};

export const pinColor = (pin) => (pin.inside === false ? PIN_COLORS.Outside : PIN_COLORS[pin.status] ?? PIN_COLORS.Outside);
