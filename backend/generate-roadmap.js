const fetch = require('node-fetch');
const DEFAULT_MODEL =
  process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001';
const SYSTEM_PROMPT = `You are TechPath's roadmap generator for students. Respond with ONE valid JSON object only.
Rules: No markdown fences, no code blocks, no explanations before or after the JSON.
Use UTF-8, double-quoted strings, valid JSON escapes. Numbers must not be quoted.`;
function allocatePhaseWeeks(durationWeeks, rawWeights) {
  const w = rawWeights.map((r) => Math.max(1, Math.floor(Number(r)) || 1));
  const sumW = w.reduce((a, b) => a + b, 0);
  let alloc = w.map((x) => Math.max(1, Math.round((x / sumW) * durationWeeks)));
  let s = alloc.reduce((a, b) => a + b, 0);
  while (s > durationWeeks) {
    const maxI = alloc.indexOf(Math.max(...alloc));
    if (alloc[maxI] > 1) {
      alloc[maxI]--;
      s--;
    } else {
      break;
    }
  }
  while (s < durationWeeks) {
    alloc[2]++;
    s++;
  }
  const final = alloc.reduce((a, b) => a + b, 0);
  if (final !== durationWeeks) {
    alloc[alloc.length - 1] += durationWeeks - final;
  }
  alloc = alloc.map((x) => Math.max(1, x));
  if (alloc.reduce((a, b) => a + b, 0) !== durationWeeks) {
    const diff = durationWeeks - alloc.reduce((a, b) => a + b, 0);
    alloc[2] += diff;
  }
  return alloc.map((x) => Math.max(1, x));
}
function normalizeRoadmap(result, constraints) {
  const { topic, level, hours, durationWeeks } = constraints;
  if (!result || typeof result !== 'object') {
    throw new Error('Roadmap payload must be a JSON object');
  }
  const phasesIn = Array.isArray(result.phases) ? result.phases : null;
  if (!phasesIn || phasesIn.length < 3) {
    throw new Error('Roadmap must include exactly 3 phases');
  }
  const sorted = [...phasesIn]
    .sort(
      (a, b) =>
        (Number(a.phase_number) || 0) - (Number(b.phase_number) || 0)
    )
    .slice(0, 3);
  const rawWeights = sorted.map((p) => {
    const w = Number(p.duration_weeks);
    return Number.isFinite(w) && w >= 1 ? Math.floor(w) : 1;
  });
  const weeksAlloc = allocatePhaseWeeks(durationWeeks, rawWeights);
  const fixed = sorted.map((p, idx) => {
    const phase = { ...p };
    phase.phase_number = idx + 1;
    phase.duration_weeks = weeksAlloc[idx];
    const est = Math.round(hours * phase.duration_weeks);
    phase.estimated_hours =
      typeof p.estimated_hours === 'number' && Number.isFinite(p.estimated_hours)
        ? Math.max(1, Math.round(p.estimated_hours))
        : Math.max(1, est);
    return phase;
  });
  let study = Number(result?.weekly_schedule?.study_hours);
  let practice = Number(result?.weekly_schedule?.practice_hours);
  if (!(study >= 0) || !(practice >= 0) || study + practice !== hours) {
    study = Math.floor(hours * 0.6) || 1;
    practice = hours - study;
    if (practice < 0) {
      practice = Math.ceil(hours * 0.4) || 1;
      study = Math.max(0, hours - practice);
    }
  }
  const levelRating =
    level === 'Beginner' ? 3 : level === 'Intermediate' ? 6 : level === 'Advanced' ? 8 : 5;
  return {
    ...result,
    topic: typeof result.topic === 'string' && result.topic.trim() ? result.topic.trim() : topic,
    total_duration_weeks: durationWeeks,
    difficulty_rating:
      typeof result.difficulty_rating === 'number' &&
      Number.isFinite(result.difficulty_rating)
        ? Math.min(10, Math.max(1, Math.round(result.difficulty_rating)))
        : levelRating,
    phases: fixed,
    weekly_schedule: {
      study_hours: study,
      practice_hours: practice,
      suggested_days: Array.isArray(result.weekly_schedule?.suggested_days)
        ? result.weekly_schedule.suggested_days
        : ['Monday', 'Wednesday', 'Saturday'],
    },
  };
}
function buildUserPrompt(topic, level, hours, durationWeeks) {
  return `You produce learning roadmaps for individual learners.
LEARNER INPUT (obey strictly):
• Subject to learn: ${topic}
• Current level: ${level} (Beg/Int/Adv — match depth and jargon to this)
• Study time budget: ${hours} hours each week (integer)
• Plan length: ${durationWeeks} weeks total across all stages
CONTENT RULES:
1. Exactly THREE phases / stages — "phase_number" must be 1, 2, and 3 in order.
2. Each phase spans part of the ${durationWeeks} weeks; the THREE "duration_weeks" fields MUST be integers ≥ 1 and MUST sum exactly to ${durationWeeks}.
3. Phase 1 foundations, Phase 2 applied practice & projects, Phase 3 integration, polish, portfolio or capstone (adapt labels to "${topic}" and ${level}).
4. "estimated_hours" per phase ≈ (hours × that phase's duration_weeks), rounded reasonably.
5. "resources": at least two items per phase with valid-looking https URLs where possible (real publishers, docs, universities, reputable courses).
6. "weekly_schedule": split the ${hours} weekly hours across study_hours + practice_hours (non-negative integers, sum equals ${hours}).
7. "prerequisites", "next_steps", "career_paths": concise, topic-specific arrays of strings.
Return exactly this JSON shape (replace values; keep keys):
{
  "topic": "",
  "total_duration_weeks": ${durationWeeks},
  "difficulty_rating": 1,
  "phases": [
    {
      "phase_number": 1,
      "phase_name": "",
      "duration_weeks": 0,
      "description": "",
      "topics": ["", ""],
      "resources": [
        {"type": "article", "title": "", "url": "https://"},
        {"type": "video", "title": "", "url": "https://"}
      ],
      "milestones": ["", ""],
      "exercises": ["", ""],
      "estimated_hours": 0
    },
    {
      "phase_number": 2,
      "phase_name": "",
      "duration_weeks": 0,
      "description": "",
      "topics": ["", ""],
      "resources": [
        {"type": "course", "title": "", "url": "https://"},
        {"type": "article", "title": "", "url": "https://"}
      ],
      "milestones": ["", ""],
      "exercises": ["", ""],
      "estimated_hours": 0
    },
    {
      "phase_number": 3,
      "phase_name": "",
      "duration_weeks": 0,
      "description": "",
      "topics": ["", ""],
      "resources": [
        {"type": "project", "title": "", "url": "https://"},
        {"type": "book", "title": "", "url": "https://"}
      ],
      "milestones": ["", ""],
      "exercises": ["", ""],
      "estimated_hours": 0
    }
  ],
  "weekly_schedule": {
    "study_hours": 0,
    "practice_hours": 0,
    "suggested_days": ["Monday", "Wednesday", "Friday"]
  },
  "prerequisites": [],
  "next_steps": [],
  "career_paths": []
}`;
}
function extractAssistantText(payload) {
  if (!payload.content || !Array.isArray(payload.content)) return '';
  return payload.content
    .filter((b) => b.type === 'text' && typeof b.text === 'string')
    .map((b) => b.text)
    .join('')
    .trim();
}
async function generateRoadmap(topic, level, hours, durationWeeks) {
  const constraints = { topic: topic.trim(), level, hours, durationWeeks };
  console.log('📝 Generating roadmap:', constraints);
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not set in environment variables');
  }
  const userPrompt = buildUserPrompt(
    constraints.topic,
    constraints.level,
    constraints.hours,
    constraints.durationWeeks
  );
  console.log('🤖 Calling Anthropic Claude Haiku — model:', DEFAULT_MODEL);
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });
  const responseBody = await response.text();
  console.log('📡 Anthropic status:', response.status, response.statusText);
  if (!response.ok) {
    console.error('❌ Anthropic error body:', responseBody);
    throw new Error(`Anthropic API error (${response.status}): ${responseBody}`);
  }
  let data;
  try {
    data = JSON.parse(responseBody);
  } catch (parseError) {
    console.error('❌ Failed to parse Anthropic response JSON:', parseError);
    throw new Error('Invalid JSON envelope from Anthropic API');
  }
  const combined = extractAssistantText(data);
  const jsonStr = combined
    .replace(/^\uFEFF/, '')
    .replace(/```(?:json)?\s*/gi, '')
    .replace(/```\s*$/gm, '')
    .trim();
  const braceStart = jsonStr.indexOf('{');
  const braceEnd = jsonStr.lastIndexOf('}');
  const slice =
    braceStart !== -1 && braceEnd > braceStart
      ? jsonStr.slice(braceStart, braceEnd + 1)
      : jsonStr;
  let roadmapJSON;
  try {
    roadmapJSON = JSON.parse(slice);
  } catch (jsonError) {
    console.error('❌ Roadmap JSON parse failed:', jsonError.message);
    console.error('Raw snippet:', slice.slice(0, 500));
    throw new Error('Model did not return parseable roadmap JSON');
  }
  const normalized = normalizeRoadmap(roadmapJSON, constraints);
  console.log('✅ Roadmap normalized (3 phases, weeks reconciled)');
  return normalized;
}
module.exports = generateRoadmap;