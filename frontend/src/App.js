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

  return (
    <div className="app">
      <Toaster position="top-right" />

      <header>
        <h1>🤖 AI Code Review Assistant</h1>
      </header>

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
    </div>
  );
}

export default App;