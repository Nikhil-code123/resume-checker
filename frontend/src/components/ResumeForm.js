import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

// ── Use full backend URL so proxy issues don't break the app ──────────────────
const API_BASE = 'https://resume-checker-rafl.onrender.com/';

const ACCEPTED = {
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'text/plain': ['.txt'],
};

function fmtSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function ResumeForm({ onResult, onLoading }) {
  const [tab, setTab] = useState('file'); // 'file' | 'text'
  const [file, setFile] = useState(null);
  const [resumeText, setResumeText] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [requiredSkills, setRequiredSkills] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onDrop = useCallback((accepted, rejected) => {
    if (rejected && rejected.length > 0) {
      setError('File rejected: ' + (rejected[0].errors?.[0]?.message || 'Invalid file'));
      return;
    }
    if (accepted[0]) {
      setFile(accepted[0]);
      setError('');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED,
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  const handleSubmit = async (e) => {
    // Prevent any form submission / page reload
    if (e && e.preventDefault) e.preventDefault();
    if (e && e.stopPropagation) e.stopPropagation();

    setError('');

    // Validation
    if (!jobTitle.trim()) { setError('Please enter the Job Title.'); return; }
    if (!jobDescription.trim()) { setError('Please enter the Job Description.'); return; }
    if (!requiredSkills.trim()) { setError('Please enter the Required Skills.'); return; }
    if (tab === 'file' && !file) { setError('Please upload a resume file.'); return; }
    if (tab === 'text' && !resumeText.trim()) { setError('Please paste your resume text.'); return; }

    setLoading(true);
    onLoading(true);

    try {
      let responseData;

      if (tab === 'file') {
        const formData = new FormData();
        formData.append('jobTitle', jobTitle.trim());
        formData.append('jobDescription', jobDescription.trim());
        formData.append('requiredSkills', requiredSkills.trim());
        formData.append('resume', file);

        const res = await fetch(`${API_BASE}/api/evaluate`, {
          method: 'POST',
          body: formData,
          // Do NOT set Content-Type header — browser sets it with boundary for multipart
        });

        const text = await res.text();
        try {
          responseData = JSON.parse(text);
        } catch {
          throw new Error('Server returned invalid response: ' + text.slice(0, 200));
        }

        if (!res.ok) {
          throw new Error(responseData.error || `Server error ${res.status}`);
        }

      } else {
        // Text mode
        const res = await fetch(`${API_BASE}/api/evaluate-text`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jobTitle: jobTitle.trim(),
            jobDescription: jobDescription.trim(),
            requiredSkills: requiredSkills.trim(),
            resumeText: resumeText.trim(),
          }),
        });

        const text = await res.text();
        try {
          responseData = JSON.parse(text);
        } catch {
          throw new Error('Server returned invalid response: ' + text.slice(0, 200));
        }

        if (!res.ok) {
          throw new Error(responseData.error || `Server error ${res.status}`);
        }
      }

      if (!responseData.success || !responseData.analysis) {
        throw new Error('Unexpected response format from server.');
      }

      onResult(responseData);

    } catch (err) {
      console.error('Analysis error:', err);
      let msg = err.message || 'Unknown error occurred';
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('ECONNREFUSED')) {
        msg = '❌ Cannot connect to backend server. Make sure it is running on http://localhost:5000 (run: cd backend && npm start)';
      }
      setError(msg);
      onLoading(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

      {/* ── Left: Job Details ───────────────────────────────────────────────── */}
      <div className="card">
        <div className="card-title"><span className="icon">💼</span> Job Details</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          <div className="form-group">
            <label>Job Title <span className="required">*</span></label>
            <input
              type="text"
              placeholder="e.g. Senior React Developer"
              value={jobTitle}
              onChange={e => setJobTitle(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Required Skills <span className="required">*</span></label>
            <input
              type="text"
              placeholder="e.g. React, Node.js, TypeScript, AWS"
              value={requiredSkills}
              onChange={e => setRequiredSkills(e.target.value)}
            />
            <span className="hint">Comma-separated list of required skills</span>
          </div>

          <div className="form-group">
            <label>Job Description <span className="required">*</span></label>
            <textarea
              rows={8}
              placeholder="Paste the full job description here..."
              value={jobDescription}
              onChange={e => setJobDescription(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* ── Right: Resume ───────────────────────────────────────────────────── */}
      <div className="card">
        <div className="card-title"><span className="icon">📄</span> Candidate Resume</div>

        <div className="tabs">
          <button
            type="button"
            className={`tab ${tab === 'file' ? 'active' : ''}`}
            onClick={() => setTab('file')}
          >
            📎 Upload File
          </button>
          <button
            type="button"
            className={`tab ${tab === 'text' ? 'active' : ''}`}
            onClick={() => setTab('text')}
          >
            ✏️ Paste Text
          </button>
        </div>

        {tab === 'file' ? (
          <div>
            <div className={`dropzone ${isDragActive ? 'active' : ''}`} {...getRootProps()}>
              <input {...getInputProps()} />
              <div className="dropzone-icon">📤</div>
              <h4>{isDragActive ? 'Drop it here!' : 'Drag & drop your resume'}</h4>
              <p>or click to browse · PDF, DOC, DOCX, TXT · max 10 MB</p>
            </div>

            {file && (
              <div className="file-info">
                <span className="file-info-icon">📃</span>
                <div>
                  <div className="file-info-name">{file.name}</div>
                  <div className="file-info-size">{fmtSize(file.size)}</div>
                </div>
                <button
                  type="button"
                  className="file-remove"
                  onClick={() => setFile(null)}
                  title="Remove file"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        ) : (
          <textarea
            rows={12}
            placeholder="Paste the full resume text here..."
            value={resumeText}
            onChange={e => setResumeText(e.target.value)}
            style={{ width: '100%' }}
          />
        )}

        {error && (
          <div className="error-box">
            <span>⚠️</span>
            <span style={{ flex: 1 }}>{error}</span>
          </div>
        )}

        <button
          type="button"
          className="btn-primary"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <>
              <div style={{
                width: 18, height: 18,
                border: '2px solid rgba(255,255,255,0.4)',
                borderTopColor: 'white',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                flexShrink: 0,
              }} />
              Analyzing Resume...
            </>
          ) : (
            <>🔍 Analyze Resume</>
          )}
        </button>
      </div>
    </div>
  );
}
