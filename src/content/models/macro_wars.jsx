import { useState } from "react";
import {
  ComposedChart, Line, XAxis, YAxis, Tooltip,
  ReferenceArea, ResponsiveContainer, CartesianGrid,
} from "recharts";

// Brent crude in USD/bbl — right axis (secondary scale)
const DATA = [
  { year: 1954, effr: 1.0,  cpi: 0.7,  t10y: 2.5,  unemp: 5.5,  brent: 1.8  },
  { year: 1955, effr: 1.8,  cpi: -0.4, t10y: 2.8,  unemp: 4.4,  brent: 1.9  },
  { year: 1956, effr: 2.7,  cpi: 1.5,  t10y: 3.2,  unemp: 4.1,  brent: 2.0  },
  { year: 1957, effr: 3.1,  cpi: 3.3,  t10y: 3.9,  unemp: 4.3,  brent: 2.0  },
  { year: 1958, effr: 1.6,  cpi: 2.8,  t10y: 3.4,  unemp: 6.8,  brent: 1.9  },
  { year: 1959, effr: 3.3,  cpi: 0.7,  t10y: 4.1,  unemp: 5.5,  brent: 1.8  },
  { year: 1960, effr: 3.2,  cpi: 1.7,  t10y: 4.0,  unemp: 5.5,  brent: 1.6  },
  { year: 1961, effr: 2.0,  cpi: 1.0,  t10y: 3.9,  unemp: 6.7,  brent: 1.6  },
  { year: 1962, effr: 2.7,  cpi: 1.0,  t10y: 3.9,  unemp: 5.5,  brent: 1.6  },
  { year: 1963, effr: 3.2,  cpi: 1.3,  t10y: 4.0,  unemp: 5.7,  brent: 1.6  },
  { year: 1964, effr: 3.5,  cpi: 1.3,  t10y: 4.2,  unemp: 5.2,  brent: 1.6  },
  { year: 1965, effr: 4.1,  cpi: 1.6,  t10y: 4.3,  unemp: 4.5,  brent: 1.6  },
  { year: 1966, effr: 5.1,  cpi: 2.9,  t10y: 4.9,  unemp: 3.8,  brent: 1.6  },
  { year: 1967, effr: 4.2,  cpi: 3.1,  t10y: 5.1,  unemp: 3.8,  brent: 1.7  },
  { year: 1968, effr: 5.7,  cpi: 4.2,  t10y: 5.6,  unemp: 3.6,  brent: 1.7  },
  { year: 1969, effr: 8.2,  cpi: 5.5,  t10y: 6.7,  unemp: 3.5,  brent: 1.8  },
  { year: 1970, effr: 7.2,  cpi: 5.7,  t10y: 7.4,  unemp: 4.9,  brent: 1.8  },
  { year: 1971, effr: 4.7,  cpi: 4.4,  t10y: 6.2,  unemp: 5.9,  brent: 2.2  },
  { year: 1972, effr: 4.4,  cpi: 3.2,  t10y: 6.2,  unemp: 5.6,  brent: 2.5  },
  { year: 1973, effr: 8.7,  cpi: 6.2,  t10y: 6.8,  unemp: 4.9,  brent: 4.8  },
  { year: 1974, effr: 10.5, cpi: 11.0, t10y: 7.6,  unemp: 5.6,  brent: 11.6 },
  { year: 1975, effr: 5.8,  cpi: 9.1,  t10y: 8.0,  unemp: 8.5,  brent: 11.5 },
  { year: 1976, effr: 5.0,  cpi: 5.8,  t10y: 7.6,  unemp: 7.7,  brent: 12.8 },
  { year: 1977, effr: 5.5,  cpi: 6.5,  t10y: 7.4,  unemp: 7.1,  brent: 13.9 },
  { year: 1978, effr: 7.9,  cpi: 7.6,  t10y: 8.4,  unemp: 6.1,  brent: 14.0 },
  { year: 1979, effr: 11.2, cpi: 11.3, t10y: 9.4,  unemp: 5.8,  brent: 31.6 },
  { year: 1980, effr: 13.4, cpi: 13.5, t10y: 11.4, unemp: 7.1,  brent: 36.8 },
  { year: 1981, effr: 16.4, cpi: 10.3, t10y: 13.9, unemp: 7.6,  brent: 35.9 },
  { year: 1982, effr: 12.2, cpi: 6.1,  t10y: 13.0, unemp: 9.7,  brent: 32.4 },
  { year: 1983, effr: 9.1,  cpi: 3.2,  t10y: 11.1, unemp: 9.6,  brent: 29.6 },
  { year: 1984, effr: 10.2, cpi: 4.3,  t10y: 12.5, unemp: 7.5,  brent: 28.8 },
  { year: 1985, effr: 8.1,  cpi: 3.6,  t10y: 10.6, unemp: 7.2,  brent: 27.6 },
  { year: 1986, effr: 6.8,  cpi: 1.9,  t10y: 7.7,  unemp: 7.0,  brent: 14.4 },
  { year: 1987, effr: 6.7,  cpi: 3.6,  t10y: 8.4,  unemp: 6.2,  brent: 18.4 },
  { year: 1988, effr: 7.6,  cpi: 4.1,  t10y: 8.9,  unemp: 5.5,  brent: 14.9 },
  { year: 1989, effr: 9.2,  cpi: 4.8,  t10y: 8.5,  unemp: 5.3,  brent: 18.2 },
  { year: 1990, effr: 8.1,  cpi: 5.4,  t10y: 8.6,  unemp: 5.6,  brent: 23.7 },
  { year: 1991, effr: 5.7,  cpi: 4.2,  t10y: 7.9,  unemp: 6.8,  brent: 20.0 },
  { year: 1992, effr: 3.5,  cpi: 3.0,  t10y: 7.0,  unemp: 7.5,  brent: 19.4 },
  { year: 1993, effr: 3.0,  cpi: 3.0,  t10y: 5.9,  unemp: 6.9,  brent: 17.0 },
  { year: 1994, effr: 5.5,  cpi: 2.6,  t10y: 7.1,  unemp: 6.1,  brent: 15.8 },
  { year: 1995, effr: 5.8,  cpi: 2.8,  t10y: 6.6,  unemp: 5.6,  brent: 17.0 },
  { year: 1996, effr: 5.3,  cpi: 3.0,  t10y: 6.4,  unemp: 5.4,  brent: 20.7 },
  { year: 1997, effr: 5.5,  cpi: 2.3,  t10y: 6.4,  unemp: 4.9,  brent: 19.1 },
  { year: 1998, effr: 5.4,  cpi: 1.6,  t10y: 5.3,  unemp: 4.5,  brent: 13.1 },
  { year: 1999, effr: 5.0,  cpi: 2.2,  t10y: 5.6,  unemp: 4.2,  brent: 17.9 },
  { year: 2000, effr: 6.5,  cpi: 3.4,  t10y: 6.0,  unemp: 4.0,  brent: 28.5 },
  { year: 2001, effr: 3.9,  cpi: 2.8,  t10y: 5.0,  unemp: 4.7,  brent: 24.5 },
  { year: 2002, effr: 1.7,  cpi: 1.6,  t10y: 4.6,  unemp: 5.8,  brent: 25.0 },
  { year: 2003, effr: 1.1,  cpi: 2.3,  t10y: 4.0,  unemp: 6.0,  brent: 28.8 },
  { year: 2004, effr: 1.4,  cpi: 2.7,  t10y: 4.3,  unemp: 5.5,  brent: 38.3 },
  { year: 2005, effr: 3.2,  cpi: 3.4,  t10y: 4.3,  unemp: 5.1,  brent: 54.5 },
  { year: 2006, effr: 5.0,  cpi: 3.2,  t10y: 4.8,  unemp: 4.6,  brent: 65.1 },
  { year: 2007, effr: 5.0,  cpi: 2.9,  t10y: 4.6,  unemp: 4.6,  brent: 72.4 },
  { year: 2008, effr: 2.0,  cpi: 3.8,  t10y: 3.7,  unemp: 5.8,  brent: 97.2 },
  { year: 2009, effr: 0.2,  cpi: -0.3, t10y: 3.3,  unemp: 9.3,  brent: 61.7 },
  { year: 2010, effr: 0.2,  cpi: 1.6,  t10y: 3.2,  unemp: 9.6,  brent: 79.5 },
  { year: 2011, effr: 0.1,  cpi: 3.2,  t10y: 2.8,  unemp: 8.9,  brent: 111.3 },
  { year: 2012, effr: 0.1,  cpi: 2.1,  t10y: 1.8,  unemp: 8.1,  brent: 111.7 },
  { year: 2013, effr: 0.1,  cpi: 1.5,  t10y: 2.4,  unemp: 7.4,  brent: 108.7 },
  { year: 2014, effr: 0.1,  cpi: 1.6,  t10y: 2.5,  unemp: 6.2,  brent: 98.9 },
  { year: 2015, effr: 0.2,  cpi: 0.1,  t10y: 2.1,  unemp: 5.3,  brent: 52.4 },
  { year: 2016, effr: 0.4,  cpi: 1.3,  t10y: 1.8,  unemp: 4.9,  brent: 43.6 },
  { year: 2017, effr: 1.0,  cpi: 2.1,  t10y: 2.3,  unemp: 4.4,  brent: 54.2 },
  { year: 2018, effr: 1.8,  cpi: 2.4,  t10y: 2.9,  unemp: 3.9,  brent: 71.1 },
  { year: 2019, effr: 2.2,  cpi: 1.8,  t10y: 2.1,  unemp: 3.7,  brent: 64.4 },
  { year: 2020, effr: 0.4,  cpi: 1.2,  t10y: 0.9,  unemp: 8.1,  brent: 41.8 },
  { year: 2021, effr: 0.1,  cpi: 4.7,  t10y: 1.4,  unemp: 5.4,  brent: 70.9 },
  { year: 2022, effr: 1.7,  cpi: 8.0,  t10y: 3.0,  unemp: 3.6,  brent: 99.0 },
  { year: 2023, effr: 5.0,  cpi: 4.1,  t10y: 4.0,  unemp: 3.6,  brent: 82.5 },
  { year: 2024, effr: 5.3,  cpi: 2.9,  t10y: 4.2,  unemp: 4.0,  brent: 80.0 },
];

const WARS = [
  { name: "Vietnam",     start: 1965, end: 1975, color: "#f97316" },
  { name: "Gulf War",    start: 1990, end: 1991, color: "#facc15" },
  { name: "Afghanistan", start: 2001, end: 2021, color: "#a855f7" },
  { name: "Iraq War",    start: 2003, end: 2011, color: "#3b82f6" },
];

const SERIES = [
  { key: "effr",   label: "EFFR",         color: "#22d3ee", desc: "Effective Fed Funds Rate", axis: "left",  fmt: v => `${v?.toFixed(1)}%` },
  { key: "cpi",    label: "CPI YoY",      color: "#f87171", desc: "Consumer Price Inflation", axis: "left",  fmt: v => `${v?.toFixed(1)}%` },
  { key: "t10y",   label: "10Y Treasury", color: "#4ade80", desc: "10-Year Treasury Yield",   axis: "left",  fmt: v => `${v?.toFixed(1)}%` },
  { key: "unemp",  label: "Unemployment", color: "#fbbf24", desc: "Unemployment Rate",        axis: "left",  fmt: v => `${v?.toFixed(1)}%` },
  { key: "brent",  label: "Brent Crude",  color: "#e879f9", desc: "Oil Price (USD/bbl)",      axis: "right", fmt: v => `$${v?.toFixed(0)}` },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const activeWars = WARS.filter(w => label >= w.start && label <= w.end);
  return (
    <div style={{
      background: "#08080f",
      border: "1px solid #1e1e2e",
      borderRadius: 10,
      padding: "14px 18px",
      fontFamily: "'IBM Plex Mono', monospace",
      boxShadow: "0 12px 40px rgba(0,0,0,0.8)",
      minWidth: 180,
    }}>
      <div style={{ color: "#888", fontSize: 10, letterSpacing: "0.2em", marginBottom: 6 }}>YEAR</div>
      <div style={{ color: "#fff", fontSize: 20, fontWeight: 700, marginBottom: 10 }}>{label}</div>
      {SERIES.map(s => {
        const p = payload.find(x => x.dataKey === s.key);
        return p ? (
          <div key={s.key} style={{ display: "flex", justifyContent: "space-between", gap: 20, marginBottom: 4 }}>
            <span style={{ color: "#666", fontSize: 11 }}>{s.label}</span>
            <span style={{ color: s.color, fontSize: 12, fontWeight: 700 }}>{s.fmt(p.value)}</span>
          </div>
        ) : null;
      })}
      {activeWars.length > 0 && (
        <div style={{ marginTop: 10, borderTop: "1px solid #1e1e2e", paddingTop: 8 }}>
          {activeWars.map(w => (
            <div key={w.name} style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: w.color }} />
              <span style={{ color: w.color, fontSize: 10, fontWeight: 700 }}>{w.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default function MacroWarsChart() {
  const [hoveredWar, setHoveredWar] = useState(null);
  const [hiddenSeries, setHiddenSeries] = useState(new Set());

  const toggleSeries = (key) => {
    setHiddenSeries(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  return (
    <div style={{
      background: "#05050d",
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "40px 24px",
      fontFamily: "'IBM Plex Mono', monospace",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&family=Playfair+Display:wght@700;900&display=swap');
        * { box-sizing: border-box; }
        .series-pill:hover { opacity: 1 !important; transform: translateY(-1px); }
        .war-badge:hover { opacity: 1 !important; }
      `}</style>

      {/* Header */}
      <div style={{ width: "100%", maxWidth: 1020, marginBottom: 28 }}>
        <div style={{ color: "#22d3ee", fontSize: 10, letterSpacing: "0.3em", marginBottom: 8, fontWeight: 600 }}>
          U.S. MACROECONOMIC INDICATORS · 1954–2024
        </div>
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "clamp(24px, 4vw, 44px)",
          fontWeight: 900,
          color: "#ededf0",
          margin: 0,
          lineHeight: 1.1,
          letterSpacing: "-0.02em",
        }}>
          Rates, Inflation & Labor<br />
          <span style={{ color: "#333" }}>Across American Wars</span>
        </h1>
        <p style={{ color: "#444", fontSize: 12, marginTop: 10 }}>
          Annual averages · Shaded regions = active U.S. military engagement · Click series to show/hide
        </p>
      </div>

      {/* Series pills */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", width: "100%", maxWidth: 1020 }}>
        {SERIES.map(s => {
          const hidden = hiddenSeries.has(s.key);
          return (
            <button
              key={s.key}
              className="series-pill"
              onClick={() => toggleSeries(s.key)}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                background: hidden ? "#0d0d18" : `${s.color}15`,
                border: `1px solid ${hidden ? "#1e1e2e" : s.color + "55"}`,
                borderRadius: 8, padding: "8px 14px",
                cursor: "pointer", transition: "all 0.2s ease",
                opacity: hidden ? 0.4 : 1,
              }}
            >
              <div style={{
                width: 20, height: 3, borderRadius: 2,
                background: hidden ? "#333" : s.color,
              }} />
              <div>
                <div style={{ color: hidden ? "#555" : s.color, fontSize: 11, fontWeight: 700, letterSpacing: "0.05em" }}>
                  {s.label}
                </div>
                <div style={{ color: "#444", fontSize: 10 }}>{s.desc}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* War badges */}
      <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap", width: "100%", maxWidth: 1020 }}>
        {WARS.map(w => (
          <button
            key={w.name}
            className="war-badge"
            onMouseEnter={() => setHoveredWar(w.name)}
            onMouseLeave={() => setHoveredWar(null)}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              background: hoveredWar === w.name ? `${w.color}18` : "transparent",
              border: `1px solid ${w.color}40`,
              borderRadius: 6, padding: "5px 10px",
              cursor: "pointer", transition: "all 0.15s ease",
              opacity: hoveredWar && hoveredWar !== w.name ? 0.4 : 1,
            }}
          >
            <div style={{ width: 8, height: 8, borderRadius: 2, background: w.color, opacity: 0.9 }} />
            <span style={{ color: w.color, fontSize: 10, fontWeight: 700, letterSpacing: "0.08em" }}>{w.name}</span>
            <span style={{ color: "#444", fontSize: 10 }}>{w.start}–{w.end}</span>
          </button>
        ))}
      </div>

      {/* Chart */}
      <div style={{ width: "100%", maxWidth: 1020, height: 500, position: "relative" }}>
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%,-50%)",
          width: "70%", height: "60%",
          background: "radial-gradient(ellipse, rgba(34,211,238,0.03) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={DATA} margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
            <defs>
              {SERIES.map(s => (
                <linearGradient key={s.key} id={`g-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={s.color} stopOpacity={0.12} />
                  <stop offset="95%" stopColor={s.color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>

            <CartesianGrid strokeDasharray="2 8" stroke="#111120" vertical={false} />

            {/* Zero line reference */}
            <ReferenceArea yAxisId="left" y1={0} y2={0} stroke="#333" strokeWidth={1} />

            {WARS.map(w => (
              <ReferenceArea
                key={w.name}
                yAxisId="left"
                x1={w.start} x2={w.end}
                fill={w.color}
                fillOpacity={hoveredWar === w.name ? 0.12 : 0.05}
                stroke={w.color}
                strokeOpacity={hoveredWar === w.name ? 0.4 : 0.15}
                strokeWidth={1}
              />
            ))}

            <XAxis
              dataKey="year"
              tickLine={false}
              axisLine={{ stroke: "#1e1e2e" }}
              tick={{ fill: "#444", fontSize: 11, fontFamily: "'IBM Plex Mono', monospace" }}
              tickCount={9}
            />
            <YAxis
              yAxisId="left"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#444", fontSize: 11, fontFamily: "'IBM Plex Mono', monospace" }}
              tickFormatter={v => `${v}%`}
              width={46}
              domain={[-2, 20]}
              ticks={[0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20]}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#e879f9", fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", opacity: 0.6 }}
              tickFormatter={v => `$${v}`}
              width={52}
              domain={[0, 140]}
              ticks={[0, 20, 40, 60, 80, 100, 120, 140]}
            />
            <Tooltip content={<CustomTooltip />}
              cursor={{ stroke: "#ffffff18", strokeWidth: 1, strokeDasharray: "4 4" }}
            />

            {SERIES.map(s => (
              <Line
                key={s.key}
                yAxisId={s.axis}
                type="monotone"
                dataKey={s.key}
                stroke={s.color}
                strokeWidth={hiddenSeries.has(s.key) ? 0 : s.key === "brent" ? 2.5 : 2}
                dot={false}
                activeDot={hiddenSeries.has(s.key) ? false : { r: 5, fill: s.color, stroke: "#05050d", strokeWidth: 2 }}
                opacity={hiddenSeries.has(s.key) ? 0 : 1}
                strokeDasharray={s.key === "unemp" ? "6 3" : s.key === "brent" ? "none" : "none"}
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Key callouts */}
      <div style={{
        width: "100%", maxWidth: 1020,
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: 12, marginTop: 28,
      }}>
        {[
          { label: "Volcker Peak (1981)", value: "EFFR 16.4% / CPI 10.3%", color: "#f87171" },
          { label: "Oil Shock (1979–80)", value: "Brent surged $2 → $37/bbl", color: "#e879f9" },
          { label: "Iraq War Oil Boom", value: "Brent $29 → $97 (2003–08)", color: "#3b82f6" },
          { label: "COVID Shock (2020)", value: "Brent crashed to $42/bbl", color: "#fbbf24" },
        ].map(c => (
          <div key={c.label} style={{
            background: "#08080f",
            border: "1px solid #141424",
            borderRadius: 8,
            padding: "12px 16px",
          }}>
            <div style={{ color: "#444", fontSize: 10, marginBottom: 4, letterSpacing: "0.08em" }}>{c.label}</div>
            <div style={{ color: c.color, fontSize: 12, fontWeight: 700 }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        width: "100%", maxWidth: 1020,
        marginTop: 20,
        borderTop: "1px solid #0f0f1e",
        paddingTop: 14,
        display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8,
      }}>
        <span style={{ color: "#2a2a3a", fontSize: 11 }}>Sources: FRED · BLS · U.S. Treasury · Federal Reserve · EIA / Macrotrends</span>
        <span style={{ color: "#2a2a3a", fontSize: 11 }}>Brent on right axis ($/bbl) · All others left axis (%)</span>
      </div>
    </div>
  );
}
