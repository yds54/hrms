
exports. ROLES = Object.freeze({
  ADMIN: 'admin',
  USER: 'user',
});
exports.GENDER = Object.freeze({
    MALE: 'male',
    FEMALE: 'female',
    OTHER: 'other'
});

exports.MARITAL_STATUS = Object.freeze({
    SINGLE: 'single',
    MARRIED: 'married'
});

exports.TEAM_ROLES = Object.freeze({
    PM: 'pm',
    TL: 'tl',
    DEV: 'dev'
});
exports.USER_STATUS = Object.freeze({
    ACTIVE: 'active',
    INACTIVE: 'inactive',
});

exports.LEAVE_DAY_TYPE = Object.freeze({
  SINGLE: "Single Day",
  MULTIPLE: "Multiple Day",
});

exports.LEAVE_DURATION = Object.freeze({
  FULL: "Full Day",
  HALF: "Half Day",
});

exports.LEAVE_STATUS = Object.freeze({
  PENDING: "Pending",
  APPROVED: "Approved",
  DECLINED: "Declined",
});