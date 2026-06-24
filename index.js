const http = require("http");
const socketIO = require("socket.io");
require("dotenv").config();
const { connectDB } = require("./src/config/dbconnection.js");
const startNotificationCron = require("./src/scheduler/notificationCron");

const app = require("./app.js");
const { initializeSocket } = require("./src/socket/socketService");
const PORT = process.env.PORT || 3001;

const startServer = async () => {
  try {
    await connectDB();
    startNotificationCron();

    const server = http.createServer(app);

    const io = socketIO(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true,
      },
      transports: ["websocket", "polling"],
    });

    initializeSocket(io);

    server.listen(PORT, () => {
      console.log(`Server is running at PORT ${PORT}`);
      console.log(`WebSocket server initialized`);
    });
  } catch (error) {
    console.error("Error : ", error);
  }
};

startServer();
