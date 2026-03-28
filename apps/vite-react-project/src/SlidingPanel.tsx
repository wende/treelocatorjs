import { useState } from "react";

function SlidingPanel() {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          position: "fixed",
          top: "16px",
          left: open ? "316px" : "16px",
          zIndex: 1000,
          padding: "10px 20px",
          background: "#3b82f6",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          fontWeight: 600,
          fontSize: "14px",
          transition: "left 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
        }}
      >
        {open ? "Close Menu" : "Open Menu"}
      </button>

      {/* Backdrop */}
      <div
        onClick={() => setOpen(false)}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.3)",
          zIndex: 998,
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 0.35s ease",
        }}
      />

      {/* Sliding panel */}
      <div
        data-locatorjs-id="SlidingPanel"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "300px",
          height: "100vh",
          background: "#1e293b",
          color: "#e2e8f0",
          zIndex: 999,
          transform: open ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
          boxShadow: "4px 0 24px rgba(0,0,0,0.3)",
          display: "flex",
          flexDirection: "column",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ padding: "24px 20px 16px", borderBottom: "1px solid #334155" }}>
          <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700 }}>Menu Panel</h2>
          <p style={{ margin: "8px 0 0", fontSize: "13px", color: "#94a3b8" }}>
            Record this panel sliding open/closed
          </p>
        </div>

        <nav style={{ flex: 1, padding: "12px 0" }}>
          {["Dashboard", "Analytics", "Reports", "Settings", "Help"].map((item) => (
            <div
              key={item}
              data-locatorjs-id={`MenuItem-${item}`}
              style={{
                padding: "12px 20px",
                cursor: "pointer",
                fontSize: "14px",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#334155")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              onClick={() => setCount((c) => c + 1)}
            >
              {item}
            </div>
          ))}
        </nav>

        <div style={{ padding: "16px 20px", borderTop: "1px solid #334155", fontSize: "12px", color: "#64748b" }}>
          Clicks during session: {count}
        </div>
      </div>

      {/* Bouncing notification badge (for jitter detection) */}
      <div
        data-locatorjs-id="NotificationBadge"
        style={{
          position: "fixed",
          top: "16px",
          right: "100px",
          zIndex: 1000,
          width: "40px",
          height: "40px",
          borderRadius: "50%",
          background: "#ef4444",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 700,
          fontSize: "14px",
          fontFamily: "system-ui",
          animation: "badge-bounce 2s ease-in-out infinite",
          boxShadow: "0 2px 8px rgba(239,68,68,0.4)",
        }}
      >
        3
      </div>

      <style>{`
        @keyframes badge-bounce {
          0%, 100% { transform: translateY(0); }
          25% { transform: translateY(-8px); }
          50% { transform: translateY(0); }
          75% { transform: translateY(-4px); }
        }
      `}</style>
    </>
  );
}

export default SlidingPanel;
