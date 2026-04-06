const COMMON_FIELDS = [
  "__v",
  "isDeleted",
  "updatedAt",
];


exports.getProjection = (extraRemove = []) => {
  const fields = [...COMMON_FIELDS, ...extraRemove];
  return fields.map((f) => `-${f}`).join(" ");
};

