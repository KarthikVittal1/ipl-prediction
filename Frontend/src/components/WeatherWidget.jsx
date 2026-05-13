import { useState, useEffect } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const WEATHER_THEMES = {
  Clear:        { icon: "☀️", accent: "#f59e0b" },
  Clouds:       { icon: "⛅", accent: "#64748b" },
  Rain:         { icon: "🌧️", accent: "#3b82f6" },
  Drizzle:      { icon: "🌦️", accent: "#06b6d4" },
  Thunderstorm: { icon: "⛈️", accent: "#7c3aed" },
  Snow:         { icon: "❄️", accent: "#0ea5e9" },
  Mist:         { icon: "🌫️", accent: "#94a3b8" },
  Haze:         { icon: "🌫️", accent: "#f59e0b" },
  Smoke:        { icon: "💨", accent: "#6b7280" },
  default:      { icon: "🌡️", accent: "#14b8a6" },
};

const IPL_VENUES = [
  "Wankhede Stadium",
  "M. Chinnaswamy Stadium",
  "Eden Gardens",
  "MA Chidambaram Stadium",
  "Arun Jaitley Stadium",
  "Rajiv Gandhi International Stadium",
  "Narendra Modi Stadium",
  "Sawai Mansingh Stadium",
  "PCA Stadium",
  "Ekana Cricket Stadium",
];

const SHORT_NAMES = {
  "Wankhede Stadium":                   "Wankhede",
  "M. Chinnaswamy Stadium":             "M. Chinnaswamy",
  "Eden Gardens":                       "Eden Gardens",
  "MA Chidambaram Stadium":             "MA Chidambaram",
  "Arun Jaitley Stadium":               "Arun Jaitley",
  "Rajiv Gandhi International Stadium": "Rajiv Gandhi",
  "Narendra Modi Stadium":              "Narendra Modi",
  "Sawai Mansingh Stadium":             "Sawai Mansingh",
  "PCA Stadium":                        "PCA",
  "Ekana Cricket Stadium":              "Ekana",
};

function WeatherCard({ venue }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  useEffect(() => {
    if (!venue) return;
    setLoading(true);
    setError(null);
    setData(null);

    fetch(`${API_BASE}/weather/${encodeURIComponent(venue)}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.status === "success") setData(json);
        else setError(json.message || "Weather unavailable");
      })
      .catch(() => setError("Could not reach server"))
      .finally(() => setLoading(false));
  }, [venue]);

  const theme = data
    ? (WEATHER_THEMES[data.weather] || WEATHER_THEMES.default)
    : WEATHER_THEMES.default;

  /* ── loading skeleton ── */
  if (loading) {
    return (
      <div style={{
        background: "#f8fafc",
        borderRadius: "12px",
        padding: "20px",
        display: "flex",
        alignItems: "center",
        gap: "16px",
        minHeight: "110px",
        border: "1px solid #e2e8f0",
      }}>
        <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#e2e8f0" }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ height: 14, background: "#e2e8f0", borderRadius: 6, width: "50%" }} />
          <div style={{ height: 22, background: "#e2e8f0", borderRadius: 6, width: "35%" }} />
          <div style={{ height: 10, background: "#e2e8f0", borderRadius: 6, width: "65%" }} />
        </div>
      </div>
    );
  }

  /* ── error state ── */
  if (error) {
    return (
      <div style={{
        background: "#fff5f5",
        borderRadius: "12px",
        padding: "20px",
        border: "1px solid #fecaca",
        color: "#dc2626",
        fontSize: "14px",
        display: "flex",
        alignItems: "center",
        gap: "10px",
      }}>
        <span style={{ fontSize: 22 }}>⚠️</span>
        <span>{error}</span>
      </div>
    );
  }

  if (!data) return null;

  const playingCondition =
    ["Rain", "Thunderstorm", "Drizzle"].includes(data.weather)
      ? { text: "⚠ Play may be affected",    color: "#dc2626" }
      : data.weather === "Clear"
      ? { text: "✓ Ideal playing conditions", color: "#16a34a" }
      : { text: "● Conditions look OK",       color: "#d97706" };

  return (
    <div style={{
      background: "#ffffff",
      borderRadius: "12px",
      border: "1px solid #e2e8f0",
      overflow: "hidden",
      boxShadow: "0 1px 8px rgba(0,0,0,0.07)",
    }}>
      {/* colored top accent bar */}
      <div style={{ height: 3, background: theme.accent }} />

      <div style={{ padding: "20px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <p style={{
              fontSize: 10,
              letterSpacing: "0.12em",
              color: "#94a3b8",
              textTransform: "uppercase",
              margin: "0 0 4px",
            }}>
              Match Day Weather
            </p>
            <p style={{ color: "#0f172a", fontWeight: 700, fontSize: 15, margin: 0 }}>
              {venue}
            </p>
          </div>
          <span style={{ fontSize: 38, lineHeight: 1 }}>{theme.icon}</span>
        </div>

        {/* Temperature */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: 6, marginTop: 14 }}>
          <span style={{ fontSize: 52, fontWeight: 900, color: "#0f172a", lineHeight: 1 }}>
            {Math.round(data.temperature)}°
          </span>
          <span style={{ fontSize: 18, color: "#64748b", marginBottom: 6 }}>C</span>
          <span style={{
            fontSize: 13,
            color: "#64748b",
            marginBottom: 7,
            marginLeft: 4,
            textTransform: "capitalize",
          }}>
            {data.description}
          </span>
        </div>

        {/* Stats row */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 8,
          marginTop: 14,
        }}>
          {[
            { label: "Humidity", value: `${data.humidity}%` },
            { label: "Wind",     value: `${data.wind_speed} m/s` },
            { label: "Pressure", value: `${data.pressure} hPa` },
          ].map(({ label, value }) => (
            <div key={label} style={{
              background: "#f8fafc",
              borderRadius: 8,
              padding: "10px 6px",
              textAlign: "center",
              border: "1px solid #e2e8f0",
            }}>
              <p style={{
                fontSize: 9,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "#94a3b8",
                margin: 0,
              }}>
                {label}
              </p>
              <p style={{ color: "#0f172a", fontWeight: 700, fontSize: 13, margin: "4px 0 0" }}>
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* Playing condition */}
        <p style={{
          marginTop: 12,
          fontSize: 12,
          fontWeight: 600,
          color: playingCondition.color,
          margin: "12px 0 0",
        }}>
          {playingCondition.text}
        </p>
      </div>
    </div>
  );
}

export default function WeatherWidget() {
  const [selectedVenue, setSelectedVenue] = useState(IPL_VENUES[0]);

  return (
    <section style={{ margin: "32px 0" }}>

      {/* Header + dropdown */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 12,
        marginBottom: 16,
      }}>
        <h2 style={{
          color: "#0f172a",
          fontWeight: 700,
          fontSize: 18,
          margin: 0,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}>
          🌤️ Stadium Weather
        </h2>

        <select
          value={selectedVenue}
          onChange={(e) => setSelectedVenue(e.target.value)}
          style={{
            background: "#ffffff",
            color: "#0f172a",
            fontSize: 13,
            borderRadius: 8,
            padding: "8px 12px",
            border: "1px solid #e2e8f0",
            cursor: "pointer",
            outline: "none",
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          }}
        >
          {IPL_VENUES.map((v) => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>
      </div>

      {/* Card */}
      <WeatherCard venue={selectedVenue} />

      {/* Quick-pick chips */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
        {IPL_VENUES.slice(0, 6).map((v) => (
          <button
            key={v}
            onClick={() => setSelectedVenue(v)}
            style={{
              fontSize: 12,
              padding: "6px 14px",
              borderRadius: 999,
              border: selectedVenue === v ? "1px solid #3b82f6" : "1px solid #e2e8f0",
              background: selectedVenue === v ? "#3b82f6" : "#ffffff",
              color: selectedVenue === v ? "#ffffff" : "#64748b",
              cursor: "pointer",
              transition: "all 0.2s",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            }}
          >
            {SHORT_NAMES[v] || v}
          </button>
        ))}
      </div>
    </section>
  );
}
