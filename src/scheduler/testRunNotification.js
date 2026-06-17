const path = require("path");
require("dotenv").config({
  path: path.resolve(__dirname, "../../.env"),
});

const { connectDB } = require("../config/dbconnection");
const runNotifications = require("../services/notificationRunner");

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
