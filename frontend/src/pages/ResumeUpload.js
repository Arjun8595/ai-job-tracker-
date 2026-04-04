import { useState } from "react";
import { useNavigate } from "react-router-dom";

function ResumeUpload({ setHasResume }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected && (
      selected.type === "application/pdf" ||
      selected.type === "text/plain" ||
      selected.name.endsWith(".pdf") ||
      selected.name.endsWith(".txt")
    )) {
      setFile(selected);
      setError("");
    } else {
      setError("❌ Please upload only PDF or TXT files.");
    }
  };

  const handleUpload = async () => {
    if (!file) return setError("❌ Please select a file first.");
    setUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("resume", file);

    try {
      const res = await fetch("https://ai-job-tracker-95.onrender.com/resume/upload", {
        method: "POST",
        body: formData,
      });

      console.log("Response status:", res.status);
      const data = await res.json();
      console.log("Response data:", data);

      if (data.success) {
        localStorage.setItem("resume", JSON.stringify({
          text: data.text,
          filename: file.name
        }));
        if (setHasResume) setHasResume(true);
        navigate("/jobs");
      } else {
        setError("❌ Upload failed: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Upload error:", err);
      setError("❌ Server error: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#0f1117",
      display: "flex", alignItems: "center",
      justifyContent: "center", padding: "16px"
    }}>
      <div style={{
        background: "#161b27", border: "1px solid #1e2535",
        borderRadius: "16px", padding: "40px 32px",
        width: "100%", maxWidth: "460px"
      }}>
        <h2 style={{
          color: "#38bdf8", fontFamily: "sans-serif",
          marginBottom: "8px", textAlign: "center", fontSize: "24px"
        }}>
          📄 Upload Resume
        </h2>
        <p style={{
          color: "#64748b", fontSize: "14px",
          marginBottom: "28px", textAlign: "center"
        }}>
          AI will analyze your resume and match you with the best jobs.
        </p>

        {/* Upload Box */}
        <div
          onClick={() => document.getElementById("fileInput").click()}
          style={{
            border: "2px dashed",
            borderColor: file ? "#0ea5e9" : "#1e2535",
            borderRadius: "12px", padding: "40px",
            textAlign: "center", marginBottom: "20px",
            background: file ? "#0ea5e910" : "transparent",
            cursor: "pointer",
          }}
        >
          <p style={{ fontSize: "40px", margin: "0 0 12px 0" }}>
            {file ? "✅" : "📁"}
          </p>
          <p style={{ color: "#94a3b8", fontSize: "14px", marginBottom: "16px" }}>
            {file ? file.name : "PDF ya TXT file select karo"}
          </p>
          <input
            type="file"
            accept=".pdf,.txt"
            onChange={handleFileChange}
            style={{ display: "none" }}
            id="fileInput"
          />
          <span style={{
            background: "#1e2535", color: "#94a3b8",
            padding: "8px 20px", borderRadius: "8px", fontSize: "14px"
          }}>
            Browse File
          </span>
        </div>

        {error && (
          <p style={{ color: "#ef4444", fontSize: "13px", marginBottom: "12px" }}>
            {error}
          </p>
        )}

        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          style={{
            width: "100%",
            background: file ? "#0ea5e9" : "#1e2535",
            color: file ? "white" : "#64748b",
            border: "none", borderRadius: "8px",
            padding: "12px", fontSize: "15px",
            fontWeight: "600",
            cursor: file ? "pointer" : "not-allowed",
            marginBottom: "8px"
          }}
        >
          {uploading ? "⏳ Uploading..." : "Upload & Continue →"}
        </button>

        <button
          onClick={() => navigate("/jobs")}
          style={{
            width: "100%", background: "none",
            color: "#475569", border: "none",
            padding: "12px", fontSize: "13px", cursor: "pointer"
          }}
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}

export default ResumeUpload;