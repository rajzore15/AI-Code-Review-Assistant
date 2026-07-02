import "./App.css";
import { useState } from "react";
import Editor from "@monaco-editor/react";
import axios from "axios";

function App() {
  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState("");
  const [result, setResult] = useState("AI review will appear here...");

  const analyzeCode = async () => {
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
    } catch (error) {
      setResult("❌ Unable to connect to the backend.");
    }
  };

  return (
    <div className="app">
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

          <button onClick={analyzeCode}>
            Analyze Code
          </button>

        </div>

        <div className="right">

          <h2>Analysis Result</h2>

          <div className="result">
            <pre>{result}</pre>
          </div>

        </div>

      </div>
    </div>
  );
}

export default App;