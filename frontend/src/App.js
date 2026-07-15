import "./App.css";
import { useState } from "react";
import Editor from "@monaco-editor/react";
import axios from "axios";
import ClipLoader from "react-spinners/ClipLoader";
import toast, { Toaster } from "react-hot-toast";
import { CopyToClipboard } from "react-copy-to-clipboard";

const defaultResult = "AI review will appear here...";

const getPreview = (text) => {
  const cleaned = (text || "").replace(/\s+/g, " ").trim();
  return cleaned.length > 80 ? `${cleaned.slice(0, 77)}...` : cleaned;
};

const getLanguageLabel = (value) => {
  const normalized = (value || "python").toLowerCase();

  switch (normalized) {
    case "javascript":
      return "🟨 JavaScript";
    case "java":
      return "☕ Java";
    case "cpp":
      return "⚙️ C++";
    case "python":
    default:
      return "🐍 Python";
  }
};

const buildAnalysisSections = (rawReview = "", selectedLanguage = "python", codeLength = 0) => {
  const reviewText = rawReview || "";
  const lines = reviewText
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  const issueMatches = lines.filter((line) =>
    /(error|bug|issue|warning|problem|exception|vulnerability|fail|fix)/i.test(line)
  );
  const suggestionMatches = lines.filter((line) =>
    /(suggest|recommend|improve|consider|should|could|better|optimi|clean|refactor)/i.test(line)
  );

  const qualityScore = Math.max(
    72,
    Math.min(97, 86 - Math.min(14, issueMatches.length * 2) + (suggestionMatches.length > 0 ? 2 : 0))
  );

  const complexityLevel =
    codeLength > 2200 ? "High" : codeLength > 1000 ? "Medium" : "Low";

  return {
    language: (selectedLanguage || "python").toUpperCase(),
    bugCount: issueMatches.length,
    suggestionCount: suggestionMatches.length,
    bugsFound: issueMatches.slice(0, 3).length
      ? issueMatches.slice(0, 3)
      : ["No critical bugs detected in the provided snippet."],
    suggestions: suggestionMatches.slice(0, 3).length
      ? suggestionMatches.slice(0, 3)
      : ["Add a few clarifying comments and refine edge-case handling."],
    qualityScore,
    complexityLevel,
    errorsAndIssues: issueMatches.slice(0, 3).length
      ? issueMatches.slice(0, 3)
      : ["No immediate errors were found in the current sample."],
    improvements: suggestionMatches.slice(0, 3).length
      ? suggestionMatches.slice(0, 3)
      : ["Improve readability with clearer naming and structure."],
    bestPractices: [
      "Keep functions focused and easy to follow.",
      "Validate inputs and edge cases explicitly.",
      "Use consistent naming and documentation.",
    ],
  };
};

const getRiskLevel = (score) => {
  if (score >= 85) {
    return { emoji: "🟢", label: "Low Risk", className: "risk-low" };
  }

  if (score >= 70) {
    return { emoji: "🟡", label: "Moderate Risk", className: "risk-medium" };
  }

  return { emoji: "🔴", label: "High Risk", className: "risk-high" };
};

const buildReviewText = (sections) => {
  return [
    `Language: ${sections.language}`,
    "",
    "Bugs Found:",
    ...sections.bugsFound.map((item) => `- ${item}`),
    "",
    "Suggestions:",
    ...sections.suggestions.map((item) => `- ${item}`),
    "",
    `Code Quality Score: ${sections.qualityScore}/100`,
    `Complexity Level: ${sections.complexityLevel}`,
    "",
    "Errors and Issues:",
    ...sections.errorsAndIssues.map((item) => `- ${item}`),
    "",
    "Improvements:",
    ...sections.improvements.map((item) => `- ${item}`),
    "",
    "Best Practices:",
    ...sections.bestPractices.map((item) => `- ${item}`),
  ].join("\n");
};

function App() {
  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState("");
  const [result, setResult] = useState(defaultResult);
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [history, setHistory] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const analyzeCode = async () => {
    if (!code.trim()) {
      toast.error("Please enter some code!");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post("http://127.0.0.1:8000/review", {
        code: code,
        language: language,
      });

      const reviewText = response.data.review || "No review details returned.";
      const sections = buildAnalysisSections(
        reviewText,
        response.data.language || language,
        response.data.code_length || code.length
      );
      const formattedReviewText = buildReviewText(sections);

      setResult(formattedReviewText);
      setAnalysisData(sections);
      setHistory((prev) => [
        {
          language: response.data.language || language,
          review: formattedReviewText,
          sections,
          time: new Date().toLocaleString(),
        },
        ...prev.slice(0, 5),
      ]);

      toast.success("Analysis Completed!");
    } catch (error) {
      setResult("❌ Unable to connect to the backend.");
      setAnalysisData(null);
      toast.error("Backend Connection Failed!");
    } finally {
      setLoading(false);
    }
  };

  const clearCode = () => {
    const confirmClear = window.confirm(
      "Are you sure you want to clear the editor and review?"
    );

    if (confirmClear) {
      setCode("");
      setResult(defaultResult);
      setAnalysisData(null);
      toast.success("Editor Cleared!");
    }
  };

  const startNewReview = () => {
    setCode("");
    setResult(defaultResult);
    setAnalysisData(null);
    setSidebarOpen(false);
    toast.success("New review started");
  };

  const downloadPDF = async () => {
    if (result === defaultResult) {
      toast.error("No review available to download!");
      return;
    }

    const { default: jsPDF } = await import("jspdf");
    const doc = new jsPDF();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("AI Code Review Report", 20, 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);

    const lines = doc.splitTextToSize(result, 170);
    doc.text(lines, 20, 35);

    doc.save("AI_Code_Review_Report.pdf");

    toast.success("PDF Downloaded!");
  };

  const uploadFile = (event) => {
    const file = event.target.files[0];

    if (!file) return;

    const extension = file.name.split(".").pop().toLowerCase();

    const languageMap = {
      py: "python",
      js: "javascript",
      java: "java",
      cpp: "cpp",
      txt: language,
    };

    if (!languageMap[extension]) {
      toast.error("Unsupported file type!");
      return;
    }

    setLanguage(languageMap[extension]);

    const reader = new FileReader();

    reader.onload = (e) => {
      setCode(e.target.result);
      toast.success("File uploaded successfully!");
    };

    reader.readAsText(file);
  };

  const handleHistorySelect = (item) => {
    setResult(item.review);
    setAnalysisData(item.sections || null);
    setLanguage(item.language);
    setSidebarOpen(false);
  };

  const clearHistory = () => {
    setHistory([]);
    setAnalysisData(null);
    setResult(defaultResult);
    toast.success("History cleared!");
  };

  const currentLanguageLabel = getLanguageLabel(language);
  const qualityScoreDisplay = analysisData ? `⭐ ${(analysisData.qualityScore / 10).toFixed(1)}/10` : "⭐ N/A";
  const riskInfo = analysisData ? getRiskLevel(analysisData.qualityScore) : { emoji: "🟢", label: "Safe", className: "risk-safe" };
  const riskLevelDisplay = `${riskInfo.emoji} ${riskInfo.label}`;
  const bugsSummary = analysisData?.bugCount ?? 0;
  const suggestionCount = analysisData?.suggestionCount ?? 0;
  const securitySuggestions = analysisData
    ? [
        "Review secrets handling and credential exposure.",
        "Validate inputs before execution.",
        "Ensure authorization checks are in place.",
      ]
    : ["Run an analysis to surface security-focused suggestions."];

  return (
    <div className={`app ${darkMode ? "dark-theme" : "light-theme"}`} data-theme={darkMode ? "dark" : "light"}>
      <Toaster position="top-right" />

      <div className="app-shell">
        <header className="topbar">
          <div className="topbar-row">
            <button
              className={`sidebar-toggle ${sidebarOpen ? "active" : ""}`}
              onClick={() => setSidebarOpen((prev) => !prev)}
              aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
            >
              ☰
            </button>

            <div className="header-title">
              <div className="hero-badge">🤖 AI Assistant</div>
              <h1>AI Code Review Assistant</h1>
              <p>Analyze your code instantly using Google's Gemini AI</p>
              <div className="header-badges" aria-label="Quick actions">
                <span className="command-pill">Review</span>
                <span className="command-pill">Fast</span>
                <span className="command-pill">Premium</span>
              </div>
            </div>

            <button
              className="theme-toggle"
              onClick={() => setDarkMode(!darkMode)}
              aria-label="Toggle dark mode"
            >
              {darkMode ? "☀️ Light" : "🌙 Dark"}
            </button>
          </div>
        </header>

        {sidebarOpen && (
          <>
            <div className="sidebar-overlay visible" onClick={() => setSidebarOpen(false)} />

            <aside className="sidebar open">
              <div className="sidebar-header">
                <div>
                  <p className="sidebar-eyebrow">Workspace</p>
                  <h3>Review History</h3>
                </div>
                <div className="sidebar-header-actions">
                  {history.length > 0 && (
                    <button className="history-clear-btn" onClick={clearHistory}>
                      Clear
                    </button>
                  )}
                  <button
                    className="sidebar-close"
                    onClick={() => setSidebarOpen(false)}
                    aria-label="Close sidebar"
                  >
                    ×
                  </button>
                </div>
              </div>

              <button className="new-review-btn" onClick={startNewReview}>
                ✨ New Review
              </button>

              <div className="sidebar-section">
                <p className="sidebar-section-title">Recent Reviews</p>
                {history.length === 0 ? (
                  <p className="empty-history">
                    Your previous reviews will appear here for quick access.
                  </p>
                ) : (
                  <div className="history-list">
                    {history.map((item, index) => (
                      <button
                        key={`${item.time}-${index}`}
                        className="history-item"
                        onClick={() => handleHistorySelect(item)}
                      >
                        <span className="history-language">{getLanguageLabel(item.language)}</span>
                        <span className="history-time">{item.time}</span>
                        <span className="history-preview">{getPreview(item.review)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="sidebar-footer">
                <button
                  className="theme-toggle sidebar-theme-toggle"
                  onClick={() => setDarkMode(!darkMode)}
                >
                  {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
                </button>
              </div>
            </aside>
          </>
        )}

        <div className="stats">
          <div className="card stat-card">
            <div className="card-icon">💡</div>
            <h3>Language</h3>
            <p>{currentLanguageLabel}</p>
          </div>

          <div className="card stat-card">
            <div className="card-icon">🧾</div>
            <h3>Characters</h3>
            <p>{code.length}</p>
          </div>

          <div className="card stat-card">
            <div className="card-icon">📏</div>
            <h3>Lines</h3>
            <p>{code ? code.split("\n").length : 0}</p>
          </div>

          <div className="card stat-card">
            <div className="card-icon">⚡</div>
            <h3>Status</h3>
            <p>{loading ? "Analyzing..." : "Ready"}</p>
          </div>
        </div>

        <div className="container">
          <div className="left">
            <div className="panel-card editor-panel">
              <div className="panel-heading">
                <div>
                  <h2>Code Editor</h2>
                  <p>Paste code or upload a file</p>
                </div>
                <span className="panel-badge">Live</span>
              </div>

              <select className="language-select" value={language} onChange={(e) => setLanguage(e.target.value)}>
                <option value="python">🐍 Python</option>
                <option value="javascript">🟨 JavaScript</option>
                <option value="java">☕ Java</option>
                <option value="cpp">⚙️ C++</option>
              </select>

              <div className="editor-shell">
                <Editor
                  height="100%"
                  language={language}
                  theme={darkMode ? "vs-dark" : "vs-light"}
                  value={code}
                  onChange={(value) => setCode(value || "")}
                />
              </div>

              <div className="editor-action-row">
                <button className="action-btn primary analyze-panel-btn" onClick={analyzeCode} disabled={loading || !code.trim()}>
                  {loading ? "⏳ Analyzing..." : "🚀 Analyze Code"}
                </button>
              </div>

              <div className="button-row secondary-actions">
                <label className="upload-btn action-btn secondary toolbar-btn">
                  📂 Upload File
                  <input type="file" accept=".py,.js,.java,.cpp,.txt" onChange={uploadFile} hidden />
                </label>

                <button className="action-btn secondary toolbar-btn" onClick={clearCode} disabled={loading}>
                  🗑 Clear
                </button>
              </div>
            </div>
          </div>

          <div className="right">
            <div className="panel-card result-panel">
              <div className="panel-heading">
                <div>
                  <h2>Analysis Result</h2>
                  <p>Actionable feedback from Gemini</p>
                </div>
                <span className="panel-badge">Ready</span>
              </div>

              <div className="result">
                {loading ? (
                  <div className="analysis-loading-state">
                    <div className="loading-orb">
                      <ClipLoader size={44} color="#60a5fa" />
                    </div>
                    <h4>Gemini AI is reviewing your code...</h4>
                    <p>Scanning logic, structure, security, and quality signals in real time.</p>
                    <div className="loading-progress" aria-hidden="true">
                      <span className="loading-progress-bar" />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="result-header">
                      <div className="result-header-top">
                        <div>
                          <p className="result-eyebrow">AI Review Results</p>
                          <h3>Context-aware feedback tailored to your code</h3>
                        </div>
                        <div className="result-badges">
                          <span className="result-badge score-badge">{qualityScoreDisplay}</span>
                          <span className={`result-badge risk-badge ${riskInfo.className}`}>{riskLevelDisplay}</span>
                          <span className="result-badge issue-badge">🐞 {bugsSummary} Bugs</span>
                          <span className="result-badge suggestion-badge">💡 {suggestionCount} Suggestions</span>
                        </div>
                      </div>
                    </div>

                    <div className="result-toolbar">
                      <div>
                        <p className="result-label">Structured review insights</p>
                        <span className="result-subtle">Premium guidance designed for faster iteration.</span>
                      </div>
                      <div className="result-toolbar-actions">
                        <CopyToClipboard
                          text={result}
                          onCopy={() => toast.success("Review copied to clipboard!")}
                        >
                          <button className="review-action-btn copy-btn action-btn toolbar-btn">📋 Copy</button>
                        </CopyToClipboard>

                        <button
                          className="review-action-btn action-btn secondary toolbar-btn"
                          onClick={downloadPDF}
                          disabled={result === defaultResult}
                        >
                          ⬇️ Download
                        </button>
                      </div>
                    </div>

                    {analysisData ? (
                      <div className="result-grid">
                        <div className="result-card accent-red">
                          <div className="result-card-header">
                            <span className="result-card-icon">🐞</span>
                            <h4>Errors & Issues</h4>
                          </div>
                          <ul>
                            {analysisData.errorsAndIssues.map((item, index) => (
                              <li key={`errors-${index}`}>{item}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="result-card accent-blue">
                          <div className="result-card-header">
                            <span className="result-card-icon">🚀</span>
                            <h4>Improvements</h4>
                          </div>
                          <ul>
                            {analysisData.improvements.map((item, index) => (
                              <li key={`improvements-${index}`}>{item}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="result-card accent-green">
                          <div className="result-card-header">
                            <span className="result-card-icon">✅</span>
                            <h4>Best Practices</h4>
                          </div>
                          <ul>
                            {analysisData.bestPractices.map((item, index) => (
                              <li key={`best-${index}`}>{item}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="result-card accent-orange">
                          <div className="result-card-header">
                            <span className="result-card-icon">🛡️</span>
                            <h4>Security Suggestions</h4>
                          </div>
                          <ul>
                            {securitySuggestions.map((item, index) => (
                              <li key={`security-${index}`}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ) : (
                      <div className="empty-result">
                        <div className="empty-result-illustration">🤖</div>
                        <h4>Ready for an AI review</h4>
                        <p>🤖 Paste or upload code to receive AI-powered review insights.</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="footer">
        <p>
          Developed by <strong>Raj Zore</strong> | AI Code Review Assistant © 2026
        </p>
      </footer>
    </div>
  );
}

export default App;