require('dotenv').config();
const { dbPath } = require('./backend/db/sqlite');
const express = require('express');
const path = require('path');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname)));
app.use(express.static(path.join(__dirname, 'html')));
app.use(express.static(path.join(__dirname, 'css')));
app.use(express.static(path.join(__dirname, 'js')));

const roadmapRoutes = require('./backend/routes/roadmap');

app.use('/api/roadmap', roadmapRoutes);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'html', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`SQLite: ${dbPath}`);
  console.log(`API Key loaded: ${process.env.ANTHROPIC_API_KEY ? 'Yes ✓' : 'No ✗'}`);
});
