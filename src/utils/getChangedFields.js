exports.getChangedFields = (oldRecord, newRecord) => {
  if (!oldRecord || !newRecord) return [];

  const changedFields = [];

  const ignoredFields = ["_id", "__v", "createdAt", "updatedAt"];

  const compare = (oldObj, newObj, parentKey = "") => {
    const keys = new Set([
      ...Object.keys(oldObj || {}),
      ...Object.keys(newObj || {}),
    ]);

    for (const key of keys) {
      if (ignoredFields.includes(key)) continue;

      const fullKey = parentKey ? `${parentKey}.${key}` : key;

      const oldValue = oldObj?.[key];
      const newValue = newObj?.[key];

      if (
        oldValue !== null &&
        newValue !== null &&
        typeof oldValue === "object" &&
        typeof newValue === "object" &&
        !Array.isArray(oldValue) &&
        !Array.isArray(newValue)
      ) {
        compare(oldValue, newValue, fullKey);
      } else if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changedFields.push({
          field: fullKey,
          oldValue,
          newValue,
        });
      }
    }
  };

  compare(oldRecord, newRecord);

  return changedFields;
};
