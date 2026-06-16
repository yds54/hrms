const cron = require("node-cron");
const runNotifications = require("./notificationRunner");

module.exports = () => {
  cron.schedule("0 0 * * *", async () => {
    try {
      await runNotifications();
      console.log("Notification cron executed");
    } catch (error) {
      console.error(error);
    }
  });
  console.log("Notification cron registered");
};
