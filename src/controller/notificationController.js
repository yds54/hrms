const { NOTIFICATION } = require("../model/modelIndex");
const { paginate } = require("../utils/pagination");
const { successResponse } = require("../utils/sucess");

//==================== DISPLAY NOTIFICATION ==============================
exports.getNotifications = async (req, res, next) => {
  try {
    const { page, limit, filter, isRead } = req.query;

    const query = {
      receiverId: req.user.id,
    };

    if (isRead !== undefined) {
      query.isRead = isRead === "true";
    }

    if (filter && filter !== "all") {
      query.type = filter;
    }

    const { data, pagination } = await paginate({
      model: NOTIFICATION,
      query,
      page,
      limit,
      sort: { createdAt: -1 },
    });

    const unreadCount = await NOTIFICATION.countDocuments({
      receiverId: req.user.id,
      isRead: false,
    });

    return successResponse(res, 200, "Notifications fetched successfully", {
      data,
      pagination,
      unreadCount,
    });
  } catch (error) {
    next(error);
  }
};

//========================= MARKS AS READ NOTIFICATION ============================
exports.markAllAsRead = async (req, res, next) => {
  try {
    await NOTIFICATION.updateMany(
      {
        receiverId: req.user.id,
        isRead: false,
      },
      {
        $set: {
          isRead: true,
        },
      },
    );

    return successResponse(res, 200, "All notifications marked as read");
  } catch (error) {
    next(error);
  }
};
