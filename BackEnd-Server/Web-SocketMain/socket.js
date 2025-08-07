const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const userSocketMap = {};

const userStatusMap = {};

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join', (username) => {
    socket.join(username);
    userSocketMap[username] = socket.id;
    userStatusMap[username] = { online: true, lastSeen: null }; // Set user as online
    io.emit('user_status', { username, online: true });
    console.log(`${username} joined room`);
  });

  socket.on('send_message', (data) => {
    const { to, message, from } = data;
    io.to(to).emit('receive_message', { from, message });
    io.emit('new_message_sent', { from, to, message });
  });

  socket.on('send_unread_count', ({ from, to, message }) => {
    io.emit('update_unread', { from, to, message });
  });

  socket.on('reset_unread_count', ({ from, to }) => {
    io.emit('reset_unread', { from, to, reset: true });
  });

  socket.on('typing', ({ from, to }) => {
    io.emit('user_typing_chatList', { from, to });
  });

  socket.on('disconnect', () => {
    const username = Object.keys(userSocketMap).find(
      (key) => userSocketMap[key] === socket.id
    );
    if (username) {
      userStatusMap[username] = { online: false, lastSeen: new Date() };
      io.emit('user_status', {
        username,
        online: false,
        lastSeen: userStatusMap[username].lastSeen
      });
      // Notify backend to update last seen in MongoDB
      axios.post('https://chat-app-server-ks97.onrender.com/update-last-seen', {
        username,
        lastSeen: userStatusMap[username].lastSeen
      }).catch((err) => {
        console.error('Error updating last seen in DB:', err);
      });
      delete userSocketMap[username];
      console.log(`${username} disconnected, last seen: ${userStatusMap[username].lastSeen}`);
    }
    console.log('User disconnected:', socket.id);
  });
});

io.on('connection', (socket) => {
  socket.on('typing', ({ from, to }) => {
    const targetSocketId = userSocketMap[to];
    if (targetSocketId) {
      io.to(targetSocketId).emit('user_typing', { from });
      console.log(`${from} is typing to ${to}`);
    }
  });
});

const PORT = process.env.WEBSOCKET_PORT;
server.listen(PORT, () => {
  console.log(`WebSocket Server running at http://localhost:${PORT}`);
});
