const { LOGS } = require("../model/modelIndex");
const { getChangedFields } = require("./getChangedFields");

exports.createLog = async ({
  userId,
  tableName,
  recordId,
  action,
  oldRecord = null,
  newRecord = null,
}) => {
  try {
    await LOGS.create({
      userId,
      tableName,
      recordId,
      action,
      oldRecord,
      newRecord,
      changedFields:
        action === "UPDATE" ? getChangedFields(oldRecord, newRecord) : [],
    });
  } catch (error) {
    console.log("Log Error:", error);
  }
};
