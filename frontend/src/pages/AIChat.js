import { useState } from "react";

function AIChat({ onFilterUpdate }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "ai", text: "Hi! 👋 I'm JobTrack AI. Discover jobs easily using smart filters like remote, full-time, and more." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = { role: "user", text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });
      const data = await res.json();
      if (data.filterUpdates && onFilterUpdate) {
        onFilterUpdate(data.filterUpdates);
      }
      setMessages(prev => [...prev, {
        role: "ai",
        text: data.reply || "Something went wrong. Please try again!"
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: "ai",
        text: "Couldn't connect to the server!"
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  };

  const suggestions = [
    "Show remote jobs",
    "Full time only",
    "High match scores",
    "Clear all filters",
    "Last week jobs",
  ];

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: "fixed", bottom: "24px", right: "24px",
          width: "56px", height: "56px", borderRadius: "50%",
          background: "#0ea5e9", border: "none", cursor: "pointer",
          fontSize: "24px", zIndex: 999,
          boxShadow: "0 4px 20px #0ea5e940",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        {isOpen ? "✕" : "🤖"}
      </button>

      {isOpen && (
        <div style={{
          position: "fixed", bottom: "90px", right: "24px",
          width: "340px", height: "480px",
          background: "#161b27", border: "1px solid #1e2535",
          borderRadius: "16px", zIndex: 998,
          display: "flex", flexDirection: "column",
          boxShadow: "0 8px 32px #00000060",
        }}>
          <div style={{
            padding: "16px", borderBottom: "1px solid #1e2535",
            display: "flex", alignItems: "center", gap: "10px"
          }}>
            <span style={{ fontSize: "24px" }}>🤖</span>
            <div>
              <p style={{ color: "#f1f5f9", margin: 0, fontSize: "14px", fontWeight: "600" }}>
                JobTrack AI Assistant
              </p>
              <p style={{ color: "#22c55e", margin: 0, fontSize: "11px" }}>● Online</p>
            </div>
          </div>

          <div style={{
            flex: 1, overflowY: "auto", padding: "16px",
            display: "flex", flexDirection: "column", gap: "12px"
          }}>
            {messages.map((msg, i) => (
              <div key={i} style={{
                display: "flex",
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start"
              }}>
                <div style={{
                  maxWidth: "80%",
                  background: msg.role === "user" ? "#0ea5e9" : "#1e2535",
                  color: "#f1f5f9", borderRadius: "12px",
                  padding: "10px 14px", fontSize: "13px", lineHeight: "1.5",
                  borderBottomRightRadius: msg.role === "user" ? "4px" : "12px",
                  borderBottomLeftRadius: msg.role === "ai" ? "4px" : "12px",
                }}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div style={{
                  background: "#1e2535", color: "#94a3b8",
                  borderRadius: "12px", padding: "10px 14px", fontSize: "13px"
                }}>
                  ⏳ Thinking...
                </div>
              </div>
            )}
          </div>

          <div style={{ padding: "8px 16px", display: "flex", gap: "6px", overflowX: "auto" }}>
            {suggestions.map((s, i) => (
              <button key={i} onClick={() => setInput(s)} style={{
                background: "#0ea5e920", color: "#38bdf8",
                border: "1px solid #0ea5e940", borderRadius: "6px",
                padding: "4px 10px", fontSize: "11px", cursor: "pointer",
                whiteSpace: "nowrap", flexShrink: 0
              }}>
                {s}
              </button>
            ))}
          </div>

          <div style={{
            padding: "12px 16px", borderTop: "1px solid #1e2535",
            display: "flex", gap: "8px"
          }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Message likho..."
              style={{
                flex: 1, background: "#0f1117",
                border: "1px solid #1e2535", borderRadius: "8px",
                padding: "8px 12px", color: "#f1f5f9",
                fontSize: "13px", outline: "none",
              }}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              style={{
                background: "#0ea5e9", color: "white",
                border: "none", borderRadius: "8px",
                padding: "8px 14px", cursor: "pointer", fontSize: "16px"
              }}
            >
              →
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default AIChat;