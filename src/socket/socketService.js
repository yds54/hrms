const { setupChatEvents } = require("./chatEvents");
const { socketAuth } = require("../config/socket");

const initializeSocket = (io) => {
  io.use(socketAuth);
  io.use((socket, next) => {
    console.log("SOCKET AUTH", {
      socketId: socket.id,
      user: socket.user,
    });

    next();
  });
  io.on("connection", (socket) => {
    console.log(`Socket Connected:`, {
      socketId: socket.id,
      userId: socket.user?.id,
    });

    setupChatEvents(io, socket);

    socket.on("error", (error) => {});

    socket.on("disconnect", (reason) => {
      console.log(` Socket Disconnected [${socket.id}]:`, reason);
    });
  });
};

module.exports = { initializeSocket };
