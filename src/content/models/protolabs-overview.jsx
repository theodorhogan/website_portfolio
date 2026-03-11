import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, CartesianGrid, Legend, Area, AreaChart, LineChart, Line } from "recharts";

const C = {
  bg: "#080c18", panel: "#0f1729", panelBorder: "#1a2744",
  accent: "#4a7dff", accentDim: "#1e3a6e", gold: "#c9a84c", goldDim: "#7a6630",
  green: "#10b981", red: "#ef4444", orange: "#f59e0b", purple: "#a78bfa", cyan: "#22d3ee",
  text: "#e2e8f0", textDim: "#8b9dc3", textMuted: "#4a5f82",
};
const F = "'JetBrains Mono','Fira Code','Courier New',monospace";

const prodTrend = [
  { y: "FY2023", cnc: 198.2, im: 203.9, p3d: 84.3, sm: 16.5 },
  { y: "FY2024", cnc: 206.9, im: 194.2, p3d: 83.8, sm: 15.3 },
  { y: "FY2025", cnc: 243.3, im: 191.5, p3d: 80.3, sm: 17.2 },
];
const marginData = [
  { y: "FY2023", gross: 44.1, op: 5.6, net: 3.4 },
  { y: "FY2024", gross: 44.6, op: 4.0, net: 3.3 },
  { y: "FY2025", gross: 44.5, op: 4.7, net: 4.0 },
];
const custData = [
  { y: "FY2023", contacts: 53464, rpc: 9425 },
  { y: "FY2024", contacts: 51552, rpc: 9716 },
  { y: "FY2025", contacts: 48415, rpc: 11012 },
];
const cfData = [
  { y: "FY2023", ocf: 73.3, capex: 28.1, fcf: 45.2 },
  { y: "FY2024", ocf: 77.8, capex: 9.2, fcf: 68.6 },
  { y: "FY2025", ocf: 74.5, capex: 14.8, fcf: 59.7 },
];
const geoRevData = [
  { y: "FY2023", us: 396.8, eu: 107.1 },
  { y: "FY2024", us: 396.2, eu: 104.7 },
  { y: "FY2025", us: 432.3, eu: 100.8 },
];
const geoOpData = [
  { y: "FY2023", us: 94.7, eu: -12.5 },
  { y: "FY2024", us: 98.3, eu: -15.5 },
  { y: "FY2025", us: 110.6, eu: -17.1 },
];
const channelPie = [{ name: "Factory", value: 416.9, pct: 78.2 }, { name: "Network", value: 116.2, pct: 21.8 }];
const productPie = [{ name: "CNC", value: 45.6 }, { name: "Inj. Mold", value: 35.9 }, { name: "3D Print", value: 15.1 }, { name: "Sheet Metal", value: 3.2 }];
const PIE_COLORS = [C.accent, "#3b5998", C.cyan, C.purple];

const incomeTable = [
  ["Revenue", "$533.1M", "$500.9M", "$503.9M", "+6.4%"],
  ["Gross Profit", "$237.1M", "$223.2M", "$222.0M", "+6.2%"],
  ["Gross Margin", "44.5%", "44.6%", "44.1%", ""],
  ["Operating Income", "$25.1M", "$19.9M", "$28.2M", "+26.1%"],
  ["Operating Margin", "4.7%", "4.0%", "5.6%", ""],
  ["Net Income", "$21.2M", "$16.6M", "$17.2M", "+27.7%"],
  ["EPS (Diluted)", "$0.88", "$0.66", "$0.66", "+33.3%"],
  ["Adj. EBITDA", "$78.1M", "\u2014", "\u2014", "14.7% margin"],
];
const bsTable = [
  ["Cash & Investments", "$142.4M", "$120.9M"], ["Accounts Receivable", "$79.0M", "$66.5M"],
  ["PP&E (net)", "$215.3M", "$227.3M"], ["Goodwill", "$274.0M", "$274.0M"],
  ["Total Assets", "$763.4M", "$743.5M"], ["Total Liabilities", "$89.5M", "$73.4M"],
  ["Shareholders' Equity", "$673.9M", "$670.2M"], ["Long-term Debt", "$0", "$0"],
];

const Bg = ({ children, bg, color, border }) => <span style={{ display: "inline-block", padding: "2px 7px", borderRadius: 4, fontSize: 9, fontWeight: 700, background: bg, color, border: `1px solid ${border}`, fontFamily: F, letterSpacing: "0.05em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{children}</span>;
const SC = ({ label, value, sub, color = C.text, icon }) => <div style={{ background: C.panel, border: `1px solid ${C.panelBorder}`, borderRadius: 6, padding: "10px 12px", flex: 1, minWidth: 120, position: "relative", overflow: "hidden" }}><div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: color }} /><div style={{ fontSize: 8, color: C.textDim, fontFamily: F, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 3 }}>{icon} {label}</div><div style={{ fontSize: 18, fontWeight: 800, color, fontFamily: F, lineHeight: 1.1 }}>{value}</div>{sub && <div style={{ fontSize: 9, color: C.textMuted, marginTop: 2, fontFamily: F }}>{sub}</div>}</div>;
const Sec = ({ children, accent = C.accent }) => <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, marginTop: 22 }}><div style={{ width: 3, height: 18, background: accent, borderRadius: 2 }} /><h2 style={{ margin: 0, fontSize: 11, fontWeight: 700, color: C.text, fontFamily: F, letterSpacing: "0.04em", textTransform: "uppercase" }}>{children}</h2><div style={{ flex: 1, height: 1, background: C.panelBorder }} /></div>;
const P = ({ children, style }) => <div style={{ background: C.panel, border: `1px solid ${C.panelBorder}`, borderRadius: 6, padding: 14, ...style }}>{children}</div>;
const Tip = ({ active, payload, label }) => { if (!active || !payload?.length) return null; return <div style={{ background: "#1a2744", border: `1px solid ${C.panelBorder}`, borderRadius: 5, padding: "6px 10px", fontFamily: F, fontSize: 10 }}><div style={{ color: C.textDim, marginBottom: 2 }}>{label}</div>{payload.map((p, i) => <div key={i} style={{ color: p.color || C.text }}>{p.name}: <strong>{typeof p.value === "number" ? p.value.toFixed(1) : p.value}</strong></div>)}</div>; };
const MBar = ({ pct, color }) => <div style={{ background: "#1a2744", borderRadius: 2, height: 5, width: "100%", overflow: "hidden" }}><div style={{ width: `${Math.min(pct, 100)}%`, height: "100%", borderRadius: 2, background: color || C.accent }} /></div>;

const TABS = ["Overview", "Business Model", "Financials", "Products", "Strategy & Catalysts", "Risks", "Semester Plan"];

export default function App() {
  const [tab, setTab] = useState("Overview");
  const [expandedRisk, setExpandedRisk] = useState(null);
  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, fontFamily: F }}>
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      <style>{`::-webkit-scrollbar{width:5px;height:5px}::-webkit-scrollbar-track{background:${C.bg}}::-webkit-scrollbar-thumb{background:${C.panelBorder};border-radius:3px}table{border-collapse:collapse;width:100%}th,td{padding:6px 8px;text-align:left;font-family:${F};font-size:10px;border-bottom:1px solid ${C.panelBorder}}th{color:${C.textDim};font-size:9px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase}*{box-sizing:border-box;margin:0;padding:0}`}</style>

      <div style={{ background: "linear-gradient(180deg,#0d1530 0%,#080c18 100%)", borderBottom: `1px solid ${C.panelBorder}`, padding: "14px 24px 10px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 30, height: 30, background: "#1a2d5a", border: "1px solid #2a4080", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#fff" }}>A</div>
            <div><div style={{ fontSize: 13, fontWeight: 800, color: "#fff", letterSpacing: "0.08em" }}>AMSA <span style={{ color: C.textDim, fontWeight: 500 }}>Equity Research</span></div><div style={{ fontSize: 8, color: C.textMuted, letterSpacing: "0.12em", textTransform: "uppercase" }}>Development Through Financial Education</div></div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}><Bg bg={`${C.accent}22`} color={C.accent} border={`${C.accent}44`}>Spring 2026</Bg><Bg bg={`${C.green}22`} color={C.green} border={`${C.green}44`}>Coverage Initiation</Bg></div>
        </div>
        <div style={{ marginTop: 8, display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
          <span style={{ fontSize: 20, fontWeight: 800, color: "#fff" }}>Proto Labs, Inc.</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: C.accent }}>NYSE: PRLB</span>
          <span style={{ fontSize: 10, color: C.textDim }}>~$57.59 | Mkt Cap ~$1.4B | Industrials | Maple Plain, MN</span>
        </div>
        <div style={{ display: "flex", gap: 2, flexWrap: "wrap", marginTop: 10 }}>
          {TABS.map(t => <button key={t} onClick={() => setTab(t)} style={{ background: tab === t ? C.panel : "transparent", border: tab === t ? `1px solid ${C.panelBorder}` : "1px solid transparent", borderBottom: tab === t ? `1px solid ${C.bg}` : "none", borderRadius: "5px 5px 0 0", padding: "6px 12px", color: tab === t ? C.text : C.textMuted, fontFamily: F, fontSize: 10, fontWeight: 600, cursor: "pointer", letterSpacing: "0.04em", textTransform: "uppercase" }}>{t}</button>)}
        </div>
      </div>

      <div style={{ padding: "0 24px 40px", maxWidth: 1400, margin: "0 auto", width: "100%" }}>

{tab === "Overview" && <>
  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16 }}>
    <SC label="FY2025 Revenue" value="$533.1M" sub="+6.4% YoY (record)" color={C.accent} icon="◆" />
    <SC label="Gross Margin" value="44.5%" sub="Stable" color={C.textDim} icon="◈" />
    <SC label="Adj. EBITDA" value="$78.1M" sub="14.7% margin" color={C.gold} icon="◆" />
    <SC label="Operating CF" value="$74.5M" sub="FCF $59.7M" color={C.green} icon="▲" />
    <SC label="Cash & Inv." value="$142.4M" sub="Zero debt" color={C.cyan} icon="◈" />
    <SC label="Customers" value="48,415" sub="-6.1% YoY" color={C.orange} icon="▼" />
    <SC label="Rev/Contact" value="$11,012" sub="+13.3% YoY" color={C.green} icon="▲" />
    <SC label="FY26E Growth" value="6-8%" sub="~$565-575M" color={C.accent} icon="▶" />
  </div>
  <Sec accent={C.accent}>Company Snapshot</Sec>
  <P><div style={{ fontSize: 11, color: C.textDim, lineHeight: 1.7 }}>Protolabs is the world's leading <strong style={{ color: C.text }}>digital manufacturer of custom parts</strong>. Engineers upload 3D CAD designs via the web, receive AI-powered quotes with design-for-manufacturability (DFM) feedback, and get parts shipped as fast as the same day. The model targets the fragmented ~$100B+ market for prototype and low-volume production runs. Founded 1999, IPO 2012.<div style={{ marginTop: 8, display: "flex", gap: 16, flexWrap: "wrap" }}><span><strong style={{ color: C.accent }}>700M+</strong> parts manufactured</span><span><strong style={{ color: C.accent }}>18M+</strong> designs analyzed</span><span><strong style={{ color: C.accent }}>300K+</strong> customers served</span><span><strong style={{ color: C.accent }}>95%</strong> of Fortune 100</span></div></div></P>
  <div style={{ display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
    <div style={{ flex: 1.3, minWidth: 380 }}><Sec accent={C.gold}>Revenue by Product ($M)</Sec><P><ResponsiveContainer width="100%" height={200}><BarChart data={prodTrend} barGap={2}><CartesianGrid strokeDasharray="3 3" stroke={C.panelBorder} /><XAxis dataKey="y" tick={{ fill: C.textDim, fontSize: 9, fontFamily: F }} /><YAxis tick={{ fill: C.textDim, fontSize: 9, fontFamily: F }} unit="$" /><Tooltip content={<Tip />} /><Legend wrapperStyle={{ fontFamily: F, fontSize: 9 }} /><Bar dataKey="cnc" name="CNC" fill={C.accent} radius={[2, 2, 0, 0]} /><Bar dataKey="im" name="Inj. Mold" fill="#3b5998" radius={[2, 2, 0, 0]} /><Bar dataKey="p3d" name="3D Print" fill={C.cyan} radius={[2, 2, 0, 0]} /><Bar dataKey="sm" name="Sheet" fill={C.purple} radius={[2, 2, 0, 0]} /></BarChart></ResponsiveContainer></P></div>
    <div style={{ flex: 0.7, minWidth: 260 }}><Sec accent={C.accent}>FY2025 Revenue Mix</Sec><P style={{ display: "flex", flexDirection: "column", alignItems: "center" }}><ResponsiveContainer width="100%" height={160}><PieChart><Pie data={productPie} cx="50%" cy="50%" innerRadius={36} outerRadius={60} paddingAngle={3} dataKey="value" startAngle={90} endAngle={-270}>{productPie.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}</Pie><Tooltip content={<Tip />} /></PieChart></ResponsiveContainer><div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>{productPie.map((p, i) => <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 8, height: 8, borderRadius: 2, background: PIE_COLORS[i] }} /><span style={{ fontSize: 9, color: C.textDim }}>{p.name} {p.value}%</span></div>)}</div></P></div>
  </div>
  <div style={{ display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
    <div style={{ flex: 1, minWidth: 340 }}><Sec accent={C.green}>Margin Profile (%)</Sec><P><ResponsiveContainer width="100%" height={170}><LineChart data={marginData}><CartesianGrid strokeDasharray="3 3" stroke={C.panelBorder} /><XAxis dataKey="y" tick={{ fill: C.textDim, fontSize: 9, fontFamily: F }} /><YAxis tick={{ fill: C.textDim, fontSize: 9, fontFamily: F }} domain={[0, 50]} unit="%" /><Tooltip content={<Tip />} /><Legend wrapperStyle={{ fontFamily: F, fontSize: 9 }} /><Line type="monotone" dataKey="gross" name="Gross" stroke={C.green} strokeWidth={2} dot={{ fill: C.green, r: 3 }} /><Line type="monotone" dataKey="op" name="Operating" stroke={C.gold} strokeWidth={2} dot={{ fill: C.gold, r: 3 }} /><Line type="monotone" dataKey="net" name="Net" stroke={C.accent} strokeWidth={2} dot={{ fill: C.accent, r: 3 }} /></LineChart></ResponsiveContainer></P></div>
    <div style={{ flex: 1, minWidth: 340 }}><Sec accent={C.orange}>Customer Economics</Sec><P><ResponsiveContainer width="100%" height={170}><BarChart data={custData}><CartesianGrid strokeDasharray="3 3" stroke={C.panelBorder} /><XAxis dataKey="y" tick={{ fill: C.textDim, fontSize: 9, fontFamily: F }} /><YAxis yAxisId="l" tick={{ fill: C.textDim, fontSize: 9, fontFamily: F }} tickFormatter={v => `${(v / 1000).toFixed(0)}K`} /><YAxis yAxisId="r" orientation="right" tick={{ fill: C.textDim, fontSize: 9, fontFamily: F }} tickFormatter={v => `$${(v / 1000).toFixed(0)}K`} /><Tooltip content={<Tip />} /><Legend wrapperStyle={{ fontFamily: F, fontSize: 9 }} /><Bar yAxisId="l" dataKey="contacts" name="Contacts" fill="#3b5998" radius={[2, 2, 0, 0]} /><Bar yAxisId="r" dataKey="rpc" name="Rev/Contact" fill={C.gold} radius={[2, 2, 0, 0]} /></BarChart></ResponsiveContainer></P></div>
  </div>
  <Sec accent={C.purple}>Key Trends & Signals</Sec>
  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 8 }}>
    {[{ c: C.green, t: "CNC MACHINING SURGE", x: "+17.6% YoY to $243.3M. Now 45.6% of revenue (was 39.3% in FY2023). Driven by aerospace, defense, and medical device demand." },{ c: C.orange, t: "DECLINING CUSTOMER COUNT", x: "48,415 unique contacts (-6.1% YoY). Third consecutive year of decline. BUT rev/contact up 13.3% to $11,012." },{ c: C.accent, t: "NETWORK CHANNEL GROWTH", x: "Network (outsourced) revenue +15.7% to $116.2M. Growing 4x faster than Factory channel (+4.1%)." },{ c: C.red, t: "EUROPE DRAG", x: "Operating loss ($17.1M) widening. Organic decline -7.0%. Germany facilities closed. European reset is key 2026 priority." },{ c: C.cyan, t: "PRODESK AI PLATFORM", x: "Launched Feb 2026. AI-powered quoting, DFM analysis, Production Catalog, team collaboration. ~50K customers expected." },{ c: C.purple, t: "NEW CEO PLAYBOOK", x: "Suresh Krishna (May 2025). 30yr operating exec. Priorities: customer experience, AI, production expansion, efficiency." }].map((r, i) => <P key={i} style={{ padding: 12, borderLeft: `3px solid ${r.c}` }}><div style={{ fontWeight: 700, color: r.c, fontSize: 9, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>{r.t}</div><div style={{ fontSize: 10, color: C.textDim, lineHeight: 1.55 }}>{r.x}</div></P>)}
  </div>
  <Sec accent={C.cyan}>Company Timeline</Sec>
  <P style={{ padding: 14 }}>
    <div style={{ position: "relative", paddingLeft: 20, borderLeft: `2px solid ${C.panelBorder}` }}>
      {[
        { y: "1999", e: "Founded", d: "Larry Lukis founds Proto Labs in a Minnesota garage, pioneering automated injection molding for rapid prototyping.", c: C.accent },
        { y: "2001", e: "Protomold Launch", d: "Launches Protomold service — first commercial offering of automated, quick-turn injection-molded plastic parts.", c: C.textDim },
        { y: "2007", e: "Firstcut CNC Service", d: "Adds CNC machining capabilities under the 'Firstcut' brand, expanding beyond plastics into metal parts.", c: C.textDim },
        { y: "2009", e: "Rebranding & Japan", d: "Protomold and Firstcut unified under the Proto Labs brand. Opens Japan office. Adds aluminum, ABS, nylon, PEEK machining.", c: C.textDim },
        { y: "2012", e: "NYSE IPO (PRLB)", d: "Completes IPO on the New York Stock Exchange, raising $71M+. Provides capital for factory expansion and automation.", c: C.gold },
        { y: "2013", e: "$150M Revenue", d: "Crosses $150M annual revenue milestone, solidifying position as the leader in rapid prototyping.", c: C.textDim },
        { y: "2014", e: "FineLine Acquisition + New CEO", d: "Acquires FineLine Prototyping (3D printing). Vicki Holt appointed CEO with billion-dollar growth ambitions.", c: C.gold },
        { y: "2016", e: "3D Printing Expansion", d: "Opens dedicated 77,000 sq. ft. 3D printing facility in Cary, North Carolina. Industrial-grade additive at scale.", c: C.textDim },
        { y: "2017", e: "RAPID Acquisition", d: "Acquires Rapid Manufacturing Group for $120M, adding sheet metal fabrication and CNC capacity in New Hampshire.", c: C.gold },
        { y: "2021", e: "3D Hubs Acquisition", d: "Acquires Amsterdam-based 3D Hubs for $280M ($130M cash + $150M stock). Creates the 'Network' channel — 240 manufacturing partners globally. All-time high stock ~$251.", c: C.accent },
        { y: "2022", e: "$118M Goodwill Impairment", d: "Europe segment goodwill written off. Net loss of ($103.5M). Rob Bodor as CEO navigates downturn. Dan Schumacher becomes CFO.", c: C.red },
        { y: "2023", e: "Germany Closures Begin", d: "Japan operations dissolved. Germany facility closures initiated (Eschenlohe, Putzbrunn). Revenue stagnates at $503.9M.", c: C.orange },
        { y: "2024", e: "Hubs Rebranded", d: "3D Hubs fully rebranded as 'Protolabs Network.' Revenue flat at $500.9M. Stock trades below $35 (-80% from peak).", c: C.textDim },
        { y: "May 2025", e: "New CEO: Suresh Krishna", d: "Board appoints Krishna (ex-Northern Tool) as President & CEO. Rob Bodor departs. Strategic reset begins.", c: C.accent },
        { y: "Oct 2025", e: "New CTAIO: Marc Kermisch", d: "Appoints Marc Kermisch as Chief Technology & AI Officer. Prior CTO departs. AI/digital mandate accelerated.", c: C.cyan },
        { y: "FY2025", e: "Record Revenue $533.1M", d: "Returns to growth (+6.4%). CNC surges +17.6%. Network +15.7%. Germany closures substantially complete.", c: C.green },
        { y: "Jan 2026", e: "ISO 13485 Certification", d: "US injection molding achieves medical device certification. Pilot production programs with two OEMs.", c: C.green },
        { y: "Feb 2026", e: "ProDesk AI Launch", d: "Launches ProDesk — AI-enabled manufacturing platform. Real-time quoting, DFM analysis, Production Catalog. India GCC announced.", c: C.accent },
      ].map((t, i) => (
        <div key={i} style={{ position: "relative", marginBottom: 10 }}>
          <div style={{ position: "absolute", left: -25, top: 3, width: 10, height: 10, borderRadius: "50%", background: t.c, border: `2px solid ${C.bg}` }} />
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: t.c, fontFamily: F, minWidth: 60, flexShrink: 0 }}>{t.y}</span>
            <div>
              <span style={{ fontSize: 10, fontWeight: 700, color: C.text }}>{t.e}</span>
              <div style={{ fontSize: 9, color: C.textDim, lineHeight: 1.5, marginTop: 1 }}>{t.d}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </P>
</>}

{tab === "Business Model" && <>
  <Sec accent={C.accent}>The Digital Thread</Sec>
  <P><div style={{ fontSize: 11, color: C.textDim, lineHeight: 1.7 }}>Protolabs sits at the intersection of <strong style={{ color: C.text }}>manufacturing and software</strong>. Its proprietary "digital thread" automates quoting, DFM analysis, and production routing. When a customer uploads a 3D CAD design, AI algorithms analyze the geometry, flag potential issues, generate an instant price quote, and route the job to the optimal production method. This compresses what used to take weeks into days or hours.</div></P>
  <Sec accent={C.gold}>Digital Thread Workflow</Sec>
  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 8 }}>
    {[{ n: "01", t: "CAD Upload", d: "Customer uploads 3D design via ProDesk" },{ n: "02", t: "AI DFM Analysis", d: "Flags wall thickness, undercuts, tolerances" },{ n: "03", t: "Instant Quote", d: "Real-time pricing with materials & finishes" },{ n: "04", t: "Smart Routing", d: "AI picks Factory vs Network optimally" },{ n: "05", t: "Production", d: "CNC, molding, 3D printing, or sheet metal" },{ n: "06", t: "Ship Same-Day", d: "Parts shipped as fast as same day" }].map(s => <P key={s.n} style={{ padding: 10, borderTop: `2px solid ${C.accent}` }}><div style={{ fontSize: 18, fontWeight: 800, color: C.accent, opacity: 0.4, fontFamily: F }}>{s.n}</div><div style={{ fontSize: 10, fontWeight: 700, color: C.text, marginBottom: 3 }}>{s.t}</div><div style={{ fontSize: 9, color: C.textDim, lineHeight: 1.5 }}>{s.d}</div></P>)}
  </div>
  <Sec accent={C.cyan}>Two Fulfilment Channels</Sec>
  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
    <div style={{ flex: 1, minWidth: 280 }}><P style={{ padding: 14, borderLeft: `3px solid ${C.accent}` }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}><span style={{ fontSize: 12, fontWeight: 700 }}>Factory (In-House)</span><span style={{ fontSize: 16, fontWeight: 800, color: C.accent }}>${channelPie[0].value}M</span></div><MBar pct={78.2} color={C.accent} /><div style={{ fontSize: 9, color: C.textMuted, marginTop: 4 }}>78.2% of FY2025 revenue | +4.1% YoY</div><div style={{ fontSize: 10, color: C.textDim, lineHeight: 1.6, marginTop: 6 }}>Owned facilities in Maple Plain, MN (US) and Telford (UK). Injection molding, CNC, 3D printing, sheet metal. Proprietary automation. Higher margins but capital-intensive.</div></P></div>
    <div style={{ flex: 1, minWidth: 280 }}><P style={{ padding: 14, borderLeft: `3px solid ${C.cyan}` }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}><span style={{ fontSize: 12, fontWeight: 700 }}>Network (Outsourced)</span><span style={{ fontSize: 16, fontWeight: 800, color: C.cyan }}>${channelPie[1].value}M</span></div><MBar pct={21.8} color={C.cyan} /><div style={{ fontSize: 9, color: C.textMuted, marginTop: 4 }}>21.8% of FY2025 revenue | +15.7% YoY</div><div style={{ fontSize: 10, color: C.textDim, lineHeight: 1.6, marginTop: 6 }}>Global network of vetted partners (formerly "Hubs," acquired Jan 2021). NA, Europe, Asia. Asset-light marketplace with AI routing. Growing 4x faster than Factory.</div></P></div>
  </div>
  <Sec accent={C.purple}>Analytical Framework</Sec>
  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
    {[{ t: "Unit Economics", q: "Factory vs Network gross margins? Network take rate? Margin evolution as product mix shifts to CNC?" },{ t: "Scalability", q: "Can revenue grow without proportional capex? Is Network the scalability lever? Marginal cost of next $1M Network revenue?" },{ t: "Competitive Moat", q: "How defensible is the digital thread vs Xometry? Is speed or software the moat? Can traditional shops replicate?" },{ t: "Customer Dynamics", q: "Why are contacts declining while revenue grows? Healthy consolidation or demand weakness? LTV/CAC?" }].map((q, i) => <P key={i} style={{ padding: 12, borderTop: `2px solid ${C.purple}` }}><div style={{ fontSize: 10, fontWeight: 700, color: C.purple, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>{q.t}</div><div style={{ fontSize: 10, color: C.textDim, lineHeight: 1.6 }}>{q.q}</div></P>)}
  </div>
  <Sec accent={C.gold}>End Markets</Sec>
  <P><div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
    {[{ m: "Medical & Healthcare", s: "Largest. ISO 13485 certified. Pilot production programs.", c: C.green },{ m: "Aerospace & Defense", s: "Fastest growing. Driving CNC surge. Reshoring tailwind.", c: C.accent },{ m: "Computer Electronics", s: "Steady prototyping. Short product cycles.", c: C.cyan },{ m: "Industrial Machinery", s: "Core traditional market.", c: C.gold },{ m: "Automotive", s: "EV transition driving new components.", c: C.purple }].map((m, i) => <div key={i} style={{ flex: "1 1 180px", background: C.bg, border: `1px solid ${C.panelBorder}`, borderRadius: 5, padding: "8px 10px", borderLeft: `3px solid ${m.c}` }}><div style={{ fontWeight: 700, color: m.c, fontSize: 9, textTransform: "uppercase" }}>{m.m}</div><div style={{ color: C.textDim, fontSize: 9, lineHeight: 1.5, marginTop: 2 }}>{m.s}</div></div>)}
  </div></P>
</>}

{tab === "Financials" && <>
  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16 }}>
    <SC label="Revenue" value="$533.1M" sub="+6.4% YoY" color={C.accent} icon="◆" /><SC label="Gross Margin" value="44.5%" sub="Flat" color={C.textDim} icon="◈" /><SC label="Op. Income" value="$25.1M" sub="4.7% margin" color={C.gold} icon="◆" /><SC label="Net Income" value="$21.2M" sub="+27.7% YoY" color={C.green} icon="▲" /><SC label="Diluted EPS" value="$0.88" sub="+33.3% YoY" color={C.green} icon="▲" /><SC label="Op. Cash Flow" value="$74.5M" sub="FCF: $59.7M" color={C.cyan} icon="◈" />
  </div>
  <div style={{ display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
    <div style={{ flex: 1, minWidth: 420 }}><Sec accent={C.accent}>Income Statement</Sec><div style={{ overflowX: "auto" }}><table><thead><tr style={{ background: "#0d1530" }}><th>Line Item</th><th style={{ textAlign: "right" }}>FY2025</th><th style={{ textAlign: "right" }}>FY2024</th><th style={{ textAlign: "right" }}>FY2023</th><th style={{ textAlign: "right" }}>YoY</th></tr></thead><tbody>{incomeTable.map((r, i) => <tr key={i} style={{ background: i % 2 === 0 ? "transparent" : "#0d1530" }}><td style={{ fontWeight: [0, 3, 5].includes(i) ? 700 : 400, color: [0, 3, 5].includes(i) ? C.text : C.textDim }}>{r[0]}</td><td style={{ textAlign: "right", fontWeight: 600, color: [0, 3, 5].includes(i) ? C.accent : C.text }}>{r[1]}</td><td style={{ textAlign: "right", color: C.textDim }}>{r[2]}</td><td style={{ textAlign: "right", color: C.textDim }}>{r[3]}</td><td style={{ textAlign: "right", color: r[4].startsWith("+") ? C.green : C.textMuted, fontWeight: 600 }}>{r[4]}</td></tr>)}</tbody></table></div></div>
    <div style={{ flex: 0.7, minWidth: 300 }}><Sec accent={C.cyan}>Balance Sheet (Dec 31)</Sec><div style={{ overflowX: "auto" }}><table><thead><tr style={{ background: "#0d1530" }}><th>Item</th><th style={{ textAlign: "right" }}>FY2025</th><th style={{ textAlign: "right" }}>FY2024</th></tr></thead><tbody>{bsTable.map((r, i) => <tr key={i} style={{ background: i % 2 === 0 ? "transparent" : "#0d1530" }}><td style={{ fontWeight: [4, 5, 6, 7].includes(i) ? 700 : 400, color: [4, 5, 6].includes(i) ? C.text : C.textDim }}>{r[0]}</td><td style={{ textAlign: "right", fontWeight: 600, color: i === 7 ? C.green : C.text }}>{r[1]}</td><td style={{ textAlign: "right", color: C.textDim }}>{r[2]}</td></tr>)}</tbody></table></div></div>
  </div>
  <div style={{ display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
    <div style={{ flex: 1, minWidth: 340 }}><Sec accent={C.green}>Cash Flow ($M)</Sec><P><ResponsiveContainer width="100%" height={180}><BarChart data={cfData}><CartesianGrid strokeDasharray="3 3" stroke={C.panelBorder} /><XAxis dataKey="y" tick={{ fill: C.textDim, fontSize: 9, fontFamily: F }} /><YAxis tick={{ fill: C.textDim, fontSize: 9, fontFamily: F }} unit="$" /><Tooltip content={<Tip />} /><Legend wrapperStyle={{ fontFamily: F, fontSize: 9 }} /><Bar dataKey="ocf" name="Operating CF" fill={C.green} radius={[2, 2, 0, 0]} /><Bar dataKey="fcf" name="Free CF" fill={C.accent} radius={[2, 2, 0, 0]} /><Bar dataKey="capex" name="CapEx" fill={C.red} radius={[2, 2, 0, 0]} /></BarChart></ResponsiveContainer></P></div>
    <div style={{ flex: 1, minWidth: 340 }}><Sec accent={C.gold}>Geographic Revenue ($M)</Sec><P><ResponsiveContainer width="100%" height={180}><BarChart data={geoRevData}><CartesianGrid strokeDasharray="3 3" stroke={C.panelBorder} /><XAxis dataKey="y" tick={{ fill: C.textDim, fontSize: 9, fontFamily: F }} /><YAxis tick={{ fill: C.textDim, fontSize: 9, fontFamily: F }} unit="$" /><Tooltip content={<Tip />} /><Legend wrapperStyle={{ fontFamily: F, fontSize: 9 }} /><Bar dataKey="us" name="United States" fill={C.accent} radius={[2, 2, 0, 0]} /><Bar dataKey="eu" name="Europe" fill={C.purple} radius={[2, 2, 0, 0]} /></BarChart></ResponsiveContainer></P></div>
  </div>
  <Sec accent={C.orange}>Segment Operating Income ($M)</Sec>
  <P><ResponsiveContainer width="100%" height={170}><BarChart data={geoOpData}><CartesianGrid strokeDasharray="3 3" stroke={C.panelBorder} /><XAxis dataKey="y" tick={{ fill: C.textDim, fontSize: 9, fontFamily: F }} /><YAxis tick={{ fill: C.textDim, fontSize: 9, fontFamily: F }} unit="$" /><Tooltip content={<Tip />} /><Legend wrapperStyle={{ fontFamily: F, fontSize: 9 }} /><Bar dataKey="us" name="US Op. Income" fill={C.green} radius={[2, 2, 0, 0]} /><Bar dataKey="eu" name="Europe Op. Income" radius={[2, 2, 0, 0]}>{geoOpData.map((_, i) => <Cell key={i} fill={C.red} />)}</Bar></BarChart></ResponsiveContainer></P>
  <Sec accent={C.purple}>Capital Allocation</Sec>
  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 8 }}>
    {[{ t: "Share Buyback", v: "$42.9M in FY2025", d: "$100M program (Feb 2025). $57.1M remaining. 974K shares @ avg $44.08.", c: C.accent },{ t: "No Dividends", v: "None paid or planned", d: "Capital via buybacks only. Shares: 26.2M to 23.6M over 3yrs.", c: C.textMuted },{ t: "CapEx", v: "$14.8M (2.8%)", d: "Guided 2-7% of revenue. Near low end. Down from $28.1M FY2023.", c: C.gold },{ t: "SBC", v: "$15.7M total", d: "~3% of revenue. RSUs, options, PSUs.", c: C.purple }].map((c, i) => <P key={i} style={{ padding: 10, borderTop: `2px solid ${c.c}` }}><div style={{ fontSize: 9, fontWeight: 700, color: c.c, textTransform: "uppercase", letterSpacing: "0.04em" }}>{c.t}</div><div style={{ fontSize: 14, fontWeight: 800, color: C.text, fontFamily: F, margin: "3px 0" }}>{c.v}</div><div style={{ fontSize: 9, color: C.textDim, lineHeight: 1.5 }}>{c.d}</div></P>)}
  </div>
</>}

{tab === "Products" && <>
  <Sec accent={C.accent}>Manufacturing Services</Sec>
  {[{ name: "CNC Machining", pct: 45.6, rev: 243.3, yoy: "+17.6%", color: C.accent, status: "SURGING", desc: "Subtractive manufacturing: automated drills/lathes cut solid blocks into precise shapes. Now largest service line.", why: "Aerospace, defense, drone, satellite industries. Medical ISO 13485. Reshoring." },{ name: "Injection Molding", pct: 35.9, rev: 191.5, yoy: "-1.4%", color: "#3b5998", status: "DECLINING", desc: "Molten material injected into custom aluminum molds. Founded on this technology.", why: "Multi-year decline from $203.9M. Higher capital intensity. Customers shifting to CNC." },{ name: "3D Printing", pct: 15.1, rev: 80.3, yoy: "-4.2%", color: C.cyan, status: "DECLINING", desc: "Additive manufacturing: SLS, DMLS, MJF, PolyJet, Carbon DLS. Strategic for prototyping.", why: "Declining but expanded US metal capacity in 2025. Important customer acquisition funnel." },{ name: "Sheet Metal", pct: 3.2, rev: 17.2, yoy: "+12.4%", color: C.purple, status: "GROWING", desc: "Fabricated parts and assemblies. Smallest but growing. Complements offering.", why: "Network capabilities. Low base. One-stop-shop for vendor consolidation." }].map((p, i) => <P key={i} style={{ marginBottom: 8, padding: 14 }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6, marginBottom: 6 }}><div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontSize: 13, fontWeight: 700 }}>{p.name}</span><Bg bg={p.status === "SURGING" ? `${C.green}22` : p.status === "DECLINING" ? `${C.red}22` : `${C.green}22`} color={p.status === "SURGING" ? C.green : p.status === "DECLINING" ? C.red : C.green} border={p.status === "SURGING" ? `${C.green}44` : p.status === "DECLINING" ? `${C.red}44` : `${C.green}44`}>{p.status}</Bg></div><div><span style={{ fontSize: 18, fontWeight: 800, color: p.color, fontFamily: F }}>${p.rev}M</span><span style={{ fontSize: 10, color: C.textMuted, marginLeft: 8 }}>{p.pct}%</span><span style={{ fontSize: 11, fontWeight: 700, color: p.yoy.startsWith("+") ? C.green : C.red, marginLeft: 8 }}>{p.yoy}</span></div></div><MBar pct={p.pct} color={p.color} /><div style={{ fontSize: 10, color: C.textDim, lineHeight: 1.6, marginTop: 8 }}>{p.desc}</div><div style={{ fontSize: 10, color: C.textDim, lineHeight: 1.6, marginTop: 4 }}><strong style={{ color: p.color }}>Driver:</strong> {p.why}</div></P>)}
  <Sec accent={C.gold}>Product Mix Trend ($M)</Sec>
  <P><ResponsiveContainer width="100%" height={220}><AreaChart data={prodTrend}><defs><linearGradient id="cncG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.accent} stopOpacity={0.3} /><stop offset="95%" stopColor={C.accent} stopOpacity={0} /></linearGradient><linearGradient id="imG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b5998" stopOpacity={0.3} /><stop offset="95%" stopColor="#3b5998" stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke={C.panelBorder} /><XAxis dataKey="y" tick={{ fill: C.textDim, fontSize: 9, fontFamily: F }} /><YAxis tick={{ fill: C.textDim, fontSize: 9, fontFamily: F }} unit="$" /><Tooltip content={<Tip />} /><Legend wrapperStyle={{ fontFamily: F, fontSize: 9 }} /><Area type="monotone" dataKey="cnc" name="CNC" stroke={C.accent} fill="url(#cncG)" strokeWidth={2} /><Area type="monotone" dataKey="im" name="Inj. Mold" stroke="#3b5998" fill="url(#imG)" strokeWidth={2} /><Area type="monotone" dataKey="p3d" name="3D Print" stroke={C.cyan} fill="none" strokeWidth={2} /></AreaChart></ResponsiveContainer></P>
</>}

{tab === "Strategy & Catalysts" && <>
  <Sec accent={C.accent}>CEO Suresh Krishna</Sec>
  <P style={{ marginBottom: 12 }}><div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "flex-start" }}><div style={{ width: 48, height: 48, borderRadius: 6, background: C.accentDim, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: C.accent, flexShrink: 0 }}>SK</div><div style={{ flex: 1, minWidth: 260 }}><div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>Suresh Krishna <span style={{ color: C.textDim, fontWeight: 400, fontSize: 10 }}>President, CEO & Director — since May 21, 2025</span></div><div style={{ fontSize: 10, color: C.textDim, lineHeight: 1.65 }}>30+ year operating executive and the company's fourth CEO. At <strong style={{ color: C.text }}>Northern Tool + Equipment</strong> (2020-2024), Krishna led a cultural and operational transformation, expanding the customer base and accelerating growth through supply-chain optimization. He previously held senior operations and leadership roles at <strong style={{ color: C.text }}>Sleep Number Corp.</strong>, <strong style={{ color: C.text }}>Polaris Industries</strong> (now Polaris Inc.), and <strong style={{ color: C.text }}>UTC Fire & Security</strong> (now Carrier Global). At Polaris, he worked in global operations for a manufacturer with similar complexity to Protolabs. Krishna holds a B.Eng. in mechanical engineering from NIT Tiruchirappalli (India) and an MBA from Northwestern's Kellogg School of Management. He has described Protolabs as a "national model for reshoring manufacturing" and sees the biggest opportunity in moving from prototyping into production: "We are great at prototyping, but we can become great at production." Compensation: 3-year employment term, $2.8M initial equity awards (RSUs, options, PSUs), with automatic one-year extensions.</div></div></div></P>
  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 8 }}>
    {[{ n: "01", t: "Elevate Customer Experience", d: "Reduce friction. Increase revenue per contact. ProDesk AI platform is the centerpiece.", c: C.accent },{ n: "02", t: "Accelerate Innovation", d: "AI deployment: intelligent pricing, automated inspection, toolpath verification, smart routing.", c: C.cyan },{ n: "03", t: "Expand Production", d: "Move up-market from prototyping into production. ISO 13485 for medical. OEM pilot programs.", c: C.gold },{ n: "04", t: "Drive Efficiency", d: "Expand margins. Reinvest savings into tech. India GCC to scale digital ops.", c: C.green }].map(s => <P key={s.n} style={{ padding: 12, borderTop: `3px solid ${s.c}` }}><div style={{ fontSize: 22, fontWeight: 800, color: s.c, opacity: 0.35, fontFamily: F }}>{s.n}</div><div style={{ fontSize: 11, fontWeight: 700, color: C.text, marginBottom: 4 }}>{s.t}</div><div style={{ fontSize: 9, color: C.textDim, lineHeight: 1.5 }}>{s.d}</div></P>)}
  </div>
  <Sec accent={C.cyan}>ProDesk (Feb 2026)</Sec>
  <P style={{ borderLeft: `3px solid ${C.cyan}` }}><div style={{ fontSize: 10, color: C.textDim, lineHeight: 1.65 }}>All-in-one platform: <strong style={{ color: C.text }}>real-time AI quoting</strong>, DFM analysis across molding/CNC/3D printing, <strong style={{ color: C.text }}>Production Catalog</strong> for reordering, team collaboration, applications engineer support. ~50K customers in 2026. Key bet on converting prototyping to production.</div></P>
  <Sec accent={C.gold}>FY2026 Guidance</Sec>
  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><SC label="FY2026 Rev Growth" value="6-8%" sub="~$565-575M" color={C.accent} icon="▶" /><SC label="Q1 Revenue" value="$130-138M" sub="" color={C.textDim} icon="◈" /><SC label="Q1 GAAP EPS" value="$0.17-0.25" sub="" color={C.textDim} icon="◈" /><SC label="Q1 Non-GAAP EPS" value="$0.36-0.44" sub="" color={C.gold} icon="◆" /></div>
  <Sec accent={C.green}>Catalysts to Monitor</Sec>
  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
    {[{ c: C.accent, t: "PRODESK ADOPTION", x: "Uptake metrics, conversion rates, engagement data." },{ c: C.green, t: "CNC DURABILITY", x: "Is A&D demand durable? Backlog visibility. Concentration risk." },{ c: C.orange, t: "EUROPEAN RESET", x: "Can management stem losses? Germany residuals. UK efficiency." },{ c: C.cyan, t: "INDIA GCC", x: "Scaling AI/digital ops. Cost savings timeline." },{ c: C.gold, t: "MEDICAL EXPANSION", x: "ISO 13485 pilot programs. Production vs prototyping revenue." },{ c: C.purple, t: "NETWORK ECONOMICS", x: "Take rate, partner quality, routing effectiveness, margin convergence." }].map((r, i) => <P key={i} style={{ padding: 10, borderLeft: `3px solid ${r.c}` }}><div style={{ fontWeight: 700, color: r.c, fontSize: 9, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.05em" }}>{r.t}</div><div style={{ fontSize: 9, color: C.textDim, lineHeight: 1.55 }}>{r.x}</div></P>)}
  </div>
  <Sec accent={C.purple}>C-Suite</Sec>
  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 8 }}>
    {[{ i: "DS", n: "Daniel Schumacher", r: "CFO — since Dec 2021 (interim), Jun 2022 (permanent)", d: "With Protolabs since 2017, initially as VP of Investor Relations and FP&A. Previously Finance Director at Stratasys (3D printing OEM, 2015-2017) and held various financial leadership roles at Rockwell Automation (2006-2015). Started career in public accounting. B.S. Accounting from University of Minnesota Carlson School of Management. Guided the company through the FY2022 goodwill impairment, Germany closures, and CEO transition. Deep institutional knowledge of the investor story — managed IR directly for 5 years before becoming CFO.", c: C.gold },
    { i: "MK", n: "Marc Kermisch", r: "Chief Technology & AI Officer — since Oct 13, 2025", d: "25+ years leading technology, R&D, and AI teams across manufacturing, software, and retail. Most recently CTO at Emergent Software (cloud, AI, data engineering). Previously Global Chief Digital & Information Officer at Case New Holland (CNH, NYSE: CNH), a $20B agriculture/construction equipment maker where he led autonomous vehicle and precision farming development. Also held executive positions at Optum Rx, Bluestem Brands, and Red Wing Shoe Company. Sits on the boards of American AgCredit and Crew Carwash. B.A. English from University of Wisconsin-Madison. Age 51. Succeeds Oleg Ryaboy who departed after 3 years. Leads ProDesk development, AI/ML strategy, product management, and cybersecurity. Product management was moved under his org to reduce silos.", c: C.cyan },
    { i: "MR", n: "Michael R. Kenison", r: "Chief Operations Officer", d: "Longest-tenured executive in the C-suite. Previously led the Americas region as VP & GM, and served as VP of Manufacturing since 2013. Before Protolabs, held leadership roles including VP of Manufacturing at Cardiac Science, Inc. (medical device maker, defibrillator technology). Deep knowledge of Protolabs' factory operations, automation systems, and quality processes. Oversees global manufacturing across US and UK facilities. Recently sold 2,500 shares post-Q4 earnings (Feb 2026 Form 4 filing).", c: C.green }
    ].map(m => <P key={m.i} style={{ padding: 12, display: "flex", gap: 10, alignItems: "flex-start", borderTop: `2px solid ${m.c}` }}><div style={{ width: 36, height: 36, borderRadius: 4, background: C.accentDim, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: C.accent, flexShrink: 0 }}>{m.i}</div><div><div style={{ fontSize: 11, fontWeight: 700 }}>{m.n} <span style={{ color: C.textDim, fontWeight: 400, fontSize: 9 }}>{m.r}</span></div><div style={{ fontSize: 9, color: C.textDim, lineHeight: 1.6, marginTop: 3 }}>{m.d}</div></div></P>)}
  </div>
  <Sec accent={C.gold}>Board & Governance</Sec>
  <P style={{ padding: 12 }}><div style={{ fontSize: 10, color: C.textDim, lineHeight: 1.65 }}>
    <strong style={{ color: C.text }}>Chairman:</strong> Rainer Gawlick — led the CEO search that brought in Krishna. Emphasized Protolabs' strategy as a "single manufacturing source from prototyping to production."
    <br /><strong style={{ color: C.text }}>CEO transition costs:</strong> ~$3.6M booked to G&A in FY2025 for the departure of Rob Bodor and onboarding of Krishna. Bodor entered a consulting arrangement ($5K/month through Nov 2025).
    <br /><strong style={{ color: C.text }}>Key governance signals:</strong> Strong anti-hedging/pledging policies, clawback provisions, double-trigger equity treatment. Annual cash incentives below target in recent periods; TSR has trailed peers. Options granted before 2023 are underwater.
    <br /><strong style={{ color: C.text }}>Alignment question:</strong> With two of four C-suite roles (CEO and CTAIO) replaced in 2025, execution risk is elevated but fresh perspectives may also accelerate strategic change. Monitor 2026 proxy for updated compensation structures.
  </div></P>
</>}

{tab === "Risks" && <>
  <Sec accent={C.red}>Key Risks</Sec>
  <P style={{ marginBottom: 10 }}><div style={{ fontSize: 10, color: C.textDim, lineHeight: 1.6 }}>Every valuation must stress-test downside scenarios. Click each risk to expand details. Assess probability, magnitude, and whether priced in.</div></P>
  {[{ sev: 5, t: "Declining Customer Count", cat: "DEMAND", d: "53,464 -> 51,552 -> 48,415 (-6.1% YoY). Third consecutive decline. If rev/contact growth fails to offset, top-line stagnates.", c: C.red },{ sev: 5, t: "Competitive Price Pressure", cat: "STRUCTURAL", d: "Fragmented market: thousands of shops + brokers (Xometry). Commoditization risk. Limited pricing power.", c: C.red },{ sev: 4, t: "European Drag", cat: "GEOGRAPHIC", d: "Op. loss $17.1M widening. Germany lease obligations through 2029. Organic -7.0%. Reset unproven.", c: C.orange },{ sev: 4, t: "Macro Cyclicality", cat: "MACRO", d: "Custom parts tied to R&D budgets. Recession cuts prototyping. Revenue stagnated FY2023-24.", c: C.orange },{ sev: 3, t: "CEO Execution Risk", cat: "MANAGEMENT", d: "Krishna since May 2025. Org restructure, India GCC, ProDesk, EU reset all simultaneous.", c: C.gold },{ sev: 3, t: "Goodwill ($274M)", cat: "ACCOUNTING", d: "36% of assets. US reporting unit. Write-down possible (FY2022: $118M). Annual testing.", c: C.gold },{ sev: 3, t: "AI Deployment Risks", cat: "TECHNOLOGY", d: "New in FY2025 10-K. DFM accuracy errors, cybersecurity, reputational risk.", c: C.purple },{ sev: 2, t: "FX Exposure", cat: "FINANCIAL", d: "~19% non-US revenue. +$3.5M FX tailwind in FY2025 could reverse.", c: C.textDim }].map((r, i) => <P key={i} style={{ marginBottom: 6, padding: 12, borderLeft: `3px solid ${r.c}`, cursor: "pointer" }} onClick={() => setExpandedRisk(expandedRisk === i ? null : i)}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}><div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ display: "flex", gap: 2 }}>{[1, 2, 3, 4, 5].map(j => <div key={j} style={{ width: 10, height: 4, borderRadius: 1, background: j <= r.sev ? (r.sev >= 4 ? C.red : r.sev >= 3 ? C.gold : C.textMuted) : "#1a2744" }} />)}</div><span style={{ fontSize: 11, fontWeight: 700 }}>{r.t}</span></div><Bg bg={`${r.c}22`} color={r.c} border={`${r.c}44`}>{r.cat}</Bg></div>{expandedRisk === i && <div style={{ fontSize: 10, color: C.textDim, lineHeight: 1.6, marginTop: 8 }}>{r.d}</div>}</P>)}
</>}

{tab === "Semester Plan" && <>
  <Sec accent={C.accent}>Learning Journey</Sec>
  <P style={{ marginBottom: 12 }}><div style={{ fontSize: 10, color: C.textDim, lineHeight: 1.65 }}>This semester you will learn to think like an equity research analyst — from understanding the business and industry, to building a detailed valuation model, to writing an institutional-grade initiation report. Each phase builds on the previous. The goal: a publishable report with a defensible investment thesis and price target.</div></P>
  {[{ phase: "Phase 1", t: "Industry & Business Model Deep-Dive", c: C.accent, items: ["Map custom manufacturing value chain end-to-end","Analyze Protolabs vs Xometry vs traditional shops","Understand digital thread and unit economics","Research TAM: $100B+ digital manufacturing market","Build an industry primer document","Identify 3-5 key revenue and margin drivers"] },{ phase: "Phase 2", t: "Financial Analysis & Modeling", c: C.gold, items: ["Build detailed 3-statement model in Excel","Decompose revenue: product mix, customers, channels, geography","Model margin expansion/compression scenarios","Project FCF and capital allocation through FY2028","Analyze working capital and capex intensity","Sensitize key assumptions (growth, margins, terminal value)"] },{ phase: "Phase 3", t: "Valuation", c: C.green, items: ["DCF with Bull/Base/Bear scenario analysis","Comparable company analysis — peer selection and multiples","Precedent transactions where applicable","Sensitivity tables and football field chart","Cross-check implied vs historical multiples","Price target with probability-weighted scenarios"] },{ phase: "Phase 4", t: "Equity Research Report", c: C.purple, items: ["Institutional-grade initiation report (20-30 pages)","Executive summary with thesis and price target","Industry overview with competitive positioning","Detailed financials with proprietary model outputs","Risk/reward with catalysts and mitigants","Peer review, presentation, final delivery to AMSA"] }].map((p, i) => <P key={i} style={{ marginBottom: 8, padding: 14, borderLeft: `3px solid ${p.c}` }}><div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}><Bg bg={`${p.c}22`} color={p.c} border={`${p.c}44`}>{p.phase}</Bg><span style={{ fontSize: 12, fontWeight: 700 }}>{p.t}</span></div><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3px 16px" }}>{p.items.map((item, j) => <div key={j} style={{ fontSize: 9, color: C.textDim, lineHeight: 1.55, paddingLeft: 10, position: "relative" }}><span style={{ position: "absolute", left: 0, color: p.c }}>›</span>{item}</div>)}</div></P>)}
  <Sec accent={C.gold}>Key Resources</Sec>
  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 8 }}>
    {[{ t: "PRLB 10-K (FY2025)", d: "Primary source. Full financials, risk factors, segment data." },{ t: "Q4 Earnings Call", d: "Management commentary, guidance, strategic priorities." },{ t: "ProDesk Platform", d: "protolabs.com — experience the product firsthand." },{ t: "SEC EDGAR", d: "Proxy, insider transactions, institutional ownership." },{ t: "Xometry (XMTR)", d: "Key competitor. Compare models, growth, margins." },{ t: "Industry Research", d: "IMARC, Mordor Intelligence for TAM projections." }].map((r, i) => <P key={i} style={{ padding: 10 }}><div style={{ fontSize: 9, fontWeight: 700, color: C.accent, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 3 }}>{r.t}</div><div style={{ fontSize: 9, color: C.textDim, lineHeight: 1.5 }}>{r.d}</div></P>)}
  </div>
</>}

        <div style={{ marginTop: 30, paddingTop: 12, borderTop: `1px solid ${C.panelBorder}`, fontSize: 8, color: C.textMuted, lineHeight: 1.5 }}>
          <strong>SOURCES:</strong> PRLB 10-K FY2025, Q4 FY2025 8-K (Feb 6, 2026), Protolabs IR, SEC EDGAR, Digital Commerce 360, Twin Cities Business, IMARC, Mordor Intelligence, Allied Market Research.
          <br /><strong>DISCLAIMER:</strong> Prepared by AMSA Equity Research for educational purposes only. Not investment advice. All data as of March 2026.
          <br /><strong>AMSA</strong> — Asset Management Study Association | Erasmus University Rotterdam | Development Through Financial Education
        </div>
      </div>
    </div>
  );
}
