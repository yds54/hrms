const COMMON_FIELDS = [
  "_id",
  "__v",
  "isDeleted",
  "createdAt",
  "updatedAt",
  "updatedBy",
];


exports.getProjection = (extraRemove = []) => {
  const fields = [...COMMON_FIELDS, ...extraRemove];
  return fields.map((f) => `-${f}`).join(" ");
};

