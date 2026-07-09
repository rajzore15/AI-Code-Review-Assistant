import "./App.css";
import { useState } from "react";
import Editor from "@monaco-editor/react";
import axios from "axios";
import ClipLoader from "react-spinners/ClipLoader";
import toast, { Toaster } from "react-hot-toast";
import { CopyToClipboard } from "react-copy-to-clipboard";

function App() {
  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState("");
  const [result, setResult] = useState("AI review will appear here...");
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [history, setHistory] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const getPreview = (text) => {
    const cleaned = (text || "").replace(/\s+/g, " ").trim();
    return cleaned.length > 80 ? `${cleaned.slice(0, 77)}...` : cleaned;
  };

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

      const reviewText = `Language: ${response.data.language}

Review:
${response.data.review}

Code Length: ${response.data.code_length} characters`;

      setResult(reviewText);
      setHistory((prev) => [
        {
          language: response.data.language,
          review: reviewText,
          time: new Date().toLocaleString(),
        },
        ...prev.slice(0, 5),
      ]);

      toast.success("Analysis Completed!");
    } catch (error) {
      setResult("❌ Unable to connect to the backend.");
      toast.error("Backend Connection Failed!");
    } finally {
      setLoading(false);
    }
  };

  const clearCode = () => {
    setCode("");
    setResult("AI review will appear here...");
    toast.success("Editor Cleared!");
  };

  const downloadPDF = async () => {
    if (result === "AI review will appear here...") {
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
    setLanguage(item.language);
    setSidebarOpen(false);
  };

  const clearHistory = () => {
    setHistory([]);
    toast.success("History cleared!");
  };

  return (
    <div className="app" data-theme={darkMode ? "dark" : "light"}>
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
              <h1>🤖 AI Code Review Assistant</h1>
              <p>Analyze your code instantly using Google's Gemini AI</p>
            </div>

            <div className="command-bar" aria-label="Quick actions">
              <span className="command-pill">⌘ Review</span>
              <span className="command-pill">⚡ Fast</span>
              <span className="command-pill">✨ Premium</span>
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
            <div
              className="sidebar-overlay visible"
              onClick={() => setSidebarOpen(false)}
            />

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
                      <span className="history-language">{item.language.toUpperCase()}</span>
                      <span className="history-time">{item.time}</span>
                      <span className="history-preview">{getPreview(item.review)}</span>
                    </button>
                  ))}
                </div>
              )}
            </aside>
          </>
        )}

        <div className="stats">
          <div className="card">
            <div className="card-icon">💡</div>
            <h3>Language</h3>
            <p>{language.toUpperCase()}</p>
          </div>

          <div className="card">
            <div className="card-icon">🧾</div>
            <h3>Characters</h3>
            <p>{code.length}</p>
          </div>

          <div className="card">
            <div className="card-icon">⚡</div>
            <h3>Status</h3>
            <p>{loading ? "Analyzing..." : "Ready ✅"}</p>
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

              <select value={language} onChange={(e) => setLanguage(e.target.value)}>
                <option value="python">Python</option>
                <option value="javascript">JavaScript</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
              </select>

              <div className="editor-shell">
                <Editor
                  height="500px"
                  language={language}
                  theme="vs-dark"
                  value={code}
                  onChange={(value) => setCode(value || "")}
                />
              </div>

              <label className="upload-btn action-btn">
                📂 Upload File
                <input
                  type="file"
                  accept=".py,.js,.java,.cpp,.txt"
                  onChange={uploadFile}
                  hidden
                />
              </label>

              <div className="button-group">
                <button className="action-btn primary" onClick={analyzeCode} disabled={loading}>
                  {loading ? "Analyzing..." : "Analyze Code"}
                </button>

                <button className="action-btn secondary" onClick={clearCode} disabled={loading}>
                  🗑 Clear
                </button>

                <button className="action-btn accent" onClick={downloadPDF} disabled={loading}>
                  📄 Download PDF
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
                <span className="panel-badge">Live</span>
              </div>

              {loading && (
                <div className="loader">
                  <ClipLoader size={45} color="#60a5fa" />
                </div>
              )}

              <div className="result">
                <CopyToClipboard
                  text={result}
                  onCopy={() => toast.success("Review copied to clipboard!")}
                >
                  <button className="copy-btn action-btn">📋 Copy Review</button>
                </CopyToClipboard>

                <pre>{result}</pre>
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