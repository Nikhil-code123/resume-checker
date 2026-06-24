import React, { useState } from 'react';
import ResumeForm from './components/ResumeForm';
import ResultsPanel from './components/ResultsPanel';

export default function App() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleReset = () => {
    setResult(null);
    setLoading(false);
  };

  return (
    <div className="app">
      {/* Header — use button/span, NOT <a href="/"> which causes full page refresh */}
      <header className="header">
        <div className="header-inner">
          <span className="logo" onClick={handleReset} style={{ cursor: 'pointer' }}>
            <div className="logo-icon">🤖</div>
            ResumeAI Checker
          </span>
          <span className="badge">AI POWERED</span>
        </div>
      </header>

      {/* Hero */}
      {!result && !loading && (
        <section className="hero">
          <div className="hero-tag">✨ Powered by Claude AI</div>
          <h1>Automated <span>Resume Relevance</span><br />Check System</h1>
          <p>Upload a resume and job description. Get instant AI-powered analysis with match score, skill breakdown, strengths, and actionable recommendations.</p>
          <div className="hero-stats">
            <div className="stat"><span className="stat-dot" /> AI-Powered Analysis</div>
            <div className="stat"><span className="stat-dot" /> PDF, DOC, TXT Support</div>
            <div className="stat"><span className="stat-dot" /> Instant Results</div>
          </div>
        </section>
      )}

      {/* Main */}
      <main className="main">
        {loading && !result && (
          <div className="card loading-overlay">
            <div className="spinner" />
            <h3>Analyzing Resume...</h3>
            <p>Claude AI is carefully evaluating the resume against the job requirements. This may take a few seconds.</p>
          </div>
        )}

        {!loading && !result && (
          <ResumeForm
            onResult={(data) => {
              setLoading(false);
              setResult(data);
            }}
            onLoading={setLoading}
          />
        )}

        {result && (
          <ResultsPanel data={result} onReset={handleReset} />
        )}
      </main>

      {/* Footer */}
      <footer className="footer">
        <p>Built with ❤️ using React + Node.js + Claude AI · Automated Resume Relevance Check System</p>
      </footer>
    </div>
  );
}
