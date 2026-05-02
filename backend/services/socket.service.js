const { Server } = require('socket.io');
const { saveMessage } = require('../routes/chat');

const setupSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || "*",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Join a team room
    socket.on('join_team', (teamId, userDetails) => {
      socket.join(teamId);
      console.log(`Socket ${socket.id} joined team ${teamId}`);
      
      // Notify team
      if (userDetails && userDetails.username) {
        const sysMsg = saveMessage(teamId, 'system', 'System', `${userDetails.username} joined the chat`, 'system');
        io.to(teamId).emit('receive_message', sysMsg);
      }
    });

    // Leave a team room
    socket.on('leave_team', (teamId) => {
      socket.leave(teamId);
      console.log(`Socket ${socket.id} left team ${teamId}`);
    });

    // Handle new message
    socket.on('send_message', (data) => {
      const { teamId, senderEmail, senderName, content } = data;
      
      // Save message
      const savedMsg = saveMessage(teamId, senderEmail, senderName, content);
      
      // Broadcast to room
      io.to(teamId).emit('receive_message', savedMsg);
    });

    // Typing indicators
    socket.on('typing', (data) => {
      const { teamId, username } = data;
      socket.to(teamId).emit('user_typing', { username });
    });
    
    socket.on('stop_typing', (data) => {
      const { teamId, username } = data;
      socket.to(teamId).emit('user_stop_typing', { username });
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });

  return io;
};

module.exports = setupSocket;
