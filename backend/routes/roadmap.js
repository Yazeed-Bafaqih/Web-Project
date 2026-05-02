const express = require('express');
const router = express.Router();
const generateRoadmap = require('../generate-roadmap');

// ==========================================
// ⚠️ TEMPORARY IN-MEMORY DATABASE FOR TESTING
// ==========================================
const memoryDb = new Map();

// Dummy Roadmap Generator (Fallback if Claude fails during testing)
function getDummyRoadmap(topic, level, hours) {
  return {
    "topic": topic,
    "total_duration_weeks": 8,
    "difficulty_rating": level === 'Beginner' ? 3 : level === 'Intermediate' ? 6 : 8,
    "phases": [
      {
        "phase_number": 1,
        "phase_name": `Introduction to ${topic}`,
        "duration_weeks": 2,
        "description": `Get started with the fundamentals of ${topic} at a ${level} level.`,
        "topics": ["Core concepts", "Setup & Tools", "Basic Syntax/Theory"],
        "resources": [
          {"type": "course", "title": `${topic} for ${level}s`, "url": "https://developer.mozilla.org"}
        ],
        "milestones": ["Set up your environment", "Complete your first Hello World"],
        "exercises": ["Write your first script", "Read the documentation"],
        "estimated_hours": hours * 2
      },
      {
        "phase_number": 2,
        "phase_name": "Building Real Projects",
        "duration_weeks": 6,
        "description": "Apply your knowledge by building practical applications.",
        "topics": ["Advanced structures", "Best Practices", "Deployment"],
        "resources": [
          {"type": "video", "title": "Build a Project from Scratch", "url": "https://youtube.com"}
        ],
        "milestones": ["Finish main project", "Deploy to production"],
        "exercises": ["Refactor code", "Add unit tests"],
        "estimated_hours": hours * 6
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
    const { topic, level, hours, goal, userEmail } = req.body;
    
    if (!topic || !level || !hours) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    console.log(`\n🎯 API Request: Generate roadmap for [${topic}], Level: [${level}], Hours: [${hours}]`);
    
    let roadmapData;
    
    try {
      // Try to call Claude API
      roadmapData = await generateRoadmap(topic, level, hours, goal);
    } catch (apiError) {
      console.error("⚠️ Claude API failed. Falling back to dummy data so you can test the UI!");
      console.error(apiError.message);
      
      // Fallback
      roadmapData = getDummyRoadmap(topic, level, hours);
    }
    
    // Save to IN-MEMORY Database
    const roadmapId = 'temp-' + Date.now();
    const newRoadmap = {
      _id: roadmapId,
      topic,
      level,
      hoursPerWeek: hours,
      goal,
      userEmail,
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

// Get saved roadmaps
router.get('/my-roadmaps', async (req, res) => {
  try {
    const { email } = req.query;
    
    // Convert Map values to array
    let allRoadmaps = Array.from(memoryDb.values());
    
    // Filter by email if provided
    if (email) {
      allRoadmaps = allRoadmaps.filter(r => r.userEmail === email);
    }
    
    // Sort by newest
    allRoadmaps.sort((a, b) => b.createdAt - a.createdAt);
    
    res.json({ 
      success: true, 
      roadmaps: allRoadmaps
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