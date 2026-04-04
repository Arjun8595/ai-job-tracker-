import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AIChat from "./AIChat";

function JobFeed({ setIsLoggedIn }) {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [pendingJob, setPendingJob] = useState(null);
  const [applications, setApplications] = useState(() => {
    const saved = localStorage.getItem("applications");
    return saved ? JSON.parse(saved) : [];
  });
  const navigate = useNavigate();

  const [filters, setFilters] = useState({
    search: "",
    skills: [],
    datePosted: "any",
    jobType: [],
    workMode: [],
    location: "",
    matchScore: "all",
  });

  const skillOptions = ["React", "Node.js", "Python", "Java", "SQL", "AWS", "Docker", "TypeScript"];

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const resume = localStorage.getItem("resume");
    const resumeText = resume ? JSON.parse(resume).text : null;

    fetch("https://ai-job-tracker-95.onrender.com/jobs")
      .then(res => res.json())
      .then(async (data) => {
        if (resumeText && data.jobs) {
          try {
            const matchRes = await fetch("https://ai-job-tracker-95.onrender.com/match", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ resumeText, jobs: data.jobs }),
            });
            const matchData = await matchRes.json();
            setJobs(matchData.jobs);
            setFilteredJobs(matchData.jobs);
          } catch (e) {
            setJobs(data.jobs);
            setFilteredJobs(data.jobs);
          }
        } else {
          setJobs(data.jobs);
          setFilteredJobs(data.jobs);
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let result = [...(jobs || [])];

    if (filters.search) {
      result = result.filter(job =>
        job.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        job.company.toLowerCase().includes(filters.search.toLowerCase())
      );
    }
    if (filters.location) {
      result = result.filter(job =>
        job.location.toLowerCase().includes(filters.location.toLowerCase())
      );
    }
    if (filters.jobType.length > 0) {
      result = result.filter(job => filters.jobType.includes(job.jobType));
    }
    if (filters.workMode.length > 0) {
      result = result.filter(job => filters.workMode.includes(job.workMode));
    }
    if (filters.datePosted !== "any") {
      const now = new Date();
      result = result.filter(job => {
        const posted = new Date(job.postedAt);
        const diff = (now - posted) / (1000 * 60 * 60);
        if (filters.datePosted === "24h") return diff <= 24;
        if (filters.datePosted === "week") return diff <= 168;
        if (filters.datePosted === "month") return diff <= 720;
        return true;
      });
    }
    if (filters.matchScore === "high") {
      result = result.filter(job => job.matchScore > 70);
    } else if (filters.matchScore === "medium") {
      result = result.filter(job => job.matchScore >= 40 && job.matchScore <= 70);
    }

    setFilteredJobs(result);
  }, [filters, jobs]);

  const toggleArray = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter(v => v !== value)
        : [...prev[key], value]
    }));
  };

  const resetFilters = () => {
    setFilters({ search: "", skills: [], datePosted: "any", jobType: [], workMode: [], location: "", matchScore: "all" });
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    navigate("/login");
  };

  const saveApplication = (job, status) => {
    const newApp = {
      id: Date.now().toString(),
      job,
      status,
      appliedAt: new Date().toISOString(),
      timeline: [{ status, time: new Date().toLocaleString() }]
    };
    const updated = [...applications, newApp];
    setApplications(updated);
    localStorage.setItem("applications", JSON.stringify(updated));
    setPendingJob(null);
  };

  if (loading) return (
    <div style={{ background: "#0f1117", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <p style={{ color: "#38bdf8", fontSize: "18px" }}>⏳ Loading & Matching Jobs...</p>
        <p style={{ color: "#64748b", fontSize: "13px" }}>Matching jobs with your resume...</p>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ background: "#0f1117", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "#ef4444" }}>❌ Error: {error}</p>
    </div>
  );

  const bestMatches = (jobs || []).filter(j => j.matchScore > 70).slice(0, 8);

  return (
    <div style={{ background: "#0f1117", minHeight: "100vh" }}>

      {/* Apply Popup */}
      {pendingJob && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "#00000080", display: "flex",
          alignItems: "center", justifyContent: "center", zIndex: 1000
        }}>
          <div style={{
            background: "#161b27", border: "1px solid #1e2535",
            borderRadius: "16px", padding: "32px",
            maxWidth: "400px", width: "90%", textAlign: "center"
          }}>
            <p style={{ fontSize: "32px", margin: "0 0 12px 0" }}>🤔</p>
            <h3 style={{ color: "#f1f5f9", margin: "0 0 8px 0" }}>
              Did you apply?
            </h3>
            <p style={{ color: "#64748b", fontSize: "14px", margin: "0 0 24px 0" }}>
              <strong style={{ color: "#f1f5f9" }}>{pendingJob.title}</strong> at <strong style={{ color: "#38bdf8" }}>{pendingJob.company}</strong>
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <button onClick={() => saveApplication(pendingJob, "Applied")} style={{
                background: "#22c55e20", color: "#22c55e",
                border: "1px solid #22c55e40", borderRadius: "8px",
                padding: "12px", fontSize: "14px", cursor: "pointer", fontWeight: "600"
              }}>
                 Yes, Applied!
              </button>

              <button onClick={() => setPendingJob(null)} style={{
                background: "#1e2535", color: "#94a3b8",
                border: "1px solid #1e2535", borderRadius: "8px",
                padding: "12px", fontSize: "14px", cursor: "pointer"
              }}>
                 No, just browsing
              </button>

              <button onClick={() => saveApplication(pendingJob, "Applied")} style={{
                background: "#0ea5e920", color: "#38bdf8",
                border: "1px solid #0ea5e940", borderRadius: "8px",
                padding: "12px", fontSize: "14px", cursor: "pointer"
              }}>
                📋 Applied Earlier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{
        background: "#161b27", borderBottom: "1px solid #1e2535",
        padding: "16px 24px", display: "flex",
        justifyContent: "space-between", alignItems: "center",
        flexWrap: "wrap", gap: "12px"
      }}>
        <h1 style={{ color: "#38bdf8", margin: 0, fontFamily: "sans-serif", fontSize: isMobile ? "18px" : "22px" }}>
          JobTrack AI 💼
        </h1>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={() => navigate("/applications")} style={{
            background: "#1e2535", color: "#94a3b8", border: "none",
            padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontSize: "13px"
          }}>
            📋 Applications
          </button>
          <button onClick={() => navigate("/resume")} style={{
            background: "#1e2535", color: "#94a3b8", border: "none",
            padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontSize: "13px"
          }}>
            📄 Resume
          </button>
          <button onClick={handleLogout} style={{
            background: "#1e2535", color: "#94a3b8", border: "none",
            padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontSize: "13px"
          }}>
            Logout
          </button>
        </div>
      </div>

      <div style={{
        display: "flex", gap: "24px",
        padding: isMobile ? "16px" : "24px",
        flexDirection: isMobile ? "column" : "row"
      }}>

        {/* FILTERS SIDEBAR */}
        <div style={{
          width: isMobile ? "86%" : "220px", flexShrink: 0,
          background: "#161b27", border: "1px solid #1e2535",
          borderRadius: "12px", padding: "20px",
          height: "fit-content",
          position: isMobile ? "relative" : "sticky", top: "24px"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h3 style={{ color: "#f1f5f9", margin: 0, fontSize: "15px" }}>🔍 Filters</h3>
            <button onClick={resetFilters} style={{
              background: "none", color: "#64748b", border: "none",
              cursor: "pointer", fontSize: "12px"
            }}>Reset all</button>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>Role / Title</label>
            <input
              placeholder="e.g. React Developer"
              value={filters.search}
              onChange={e => setFilters(p => ({ ...p, search: e.target.value }))}
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>Location</label>
            <input
              placeholder="e.g. Bangalore, Delhi"
              value={filters.location}
              onChange={e => setFilters(p => ({ ...p, location: e.target.value }))}
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>Skills</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {skillOptions.map(skill => (
                <button key={skill} onClick={() => toggleArray("skills", skill)} style={{
                  padding: "4px 10px", borderRadius: "6px", fontSize: "12px",
                  cursor: "pointer", border: "1px solid",
                  background: filters.skills.includes(skill) ? "#0ea5e9" : "transparent",
                  color: filters.skills.includes(skill) ? "white" : "#94a3b8",
                  borderColor: filters.skills.includes(skill) ? "#0ea5e9" : "#1e2535",
                }}>
                  {skill}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>Date Posted</label>
            {[
              { value: "any", label: "Any time" },
              { value: "24h", label: "Last 24 hours" },
              { value: "week", label: "Last week" },
              { value: "month", label: "Last month" },
            ].map(d => (
              <label key={d.value} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", cursor: "pointer" }}>
                <input type="radio" name="date" value={d.value}
                  checked={filters.datePosted === d.value}
                  onChange={() => setFilters(p => ({ ...p, datePosted: d.value }))}
                />
                <span style={{ color: "#94a3b8", fontSize: "13px" }}>{d.label}</span>
              </label>
            ))}
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>Job Type</label>
            {[
              { value: "full-time", label: "Full Time" },
              { value: "part-time", label: "Part Time" },
              { value: "contract", label: "Contract" },
              { value: "internship", label: "Internship" },
            ].map(type => (
              <label key={type.value} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", cursor: "pointer" }}>
                <input type="checkbox"
                  checked={filters.jobType.includes(type.value)}
                  onChange={() => toggleArray("jobType", type.value)}
                />
                <span style={{ color: "#94a3b8", fontSize: "13px" }}>{type.label}</span>
              </label>
            ))}
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>Work Mode</label>
            {[
              { value: "remote", label: "🌐 Remote" },
              { value: "hybrid", label: "🏠 Hybrid" },
              { value: "on-site", label: "🏢 On-site" },
            ].map(mode => (
              <label key={mode.value} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", cursor: "pointer" }}>
                <input type="checkbox"
                  checked={filters.workMode.includes(mode.value)}
                  onChange={() => toggleArray("workMode", mode.value)}
                />
                <span style={{ color: "#94a3b8", fontSize: "13px" }}>{mode.label}</span>
              </label>
            ))}
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>Match Score</label>
            {[
              { value: "all", label: "All Jobs" },
              { value: "high", label: "🟢 High (>70%)" },
              { value: "medium", label: "🟡 Medium (40-70%)" },
            ].map(m => (
              <label key={m.value} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", cursor: "pointer" }}>
                <input type="radio" name="match" value={m.value}
                  checked={filters.matchScore === m.value}
                  onChange={() => setFilters(p => ({ ...p, matchScore: m.value }))}
                />
                <span style={{ color: "#94a3b8", fontSize: "13px" }}>{m.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* JOB CARDS */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {bestMatches.length > 0 && (
            <div style={{ marginBottom: "24px" }}>
              <h2 style={{ color: "#f1f5f9", fontSize: "16px", marginBottom: "12px" }}>
                ⭐ Best Matches ({bestMatches.length})
              </h2>
              <div style={{ display: "flex", gap: "12px", overflowX: "auto", paddingBottom: "8px" }}>
                {bestMatches.map(job => (
                  <div key={job.id} style={{
                    background: "#161b27", border: "1px solid #22c55e40",
                    borderRadius: "12px", padding: "16px",
                    minWidth: "220px", maxWidth: "220px"
                  }}>
                    <span style={{
                      background: "#22c55e20", color: "#22c55e",
                      border: "1px solid #22c55e40", borderRadius: "6px",
                      padding: "2px 8px", fontSize: "11px", fontWeight: "600"
                    }}>
                      🎯 {job.matchScore}%
                    </span>
                    <p style={{ color: "#f1f5f9", fontSize: "13px", margin: "8px 0 4px 0", fontWeight: "600" }}>
                      {job.title}
                    </p>
                    <p style={{ color: "#38bdf8", fontSize: "12px", margin: 0 }}>{job.company}</p>
                    <p style={{ color: "#64748b", fontSize: "11px", margin: "4px 0 0 0" }}>📍 {job.location}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p style={{ color: "#64748b", marginBottom: "16px", fontSize: "14px" }}>
            {filteredJobs?.length} jobs found
          </p>

          {filteredJobs?.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px", color: "#64748b" }}>
              <p style={{ fontSize: "40px" }}>🔍</p>
              <p>No jobs found. Try different filters.</p>
            </div>
          )}

          {filteredJobs?.map((job) => (
            <div key={job.id} style={{
              background: "#161b27", border: "1px solid #1e2535",
              borderRadius: "12px", padding: isMobile ? "16px" : "20px",
              marginBottom: "12px",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px" }}>
                <div>
                  <h3 style={{ color: "#f1f5f9", margin: "0 0 4px 0", fontSize: isMobile ? "14px" : "16px" }}>
                    {job.title}
                  </h3>
                  <p style={{ color: "#38bdf8", margin: "0 0 8px 0", fontSize: "14px" }}>
                    🏢 {job.company}
                  </p>
                </div>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {job.matchScore && (
                    <span style={{
                      background: job.matchScore > 70 ? "#22c55e20" : job.matchScore > 40 ? "#eab30820" : "#94a3b820",
                      color: job.matchScore > 70 ? "#22c55e" : job.matchScore > 40 ? "#eab308" : "#94a3b8",
                      border: `1px solid ${job.matchScore > 70 ? "#22c55e40" : job.matchScore > 40 ? "#eab30840" : "#94a3b840"}`,
                      borderRadius: "6px", padding: "4px 10px", fontSize: "11px", fontWeight: "600"
                    }}>
                      🎯 {job.matchScore}%
                    </span>
                  )}
                  <span style={{
                    background: "#0ea5e920", color: "#38bdf8",
                    border: "1px solid #0ea5e940", borderRadius: "6px",
                    padding: "4px 10px", fontSize: "11px"
                  }}>
                    {job.jobType}
                  </span>
                  <span style={{
                    background: job.workMode === "remote" ? "#22c55e20" : job.workMode === "hybrid" ? "#eab30820" : "#94a3b820",
                    color: job.workMode === "remote" ? "#22c55e" : job.workMode === "hybrid" ? "#eab308" : "#94a3b8",
                    border: `1px solid ${job.workMode === "remote" ? "#22c55e40" : job.workMode === "hybrid" ? "#eab30840" : "#94a3b840"}`,
                    borderRadius: "6px", padding: "4px 10px", fontSize: "11px"
                  }}>
                    {job.workMode}
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", gap: "16px", marginBottom: "12px", flexWrap: "wrap" }}>
                <p style={{ color: "#94a3b8", margin: 0, fontSize: "13px" }}>📍 {job.location}</p>
                <p style={{ color: "#94a3b8", margin: 0, fontSize: "13px" }}>💰 {job.salary}</p>
              </div>

              {job.matchDetails?.matchingSkills?.length > 0 && (
                <div style={{ marginBottom: "12px" }}>
                  <p style={{ color: "#64748b", fontSize: "11px", margin: "0 0 6px 0" }}>MATCHING SKILLS</p>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {job.matchDetails.matchingSkills.map((skill, i) => (
                      <span key={i} style={{
                        background: "#0ea5e920", color: "#38bdf8",
                        border: "1px solid #0ea5e940",
                        borderRadius: "4px", padding: "2px 8px", fontSize: "11px"
                      }}>
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <p style={{
                color: "#64748b", fontSize: "13px", margin: "0 0 16px 0", lineHeight: "1.5",
                display: "-webkit-box", WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical", overflow: "hidden"
              }}>
                {job.description}
              </p>

              <button
                onClick={() => {
                  window.open(job.applyUrl, "_blank");
                  setTimeout(() => setPendingJob(job), 2000);
                }}
                style={{
                  background: "#0ea5e9", color: "white",
                  padding: "8px 20px", borderRadius: "8px",
                  border: "none", fontSize: "14px", fontWeight: "600",
                  cursor: "pointer"
                }}
              >
                Apply Now →
              </button>
            </div>
          ))}
        </div>      
      </div>

       <AIChat onFilterUpdate={(updates) => {
        setFilters(prev => ({ ...prev, ...updates }));
      }} />
    </div>
 
  );
}

const labelStyle = {
  display: "block", color: "#64748b",
  fontSize: "11px", fontWeight: "600",
  textTransform: "uppercase", letterSpacing: "0.5px",
  marginBottom: "8px"
};

const inputStyle = {
  width: "100%", background: "#0f1117",
  border: "1px solid #1e2535", borderRadius: "8px",
  padding: "8px 12px", color: "#f1f5f9",
  fontSize: "13px", outline: "none",
  boxSizing: "border-box"
};

export default JobFeed;