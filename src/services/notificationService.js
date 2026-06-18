const moment = require("moment");
const { NOTIFICATION } = require("../model/modelIndex");

exports.createNotification = async ({
  receiverId,
  type,
  message,
  userId = null,
}) => {
  const start = moment().startOf("day").toDate();
  const end = moment().endOf("day").toDate();

  const exists = await NOTIFICATION.findOne({
    receiverId,
    type,
    userId,
    message,
    createdAt: {
      $gte: start,
      $lte: end,
    },
  });

  if (exists) return;

  await NOTIFICATION.create({
    receiverId,
    type,
    message,
    userId,
  });
};
