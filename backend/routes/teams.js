const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
// In a real app we'd require the Team model: const Team = require('../models/Team');

// ==========================================
// ⚠️ TEMPORARY IN-MEMORY DATABASE FOR TESTING
// ==========================================
const teamsDb = new Map();

// Helper to generate random invite code
const generateInviteCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

// Create Team
router.post('/', 
  body('name').isLength({ min: 3, max: 50 }).trim(),
  body('privacy').isIn(['public', 'private', 'visible']).optional(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, description, roadmapId, privacy = 'public', userEmail, username } = req.body;
      
      const teamId = 'team-' + Date.now();
      const newTeam = {
        _id: teamId,
        name,
        description,
        roadmapId,
        privacy,
        inviteCode: generateInviteCode(),
        members: [{
          userEmail: userEmail || 'anonymous@test.com',
          username: username || 'Admin',
          role: 'admin',
          joinedAt: new Date(),
          progress: 0
        }],
        streak: 0,
        createdAt: new Date()
      };
      
      teamsDb.set(teamId, newTeam);
      
      res.status(201).json({
        success: true,
        message: 'Team created successfully',
        team: newTeam
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Get All Public/Visible Teams
router.get('/', async (req, res) => {
  try {
    const allTeams = Array.from(teamsDb.values())
      .filter(t => t.privacy === 'public' || t.privacy === 'visible')
      .map(t => ({
        ...t,
        memberCount: t.members.length
      }));
    
    res.json({ success: true, teams: allTeams });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get User's Teams
router.get('/my-teams', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
       return res.status(400).json({ error: 'Email required' });
    }
    
    const userTeams = Array.from(teamsDb.values())
      .filter(t => t.members.some(m => m.userEmail === email));
      
    res.json({ success: true, teams: userTeams });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Single Team
router.get('/:id', async (req, res) => {
  try {
    const team = teamsDb.get(req.params.id);
    if (!team) return res.status(404).json({ error: 'Team not found' });
    
    res.json({ success: true, team });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Join Team
router.post('/:id/join', async (req, res) => {
  try {
    const { userEmail, username, inviteCode } = req.body;
    const team = teamsDb.get(req.params.id);
    
    if (!team) return res.status(404).json({ error: 'Team not found' });
    
    // Check if already member
    if (team.members.some(m => m.userEmail === userEmail)) {
      return res.status(400).json({ error: 'Already a member' });
    }
    
    // Check privacy
    if (team.privacy === 'private' && team.inviteCode !== inviteCode) {
      return res.status(403).json({ error: 'Invalid invite code' });
    }
    
    team.members.push({
      userEmail,
      username,
      role: 'member',
      joinedAt: new Date(),
      progress: 0
    });
    
    teamsDb.set(team._id, team);
    
    res.json({ success: true, message: 'Joined successfully', team });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
