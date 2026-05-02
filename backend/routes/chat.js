const express = require('express');
const router = express.Router();

// ==========================================
// ⚠️ TEMPORARY IN-MEMORY DATABASE FOR TESTING
// ==========================================
// Structure: teamId -> [Message]
const messagesDb = new Map();

// Get chat history for a team
router.get('/:teamId', async (req, res) => {
  try {
    const { teamId } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    
    const teamMessages = messagesDb.get(teamId) || [];
    
    // Return last N messages
    const recentMessages = teamMessages.slice(-limit);
    
    res.json({
      success: true,
      messages: recentMessages
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add a message manually (mostly handled by socket.io, but good for REST fallback/system messages)
router.post('/:teamId', async (req, res) => {
  try {
    const { teamId } = req.params;
    const { senderEmail, senderName, content, type = 'text' } = req.body;
    
    if (!content || !senderEmail || !senderName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const newMessage = {
      _id: 'msg-' + Date.now(),
      teamId,
      senderEmail,
      senderName,
      content,
      type,
      createdAt: new Date()
    };
    
    const teamMessages = messagesDb.get(teamId) || [];
    teamMessages.push(newMessage);
    messagesDb.set(teamId, teamMessages);
    
    res.status(201).json({
      success: true,
      message: newMessage
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper for socket service to save messages
const saveMessage = (teamId, senderEmail, senderName, content, type = 'text') => {
  const newMessage = {
    _id: 'msg-' + Date.now(),
    teamId,
    senderEmail,
    senderName,
    content,
    type,
    createdAt: new Date()
  };
  
  const teamMessages = messagesDb.get(teamId) || [];
  teamMessages.push(newMessage);
  messagesDb.set(teamId, teamMessages);
  
  return newMessage;
};

module.exports = {
  router,
  saveMessage
};
