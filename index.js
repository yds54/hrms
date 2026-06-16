const http = require("http");
require("dotenv").config();
const { connectDB } = require("./src/config/dbconnection.js");
const notificationCron = require("./scripts/notificationCron");

const app = require("./app.js");
const PORT = process.env.PORT || 3001;
const startServer = async () => {
  try {
    await connectDB();
    notificationCron();
    app.listen(PORT, () => {
      console.log(`Server is running at PORT ${PORT}. `);
    });
  } catch (error) {
    console.error("Error : ", error);
  }
};

startServer();
