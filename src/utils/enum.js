exports.ROLES = Object.freeze({
  ADMIN: "admin",
  USER: "user",
  HR: "hr",
  HR_RECRUITER: "hr_recruiter",
  PROJECT_MANAGER: "project_manager",
  TEAM_LEAD: "team_lead",
});

exports.GENDER = Object.freeze({
  MALE: "male",
  FEMALE: "female",
  OTHER: "other",
});

exports.MARITAL_STATUS = Object.freeze({
  SINGLE: "single",
  MARRIED: "married",
});

exports.TEAM_ROLES = Object.freeze({
  PM: "pm",
  TL: "tl",
  DEV: "dev",
});
exports.USER_STATUS = Object.freeze({
  ACTIVE: "active",
  INACTIVE: "inactive",
});

exports.LEAVE_DAY_TYPE = Object.freeze({
  SINGLE: "Single Day",
  MULTIPLE: "Multiple Day",
});

exports.LEAVE_DURATION = Object.freeze({
  FULL: "Full Day",
  HALF: "Half Day",
  NONE: "-",
});

exports.LEAVE_STATUS = Object.freeze({
  PENDING: "Pending",
  APPROVED: "Approved",
  DECLINED: "Declined",
});

exports.PRIORITY_STATUS = Object.freeze({
  LOW: "Low",
  NORMAL: "Normal",
  HIGH: "High",
});

exports.TICKET_STATUS = Object.freeze({
  TODO: "To Do",
  INPROGRESS: "In Progress",
  ONHOLD: "On Hold",
  COMPLETED: "Completed",
  REOPEN: "Reopen",
});

exports.LEAVE_REASON_TYPE = Object.freeze({
  SICK: "Sick Leave",
  CASUAL: "Casual Leave",
  EARNED: "Earned Leave",
  PAID: "Paid Leave",
  UNPAID: "Unpaid Leave",
  OTHER: "Other",
});

exports.TICKET_FILTER = Object.freeze({
  ALL: "all",
  MY_TICKETS: "myTickets",
  ASSIGNED_TO_ME: "assignedToMe",
});

exports.TIMEZONES = Object.freeze({
  INDIA: "Asia/Kolkata",
});

exports.PROJECT_STATUS = Object.freeze({
  INPROGRESS: "inProgress",
  COMPLETED: "completed",
  ONHOLD: "onHold",
  PENDING: "pending",
  TERMINATED: "terminated",
});

exports.LEFT_TYPE = Object.freeze({
  SELF: "self",
  COMPANY: "company",
  ABSCONDING: "absconding",
});
