const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const dataDir = path.join(__dirname, '..', '..', 'data');
const dbPath =
  process.env.SQLITE_PATH || path.join(dataDir, 'roadmaps.db');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS roadmaps (
  id TEXT PRIMARY KEY,
  topic TEXT NOT NULL,
  level TEXT NOT NULL,
  hours_per_week INTEGER NOT NULL,
  duration_weeks INTEGER NOT NULL,
  session_id TEXT,
  user_email TEXT,
  roadmap_data TEXT NOT NULL,
  progress INTEGER NOT NULL DEFAULT 0,
  share_token TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_roadmaps_session ON roadmaps(session_id);
CREATE INDEX IF NOT EXISTS idx_roadmaps_email ON roadmaps(user_email);
CREATE INDEX IF NOT EXISTS idx_roadmaps_share ON roadmaps(share_token);
`);

function rowToClient(row) {
  if (!row) return null;
  return {
    _id: row.id,
    topic: row.topic,
    level: row.level,
    hoursPerWeek: row.hours_per_week,
    durationWeeks: row.duration_weeks,
    sessionId: row.session_id || undefined,
    userEmail: row.user_email || undefined,
    roadmapData: JSON.parse(row.roadmap_data),
    progress: row.progress,
    createdAt: new Date(row.created_at),
    shareToken: row.share_token,
  };
}

function insertRoadmap(doc) {
  const createdAt = doc.createdAt instanceof Date ? doc.createdAt.toISOString() : doc.createdAt;
  db.prepare(
    `INSERT INTO roadmaps (
      id, topic, level, hours_per_week, duration_weeks,
      session_id, user_email, roadmap_data, progress, share_token, created_at
    ) VALUES (
      @id, @topic, @level, @hours_per_week, @duration_weeks,
      @session_id, @user_email, @roadmap_data, @progress, @share_token, @created_at
    )`
  ).run({
    id: doc._id,
    topic: doc.topic,
    level: doc.level,
    hours_per_week: doc.hoursPerWeek,
    duration_weeks: doc.durationWeeks,
    session_id: doc.sessionId || null,
    user_email: doc.userEmail || null,
    roadmap_data: JSON.stringify(doc.roadmapData),
    progress: doc.progress ?? 0,
    share_token: doc.shareToken,
    created_at: createdAt,
  });
}

function findById(id) {
  const row = db.prepare('SELECT * FROM roadmaps WHERE id = ?').get(id);
  return rowToClient(row);
}

function findByShareToken(token) {
  const row = db
    .prepare('SELECT * FROM roadmaps WHERE share_token = ?')
    .get(token);
  return rowToClient(row);
}

function listBySession(sessionId) {
  const rows = db
    .prepare(
      'SELECT * FROM roadmaps WHERE session_id = ? ORDER BY created_at DESC'
    )
    .all(sessionId);
  return rows.map(rowToClient);
}

function listByEmail(email) {
  const rows = db
    .prepare(
      'SELECT * FROM roadmaps WHERE user_email = ? ORDER BY created_at DESC'
    )
    .all(email);
  return rows.map(rowToClient);
}

function updateProgress(id, progress) {
  const info = db
    .prepare('UPDATE roadmaps SET progress = ? WHERE id = ?')
    .run(progress, id);
  return info.changes > 0;
}

function deleteById(id) {
  const info = db.prepare('DELETE FROM roadmaps WHERE id = ?').run(id);
  return info.changes > 0;
}

module.exports = {
  dbPath,
  insertRoadmap,
  findById,
  findByShareToken,
  listBySession,
  listByEmail,
  updateProgress,
  deleteById,
};
