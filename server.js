require('dotenv').config();
const express = require('express');
const path = require('path');
const http = require('http');
const setupSocket = require('./backend/services/socket.service');

const app = express();
const server = http.createServer(app);

// Setup Socket.IO
const io = setupSocket(server);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// خدمة الملفات الثابتة
app.use(express.static(path.join(__dirname)));
app.use(express.static(path.join(__dirname, 'html')));
app.use(express.static(path.join(__dirname, 'css')));
app.use(express.static(path.join(__dirname, 'js')));

// 👇 مهم جداً - ربط الـ Routes
const roadmapRoutes = require('./backend/routes/roadmap');
const teamsRoutes = require('./backend/routes/teams');
const { router: chatRoutes } = require('./backend/routes/chat');

app.use('/api/roadmap', roadmapRoutes);
app.use('/api/teams', teamsRoutes);
app.use('/api/chat', chatRoutes);

// الصفحة الرئيسية
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'html', 'index.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API Key loaded: ${process.env.ANTHROPIC_API_KEY ? 'Yes ✓' : 'No ✗'}`);
});