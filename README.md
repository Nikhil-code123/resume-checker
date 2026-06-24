# 🤖 Automated Resume Relevance Check System

AI-powered resume analyzer built with **React** (frontend) + **Node.js/Express** (backend) + **Claude AI** (Anthropic).

## Features

- Upload PDF, DOC, DOCX, or TXT resumes — or paste text directly
- AI analysis: match percentage, verdict, strengths, missing skills, recommendations
- Skill-by-skill breakdown (matched / partial / missing)
- Experience & education match ratings
- Clean, responsive UI

## Project Structure

```
resume-checker/
├── backend/          ← Node.js + Express API
│   ├── server.js
│   ├── package.json
│   └── .env.example
└── frontend/         ← React app
    ├── src/
    │   ├── App.js
    │   ├── components/
    │   │   ├── ResumeForm.js
    │   │   └── ResultsPanel.js
    │   └── index.css
    └── package.json
```

## Quick Start

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY
npm run dev        # or: npm start
```

Backend runs at **http://localhost:5000**

### 2. Frontend

```bash
cd frontend
npm install
npm start
```

Frontend runs at **http://localhost:3000** and proxies `/api/*` to the backend.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/evaluate` | Evaluate with file upload |
| POST | `/api/evaluate-text` | Evaluate with pasted text |

### POST `/api/evaluate` (multipart/form-data)
| Field | Type | Description |
|-------|------|-------------|
| `jobTitle` | string | Job title |
| `jobDescription` | string | Full job description |
| `requiredSkills` | string | Comma-separated skills |
| `resume` | file | PDF / DOC / DOCX / TXT |

### POST `/api/evaluate-text` (application/json)
```json
{
  "jobTitle": "Senior React Developer",
  "jobDescription": "We are looking for...",
  "requiredSkills": "React, Node.js, TypeScript",
  "resumeText": "John Doe\n5 years experience..."
}
```

### Response
```json
{
  "success": true,
  "fileName": "resume.pdf",
  "analysis": {
    "matchPercentage": 85,
    "verdict": "Strong Match",
    "overallSummary": "...",
    "strengths": ["...", "..."],
    "missingSkills": ["...", "..."],
    "recommendations": ["...", "..."],
    "skillsAnalysis": {
      "matched": ["React", "Node.js"],
      "partial": ["TypeScript"],
      "missing": []
    },
    "experienceMatch": "Excellent",
    "educationMatch": "Good"
  }
}
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | ✅ Yes | Your Anthropic API key |
| `PORT` | No | Backend port (default: 5000) |
| `NODE_ENV` | No | `development` or `production` |

Get your API key at: https://console.anthropic.com

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, react-dropzone |
| Backend | Node.js, Express 4 |
| AI | Anthropic Claude (claude-sonnet-4-6) |
| File Parsing | pdf-parse, mammoth |
| CORS | cors middleware |
| Rate Limiting | express-rate-limit |
