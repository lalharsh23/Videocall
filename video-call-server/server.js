// server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// To store active users in rooms
let rooms = {};

app.get('/', (req, res) => {
  res.send('Video Call Signaling Server');
});

// When a user connects to the server
io.on('connection', (socket) => {
  console.log('New user connected', socket.id);

  // Join a room
  socket.on('join-room', (roomId, userId) => {
    socket.join(roomId);
    if (!rooms[roomId]) rooms[roomId] = [];
    rooms[roomId].push(userId);

    console.log(`${userId} joined room ${roomId}`);
    socket.to(roomId).emit('user-connected', userId);
  });

  // Relay signaling messages (offer, answer, ICE candidates)
  socket.on('signal', (data) => {
    const { roomId, userId, signalData } = data;
    socket.to(roomId).emit('signal', { userId, signalData });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    // Remove user from all rooms
    for (let roomId in rooms) {
      rooms[roomId] = rooms[roomId].filter((id) => id !== socket.id);
    }
  });
});

server.listen(8000, () => {
  console.log('Server running on http://localhost:8000');
});
