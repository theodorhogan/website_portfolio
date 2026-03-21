import { useState } from "react";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine,
} from "recharts";

/* ===================================================================
   TERMINAL — Full System Overview (One-Shot Snapshot)
   Static rendering of Dispatch / Duration / Beta views
   Data frozen: 14-MAR-26 (wk 11)
   =================================================================== */

// -- Design tokens ---------------------------------------------------
const T = {
  bg:         "#080c10",
  bgPanel:    "#0d1117",
  bgElev:     "#111820",
  bgHover:    "#161e28",
  bgActive:   "#1a2535",
  border:     "#1d2635",
  borderB:    "#253045",
  borderA:    "#2d3d55",
  text:       "#dce6f0",
  textDim:    "#6b7a99",
  textMuted:  "#404d65",
  textBright: "#f0f6ff",
  amber:      "#f59e0b",
  cyan:       "#22d3ee",
  chartreuse: "#a3e635",
  red:        "#ef4444",
  green:      "#34d399",
  blue:       "#60a5fa",
  purple:     "#a78bfa",
  orange:     "#fb923c",
  mono: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace",
};

const S = {
  panel: {
    background: T.bgPanel,
    border: `1px solid ${T.border}`,
    borderRadius: 6,
    overflow: "hidden",
  },
  panelHead: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "6px 12px", borderBottom: `1px solid ${T.border}`,
    fontFamily: T.mono, fontSize: 10, fontWeight: 700,
    letterSpacing: "0.1em", color: T.textDim,
  },
  panelBody: { padding: 12 },
  sectionHead: (color) => ({
    display: "flex", alignItems: "center", gap: 8,
    margin: "16px 0 8px", fontSize: 11, fontWeight: 800,
    letterSpacing: "0.1em", color: T.textDim,
    textTransform: "uppercase", fontFamily: T.mono,
  }),
  sectionBar: (color) => ({
    width: 3, height: 14, background: color, borderRadius: 2, flexShrink: 0,
  }),
  badge: (bg, fg) => ({
    display: "inline-block", padding: "1px 6px", borderRadius: 3,
    fontSize: 10, fontWeight: 700, fontFamily: T.mono,
    background: bg, color: fg, border: `1px solid ${fg}33`,
  }),
  statCard: (accent) => ({
    background: T.bgPanel, border: `1px solid ${T.border}`,
    borderRadius: 6, borderTop: `2px solid ${accent}`,
    padding: "8px 12px", minWidth: 100,
  }),
  th: {
    fontFamily: T.mono, fontSize: 10, fontWeight: 700,
    letterSpacing: "0.08em", color: T.textDim,
    padding: "4px 8px", textAlign: "left", whiteSpace: "nowrap",
    borderBottom: `1px solid ${T.border}`,
  },
  td: {
    fontFamily: T.mono, fontSize: 11, padding: "4px 8px",
    borderBottom: `1px solid ${T.border}`, whiteSpace: "nowrap",
    fontVariantNumeric: "tabular-nums",
  },
};

// -- Hardcoded data --------------------------------------------------

const YIELD_CURVE = [
  { tenor: "1M", cur: 4.31, prev: 4.33 },
  { tenor: "2M", cur: 4.29, prev: 4.30 },
  { tenor: "3M", cur: 4.27, prev: 4.29 },
  { tenor: "6M", cur: 4.18, prev: 4.21 },
  { tenor: "1Y", cur: 4.05, prev: 4.10 },
  { tenor: "2Y", cur: 3.95, prev: 4.01 },
  { tenor: "3Y", cur: 3.93, prev: 3.98 },
  { tenor: "5Y", cur: 4.01, prev: 4.05 },
  { tenor: "7Y", cur: 4.12, prev: 4.15 },
  { tenor: "10Y", cur: 4.27, prev: 4.31 },
  { tenor: "20Y", cur: 4.55, prev: 4.58 },
  { tenor: "30Y", cur: 4.52, prev: 4.56 },
];

const SPX_DAILY = [
  { date: "Sep 25", value: 5475 }, { date: "Oct 25", value: 5560 },
  { date: "Nov 25", value: 5680 }, { date: "Dec 25", value: 5880 },
  { date: "Jan 26", value: 5920 }, { date: "Feb 26", value: 5750 },
  { date: "Mar 1", value: 5680 }, { date: "Mar 3", value: 5620 },
  { date: "Mar 5", value: 5590 }, { date: "Mar 7", value: 5550 },
  { date: "Mar 10", value: 5520 }, { date: "Mar 14", value: 5488 },
];

const ZQ_FUTURES = [
  { label: "Mar 26", rate: 4.33 }, { label: "Apr 26", rate: 4.33 },
  { label: "May 26", rate: 4.30 }, { label: "Jun 26", rate: 4.22 },
  { label: "Jul 26", rate: 4.17 }, { label: "Aug 26", rate: 4.10 },
  { label: "Sep 26", rate: 4.02 }, { label: "Oct 26", rate: 3.97 },
  { label: "Nov 26", rate: 3.92 }, { label: "Dec 26", rate: 3.88 },
  { label: "Jan 27", rate: 3.85 }, { label: "Feb 27", rate: 3.82 },
];

const INDICES = [
  { name: "S&P 500",    ticker: "SPX",   price: 5488.12, chg: -2.67, hi52: 6144 },
  { name: "NASDAQ 100", ticker: "NDX",   price: 19032.45, chg: -3.15, hi52: 22222 },
  { name: "DJIA",       ticker: "DJI",   price: 40821.30, chg: -1.83, hi52: 45074 },
  { name: "STOXX 600",  ticker: "SXXP",  price: 548.90,  chg: +0.45, hi52: 555 },
  { name: "DAX 40",     ticker: "DAX",   price: 22891.68, chg: +0.72, hi52: 23476 },
  { name: "FTSE 100",   ticker: "UKX",   price: 8632.10, chg: -0.38, hi52: 8908 },
];

const US_SECTORS = [
  { name: "Info Tech",   ticker: "XLK",  chg: -3.82 },
  { name: "Financials",  ticker: "XLF",  chg: -1.45 },
  { name: "Healthcare",  ticker: "XLV",  chg: -0.92 },
  { name: "Cons. Disc.", ticker: "XLY",  chg: -4.10 },
  { name: "Comm. Svcs",  ticker: "XLC",  chg: -2.76 },
  { name: "Industrials",  ticker: "XLI",  chg: -1.88 },
  { name: "Cons. Staples", ticker: "XLP", chg: +0.34 },
  { name: "Energy",      ticker: "XLE",  chg: +1.22 },
  { name: "Materials",   ticker: "XLB",  chg: -0.67 },
  { name: "Utilities",   ticker: "XLU",  chg: +0.58 },
  { name: "Real Estate", ticker: "XLRE", chg: -1.15 },
];

const EU_SECTORS = [
  { name: "Info Tech",   ticker: "SX8P",  chg: +1.42 },
  { name: "Financials",  ticker: "SX7P",  chg: +0.88 },
  { name: "Healthcare",  ticker: "SXDP",  chg: +0.21 },
  { name: "Cons. Disc.", ticker: "SXAP",  chg: +0.65 },
  { name: "Comm. Svcs",  ticker: "SXKP",  chg: +0.38 },
  { name: "Industrials",  ticker: "SXNP",  chg: +0.94 },
  { name: "Cons. Staples", ticker: "SX3P", chg: -0.12 },
  { name: "Energy",      ticker: "SXEP",  chg: +1.55 },
  { name: "Materials",   ticker: "SX4P",  chg: +0.72 },
  { name: "Utilities",   ticker: "SX6P",  chg: +0.33 },
  { name: "Real Estate", ticker: "SX86P", chg: -0.28 },
];

const INDUSTRY_DATA = [
  { label: "Information Tech", usPrice: 232.18, usChg: -3.82, usLw: -1.20, euPrice: 98.45, euChg: +1.42, euLw: +0.88 },
  { label: "Financials",       usPrice: 48.92,  usChg: -1.45, usLw: +0.65, euPrice: 42.10, euChg: +0.88, euLw: +0.32 },
  { label: "Healthcare",       usPrice: 143.67, usChg: -0.92, usLw: +0.18, euPrice: 87.33, euChg: +0.21, euLw: -0.14 },
  { label: "Consumer Disc.",   usPrice: 198.44, usChg: -4.10, usLw: -0.88, euPrice: 65.21, euChg: +0.65, euLw: +0.44 },
  { label: "Communication",    usPrice: 92.31,  usChg: -2.76, usLw: -0.55, euPrice: 31.80, euChg: +0.38, euLw: +0.12 },
  { label: "Industrials",       usPrice: 131.78, usChg: -1.88, usLw: +0.33, euPrice: 74.55, euChg: +0.94, euLw: +0.67 },
  { label: "Consumer Staples", usPrice: 81.22,  usChg: +0.34, usLw: +0.42, euPrice: 58.90, euChg: -0.12, euLw: +0.21 },
  { label: "Energy",           usPrice: 89.15,  usChg: +1.22, usLw: +0.78, euPrice: 44.72, euChg: +1.55, euLw: +1.10 },
  { label: "Materials",        usPrice: 86.43,  usChg: -0.67, usLw: +0.14, euPrice: 52.18, euChg: +0.72, euLw: +0.33 },
  { label: "Utilities",        usPrice: 76.88,  usChg: +0.58, usLw: +0.32, euPrice: 39.65, euChg: +0.33, euLw: +0.18 },
  { label: "Real Estate",      usPrice: 42.11,  usChg: -1.15, usLw: -0.44, euPrice: 18.92, euChg: -0.28, euLw: -0.08 },
];

const STOCKS = [
  { name: "NVIDIA",         ticker: "NVDA",  price: 878.35,  chg: -4.22, tags: ["mega"] },
  { name: "Microsoft",      ticker: "MSFT",  price: 402.18,  chg: -1.88, tags: ["mega"] },
  { name: "Apple",          ticker: "AAPL",  price: 218.24,  chg: -2.35, tags: ["mega"] },
  { name: "Alphabet",       ticker: "GOOGL", price: 162.45,  chg: -3.10, tags: ["mega"] },
  { name: "Meta Platforms",  ticker: "META",  price: 582.90,  chg: -2.95, tags: ["mega"] },
  { name: "Amazon",         ticker: "AMZN",  price: 198.72,  chg: -3.44, tags: ["mega"] },
  { name: "Tesla",          ticker: "TSLA",  price: 245.80,  chg: -5.67, tags: ["mega"] },
  { name: "Palantir",       ticker: "PLTR",  price: 82.45,   chg: -6.12, tags: ["mega"] },
  { name: "Salesforce",     ticker: "CRM",   price: 278.90,  chg: -2.88, tags: ["growth"] },
  { name: "Snowflake",      ticker: "SNOW",  price: 168.32,  chg: -4.55, tags: ["growth"] },
  { name: "Cloudflare",     ticker: "NET",   price: 112.60,  chg: -3.78, tags: ["growth"] },
  { name: "CrowdStrike",    ticker: "CRWD",  price: 332.15,  chg: -3.22, tags: ["growth"] },
  { name: "AMD",            ticker: "AMD",   price: 148.90,  chg: -5.10, tags: ["growth"] },
  { name: "IonQ",           ticker: "IONQ",  price: 32.18,   chg: -8.45, tags: ["quantum"] },
  { name: "Rigetti",        ticker: "RGTI",  price: 12.44,   chg: -9.22, tags: ["quantum"] },
  { name: "D-Wave Quantum", ticker: "QBTS",  price: 8.15,    chg: -7.80, tags: ["quantum"] },
];

const RATES_TABLE = {
  tenors: ["US1M","US2M","US3M","US6M","US1Y","US2Y","US3Y","US5Y","US7Y","US10Y","US20Y","US30Y","USSW10"],
  labels: ["1M","2M","3M","6M","1Y","2Y","3Y","5Y","7Y","10Y","20Y","30Y","10Y SW"],
  cycleLowDate:  ["12-Sep","12-Sep","12-Sep","18-Sep","18-Sep","18-Sep","18-Sep","17-Sep","16-Sep","16-Sep","16-Sep","16-Sep","16-Sep"],
  cycleLowRate:  [4.21, 4.18, 4.15, 3.88, 3.62, 3.52, 3.48, 3.50, 3.63, 3.72, 4.02, 4.01, 3.68],
  thisWeek:      [4.31, 4.29, 4.27, 4.18, 4.05, 3.95, 3.93, 4.01, 4.12, 4.27, 4.55, 4.52, 4.22],
  lastWeek:      [4.33, 4.30, 4.29, 4.21, 4.10, 4.01, 3.98, 4.05, 4.15, 4.31, 4.58, 4.56, 4.26],
  ytdStart:      [4.38, 4.35, 4.33, 4.22, 4.12, 4.08, 4.05, 4.10, 4.18, 4.35, 4.62, 4.58, 4.30],
};

const SPREADS = [
  { name: "Investment Grade", ticker: "IG",    value: 92 },
  { name: "High Yield",       ticker: "HY",    value: 342 },
  { name: "IG Emerging Mkt",  ticker: "IG-EM", value: 178 },
  { name: "CCC & Below",      ticker: "CCC",   value: 688 },
  { name: "BB Composite",     ticker: "BB",    value: 215 },
];

const BILLS_NOTES = [
  { name: "Fed Funds Rate",    ticker: "FEDL01", type: "rate",  value: 4.3300 },
  { name: "SOFR",             ticker: "SOFR",   type: "rate",  value: 4.3100 },
  { name: "3-Month T-Bill",   ticker: "GB3",    type: "yield", value: 4.2700 },
  { name: "2-Year Note",      ticker: "GT2",    type: "yield", value: 3.9500 },
  { name: "10-Year Note",     ticker: "GT10",   type: "yield", value: 4.2700 },
];

const SLOPES = [
  { label: "2Y-10Y", thisWk: 32, lastWk: 30, delta: 2, yearStart: 27, ytd: 5 },
  { label: "3M-10Y", thisWk: 0, lastWk: 2, delta: -2, yearStart: 2, ytd: -2 },
];

const CUTS = [
  { label: "EFFR", value: "4.33" },
  { label: "Q1'26", value: "-0.0bp" },
  { label: "Q2'26", value: "-11.0bp" },
  { label: "Q3'26", value: "-31.0bp" },
  { label: "Q4'26", value: "-14.0bp" },
  { label: "TOTAL", value: "-56.0bp" },
];

const ECON_EVENTS = [
  { day: "Mon", label: "NY Fed Inflation Expectations", actual: "3.1%", expected: "3.0%", surprise: "+3.33%", pending: false },
  { day: "Tue", label: "CPI YoY",                      actual: "2.8%", expected: "2.9%", surprise: "-3.45%", pending: false },
  { day: "Tue", label: "CPI Core MoM",                 actual: "0.2%", expected: "0.3%", surprise: "-33.3%", pending: false },
  { day: "Wed", label: "PPI Final Demand YoY",          actual: "3.2%", expected: "3.3%", surprise: "-3.03%", pending: false },
  { day: "Thu", label: "Initial Jobless Claims",         actual: "220K", expected: "225K", surprise: "-2.22%", pending: false },
  { day: "Thu", label: "Retail Sales MoM",               actual: "0.2%", expected: "0.6%", surprise: "-66.7%", pending: false },
  { day: "Fri", label: "U. of Mich. Sentiment (Prelim)", actual: null, expected: "63.2", surprise: null, pending: true },
  { day: "Fri", label: "Industrial Production MoM",      actual: null, expected: "0.2%", surprise: null, pending: true },
];

const NEWSLETTER = {
  title: "Week 11: Tariff Escalation Rattles Risk Assets",
  editions: [
    { date: "14-MAR-26", active: true },
    { date: "07-MAR-26", active: false },
    { date: "28-FEB-26", active: false },
  ],
  body: [
    [
      { t: "text", v: "Risk assets sold off sharply this week as the administration escalated tariff threats against key trading partners. The S&P 500 fell " },
      { t: "pct", v: "-2.67%", sign: "neg" },
      { t: "text", v: " to close at " },
      { t: "actual", v: "5,488" },
      { t: "text", v: " while the NASDAQ dropped " },
      { t: "pct", v: "-3.15%", sign: "neg" },
      { t: "text", v: ". Treasuries rallied on safe-haven demand, with the 10Y yield falling to " },
      { t: "actual", v: "4.27%" },
      { t: "text", v: " from last week's " },
      { t: "expected", v: "4.31%" },
      { t: "text", v: "." },
    ],
    [
      { t: "text", v: "CPI came in cooler than expected at " },
      { t: "actual", v: "2.8% YoY" },
      { t: "text", v: " vs the consensus estimate of " },
      { t: "expected", v: "2.9%" },
      { t: "text", v: ". Core CPI MoM printed " },
      { t: "actual", v: "0.2%" },
      { t: "text", v: " against expectations of " },
      { t: "expected", v: "0.3%" },
      { t: "text", v: ". This marks the first sub-consensus core reading in four months, adding fuel to rate-cut expectations. Fed funds futures now imply " },
      { t: "actual", v: "2.2 cuts" },
      { t: "text", v: " by year-end versus " },
      { t: "expected", v: "1.8" },
      { t: "text", v: " a week ago." },
    ],
    [
      { t: "text", v: "European equities diverged from US peers, with the STOXX 600 posting a modest " },
      { t: "pct", v: "+0.45%", sign: "pos" },
      { t: "text", v: " gain. The DAX outperformed at " },
      { t: "pct", v: "+0.72%", sign: "pos" },
      { t: "text", v: " driven by strong industrials and financials. Retail sales disappointed at " },
      { t: "actual", v: "0.2% MoM" },
      { t: "text", v: " vs " },
      { t: "expected", v: "0.6%" },
      { t: "text", v: " expected, raising concerns about consumer spending momentum heading into Q2." },
    ],
  ],
};

// -- Helpers ---------------------------------------------------------
const pctColor = (v) => v > 0 ? T.green : v < 0 ? T.red : T.textDim;
const fmtPct = (v) => `${v > 0 ? "+" : ""}${v.toFixed(2)}%`;
const fmtBps = (v, sign = false) => {
  if (v === null || v === undefined) return "--";
  const s = sign && v > 0 ? "+" : "";
  return `${s}${v}bp`;
};
const bpsColor = (v) => {
  if (v === null || v === undefined || v === 0) return T.textDim;
  return v < 0 ? T.green : T.red;
};
const chgColor = (v) => {
  if (v === null || v === undefined || Math.abs(v) < 0.005) return T.textDim;
  return v < 0 ? T.green : T.red;
};
const chgFmt = (v) => {
  if (v === null || v === undefined) return "";
  return `${v > 0 ? "+" : ""}${v.toFixed(2)}`;
};

function SectionHeadEl({ title, accent }) {
  return (
    <div style={S.sectionHead(accent)}>
      <div style={S.sectionBar(accent)} />
      {title}
    </div>
  );
}

function StatCardEl({ label, value, sub, accent }) {
  return (
    <div style={S.statCard(accent)}>
      <div style={{ fontSize: 9, fontWeight: 700, color: T.textDim, letterSpacing: "0.08em", fontFamily: T.mono }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 800, color: T.textBright, fontFamily: T.mono, marginTop: 2 }}>{value}</div>
      {sub && <div style={{ fontSize: 9, color: T.textDim, fontFamily: T.mono, marginTop: 1 }}>{sub}</div>}
    </div>
  );
}

function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: T.bgElev, border: `1px solid ${T.border}`, borderRadius: 4, padding: "6px 10px", fontFamily: T.mono, fontSize: 10 }}>
      <div style={{ color: T.textDim, marginBottom: 3 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color }}>
          {p.name}: <strong>{typeof p.value === "number" ? p.value.toFixed(3) : p.value}</strong>
        </div>
      ))}
    </div>
  );
}

// ====================================================================
//  DISPATCH PAGE
// ====================================================================
function DispatchPage() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 16 }}>
      {/* Newsletter */}
      <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 0 }}>
        {/* Sidebar */}
        <div style={{ ...S.panel, borderRadius: "6px 0 0 6px" }}>
          <div style={S.panelHead}><span>EDITIONS</span><span style={{ marginLeft: "auto", fontWeight: 400 }}>3</span></div>
          <div style={{ padding: 0 }}>
            {NEWSLETTER.editions.map((ed, i) => (
              <div key={i} style={{
                padding: "8px 12px", cursor: "pointer",
                background: ed.active ? T.bgActive : "transparent",
                borderLeft: ed.active ? `2px solid ${T.amber}` : "2px solid transparent",
                borderBottom: `1px solid ${T.border}`,
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: ed.active ? T.amber : T.text, fontFamily: T.mono }}>{ed.date}</div>
              </div>
            ))}
          </div>
        </div>
        {/* Main content */}
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {/* Header */}
          <div style={{ ...S.panel, borderRadius: "0 6px 0 0", borderLeft: "none" }}>
            <div style={{ padding: "12px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 10, color: T.textDim, fontFamily: T.mono }}>14-MAR-2026</span>
                <span style={S.badge(`${T.amber}18`, T.amber)}>WEEK OF 14-MAR-26</span>
              </div>
              <h1 style={{ fontSize: 16, fontWeight: 800, color: T.textBright, margin: "4px 0 8px", fontFamily: T.mono }}>{NEWSLETTER.title}</h1>
              <div style={{ display: "flex", gap: 8 }}>
                <button style={{ background: T.bgElev, border: `1px solid ${T.border}`, borderRadius: 4, padding: "3px 10px", color: T.textDim, fontFamily: T.mono, fontSize: 10, cursor: "pointer" }}>&larr; PREV</button>
                <button style={{ background: T.bgElev, border: `1px solid ${T.border}`, borderRadius: 4, padding: "3px 10px", color: T.textDim, fontFamily: T.mono, fontSize: 10, cursor: "pointer" }}>NEXT &rarr;</button>
              </div>
            </div>
          </div>
          {/* Body */}
          <div style={{ ...S.panel, borderRadius: "0 0 6px 0", borderLeft: "none", borderTop: "none", flex: 1 }}>
            <div style={S.panelBody}>
              {NEWSLETTER.body.map((para, pi) => (
                <p key={pi} style={{ fontSize: 12, lineHeight: 1.7, color: T.text, fontFamily: T.mono, margin: "0 0 14px" }}>
                  {para.map((seg, si) => {
                    if (seg.t === "actual")   return <span key={si} style={S.badge(`${T.green}18`, T.green)}>{seg.v}</span>;
                    if (seg.t === "expected") return <span key={si} style={S.badge(`${T.blue}18`, T.blue)}>{seg.v}</span>;
                    if (seg.t === "pct")      return <span key={si} style={S.badge(seg.sign === "neg" ? `${T.red}18` : `${T.green}18`, seg.sign === "neg" ? T.red : T.green)}>{seg.v}</span>;
                    return <span key={si}>{seg.v}</span>;
                  })}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Econ Calendar */}
      <div>
        {/* Week rail */}
        <div style={{ display: "flex", gap: 4, marginBottom: 8, flexWrap: "wrap" }}>
          {["LATEST", "07-MAR-26", "28-FEB-26", "21-FEB-26", "14-FEB-26", "07-FEB-26"].map((lbl, i) => (
            <button key={i} style={{
              background: i === 0 ? T.bgActive : T.bgPanel,
              border: `1px solid ${i === 0 ? T.amber : T.border}`,
              borderRadius: 4, padding: "3px 8px", fontSize: 9, fontFamily: T.mono,
              color: i === 0 ? T.amber : T.textDim, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 4,
            }}>
              {i === 0 && <span style={{ width: 5, height: 5, borderRadius: "50%", background: T.amber, display: "inline-block" }} />}
              {lbl}
            </button>
          ))}
        </div>
        <div style={S.panel}>
          <div style={S.panelHead}>
            <span>ECONOMIC CALENDAR</span>
            <span style={{ marginLeft: "auto", fontWeight: 400 }}>
              {ECON_EVENTS.filter(e => !e.pending).length} released &middot; {ECON_EVENTS.filter(e => e.pending).length} upcoming
            </span>
          </div>
          <div style={{ padding: 0 }}>
            {/* RELEASED */}
            <div style={{ padding: "6px 12px", fontSize: 9, fontWeight: 800, letterSpacing: "0.1em", color: T.green, fontFamily: T.mono, borderBottom: `1px solid ${T.border}` }}>RELEASED</div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Day", "Event", "Actual", "Est.", "Surprise"].map(h => (
                    <th key={h} style={S.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ECON_EVENTS.filter(e => !e.pending).map((ev, i) => (
                  <tr key={i}>
                    <td style={{ ...S.td, color: T.textDim, width: 36 }}>{ev.day}</td>
                    <td style={{ ...S.td, fontWeight: 500 }}>{ev.label}</td>
                    <td style={S.td}><span style={S.badge(`${T.green}18`, T.green)}>{ev.actual}</span></td>
                    <td style={S.td}><span style={S.badge(`${T.blue}18`, T.blue)}>{ev.expected}</span></td>
                    <td style={{ ...S.td, color: parseFloat(ev.surprise) > 0 ? T.green : parseFloat(ev.surprise) < -5 ? T.red : T.textDim, fontWeight: 700 }}>{ev.surprise}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* UPCOMING */}
            <div style={{ padding: "6px 12px", fontSize: 9, fontWeight: 800, letterSpacing: "0.1em", color: T.amber, fontFamily: T.mono, borderBottom: `1px solid ${T.border}`, borderTop: `1px solid ${T.border}` }}>UPCOMING</div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Day", "Event", "Actual", "Est.", ""].map((h, i) => (
                    <th key={i} style={S.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ECON_EVENTS.filter(e => e.pending).map((ev, i) => (
                  <tr key={i} style={{ opacity: 0.5 }}>
                    <td style={{ ...S.td, color: T.textDim, width: 36 }}>{ev.day}</td>
                    <td style={{ ...S.td, fontWeight: 500 }}>{ev.label}</td>
                    <td style={S.td}><span style={{ color: T.textMuted }}>&ndash;</span></td>
                    <td style={S.td}><span style={S.badge(`${T.blue}18`, T.blue)}>{ev.expected}</span></td>
                    <td style={S.td}><span style={{ color: T.textMuted }}>&ndash;</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ====================================================================
//  DURATION PAGE
// ====================================================================
function DurationPage() {
  const [cycleMode, setCycleMode] = useState("low");

  const ratesChange = RATES_TABLE.thisWeek.map((v, i) => +(v - RATES_TABLE.lastWeek[i]).toFixed(2));
  const ytdChange = RATES_TABLE.thisWeek.map((v, i) => +(v - RATES_TABLE.ytdStart[i]).toFixed(2));

  const slope3m10y = Math.round((YIELD_CURVE.find(d => d.tenor === "10Y").cur - YIELD_CURVE.find(d => d.tenor === "3M").cur) * 100);
  const slope2y10y = Math.round((YIELD_CURVE.find(d => d.tenor === "10Y").cur - YIELD_CURVE.find(d => d.tenor === "2Y").cur) * 100);

  const effr = ZQ_FUTURES[0].rate;
  const terminal = ZQ_FUTURES[ZQ_FUTURES.length - 1].rate;
  const cutsImplied = Math.round((effr - terminal) / 0.25);

  return (
    <div>
      {/* Rates & Yields */}
      <SectionHeadEl title="US Treasury - Rates & Yields" accent={T.amber} />
      <div style={S.panel}>
        <div style={{ ...S.panelHead, justifyContent: "space-between" }}>
          <span style={{ fontWeight: 700 }}>Money to Capital Markets</span>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 9, color: T.textDim }}>Cycle (mo)</span>
            <input type="number" defaultValue={6} min={1} max={36} style={{
              width: 40, background: T.bgElev, border: `1px solid ${T.border}`,
              borderRadius: 3, color: T.text, fontFamily: T.mono, fontSize: 10, padding: "2px 4px", textAlign: "center",
            }} />
            <select value={cycleMode} onChange={e => setCycleMode(e.target.value)} style={{
              background: T.bgElev, border: `1px solid ${T.border}`,
              borderRadius: 3, color: T.text, fontFamily: T.mono, fontSize: 10, padding: "2px 6px",
            }}>
              <option value="high">Cycle High</option>
              <option value="low">Cycle Low</option>
            </select>
          </div>
        </div>
        <div style={{ overflowX: "auto", padding: 0 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
            <tbody>
              {/* Category row */}
              <tr style={{ background: T.bgElev }}>
                <th style={{ ...S.th, minWidth: 145, fontWeight: 700 }}>Category</th>
                {RATES_TABLE.labels.map((lbl, i) => (
                  <td key={i} style={{ ...S.td, textAlign: "center", fontWeight: 700, color: T.amber, fontSize: 10 }}>{lbl}</td>
                ))}
              </tr>
              {/* Cycle Low/High Date */}
              <tr>
                <th style={{ ...S.th, fontWeight: 500 }}>{cycleMode === "high" ? "Cycle High Date" : "Cycle Low Date"}</th>
                {RATES_TABLE.cycleLowDate.map((d, i) => <td key={i} style={{ ...S.td, textAlign: "center", color: T.textDim, fontSize: 10 }}>{d}</td>)}
              </tr>
              {/* Cycle Low/High Rate */}
              <tr>
                <th style={{ ...S.th, fontWeight: 500 }}>{cycleMode === "high" ? "Cycle High Rate" : "Cycle Low Rate"}</th>
                {RATES_TABLE.cycleLowRate.map((v, i) => <td key={i} style={{ ...S.td, textAlign: "center", fontSize: 10 }}>{v.toFixed(2)}</td>)}
              </tr>
              {/* This Week */}
              <tr>
                <th style={{ ...S.th, fontWeight: 500 }}>This Week (14-Mar)</th>
                {RATES_TABLE.thisWeek.map((v, i) => <td key={i} style={{ ...S.td, textAlign: "center", fontSize: 10 }}>{v.toFixed(2)}</td>)}
              </tr>
              {/* Last Week */}
              <tr>
                <th style={{ ...S.th, fontWeight: 500 }}>Last Week (07-Mar)</th>
                {RATES_TABLE.lastWeek.map((v, i) => <td key={i} style={{ ...S.td, textAlign: "center", fontSize: 10 }}>{v.toFixed(2)}</td>)}
              </tr>
              {/* Change */}
              <tr>
                <th style={{ ...S.th, fontWeight: 500 }}>Change</th>
                {ratesChange.map((v, i) => (
                  <td key={i} style={{ ...S.td, textAlign: "center", fontSize: 10, fontWeight: 700, color: chgColor(v) }}>{chgFmt(v)}</td>
                ))}
              </tr>
              {/* YTD Start */}
              <tr>
                <th style={{ ...S.th, fontWeight: 500 }}>Yield @ 1/1/2026</th>
                {RATES_TABLE.ytdStart.map((v, i) => <td key={i} style={{ ...S.td, textAlign: "center", fontSize: 10, color: T.textDim }}>{v.toFixed(2)}</td>)}
              </tr>
              {/* YTD Change */}
              <tr>
                <th style={{ ...S.th, fontWeight: 500 }}>YTD</th>
                {ytdChange.map((v, i) => (
                  <td key={i} style={{ ...S.td, textAlign: "center", fontSize: 10, fontWeight: 700, color: chgColor(v) }}>{chgFmt(v)}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 16, marginTop: 16 }}>
        {/* Yield Curve */}
        <div>
          <SectionHeadEl title="Yield Curve" accent={T.amber} />
          <div style={S.panel}>
            <div style={S.panelHead}>
              <span>CURRENT vs PRIOR WEEK</span>
              <span style={{ marginLeft: "auto", fontWeight: 400 }}>14-Mar-26</span>
            </div>
            <div style={S.panelBody}>
              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <span style={S.badge(slope3m10y >= 0 ? `${T.green}22` : `${T.red}22`, slope3m10y >= 0 ? T.green : T.red)}>
                  3M/10Y: {slope3m10y > 0 ? "+" : ""}{slope3m10y}bp
                </span>
                <span style={S.badge(slope2y10y >= 0 ? `${T.green}22` : `${T.red}22`, slope2y10y >= 0 ? T.green : T.red)}>
                  2Y/10Y: {slope2y10y > 0 ? "+" : ""}{slope2y10y}bp
                </span>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={YIELD_CURVE} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
                  <CartesianGrid strokeDasharray="2 4" stroke={T.border} />
                  <XAxis dataKey="tenor" tick={{ fill: T.textDim, fontSize: 10, fontFamily: T.mono }} />
                  <YAxis domain={["auto", "auto"]} tick={{ fill: T.textDim, fontSize: 10, fontFamily: T.mono }} tickFormatter={v => `${v.toFixed(2)}%`} width={50} />
                  <Tooltip content={<ChartTip />} />
                  <Line dataKey="prev" name="Prior week" stroke={T.textMuted} strokeWidth={1} strokeDasharray="4 2" dot={false} isAnimationActive={false} />
                  <Line dataKey="cur" name="Current" stroke={T.amber} strokeWidth={2} dot={{ fill: T.amber, r: 3 }} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Fed Funds Futures */}
        <div>
          <SectionHeadEl title="Fed Funds Futures" accent={T.cyan} />
          <div style={S.panel}>
            <div style={S.panelHead}><span>ZQ IMPLIED RATE PATH</span></div>
            <div style={S.panelBody}>
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                <StatCardEl label="Current EFFR" value={`${effr.toFixed(2)}%`} accent={T.cyan} />
                <StatCardEl label="Terminal (12m)" value={`${terminal.toFixed(2)}%`} accent={T.chartreuse} />
                <StatCardEl label="Cuts Implied" value={`${cutsImplied}\u00d725bp`} accent={T.amber} />
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={ZQ_FUTURES} margin={{ top: 4, right: 8, bottom: 24, left: 0 }}>
                  <CartesianGrid strokeDasharray="2 4" stroke={T.border} />
                  <XAxis dataKey="label" tick={{ fill: T.textDim, fontSize: 9, fontFamily: T.mono }} angle={-30} textAnchor="end" height={36} />
                  <YAxis domain={["auto", "auto"]} tick={{ fill: T.textDim, fontSize: 10, fontFamily: T.mono }} tickFormatter={v => `${v.toFixed(2)}%`} width={48} />
                  <Tooltip content={<ChartTip />} />
                  <Bar dataKey="rate" name="Implied Rate" radius={[2, 2, 0, 0]}>
                    {ZQ_FUTURES.map((_, i) => (
                      <Cell key={i} fill={i === 0 ? T.cyan : i === ZQ_FUTURES.length - 1 ? T.chartreuse : T.blue} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Quarterly Cuts */}
        <div style={{ minWidth: 140 }}>
          <SectionHeadEl title="Quarterly Cuts" accent={T.cyan} />
          <div style={S.panel}>
            <div style={S.panelBody}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: T.textDim, fontFamily: T.mono, marginBottom: 8 }}>CUTS</div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={S.th}>PERIOD</th>
                    <th style={{ ...S.th, textAlign: "right" }}>VALUE</th>
                  </tr>
                </thead>
                <tbody>
                  {CUTS.map((row, i) => {
                    const isTotal = row.label === "TOTAL";
                    const isEffr = row.label === "EFFR";
                    const numVal = parseFloat(row.value);
                    const color = isEffr ? T.text : (isNaN(numVal) || numVal === 0) ? T.textDim : numVal < 0 ? T.green : T.red;
                    return (
                      <tr key={i} style={isTotal ? { borderTop: `1px solid ${T.borderB}` } : {}}>
                        <td style={{ ...S.td, color: T.textDim, fontWeight: isTotal ? 700 : 400 }}>{row.label}</td>
                        <td style={{ ...S.td, textAlign: "right", fontWeight: 700, color }}>{row.value}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 16, marginTop: 16 }}>
        {/* 10Y/2Y Trend */}
        <div>
          <SectionHeadEl title="10Y / 2Y Trend - 6 months" accent={T.amber} />
          <div style={S.panel}>
            <div style={S.panelHead}><span>US TREASURY YIELDS - DAILY</span></div>
            <div style={S.panelBody}>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={[
                  { date: "Sep", y10: 3.72, y2: 3.52 }, { date: "Oct", y10: 3.95, y2: 3.70 },
                  { date: "Nov", y10: 4.15, y2: 3.88 }, { date: "Dec", y10: 4.35, y2: 4.08 },
                  { date: "Jan", y10: 4.30, y2: 4.05 }, { date: "Feb", y10: 4.31, y2: 4.01 },
                  { date: "Mar", y10: 4.27, y2: 3.95 },
                ]} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
                  <defs>
                    <linearGradient id="grad10y" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={T.amber} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={T.amber} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 4" stroke={T.border} />
                  <XAxis dataKey="date" tick={{ fill: T.textDim, fontSize: 9, fontFamily: T.mono }} />
                  <YAxis domain={["auto", "auto"]} tick={{ fill: T.textDim, fontSize: 10, fontFamily: T.mono }} tickFormatter={v => `${v.toFixed(1)}%`} width={42} />
                  <Tooltip content={<ChartTip />} />
                  <ReferenceLine y={4.0} stroke={T.textMuted} strokeDasharray="3 3" />
                  <Area dataKey="y10" name="10Y Yield" stroke={T.amber} fill="url(#grad10y)" strokeWidth={2} dot={false} isAnimationActive={false} />
                  <Line dataKey="y2" name="2Y Yield" stroke={T.cyan} strokeWidth={1.5} dot={false} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <StatCardEl label="10Y UST Yield" value="4.27%" sub="US 10-Year Treasury" accent={T.amber} />
            <StatCardEl label="2Y UST Yield" value="3.95%" sub="US 2-Year Treasury" accent={T.cyan} />
            <StatCardEl label="2s/10s Spread" value="+0.32%" sub="Normal" accent={T.green} />
          </div>
        </div>

        {/* Right column: Slopes + Spreads + Bills */}
        <div>
          {/* Yield Slopes */}
          <SectionHeadEl title="Yield Slopes" accent={T.amber} />
          <div style={S.panel}>
            <div style={S.panelBody}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: T.textDim, fontFamily: T.mono, marginBottom: 8 }}>SLOPES</div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["TICKER", "THIS WK", "LAST WK", "\u0394", "1/1/2026", "YTD \u0394"].map(h => (
                      <th key={h} style={S.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SLOPES.map((r, i) => (
                    <tr key={i}>
                      <td style={{ ...S.td, fontWeight: 700 }}>{r.label}</td>
                      <td style={{ ...S.td, textAlign: "right" }}>{r.thisWk}bp</td>
                      <td style={{ ...S.td, textAlign: "right", color: T.textDim }}>[{r.lastWk}bp]</td>
                      <td style={{ ...S.td, textAlign: "right", fontWeight: 700, color: r.delta > 0 ? T.green : r.delta < 0 ? T.red : T.textDim }}>
                        {r.delta > 0 ? "+" : ""}{r.delta}bp
                      </td>
                      <td style={{ ...S.td, textAlign: "right", color: T.textDim }}>{r.yearStart}bp</td>
                      <td style={{ ...S.td, textAlign: "right", fontWeight: 700, color: r.ytd > 0 ? T.green : r.ytd < 0 ? T.red : T.textDim }}>
                        {r.ytd > 0 ? "+" : ""}{r.ytd}bp
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Credit Spreads */}
          <SectionHeadEl title="Credit Spreads" accent={T.red} />
          <div style={S.panel}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={S.th}>Instrument</th>
                    <th style={S.th}>Ticker</th>
                    <th style={{ ...S.th, textAlign: "right" }}>Spread (bps)</th>
                  </tr>
                </thead>
                <tbody>
                  {SPREADS.map((row, i) => {
                    const color = row.ticker === "HY" ? (row.value > 500 ? T.red : row.value > 350 ? T.orange : T.amber) :
                                  row.ticker === "IG" ? (row.value > 150 ? T.red : row.value > 100 ? T.orange : T.green) : T.text;
                    return (
                      <tr key={i}>
                        <td style={S.td}>{row.name}</td>
                        <td style={{ ...S.td, color: T.textDim }}>{row.ticker}</td>
                        <td style={{ ...S.td, textAlign: "right", fontWeight: 700, color }}>{row.value}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bills & Notes */}
          <SectionHeadEl title="Bills & Notes" accent={T.amber} />
          <div style={S.panel}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={S.th}>Instrument</th>
                    <th style={S.th}>Ticker</th>
                    <th style={S.th}>Type</th>
                    <th style={{ ...S.th, textAlign: "right" }}>Rate/Yield</th>
                  </tr>
                </thead>
                <tbody>
                  {BILLS_NOTES.map((row, i) => {
                    const hi = row.value >= 4.5;
                    const lo = row.value <= 3.3;
                    return (
                      <tr key={i}>
                        <td style={{ ...S.td, fontWeight: 500 }}>{row.name}</td>
                        <td style={{ ...S.td, color: T.textDim }}>{row.ticker}</td>
                        <td style={S.td}>
                          <span style={S.badge(
                            row.type === "rate" ? `${T.blue}18` : `${T.amber}18`,
                            row.type === "rate" ? T.blue : T.amber
                          )}>{row.type.toUpperCase()}</span>
                        </td>
                        <td style={{ ...S.td, textAlign: "right", fontWeight: 700, color: hi ? T.red : lo ? T.green : T.text }}>
                          {row.value.toFixed(4)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ====================================================================
//  BETA PAGE
// ====================================================================
function BetaPage() {
  const [watchTab, setWatchTab] = useState("ALL");

  const filteredStocks = watchTab === "ALL" ? STOCKS :
    watchTab === "MEGA" ? STOCKS.filter(s => s.tags.includes("mega")) :
    watchTab === "GROWTH" ? STOCKS.filter(s => s.tags.includes("growth")) :
    watchTab === "QUANTUM" ? STOCKS.filter(s => s.tags.includes("quantum")) : STOCKS;

  const sectorBarData = (sectors) => [...sectors].sort((a, b) => b.chg - a.chg);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 340px", gap: 16 }}>
      {/* Left col: SPX + Sectors */}
      <div>
        <SectionHeadEl title="S&P 500 - 12-Month Daily" accent={T.green} />
        <div style={S.panel}>
          <div style={S.panelHead}><span>SPX DAILY CLOSE</span></div>
          <div style={S.panelBody}>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <StatCardEl label="S&P 500" value="5,488" accent={T.green} />
              <StatCardEl label="Period Chg" value="-2.67%" accent={T.red} />
              <StatCardEl label="52W High" value="6,144" accent={T.amber} />
              <StatCardEl label="52W Low" value="5,120" accent={T.textDim} />
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={SPX_DAILY} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
                <defs>
                  <linearGradient id="spxGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={T.green} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={T.green} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 4" stroke={T.border} />
                <XAxis dataKey="date" tick={{ fill: T.textDim, fontSize: 9, fontFamily: T.mono }} />
                <YAxis domain={["auto", "auto"]} tick={{ fill: T.textDim, fontSize: 10, fontFamily: T.mono }} tickFormatter={v => v.toFixed(0)} width={52} />
                <Tooltip content={<ChartTip />} />
                <Area dataKey="value" name="S&P 500" stroke={T.green} fill="url(#spxGrad)" strokeWidth={2} dot={false} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <SectionHeadEl title="Sector Performance - Week on Week" accent={T.chartreuse} />
        <div style={S.panel}>
          <div style={S.panelHead}><span>SECTOR ROTATION</span></div>
          <div style={{ ...S.panelBody, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {/* US Sectors */}
            <div>
              <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.1em", color: T.textDim, fontFamily: T.mono, marginBottom: 6 }}>US SECTORS (SPDR)</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={sectorBarData(US_SECTORS)} layout="vertical" margin={{ top: 0, right: 36, bottom: 0, left: 4 }}>
                  <CartesianGrid strokeDasharray="2 4" stroke={T.border} horizontal={false} />
                  <XAxis type="number" domain={["auto", "auto"]} tick={{ fill: T.textDim, fontSize: 9, fontFamily: T.mono }} tickFormatter={v => `${v.toFixed(1)}%`} />
                  <YAxis dataKey="name" type="category" width={70} tick={{ fill: T.textDim, fontSize: 9, fontFamily: T.mono }} />
                  <Tooltip content={<ChartTip />} />
                  <ReferenceLine x={0} stroke={T.borderB} />
                  <Bar dataKey="chg" name="Wk %" radius={[0, 2, 2, 0]}>
                    {sectorBarData(US_SECTORS).map((d, i) => <Cell key={i} fill={d.chg >= 0 ? T.green : T.red} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* EU Sectors */}
            <div>
              <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.1em", color: T.textDim, fontFamily: T.mono, marginBottom: 6 }}>EU SECTORS (STOXX)</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={sectorBarData(EU_SECTORS)} layout="vertical" margin={{ top: 0, right: 36, bottom: 0, left: 4 }}>
                  <CartesianGrid strokeDasharray="2 4" stroke={T.border} horizontal={false} />
                  <XAxis type="number" domain={["auto", "auto"]} tick={{ fill: T.textDim, fontSize: 9, fontFamily: T.mono }} tickFormatter={v => `${v.toFixed(1)}%`} />
                  <YAxis dataKey="name" type="category" width={70} tick={{ fill: T.textDim, fontSize: 9, fontFamily: T.mono }} />
                  <Tooltip content={<ChartTip />} />
                  <ReferenceLine x={0} stroke={T.borderB} />
                  <Bar dataKey="chg" name="Wk %" radius={[0, 2, 2, 0]}>
                    {sectorBarData(EU_SECTORS).map((d, i) => <Cell key={i} fill={d.chg >= 0 ? T.green : T.red} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Mid col: Indices + Industry */}
      <div>
        <SectionHeadEl title="Global Indices" accent={T.amber} />
        <div style={S.panel}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={S.th}>Index</th>
                  <th style={S.th}>Ticker</th>
                  <th style={{ ...S.th, textAlign: "right" }}>Price</th>
                  <th style={{ ...S.th, textAlign: "right" }}>Wk Chg</th>
                  <th style={{ ...S.th, textAlign: "right" }}>52W Hi</th>
                </tr>
              </thead>
              <tbody>
                {INDICES.map((row, i) => (
                  <tr key={i}>
                    <td style={{ ...S.td, fontWeight: 500 }}>{row.name}</td>
                    <td style={{ ...S.td, color: T.textDim }}>{row.ticker}</td>
                    <td style={{ ...S.td, textAlign: "right" }}>{row.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                    <td style={{ ...S.td, textAlign: "right", fontWeight: 700, color: pctColor(row.chg) }}>
                      {row.chg > 0 ? "+" : ""}{row.chg.toFixed(2)}%
                    </td>
                    <td style={{ ...S.td, textAlign: "right", color: row.price >= row.hi52 * 0.99 ? T.amber : T.textDim, fontWeight: row.price >= row.hi52 * 0.99 ? 700 : 400 }}>
                      {row.hi52.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <SectionHeadEl title="Industry Overview - US vs EU" accent={T.blue} />
        <div style={S.panel}>
          <div style={S.panelHead}><span>SECTOR ETFs - WEEK ON WEEK</span></div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th rowSpan={2} style={S.th}>Industry</th>
                  <th colSpan={3} style={{ ...S.th, textAlign: "center", borderBottom: `1px solid ${T.blue}`, color: T.blue }}>US</th>
                  <th colSpan={3} style={{ ...S.th, textAlign: "center", borderBottom: `1px solid ${T.cyan}`, color: T.cyan }}>EU</th>
                </tr>
                <tr>
                  <th style={{ ...S.th, textAlign: "right" }}>Price</th>
                  <th style={{ ...S.th, textAlign: "right" }}>% Chg</th>
                  <th style={{ ...S.th, textAlign: "right", color: T.textMuted }}>[Last wk]</th>
                  <th style={{ ...S.th, textAlign: "right" }}>Price</th>
                  <th style={{ ...S.th, textAlign: "right" }}>% Chg</th>
                  <th style={{ ...S.th, textAlign: "right", color: T.textMuted }}>[Last wk]</th>
                </tr>
              </thead>
              <tbody>
                {INDUSTRY_DATA.map((row, i) => (
                  <tr key={i}>
                    <td style={{ ...S.td, fontWeight: 500, whiteSpace: "nowrap" }}>{row.label}</td>
                    <td style={{ ...S.td, textAlign: "right" }}>{row.usPrice.toFixed(2)}</td>
                    <td style={{ ...S.td, textAlign: "right", fontWeight: 700, color: pctColor(row.usChg) }}>
                      {row.usChg > 0 ? "+" : ""}{row.usChg.toFixed(2)}%
                    </td>
                    <td style={{ ...S.td, textAlign: "right", color: pctColor(row.usLw) }}>
                      [{row.usLw > 0 ? "+" : ""}{row.usLw.toFixed(2)}%]
                    </td>
                    <td style={{ ...S.td, textAlign: "right", borderLeft: `1px solid ${T.border}` }}>{row.euPrice.toFixed(2)}</td>
                    <td style={{ ...S.td, textAlign: "right", fontWeight: 700, color: pctColor(row.euChg) }}>
                      {row.euChg > 0 ? "+" : ""}{row.euChg.toFixed(2)}%
                    </td>
                    <td style={{ ...S.td, textAlign: "right", color: pctColor(row.euLw) }}>
                      [{row.euLw > 0 ? "+" : ""}{row.euLw.toFixed(2)}%]
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Right col: Watchlist */}
      <div>
        <SectionHeadEl title="Watchlist" accent={T.blue} />
        <div style={S.panel}>
          {/* Tab strip */}
          <div style={{ display: "flex", borderBottom: `1px solid ${T.border}` }}>
            {["ALL", "MEGA", "GROWTH", "QUANTUM"].map(tab => (
              <button key={tab} onClick={() => setWatchTab(tab)} style={{
                flex: 1, padding: "6px 0", background: "transparent",
                border: "none", borderBottom: watchTab === tab ? `2px solid ${T.amber}` : "2px solid transparent",
                color: watchTab === tab ? T.amber : T.textDim,
                fontFamily: T.mono, fontSize: 10, fontWeight: 700,
                cursor: "pointer", letterSpacing: "0.08em",
              }}>{tab}</button>
            ))}
          </div>
          {/* Stock table */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={S.th}>Name</th>
                  <th style={S.th}>Ticker</th>
                  <th style={{ ...S.th, textAlign: "right" }}>Price</th>
                  <th style={{ ...S.th, textAlign: "right" }}>Wk Chg</th>
                </tr>
              </thead>
              <tbody>
                {filteredStocks.map((row, i) => (
                  <tr key={i}>
                    <td style={{ ...S.td, fontWeight: 500 }}>{row.name}</td>
                    <td style={{ ...S.td, color: T.textDim, fontWeight: 700 }}>{row.ticker}</td>
                    <td style={{ ...S.td, textAlign: "right" }}>${row.price.toFixed(2)}</td>
                    <td style={{ ...S.td, textAlign: "right", fontWeight: 700, color: pctColor(row.chg) }}>
                      {row.chg > 0 ? "+" : ""}{row.chg.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ====================================================================
//  MAIN COMPONENT
// ====================================================================
export default function TerminalOverview() {
  const [page, setPage] = useState("dispatch");

  const navLinks = [
    { id: "dispatch", label: "DISPATCH" },
    { id: "duration", label: "DURATION" },
    { id: "beta",     label: "BETA" },
  ];

  return (
    <div style={{
      background: T.bg, color: T.text, fontFamily: T.mono, minHeight: "100vh",
    }}>
      {/* ── NavBar ── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 100,
        height: 40, display: "flex", alignItems: "center",
        background: T.bgPanel, borderBottom: `1px solid ${T.borderB}`,
        padding: "0 16px", gap: 16,
      }}>
        {/* Left: Logo + Nav */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: "0.12em", fontFamily: T.mono }}>
            <span style={{ color: T.amber }}>T</span>
            <span style={{ color: T.textBright }}>ERMINAL</span>
          </span>
          <nav style={{ display: "flex", gap: 2 }}>
            {navLinks.map(link => (
              <button key={link.id} onClick={() => setPage(link.id)} style={{
                background: "transparent", border: "none",
                borderBottom: page === link.id ? `2px solid ${T.amber}` : "2px solid transparent",
                color: page === link.id ? T.amber : T.textDim,
                fontFamily: T.mono, fontSize: 11, fontWeight: 700,
                padding: "10px 12px", cursor: "pointer", letterSpacing: "0.06em",
              }}>{link.label}</button>
            ))}
          </nav>
        </div>

        {/* Center: Week navigator */}
        <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", gap: 6 }}>
          <button style={{
            background: T.bgElev, border: `1px solid ${T.border}`, borderRadius: 3,
            color: T.textDim, fontFamily: T.mono, fontSize: 11, padding: "2px 8px", cursor: "pointer",
          }}>&lt;</button>
          <span style={{ fontSize: 11, fontWeight: 700, color: T.amber, letterSpacing: "0.06em", fontFamily: T.mono }}>
            ACTIVE 14-MAR-26
          </span>
          <button style={{
            background: T.bgElev, border: `1px solid ${T.border}`, borderRadius: 3,
            color: T.textDim, fontFamily: T.mono, fontSize: 11, padding: "2px 8px", cursor: "pointer",
          }}>&gt;</button>
          <button style={{
            background: T.bgElev, border: `1px solid ${T.border}`, borderRadius: 4,
            color: T.textDim, fontFamily: T.mono, fontSize: 10, padding: "3px 10px", cursor: "pointer",
            marginLeft: 4,
          }}>Latest</button>
        </div>

        {/* Right: Clock + market dot */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, fontFamily: T.mono, color: T.textDim }}>
          <span>21-MAR-26 (wk 12)</span>
          <span style={{ color: T.textMuted }}>|</span>
          <span>14:32:05</span>
          <span style={{
            width: 7, height: 7, borderRadius: "50%", background: T.red,
            display: "inline-block", marginLeft: 4,
          }} title="CLOSED" />
        </div>
      </header>

      {/* ── Page content ── */}
      <main style={{ padding: 16 }}>
        {page === "dispatch" && <DispatchPage />}
        {page === "duration" && <DurationPage />}
        {page === "beta" && <BetaPage />}
      </main>
    </div>
  );
}
