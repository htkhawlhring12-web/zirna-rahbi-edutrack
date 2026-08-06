// Single source of truth for how ClassLevel enum values are displayed.
// Update here, not per-page, if the class range ever changes.
export const CLASS_LABELS: Record<string, string> = {
  CLASS_8: "Class 8",
  CLASS_9: "Class 9",
  CLASS_10: "Class 10",
  CLASS_11: "Class 11",
  CLASS_12: "Class 12",
};

export const CLASS_OPTIONS = Object.entries(CLASS_LABELS).map(
  ([value, label]) => ({ value, label })
);
