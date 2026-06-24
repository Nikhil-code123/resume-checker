import React from 'react';

function getVerdictClass(verdict) {
  if (!verdict) return '';
  const v = verdict.toLowerCase();
  if (v.includes('strong')) return 'verdict-strong';
  if (v.includes('moderate')) return 'verdict-moderate';
  return 'verdict-weak';
}

function getScoreColor(score) {
  if (score >= 80) return '#10b981';
  if (score >= 50) return '#f59e0b';
  return '#ef4444';
}

function getScoreBg(score) {
  if (score >= 80) return '#ecfdf5';
  if (score >= 50) return '#fffbeb';
  return '#fef2f2';
}

function ScoreCircle({ score }) {
  const color = getScoreColor(score);
  const bg = getScoreBg(score);
  const r = 60;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <div style={{ position: 'relative', width: 160, height: 160 }}>
      <svg width="160" height="160" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="80" cy="80" r={r} fill={bg} stroke="#e5e7eb" strokeWidth="10" />
        <circle cx="80" cy="80" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: '2rem', fontWeight: 800, color, lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#9ca3af', marginTop: 2 }}>/ 100</span>
      </div>
    </div>
  );
}

export default function ResultsPanel({ data, onReset }) {
  const { analysis, fileName } = data;
  const score = Math.round(analysis.matchPercentage);
  const color = getScoreColor(score);

  return (
    <div>
      <div className="results-header">
        <div>
          <div className="results-title">📊 Analysis Results</div>
          {fileName && <div style={{ fontSize: '0.83rem', color: '#9ca3af', marginTop: 3 }}>for <b style={{ color: '#4b5563' }}>{fileName}</b></div>}
        </div>
        <button className="btn-secondary" onClick={onReset}>← New Analysis</button>
      </div>

      {/* Score + Meta */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="score-section">
          <div className="score-circle-wrap">
            <ScoreCircle score={score} />
            <span className={`verdict-badge ${getVerdictClass(analysis.verdict)}`}>{analysis.verdict}</span>
          </div>
          <div className="score-meta">
            <div className="meta-item">
              <span className="meta-label">Overall Summary</span>
              <p className="summary-text">{analysis.overallSummary}</p>
            </div>
            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
              <div className="meta-item">
                <span className="meta-label">Experience Match</span>
                <span className="meta-value">{analysis.experienceMatch}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Education Match</span>
                <span className="meta-value">{analysis.educationMatch}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Skills Analysis */}
      {analysis.skillsAnalysis && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-title"><span className="icon">🎯</span> Skills Breakdown</div>
          <div className="skills-grid">
            <div className="skill-group" style={{ background: '#ecfdf5' }}>
              <div className="skill-group-title" style={{ color: '#065f46' }}>✅ Matched ({(analysis.skillsAnalysis.matched || []).length})</div>
              {(analysis.skillsAnalysis.matched || []).map((s, i) => (
                <span key={i} className="skill-tag" style={{ background: '#d1fae5', color: '#065f46' }}>{s}</span>
              ))}
              {!(analysis.skillsAnalysis.matched || []).length && <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>None</span>}
            </div>
            <div className="skill-group" style={{ background: '#fffbeb' }}>
              <div className="skill-group-title" style={{ color: '#92400e' }}>⚡ Partial ({(analysis.skillsAnalysis.partial || []).length})</div>
              {(analysis.skillsAnalysis.partial || []).map((s, i) => (
                <span key={i} className="skill-tag" style={{ background: '#fde68a', color: '#92400e' }}>{s}</span>
              ))}
              {!(analysis.skillsAnalysis.partial || []).length && <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>None</span>}
            </div>
            <div className="skill-group" style={{ background: '#fef2f2' }}>
              <div className="skill-group-title" style={{ color: '#991b1b' }}>❌ Missing ({(analysis.skillsAnalysis.missing || []).length})</div>
              {(analysis.skillsAnalysis.missing || []).map((s, i) => (
                <span key={i} className="skill-tag" style={{ background: '#fecaca', color: '#991b1b' }}>{s}</span>
              ))}
              {!(analysis.skillsAnalysis.missing || []).length && <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>None</span>}
            </div>
          </div>
        </div>
      )}

      {/* Strengths & Missing */}
      <div className="result-lists">
        <div className="card result-list" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
          <div className="result-list-title" style={{ color: '#065f46' }}>💪 Strengths</div>
          <ul>
            {(analysis.strengths || []).map((s, i) => (
              <li key={i} style={{ '--dot-color': '#10b981' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', flexShrink: 0, marginTop: 6 }} />
                {s}
              </li>
            ))}
          </ul>
        </div>
        <div className="card result-list" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
          <div className="result-list-title" style={{ color: '#991b1b' }}>⚠️ Areas to Improve</div>
          <ul>
            {(analysis.missingSkills || []).map((s, i) => (
              <li key={i}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', flexShrink: 0, marginTop: 6 }} />
                {s}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Recommendations */}
      {analysis.recommendations?.length > 0 && (
        <div className="card" style={{ background: '#eef2ff', border: '1px solid #c7d2fe' }}>
          <div className="card-title" style={{ color: '#3730a3' }}><span className="icon">💡</span> Recommendations for Candidate</div>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {analysis.recommendations.map((r, i) => (
              <li key={i} style={{ display: 'flex', gap: 10, fontSize: '0.88rem', color: '#3730a3', alignItems: 'flex-start', lineHeight: 1.5 }}>
                <span style={{ background: '#6366f1', color: 'white', width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>{i + 1}</span>
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
