const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', '..', 'data');
const dbPath = process.env.SQLITE_PATH || path.join(dataDir, 'roadmaps.json');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let db = { roadmaps: [] };

function loadDb() {
  if (fs.existsSync(dbPath)) {
    try {
      db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    } catch (e) {
      console.error('Failed to parse DB:', e);
      db = { roadmaps: [] };
    }
  } else {
    saveDb();
  }
}

function saveDb() {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
}

loadDb();

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
    roadmapData: row.roadmap_data,
    progress: row.progress,
    createdAt: new Date(row.created_at),
    shareToken: row.share_token,
  };
}

function insertRoadmap(doc) {
  const createdAt = doc.createdAt instanceof Date ? doc.createdAt.toISOString() : doc.createdAt;
  const row = {
    id: doc._id,
    topic: doc.topic,
    level: doc.level,
    hours_per_week: doc.hoursPerWeek,
    duration_weeks: doc.durationWeeks,
    session_id: doc.sessionId || null,
    user_email: doc.userEmail || null,
    roadmap_data: doc.roadmapData,
    progress: doc.progress ?? 0,
    share_token: doc.shareToken,
    created_at: createdAt,
  };
  
  const existingIndex = db.roadmaps.findIndex(r => r.id === row.id);
  if (existingIndex >= 0) {
    db.roadmaps[existingIndex] = row;
  } else {
    db.roadmaps.push(row);
  }
  saveDb();
}

function findById(id) {
  const row = db.roadmaps.find(r => r.id === id);
  return rowToClient(row);
}

function findByShareToken(token) {
  const row = db.roadmaps.find(r => r.share_token === token);
  return rowToClient(row);
}

function listBySession(sessionId) {
  const rows = db.roadmaps
    .filter(r => r.session_id === sessionId)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  return rows.map(rowToClient);
}

function listByEmail(email) {
  const rows = db.roadmaps
    .filter(r => r.user_email === email)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  return rows.map(rowToClient);
}

function updateProgress(id, progress) {
  const row = db.roadmaps.find(r => r.id === id);
  if (row) {
    row.progress = progress;
    saveDb();
    return true;
  }
  return false;
}

function deleteById(id) {
  const initialLen = db.roadmaps.length;
  db.roadmaps = db.roadmaps.filter(r => r.id !== id);
  if (db.roadmaps.length !== initialLen) {
    saveDb();
    return true;
  }
  return false;
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
