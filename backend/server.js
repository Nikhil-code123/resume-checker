require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'OPTIONS'], allowedHeaders: ['Content-Type'] }));
app.options('*', cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Multer ────────────────────────────────────────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.doc', '.docx', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Only PDF, DOC, DOCX and TXT files are allowed'));
  },
});

// ── Extract text from file ────────────────────────────────────────────────────
async function extractTextFromFile(file) {
  const ext = path.extname(file.originalname).toLowerCase();
  console.log(`Extracting text from: ${file.originalname} (${ext})`);
  if (ext === '.txt') return file.buffer.toString('utf-8');
  if (ext === '.pdf') {
    const pdfParse = require('pdf-parse');
    const data = await pdfParse(file.buffer);
    return data.text;
  }
  if (ext === '.doc' || ext === '.docx') {
    const mammoth = require('mammoth');
    const result = await mammoth.extractRawText({ buffer: file.buffer });
    return result.value;
  }
  throw new Error('Unsupported file type: ' + ext);
}

// ── Analyze with OpenRouter ───────────────────────────────────────────────────
async function analyzeResume(jobTitle, jobDescription, requiredSkills, resumeText) {
  const skillsList = requiredSkills.split(',').map(s => s.trim()).filter(Boolean).join(', ');

  const prompt = `You are an expert HR analyst with 15+ years of experience evaluating resumes.

Analyze the resume below against the job description and return ONLY a valid JSON object — no markdown, no extra text, no backticks.

JOB TITLE: ${jobTitle}

REQUIRED SKILLS: ${skillsList}

JOB DESCRIPTION:
${jobDescription}

RESUME:
${resumeText.slice(0, 6000)}

Return exactly this JSON structure:
{
  "matchPercentage": <integer 0-100>,
  "verdict": "<Strong Match | Moderate Match | Weak Match>",
  "overallSummary": "<2-3 sentence summary of the candidate's fit>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "missingSkills": ["<gap 1>", "<gap 2>", "<gap 3>"],
  "recommendations": ["<recommendation 1>", "<recommendation 2>", "<recommendation 3>"],
  "skillsAnalysis": {
    "matched": ["<skill>"],
    "partial": ["<skill>"],
    "missing": ["<skill>"]
  },
  "experienceMatch": "<Excellent | Good | Fair | Poor>",
  "educationMatch": "<Excellent | Good | Fair | Poor | Not Specified>"
}

Scoring: 80-100 = Strong Match, 50-79 = Moderate Match, 0-49 = Weak Match.
Only include skills from the REQUIRED SKILLS list inside skillsAnalysis.`;

  console.log('Calling OpenRouter API...');
  const MODEL_NAME = "qwen/qwen3-8b";

  console.log("Using model:", MODEL_NAME);

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': 'http://localhost:3000',
    'X-OpenRouter-Title': 'Resume Checker',
  },
      body: JSON.stringify({
      model: MODEL_NAME,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1500,
    }),
  });

const data = await response.json();

console.log('OpenRouter response status:', response.status);
console.log('OpenRouter response body:', JSON.stringify(data, null, 2));

if (!response.ok) {
  console.error('OpenRouter Error:', data);
  throw new Error(data.error?.message || `OpenRouter error: ${response.status}`);
}

  const rawText = data.choices[0].message.content.trim();
  console.log('Raw response (first 300 chars):', rawText.slice(0, 300));

  // Strip accidental ```json fences
  const clean = rawText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  return JSON.parse(clean);
}

// ── Routes ────────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ message: 'Resume Checker API (OpenRouter) ✅' });
});

app.get('/api/health', (req, res) => {
  const hasKey = !!process.env.OPENROUTER_API_KEY;
  res.json({
    status: 'OK',
    openRouterKeySet: hasKey,
    message: hasKey ? '✅ Ready to analyze resumes' : '❌ OPENROUTER_API_KEY not set in .env',
    timestamp: new Date().toISOString(),
  });
});

// File upload route
app.post('/api/evaluate', upload.single('resume'), async (req, res) => {
  console.log('\n── /api/evaluate called ──');
  console.log('Body fields:', Object.keys(req.body));
  console.log('File:', req.file ? req.file.originalname : 'NONE');
  try {
    const { jobTitle, jobDescription, requiredSkills } = req.body;
    if (!jobTitle || !jobDescription || !requiredSkills)
      return res.status(400).json({ error: 'Missing required fields: jobTitle, jobDescription, requiredSkills' });
    if (!req.file)
      return res.status(400).json({ error: 'No resume file uploaded' });
    if (!process.env.OPENROUTER_API_KEY)
      return res.status(500).json({ error: 'OPENROUTER_API_KEY not set. Add it to backend/.env' });

    const resumeText = await extractTextFromFile(req.file);
    console.log(`Extracted ${resumeText.length} characters from resume`);
    if (!resumeText || resumeText.trim().length < 30)
      return res.status(400).json({ error: 'Could not extract enough text from the file.' });

    const analysis = await analyzeResume(jobTitle, jobDescription, requiredSkills, resumeText);
    console.log('✅ Analysis complete:', analysis.matchPercentage + '%', '-', analysis.verdict);
    res.json({ success: true, fileName: req.file.originalname, fileSize: req.file.size, analysis });

  } catch (err) {
    console.error('ERROR in /api/evaluate:', err.message);
    res.status(500).json({ error: err.message || 'Analysis failed' });
  }
});

// Plain text route
app.post('/api/evaluate-text', async (req, res) => {
  console.log('\n── /api/evaluate-text called ──');
  try {
    const { jobTitle, jobDescription, requiredSkills, resumeText } = req.body;
    if (!jobTitle || !jobDescription || !requiredSkills || !resumeText)
      return res.status(400).json({ error: 'All fields required' });
    if (!process.env.OPENROUTER_API_KEY)
      return res.status(500).json({ error: 'OPENROUTER_API_KEY not set. Add it to backend/.env' });

    const analysis = await analyzeResume(jobTitle, jobDescription, requiredSkills, resumeText);
    console.log('✅ Analysis complete:', analysis.matchPercentage + '%', '-', analysis.verdict);
    res.json({ success: true, analysis });

  } catch (err) {
    console.error('ERROR in /api/evaluate-text:', err.message);
    res.status(500).json({ error: err.message || 'Analysis failed' });
  }
});

app.use((req, res) => res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` }));

app.listen(PORT, () => {
  console.log(`\n🚀 Resume Checker API running at http://localhost:${PORT}`);
  console.log(`🔑 OpenRouter API key: ${process.env.OPENROUTER_API_KEY ? '✅ Set' : '❌ NOT SET — add to .env'}`);
  console.log(`📋 Health check: http://localhost:${PORT}/api/health\n`);
});
