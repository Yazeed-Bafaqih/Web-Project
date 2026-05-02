const fetch = require('node-fetch');

async function generateRoadmap(topic, level, hours, goal) {
  console.log('📝 Generating roadmap for:', { topic, level, hours, goal });
  
  const prompt = `You are an expert learning path designer. Create a detailed, practical learning roadmap for:

**Topic:** ${topic}
**Current Level:** ${level}
**Hours Per Week:** ${hours}
**Goal:** ${goal || 'General learning'}

Provide a structured, actionable roadmap in JSON format ONLY (no markdown formatting, no explanations, no code blocks).

The JSON must follow this exact structure:
{
  "topic": "${topic}",
  "total_duration_weeks": 12,
  "difficulty_rating": ${level === 'Beginner' ? 3 : level === 'Intermediate' ? 6 : 8},
  "phases": [
    {
      "phase_number": 1,
      "phase_name": "Foundation Basics",
      "duration_weeks": 3,
      "description": "Learn fundamental concepts",
      "topics": ["Core concepts", "Basic tools", "Essential theory"],
      "resources": [
        {"type": "article", "title": "Introduction Guide", "url": "https://example.com"}
      ],
      "milestones": ["Complete first project", "Understand basics"],
      "exercises": ["Practice exercises", "Small tasks"],
      "estimated_hours": 15
    }
  ],
  "weekly_schedule": {
    "study_hours": ${Math.floor(hours * 0.6)},
    "practice_hours": ${Math.ceil(hours * 0.4)},
    "suggested_days": ["Monday", "Wednesday", "Saturday"]
  },
  "prerequisites": ["Basic computer knowledge"],
  "next_steps": ["Build projects", "Join community"],
  "career_paths": ["Related career 1", "Related career 2"]
}

Make it practical, specific, and tailored to the available time.`;

  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is not set in environment variables');
    }

    console.log('🔑 API Key is present');
    console.log('🤖 Calling Claude API...');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307', // Using Haiku as it is fast and cheap
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    console.log('📡 API Response Status:', response.status, response.statusText);

    const responseBody = await response.text();

    if (!response.ok) {
      console.error('❌ API Error Response:', responseBody);
      throw new Error(`Claude API Error (${response.status}): ${responseBody}`);
    }

    let data;
    try {
      data = JSON.parse(responseBody);
    } catch (parseError) {
      console.error('❌ Failed to parse response from Anthropic API:', parseError);
      throw new Error('Invalid JSON response from Claude API');
    }

    if (!data.content || !data.content[0] || !data.content[0].text) {
      throw new Error('Invalid response structure from Claude API');
    }

    const content = data.content[0].text;
    
    // Clean markdown formatting in case Claude returned it wrapped in ```json
    const jsonStr = content.replace(/```json\n?|\n?```/g, '').trim();

    let roadmapJSON;
    try {
      roadmapJSON = JSON.parse(jsonStr);
    } catch (jsonError) {
      console.error('❌ Failed to parse roadmap JSON from Claude:', jsonError);
      console.error('JSON string was:', jsonStr);
      throw new Error('Claude did not return valid JSON content');
    }

    console.log('✅ Successfully parsed roadmap JSON');
    return roadmapJSON;
    
  } catch (error) {
    console.error('❌ Error in generateRoadmap function:', error.message);
    throw error;
  }
}

module.exports = generateRoadmap;