const moment = require("moment");
const { USER, USERPAYROLL, INTERVIEW, TEAMS } = require("../model/modelIndex");
const {
  USER_STATUS,
  NOTIFICATION_TYPE,
  MARITAL_STATUS,
  ROLES,
} = require("../utils/enum");

const { createNotification } = require("./notificationService");
const {
  getTodayMonthDay,
  getDateDiffFromToday,
  getWeekDay,
  addDaysAndFormat,
  getCurrentEvaluationWeek,
} = require("../utils/dateFormat");

const getInterviewRecipients = async (interview) => {
  const recipients = new Set();
  if (interview.technicalRoundUser) {
    recipients.add(interview.technicalRoundUser.toString());
  }
  if (interview.hrRoundUser) {
    recipients.add(interview.hrRoundUser.toString());
  }

  const admins = await USER.find({
    isDeleted: false,
    isLeft: false,
    status: USER_STATUS.ACTIVE,
    role: {
      $in: [ROLES.ADMIN, ROLES.HR, ROLES.RECRUITER],
    },
  }).select("_id");

  admins.forEach((user) => {
    recipients.add(user._id.toString());
  });
  return [...recipients];
};

const sendInterviewNotification = async (interview, dayLabel) => {
  const recipients = await getInterviewRecipients(interview);

  await Promise.all(
    recipients.map((receiverId) =>
      createNotification({
        receiverId,
        type: NOTIFICATION_TYPE.INTERVIEW,
        userId: interview._id,
        message: `Interview of ${interview.name} scheduled on ${dayLabel}`,
      }),
    ),
  );
};

const getLeaveRecipients = async (userId) => {
  const recipients = new Set();
  // Team PM + TL
  const teams = await TEAMS.find({
    isDeleted: false,
    members: userId,
  }).select("projectManagers teamLeaders");
  teams.forEach((team) => {
    team.projectManagers?.forEach((id) => recipients.add(id.toString()));
    team.teamLeaders?.forEach((id) => recipients.add(id.toString()));
  });
  // HR + Admin
  const admins = await USER.find({
    isDeleted: false,
    isLeft: false,
    status: USER_STATUS.ACTIVE,
    role: {
      $in: [ROLES.ADMIN, ROLES.HR],
    },
  }).select("_id");
  admins.forEach((user) => {
    recipients.add(user._id.toString());
  });
  return [...recipients];
};

//===================  BIRTHDAY NOTIFICATION ===============================
exports.birthdayNotifications = async () => {
  const { day, month } = getTodayMonthDay();
  const birthdayUsers = await USER.find({
    isDeleted: false,
    isLeft: false,
    status: USER_STATUS.ACTIVE,
    $expr: {
      $and: [
        {
          $eq: [{ $dayOfMonth: "$birthDate" }, day],
        },
        {
          $eq: [{ $month: "$birthDate" }, month],
        },
      ],
    },
  }).select("_id fullName");

  if (!birthdayUsers.length) return;

  const users = await USER.find({
    isDeleted: false,
    isLeft: false,
    status: USER_STATUS.ACTIVE,
  }).select("_id");

  for (const birthdayUser of birthdayUsers) {
    for (const receiver of users) {
      const self = receiver._id.toString() === birthdayUser._id.toString();

      await createNotification({
        receiverId: receiver._id,
        type: NOTIFICATION_TYPE.BIRTHDAY,
        userId: birthdayUser._id,
        message: self
          ? "Wish you a Happy Birthday"
          : `Today is ${birthdayUser.fullName}'s Birthday`,
      });
    }
  }
};

//================== MARRIAGE ANNIVERSARY NOTIFICATION ============================
exports.marriageAnniversaryNotifications = async () => {
  const { day, month } = getTodayMonthDay();
  const anniversaryUsers = await USER.find({
    maritalStatus: MARITAL_STATUS.MARRIED,
    isDeleted: false,
    isLeft: false,
    status: USER_STATUS.ACTIVE,
    $expr: {
      $and: [
        {
          $eq: [{ $dayOfMonth: "$marriageDate" }, day],
        },
        {
          $eq: [{ $month: "$marriageDate" }, month],
        },
      ],
    },
  }).select("_id fullName");

  if (!anniversaryUsers.length) return;

  const users = await USER.find({
    isDeleted: false,
    isLeft: false,
    status: USER_STATUS.ACTIVE,
  }).select("_id");

  for (const anniversaryUser of anniversaryUsers) {
    for (const receiver of users) {
      const self = receiver._id.toString() === anniversaryUser._id.toString();

      await createNotification({
        receiverId: receiver._id,
        type: NOTIFICATION_TYPE.MARRIAGE_ANNIVERSARY,
        userId: anniversaryUser._id,
        message: self
          ? "Wish you a Happy Marriage Anniversary"
          : `Today is ${anniversaryUser.fullName}'s Marriage Anniversary`,
      });
    }
  }
};

//=================== RESIGNATION NOTIFICATION ============================
exports.resignationNoticeNotifications = async () => {
  const today = moment().startOf("day");
  const users = await USER.find({
    isDeleted: false,
    resignationDetails: { $exists: true },
    "resignationDetails.lastWorkingDate": { $ne: null },
  }).select(
    "_id name.firstName name.lastName resignationDetails.lastWorkingDate",
  );

  if (!users.length) return;

  const hrAdmins = await USER.find({
    role: { $in: [ROLES.ADMIN, ROLES.HR] },
    isDeleted: false,
    isLeft: false,
    status: USER_STATUS.ACTIVE,
  }).select("_id");

  for (const employee of users) {
    const employeeName =
      `${employee.name?.firstName || ""} ${employee.name?.lastName || ""}`.trim();
    const lastWorkingDate = moment(
      employee.resignationDetails.lastWorkingDate,
    ).startOf("day");

    const diffDays = lastWorkingDate.diff(today, "days");

    let adminMessage = null;
    let employeeMessage = null;

    if (diffDays === 3) {
      adminMessage = `Notice period of ${employeeName} is going to complete on ${lastWorkingDate.format("dddd")}`;
    }

    if (diffDays === 1) {
      adminMessage = `Notice period of ${employeeName} is going to complete tomorrow`;
      employeeMessage = "Your notice period will complete tomorrow";
    }
    if (diffDays === 0) {
      adminMessage = `Notice period of ${employeeName} is going to complete today`;
      employeeMessage = "Your notice period has been completed today";
    }
    // HR AND ADMIN
    if (adminMessage) {
      for (const admin of hrAdmins) {
        await createNotification({
          receiverId: admin._id,
          type: NOTIFICATION_TYPE.RESIGNATION,
          userId: employee._id,
          message: adminMessage,
        });
      }
    }

    // Employee
    if (employeeMessage) {
      await createNotification({
        receiverId: employee._id,
        type: NOTIFICATION_TYPE.RESIGNATION,
        userId: employee._id,
        message: employeeMessage,
      });
    }
  }
};

//======================= EMPLOYMENT NOTIFICATION =====================
exports.employmentStartNotifications = async () => {
  const payrolls = await USERPAYROLL.find({
    isDeleted: false,
    joiningDate: { $ne: null },
  })
    .populate("userId", "name.firstName name.lastName status isDeleted isLeft")
    .select("userId joiningDate");

  if (!payrolls.length) return;

  const hrAdmins = await USER.find({
    role: { $in: [ROLES.ADMIN, ROLES.HR] },
    isDeleted: false,
    isLeft: false,
    status: USER_STATUS.ACTIVE,
  }).select("_id");

  for (const payroll of payrolls) {
    if (!payroll.userId) continue;

    const employee = payroll.userId;

    // Skip inactive users
    if (
      employee.isDeleted ||
      employee.isLeft ||
      employee.status !== USER_STATUS.ACTIVE
    ) {
      continue;
    }

    const employeeName = `${employee.name?.firstName || ""} ${
      employee.name?.lastName || ""
    }`.trim();

    const joiningDate = moment(payroll.joiningDate);
    const diffDays = getDateDiffFromToday(payroll.joiningDate);

    let adminMessage = null;

    // ---------------- ADMIN / HR ----------------
    if (diffDays === 3) {
      adminMessage = `Employment of ${employeeName} is going to start from ${joiningDate.format(
        "dddd",
      )}`;
    } else if (diffDays === 1) {
      adminMessage = `Employment of ${employeeName} is going to start from tomorrow`;
    } else if (diffDays === 0) {
      adminMessage = `Employment of ${employeeName} is going to start from today`;
    }

    if (adminMessage) {
      for (const admin of hrAdmins) {
        await createNotification({
          receiverId: admin._id,
          type: NOTIFICATION_TYPE.EMPLOYMENT,
          userId: employee._id,
          message: adminMessage,
        });
      }
    }

    // ---------------- EMPLOYEE ----------------
    // Only 1 day before
    if (diffDays === 1) {
      await createNotification({
        receiverId: employee._id,
        type: NOTIFICATION_TYPE.EMPLOYMENT,
        userId: employee._id,
        message: `Your employment is going to start from tomorrow`,
      });
    }
  }
};

//======================= EMPLOYEE ANNIVERSARY NOTIFICATION =====================
exports.employeeAnniversaryNotifications = async () => {
  const { day, month } = getTodayMonthDay();
  const payrolls = await USERPAYROLL.find({
    isDeleted: false,
    joiningDate: { $ne: null },
  })
    .populate(
      "userId",
      "name.firstName name.lastName status isDeleted isLeft role",
    )
    .select("userId joiningDate");

  if (!payrolls.length) return;

  const hrAdmins = await USER.find({
    role: { $in: [ROLES.ADMIN, ROLES.HR] },
    isDeleted: false,
    isLeft: false,
    status: USER_STATUS.ACTIVE,
  }).select("_id");

  for (const payroll of payrolls) {
    if (!payroll.userId) continue;
    const employee = payroll.userId;

    if (
      employee.isDeleted ||
      employee.isLeft ||
      employee.status !== USER_STATUS.ACTIVE
    ) {
      continue;
    }

    const joiningDate = moment(payroll.joiningDate);

    const isAnniversary =
      joiningDate.date() === day && joiningDate.month() + 1 === month;

    if (!isAnniversary) continue;

    const employeeName = `${employee.name?.firstName || ""} ${
      employee.name?.lastName || ""
    }`.trim();

    // ---------------- ADMIN / HR ----------------
    for (const admin of hrAdmins) {
      if (admin._id.toString() === employee._id.toString()) {
        continue;
      }
      await createNotification({
        receiverId: admin._id,
        type: NOTIFICATION_TYPE.EMPLOYEE_ANNIVERSARY,
        userId: employee._id,
        message: `Today is ${employeeName}'s Employee Anniversary`,
      });
    }

    // ---------------- EMPLOYEE ----------------
    await createNotification({
      receiverId: employee._id,
      type: NOTIFICATION_TYPE.EMPLOYEE_ANNIVERSARY,
      userId: employee._id,
      message: "Wish you a Happy Employee Anniversary",
    });
  }
};

//======================= BOND COMPLETE NOTIFICATION =====================
exports.bondCompleteNotifications = async () => {
  const payrolls = await USERPAYROLL.find({
    isDeleted: false,
    isBond: true,
    bondCompletedDate: { $ne: null },
  })
    .populate("userId", "name.firstName name.lastName status isDeleted isLeft")
    .select("userId bondCompletedDate");

  if (!payrolls.length) return;

  const hrAdmins = await USER.find({
    role: { $in: [ROLES.ADMIN, ROLES.HR] },
    isDeleted: false,
    isLeft: false,
    status: USER_STATUS.ACTIVE,
  }).select("_id");

  for (const payroll of payrolls) {
    if (!payroll.userId) continue;

    const employee = payroll.userId;

    if (
      employee.isDeleted ||
      employee.isLeft ||
      employee.status !== USER_STATUS.ACTIVE
    ) {
      continue;
    }

    const employeeName = `${employee.name?.firstName || ""} ${
      employee.name?.lastName || ""
    }`.trim();

    const diffDays = getDateDiffFromToday(payroll.bondCompletedDate);
    const weekDay = getWeekDay(payroll.bondCompletedDate);

    let adminMessage = null;
    let employeeMessage = null;

    // ---------------- ADMIN / HR ----------------
    if (diffDays === 3 || diffDays === 2) {
      adminMessage = `Bond of ${employeeName} is going to be complete on ${weekDay}`;
    } else if (diffDays === 1) {
      adminMessage = `Bond of ${employeeName} is going to be complete on Tomorrow`;
      employeeMessage = "Your Bond is going to be complete on Tomorrow";
    } else if (diffDays === 0) {
      adminMessage = `Bond of ${employeeName} is going to be complete on Today`;
      employeeMessage = "Your Bond is going to be complete on Today";
    }

    // ---------------- ADMIN / HR ----------------
    if (adminMessage) {
      for (const admin of hrAdmins) {
        await createNotification({
          receiverId: admin._id,
          type: NOTIFICATION_TYPE.BOND_COMPLETE,
          userId: employee._id,
          message: adminMessage,
        });
      }
    }

    // ---------------- EMPLOYEE ----------------
    if (employeeMessage) {
      await createNotification({
        receiverId: employee._id,
        type: NOTIFICATION_TYPE.BOND_COMPLETE,
        userId: employee._id,
        message: employeeMessage,
      });
    }
  }
};

//======================= INTERVIEW SCHEDULE NOTIFICATION ========================
exports.interviewScheduledNotification = async (interview) => {
  const diffDays = getDateDiffFromToday(interview.interviewTime);
  let dayLabel;
  if (diffDays === 0) {
    dayLabel = "Today";
  } else if (diffDays === 1) {
    dayLabel = "Tomorrow";
  } else {
    dayLabel = getWeekDay(interview.interviewTime);
  }
  await sendInterviewNotification(interview, dayLabel);
};

//======================= INTERVIEW REMINDER NOTIFICATION ========================
exports.interviewReminderNotifications = async () => {
  const interviews = await INTERVIEW.find({
    isDeleted: false,
    interviewTime: { $gte: new Date() },
  }).select("name interviewTime technicalRoundUser hrRoundUser");

  for (const interview of interviews) {
    const diffDays = getDateDiffFromToday(interview.interviewTime);
    let dayLabel = null;

    if (diffDays === 2) {
      dayLabel = getWeekDay(interview.interviewTime);
    } else if (diffDays === 1) {
      dayLabel = "Tomorrow";
    } else if (diffDays === 0) {
      dayLabel = "Today";
    }

    if (!dayLabel) continue;

    await sendInterviewNotification(interview, dayLabel);
  }
};

//======================= EVALUATION NOTIFICATION ========================
exports.evaluationNotifications = async () => {
  const currentWeek = getCurrentEvaluationWeek();
  if (!currentWeek) {
    return;
  }
  const displayDate = addDaysAndFormat(currentWeek.toDate, 7);

  const teams = await TEAMS.find({
    isDeleted: false,
    members: { $exists: true, $ne: [] },
  }).select("projectManagers teamLeaders");

  for (const team of teams) {
    const recipients = new Set();
    team.projectManagers.forEach((id) => recipients.add(id.toString()));
    team.teamLeaders.forEach((id) => recipients.add(id.toString()));

    await Promise.all(
      [...recipients].map((receiverId) =>
        createNotification({
          receiverId,
          type: NOTIFICATION_TYPE.EVALUATION,
          message: `Employee Evaluation cell has been activated till ${displayDate}`,
        }),
      ),
    );
  }
};

//======================= CREATE LEAVE NOTIFICATION ========================
exports.leaveRequestCreatedNotification = async (leave, employee) => {
  const recipients = await getLeaveRecipients(employee._id);
  await Promise.all(
    recipients.map((receiverId) =>
      createNotification({
        receiverId,
        type: NOTIFICATION_TYPE.LEAVE,
        userId: leave._id,
        message: `${employee.fullName} has send you leave request`,
      }),
    ),
  );
};

//======================= APPROVE LEAVE NOTIFICATION ========================
exports.leaveApprovedNotification = async ({ leave, approverName }) => {
  const leaveDate = leave.date || leave.fromDate;
  await createNotification({
    receiverId: leave.user,
    type: NOTIFICATION_TYPE.LEAVE,
    userId: leave._id,
    message: `${approverName} has Approved Your leave request for ${leave.reason} on ${moment(
      leaveDate,
    ).format("DD MMM YYYY")}`,
  });
};

//======================= DECLINED LEAVE NOTIFICATION ========================
exports.leaveDeclinedNotification = async ({ leave, approverName }) => {
  const leaveDate = leave.date || leave.fromDate;
  await createNotification({
    receiverId: leave.user,
    type: NOTIFICATION_TYPE.LEAVE,
    userId: leave._id,
    message: `${approverName} has Declined Your leave request for ${leave.reason} on ${moment(
      leaveDate,
    ).format("DD MMM YYYY")}`,
  });
};

// ================= TICKET CREATED NOTIFICATION =================
exports.ticketCreatedNotification = async ({ ticket, creatorName }) => {
  const recipients = ticket.assignedTo.map(String);
  await Promise.all(
    recipients.map((receiverId) =>
      createNotification({
        receiverId,
        type: NOTIFICATION_TYPE.TICKET,
        userId: ticket._id,
        message: `${creatorName} has assigned '${ticket.title}' ticket to you`,
      }),
    ),
  );
};

// ================= TICKET STATUS UPDATED NOTIFICATION =================
exports.ticketStatusNotification = async ({
  ticket,
  oldStatus,
  newStatus,
  changedById,
  changedByName,
}) => {
  const recipients = new Set();
  recipients.add(ticket.createdBy.toString());
  ticket.assignedTo.forEach((id) => {
    recipients.add(id.toString());
  });
  recipients.delete(changedById.toString());
  await Promise.all(
    [...recipients].map((receiverId) =>
      createNotification({
        receiverId,
        type: NOTIFICATION_TYPE.TICKET,
        userId: ticket._id,
        message: `${changedByName} has changed the status ${oldStatus} to ${newStatus} for '${ticket.title}' ticket`,
      }),
    ),
  );
};

// ================= TICKET ASSIGNEE UPDATED NOTIFICATION =================
exports.ticketAssigneeNotification = async ({
  ticket,
  oldAssigneeId,
  newAssigneeId,
  changedById,
  changedByName,
}) => {
  const recipients = new Set();
  recipients.add(ticket.createdBy.toString());
  recipients.add(newAssigneeId.toString());
  recipients.add(oldAssigneeId.toString());
  recipients.delete(changedById.toString());
  await Promise.all(
    [...recipients].map((receiverId) =>
      createNotification({
        receiverId,
        type: NOTIFICATION_TYPE.TICKET,
        userId: ticket._id,
        message: `${changedByName} has reassigned '${ticket.title}' ticket`,
      }),
    ),
  );
};

// ================= TICKET COMMENT =================
exports.ticketCommentNotification = async ({
  ticket,
  commenterId,
  commenterName,
}) => {
  const recipients = new Set();
  // ticket creator
  if (ticket.createdBy?.toString() !== commenterId.toString()) {
    recipients.add(ticket.createdBy.toString());
  }
  // assignees
  ticket.assignedTo.forEach((id) => {
    if (id.toString() !== commenterId.toString()) {
      recipients.add(id.toString());
    }
  });
  await Promise.all(
    [...recipients].map((receiverId) =>
      createNotification({
        receiverId,
        type: NOTIFICATION_TYPE.TICKET,
        userId: ticket._id,
        message: `${commenterName} has added comment on '${ticket.title}' ticket`,
      }),
    ),
  );
};
