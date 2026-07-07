import "./App.css";
import { useState } from "react";
import Editor from "@monaco-editor/react";
import axios from "axios";
import ClipLoader from "react-spinners/ClipLoader";
import toast, { Toaster } from "react-hot-toast";
import { CopyToClipboard } from "react-copy-to-clipboard";
import jsPDF from "jspdf";

function App() {
  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState("");
  const [result, setResult] = useState("AI review will appear here...");
  const [loading, setLoading] = useState(false);

  // Analyze Code
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

      setResult(
        `Language: ${response.data.language}

Review:
${response.data.review}

Code Length: ${response.data.code_length} characters`
      );

      toast.success("Analysis Completed!");
    } catch (error) {
      setResult("❌ Unable to connect to the backend.");
      toast.error("Backend Connection Failed!");
    } finally {
      setLoading(false);
    }
  };

  // Clear Code
  const clearCode = () => {
    setCode("");
    setResult("AI review will appear here...");
    toast.success("Editor Cleared!");
  };

  // Download PDF
  const downloadPDF = () => {
    if (result === "AI review will appear here...") {
      toast.error("No review available to download!");
      return;
    }

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

  // Upload File
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

  return (
    <div className="app">
      <Toaster position="top-right" />

      <header>
        <h1>🤖 AI Code Review Assistant</h1>
        <p>Analyze your code instantly using Google's Gemini AI</p>
      </header>

      <div className="stats">
        <div className="card">
          <h3>Language</h3>
          <p>{language.toUpperCase()}</p>
        </div>

        <div className="card">
          <h3>Characters</h3>
          <p>{code.length}</p>
        </div>

        <div className="card">
          <h3>Status</h3>
          <p>{loading ? "Analyzing..." : "Ready ✅"}</p>
        </div>
      </div>

      <div className="container">
        <div className="left">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
          </select>

          <Editor
            height="500px"
            language={language}
            theme="vs-dark"
            value={code}
            onChange={(value) => setCode(value || "")}
          />

          <label className="upload-btn">
            📂 Upload File
              <input
                type="file"
                accept=".py,.js,.java,.cpp,.txt"
                onChange={uploadFile}
                hidden
              />
            </label>

          <div className="button-group">
            <button onClick={analyzeCode} disabled={loading}>
              {loading ? "Analyzing..." : "Analyze Code"}
            </button>

            <button
              onClick={clearCode}
              className="clear-btn"
              disabled={loading}
            >
              🗑 Clear
            </button>

            <button
              onClick={downloadPDF}
              className="pdf-btn"
              disabled={loading}
            >
              📄 Download PDF
            </button>

            
          </div>
        </div>

        

        <div className="right">
          <h2>Analysis Result</h2>

          {loading && (
            <div
              style={{
                textAlign: "center",
                marginBottom: "20px",
              }}
            >
              <ClipLoader size={45} color="#00e5ff" />
            </div>
          )}

          <div className="result">
            <CopyToClipboard
              text={result}
              onCopy={() => toast.success("Review copied to clipboard!")}
            >
              <button className="copy-btn">
                📋 Copy Review
              </button>
            </CopyToClipboard>

            <pre>{result}</pre>
          </div>
        </div>
      </div>

      <footer className="footer">
        <p>Developed by <strong>Raj Zore</strong> | AI Code Review Assistant © 2026</p>
      </footer>
    </div>
  );
}

export default App;