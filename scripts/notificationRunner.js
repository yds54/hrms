const {
  birthdayNotifications,
  marriageAnniversaryNotifications,
  resignationNoticeNotifications,
  employmentStartNotifications,
  employeeAnniversaryNotifications,
  bondCompleteNotifications,
  interviewReminderNotifications,
  evaluationNotifications,
} = require("../src/services/notificationEventService");

module.exports = async () => {
  await birthdayNotifications();
  await marriageAnniversaryNotifications();
  await resignationNoticeNotifications();
  await employmentStartNotifications();
  await employeeAnniversaryNotifications();
  await bondCompleteNotifications();
  await interviewReminderNotifications();
  await evaluationNotifications();
};
