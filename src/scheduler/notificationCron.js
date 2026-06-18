const cron = require("node-cron");
const runNotifications = require("../services/notificationRunner");
const { TIMEZONES } = require("../utils/enum");

module.exports = () => {
  cron.schedule(
    "0 0 * * *",
    async () => {
      try {
        await runNotifications();
        console.log("Notification cron executed");
      } catch (error) {
        console.error(error);
      }
    },
    {
      timezone: TIMEZONES.INDIA,
    },
  );
};
