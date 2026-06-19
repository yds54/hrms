require("dotenv").config({
  path: require("path").resolve(__dirname, "../.env"),
});

const { connectDB } = require("../src/config/dbconnection");
const runNotifications = require("../src/services/notificationRunner");

(async () => {
  try {
    await connectDB();
    await runNotifications();
    console.log("All notifications executed");
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
