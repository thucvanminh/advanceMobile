const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('joinGroup', (username) => {
    console.log(`${username} joined the group`);
    socket.broadcast.emit('receiveMessage', {
      id: Date.now().toString(),
      text: `${username} has joined the group`,
      username: 'System',
      isSystem: true,
    });
  });

  socket.on('sendMessage', (message) => {
    console.log('Message received:', message);
    io.emit('receiveMessage', message);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

server.listen(3000, '0.0.0.0', () => {
  console.log('Server is running on port 3000');
});