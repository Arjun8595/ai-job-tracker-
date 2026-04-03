import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Applications() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState(() => {
    const saved = localStorage.getItem("applications");
    return saved ? JSON.parse(saved) : [];
  });

  const updateStatus = (id, newStatus) => {
    const updated = applications.map(app => {
      if (app.id === id) {
        return {
          ...app,
          status: newStatus,
          timeline: [...app.timeline, {
            status: newStatus,
            time: new Date().toLocaleString()
          }]
        };
      }
      return app;
    });
    setApplications(updated);
    localStorage.setItem("applications", JSON.stringify(updated));
  };

  const statusColors = {
    "Applied": { bg: "#0ea5e920", color: "#38bdf8", border: "#0ea5e940" },
    "Interview": { bg: "#eab30820", color: "#eab308", border: "#eab30840" },
    "Offer": { bg: "#22c55e20", color: "#22c55e", border: "#22c55e40" },
    "Rejected": { bg: "#ef444420", color: "#ef4444", border: "#ef444440" },
  };

  return (
    <div style={{ background: "#0f1117", minHeight: "100vh" }}>

      {/* Header */}
      <div style={{
        background: "#161b27", borderBottom: "1px solid #1e2535",
        padding: "16px 24px", display: "flex",
        justifyContent: "space-between", alignItems: "center"
      }}>
        <h1 style={{ color: "#38bdf8", margin: 0, fontFamily: "sans-serif", fontSize: "22px" }}>
          📋 My Applications
        </h1>
        <button onClick={() => navigate("/jobs")} style={{
          background: "#1e2535", color: "#94a3b8", border: "none",
          padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontSize: "13px"
        }}>
          ← Back to Jobs
        </button>
      </div>

      <div style={{ padding: "24px" }}>

        {/* Stats */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
          {[
            { label: "Total", value: applications.length, color: "#38bdf8" },
            { label: "Applied", value: applications.filter(a => a.status === "Applied").length, color: "#38bdf8" },
            { label: "Interview", value: applications.filter(a => a.status === "Interview").length, color: "#eab308" },
            { label: "Offer", value: applications.filter(a => a.status === "Offer").length, color: "#22c55e" },
            { label: "Rejected", value: applications.filter(a => a.status === "Rejected").length, color: "#ef4444" },
          ].map(stat => (
            <div key={stat.label} style={{
              background: "#161b27", border: "1px solid #1e2535",
              borderRadius: "12px", padding: "16px 24px", textAlign: "center"
            }}>
              <p style={{ color: stat.color, fontSize: "24px", fontWeight: "700", margin: 0 }}>
                {stat.value}
              </p>
              <p style={{ color: "#64748b", fontSize: "12px", margin: "4px 0 0 0" }}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* Applications List */}
        {applications.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px", color: "#64748b" }}>
            <p style={{ fontSize: "40px" }}>📭</p>
            <p style={{ fontSize: "16px" }}>Koi application nahi abhi</p>
            <button onClick={() => navigate("/jobs")} style={{
              background: "#0ea5e9", color: "white", border: "none",
              padding: "10px 24px", borderRadius: "8px", cursor: "pointer",
              fontSize: "14px", marginTop: "16px"
            }}>
              Search Jobs →
            </button>
          </div>
        ) : (
          applications.map(app => (
            <div key={app.id} style={{
              background: "#161b27", border: "1px solid #1e2535",
              borderRadius: "12px", padding: "20px", marginBottom: "12px"
            }}>
              {/* Job Info */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
                <div>
                  <h3 style={{ color: "#f1f5f9", margin: "0 0 4px 0", fontSize: "16px" }}>
                    {app.job.title}
                  </h3>
                  <p style={{ color: "#38bdf8", margin: "0 0 4px 0", fontSize: "14px" }}>
                    🏢 {app.job.company}
                  </p>
                  <p style={{ color: "#64748b", margin: 0, fontSize: "12px" }}>
                    📍 {app.job.location} • Applied: {new Date(app.appliedAt).toLocaleDateString()}
                  </p>
                </div>

                {/* Status Badge */}
                <span style={{
                  background: statusColors[app.status]?.bg,
                  color: statusColors[app.status]?.color,
                  border: `1px solid ${statusColors[app.status]?.border}`,
                  borderRadius: "6px", padding: "4px 12px", fontSize: "12px", fontWeight: "600"
                }}>
                  {app.status}
                </span>
              </div>

              {/* Status Update Buttons */}
              <div style={{ display: "flex", gap: "8px", marginTop: "16px", flexWrap: "wrap" }}>
                <p style={{ color: "#64748b", fontSize: "12px", margin: "auto 0" }}>Update:</p>
                {["Applied", "Interview", "Offer", "Rejected"].map(status => (
                  <button
                    key={status}
                    onClick={() => updateStatus(app.id, status)}
                    style={{
                      background: app.status === status ? statusColors[status]?.bg : "transparent",
                      color: app.status === status ? statusColors[status]?.color : "#64748b",
                      border: `1px solid ${app.status === status ? statusColors[status]?.border : "#1e2535"}`,
                      borderRadius: "6px", padding: "4px 12px",
                      fontSize: "12px", cursor: "pointer"
                    }}
                  >
                    {status}
                  </button>
                ))}
              </div>

              {/* Timeline */}
              <div style={{ marginTop: "16px", borderTop: "1px solid #1e2535", paddingTop: "12px" }}>
                <p style={{ color: "#64748b", fontSize: "11px", marginBottom: "8px" }}>TIMELINE</p>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {app.timeline.map((t, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{
                        background: statusColors[t.status]?.bg,
                        color: statusColors[t.status]?.color,
                        border: `1px solid ${statusColors[t.status]?.border}`,
                        borderRadius: "4px", padding: "2px 8px", fontSize: "11px"
                      }}>
                        {t.status}
                      </span>
                      <span style={{ color: "#475569", fontSize: "11px" }}>{t.time}</span>
                      {i < app.timeline.length - 1 && (
                        <span style={{ color: "#1e2535" }}>→</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Applications;