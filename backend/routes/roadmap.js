const express = require('express');
const router = express.Router();
const generateRoadmap = require('../generate-roadmap');

// ==========================================
// ⚠️ TEMPORARY IN-MEMORY DATABASE FOR TESTING
// ==========================================
const memoryDb = new Map();

// Dummy Roadmap Generator (Fallback if Claude fails during testing)
function getDummyRoadmap(topic, level, hours, durationWeeks) {
  let rem = durationWeeks;
  const dur0 = Math.ceil(rem / 3);
  rem -= dur0;
  const dur1 = Math.ceil(rem / 2);
  const dur2 = rem - dur1;
  const dur = [dur0, dur1, dur2];

  return {
    "topic": topic,
    "total_duration_weeks": durationWeeks,
    "difficulty_rating": level === 'Beginner' ? 3 : level === 'Intermediate' ? 6 : 8,
    "phases": [
      {
        "phase_number": 1,
        "phase_name": `Foundation — ${topic}`,
        "duration_weeks": dur[0],
        "description": `Get started with the fundamentals of ${topic} at a ${level} level.`,
        "topics": ["Core concepts", "Setup & tools", "Essential syntax or theory"],
        "resources": [
          {"type": "course", "title": `${topic} for ${level}s`, "url": "https://developer.mozilla.org"}
        ],
        "milestones": ["Set up your environment", "Complete your first guided exercise"],
        "exercises": ["Practice basics daily", "Read official docs"],
        "estimated_hours": hours * dur[0]
      },
      {
        "phase_number": 2,
        "phase_name": `Practice & projects — ${topic}`,
        "duration_weeks": dur[1],
        "description": "Apply concepts with structured projects.",
        "topics": ["Intermediate patterns", "Debugging", "Tooling"],
        "resources": [
          {"type": "video", "title": "Guided mini-projects", "url": "https://youtube.com"}
        ],
        "milestones": ["Ship two small projects", "Peer review or self-review"],
        "exercises": ["Iterate on feedback", "Add tests where applicable"],
        "estimated_hours": hours * dur[1]
      },
      {
        "phase_number": 3,
        "phase_name": `Consolidate & stretch — ${topic}`,
        "duration_weeks": dur[2],
        "description": "Deepen mastery and prepare real-world outputs.",
        "topics": ["Best practices", "Deployment or integration", "Portfolio piece"],
        "resources": [
          {"type": "article", "title": "Production readiness checklist", "url": "https://developer.mozilla.org"}
        ],
        "milestones": ["Ship a capstone project", "Document what you learned"],
        "exercises": ["Optimize and refactor", "Present or deploy"],
        "estimated_hours": hours * dur[2]
      }
    ],
    "weekly_schedule": {
      "study_hours": Math.floor(hours * 0.6) || 1,
      "practice_hours": Math.ceil(hours * 0.4) || 1,
      "suggested_days": ["Monday", "Wednesday", "Friday"]
    },
    "prerequisites": ["A working computer", "Curiosity to learn"],
    "next_steps": ["Join a community", "Build a portfolio"],
    "career_paths": [`${topic} Developer`, "Technical Consultant"]
  };
}

// Generate new roadmap
router.post('/generate', async (req, res) => {
  try {
    const { topic, level, hours, durationWeeks, sessionId } = req.body;

    const sidRaw = typeof sessionId === 'string' ? sessionId.trim() : '';
    const uuidOk =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        sidRaw
      );

    if (!uuidOk) {
      return res.status(400).json({
        error: 'Missing or invalid sessionId (use crypto.randomUUID in the browser)',
      });
    }

    if (!topic || !level || String(topic).trim().length < 3) {
      return res.status(400).json({ error: 'Missing or invalid topic/level' });
    }

    const weeks = parseInt(durationWeeks, 10);
    const hrs = parseInt(hours, 10);
    if (Number.isNaN(weeks) || weeks < 3 || weeks > 52) {
      return res.status(400).json({ error: 'durationWeeks must be between 3 and 52' });
    }
    if (Number.isNaN(hrs) || hrs < 1 || hrs > 15) {
      return res.status(400).json({ error: 'hours must be between 1 and 15' });
    }
    
    console.log(`\n🎯 API Request: [${topic}] Level: [${level}] Hours/wk: [${hrs}] Duration: [${weeks}w]`);
    
    let roadmapData;
    
    try {
      roadmapData = await generateRoadmap(topic, level, hrs, weeks);
    } catch (apiError) {
      console.error("⚠️ Claude API failed. Falling back to dummy data so you can test the UI!");
      console.error(apiError.message);
      
      roadmapData = getDummyRoadmap(topic, level, hrs, weeks);
    }
    
    // Save to IN-MEMORY Database
    const roadmapId = 'temp-' + Date.now();
    const newRoadmap = {
      _id: roadmapId,
      topic,
      level,
      hoursPerWeek: hrs,
      durationWeeks: weeks,
      sessionId: sidRaw,
      roadmapData,
      progress: 0,
      createdAt: new Date(),
      shareToken: Math.random().toString(36).substring(7)
    };
    
    memoryDb.set(roadmapId, newRoadmap);
    
    res.json({
      success: true,
      roadmapId: roadmapId,
      shareToken: newRoadmap.shareToken,
      message: 'Roadmap generated successfully',
      data: roadmapData
    });
    
  } catch (error) {
    console.error('❌ Critical Error in route:', error);
    res.status(500).json({ 
      error: 'Failed to generate roadmap',
      message: error.message 
    });
  }
});

// Get saved roadmaps (scoped: email filter overrides session filter)
router.get('/my-roadmaps', async (req, res) => {
  try {
    const { email, sessionId } = req.query;

    let allRoadmaps = Array.from(memoryDb.values());

    const emailTrim =
      typeof email === 'string' && email.includes('@')
        ? email.trim()
        : '';

    const sidTrim =
      typeof sessionId === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        sessionId.trim()
      )
        ? sessionId.trim()
        : '';

    if (emailTrim) {
      allRoadmaps = allRoadmaps.filter((r) => r.userEmail === emailTrim);
    } else if (sidTrim) {
      allRoadmaps = allRoadmaps.filter((r) => r.sessionId === sidTrim);
    } else {
      allRoadmaps = [];
    }

    allRoadmaps.sort((a, b) => b.createdAt - a.createdAt);

    res.json({
      success: true,
      roadmaps: allRoadmaps,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single roadmap by ID
router.get('/:idOrToken', async (req, res) => {
  try {
    const { idOrToken } = req.params;
    
    // Find in memory db by ID or shareToken
    let roadmap = memoryDb.get(idOrToken);
    
    if (!roadmap) {
      // Check shareToken
      const allRoadmaps = Array.from(memoryDb.values());
      roadmap = allRoadmaps.find(r => r.shareToken === idOrToken);
    }
    
    if (!roadmap) {
      return res.status(404).json({ error: 'Roadmap not found in memory database' });
    }
    
    res.json({ 
      success: true, 
      roadmap: roadmap
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update roadmap progress
router.put('/:id/progress', async (req, res) => {
  try {
    const { progress } = req.body;
    const { id } = req.params;
    
    const roadmap = memoryDb.get(id);
    if (roadmap) {
      roadmap.progress = progress;
      memoryDb.set(id, roadmap);
    }
    
    res.json({ 
      success: true, 
      message: 'Progress updated in memory',
      progress 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete roadmap
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    memoryDb.delete(id);
    
    res.json({ 
      success: true, 
      message: 'Roadmap deleted from memory' 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;