import { useState, useMemo, useCallback } from "react";

// ═══════════════════════════════════════════════════════════════
// CASE 1: TRENDSETTER INC.
// ═══════════════════════════════════════════════════════════════

function trendsetterMega(fv) {
  const megaShares = 5000000;
  const totalShares = 12000000;
  const liqPref = 1.25 * 5000000;
  const frac = megaShares / totalShares;
  if (fv <= 0) return 0;
  if (fv <= liqPref) return fv;
  const participate = liqPref + (fv - liqPref) * frac;
  const convert = fv * frac;
  return Math.min(Math.max(participate, convert), fv);
}

function trendsetterAlphaHit(fv) {
  const aShares = 4761905;
  const total = 11761905;
  const issueP = 1.05;
  const frac = aShares / total;
  const liqPref = issueP * aShares;
  const cap = 3 * issueP * aShares;
  if (fv <= 0) return 0;
  if (fv <= liqPref) return fv;
  let part = liqPref + (fv - liqPref) * frac;
  if (part > cap) part = cap;
  const conv = fv * frac;
  return Math.min(Math.max(part, conv), fv);
}

function trendsetterAlphaMiss(fv) {
  const aShares = 5263158;
  const total = 13000000;
  const issueP = 0.95;
  const frac = aShares / total;
  const liqPref = issueP * aShares;
  const cap = 3 * issueP * aShares;
  if (fv <= 0) return 0;
  if (fv <= liqPref) return fv;
  let part = liqPref + (fv - liqPref) * frac;
  if (part > cap) part = cap;
  const conv = fv * frac;
  return Math.min(Math.max(part, conv), fv);
}

// ═══════════════════════════════════════════════════════════════
// CASE 2: BUTCHERED DATA
// ═══════════════════════════════════════════════════════════════

function butcheredAlpha(fv) {
  const aShares = 4000000;
  const total = 9000000;
  const frac = aShares / total;
  const liqPref = 1.00 * aShares;
  if (fv <= 0) return 0;
  const prefValue = Math.min(liqPref, fv);
  const convValue = fv * frac;
  return Math.min(Math.max(prefValue, convValue), fv);
}

function butcheredMega(fv) {
  const mShares = 6000000;
  const total = 12000000;
  const frac = mShares / total;
  const liqPref = 1.00 * mShares;
  const cap = 2.50 * 1.00 * mShares;
  if (fv <= 0) return 0;
  if (fv <= liqPref) return fv;
  let part = liqPref + (fv - liqPref) * frac;
  if (part > cap) part = cap;
  const conv = fv * frac;
  return Math.min(Math.max(part, conv), fv);
}

// ═══════════════════════════════════════════════════════════════
// CASE DEFINITIONS
// ═══════════════════════════════════════════════════════════════

const CASES = {
  trendsetter: {
    title: "Trendsetter Inc.",
    subtitle: "Series A — Alpha Ventures vs Mega Fund",
    maxFV: 50,
    lines: [
      { key: "firmValue", label: "Firm Value (45° line)", color: "#64748b", dash: "6,4", fn: (fv) => fv },
      { key: "mega", label: "Mega — Participating, 1.25× liq pref, no cap (41.7%)", color: "#0ea5e9", fn: (fv) => trendsetterMega(fv * 1e6) / 1e6 },
      { key: "alphaHit", label: "Alpha — Rev. target HIT, 3× cap participating (40.5%)", color: "#10b981", fn: (fv) => trendsetterAlphaHit(fv * 1e6) / 1e6 },
      { key: "alphaMiss", label: "Alpha — Rev. target MISSED, 3× cap participating (40.5%)", color: "#f59e0b", fn: (fv) => trendsetterAlphaMiss(fv * 1e6) / 1e6 },
    ],
    verticals: (() => {
      const aHitS = 4761905, aHitT = 11761905, aHitIP = 1.05;
      const aHitF = aHitS / aHitT, aHitCap = 3 * aHitIP * aHitS;
      const aMissS = 5263158, aMissT = 13000000, aMissIP = 0.95;
      const aMissF = aMissS / aMissT, aMissCap = 3 * aMissIP * aMissS;
      return [
        { key: "aLiq", value: 5.0, label: "Alpha Liq Pref", detail: "$5M (both scenarios)", color: "#10b981" },
        { key: "mLiq", value: 6.25, label: "Mega 1.25× Liq Pref", detail: "$6.25M", color: "#0ea5e9" },
        { key: "a3xH", value: aHitCap / 1e6, label: "Alpha 3× Cap (hit)", detail: `$${(aHitCap / 1e6).toFixed(1)}M`, color: "#10b981" },
        { key: "a3xM", value: aMissCap / 1e6, label: "Alpha 3× Cap (miss)", detail: `$${(aMissCap / 1e6).toFixed(1)}M`, color: "#f59e0b" },
        { key: "aCvH", value: aHitCap / aHitF / 1e6, label: "Alpha Conv > Part (hit)", detail: `$${(aHitCap / aHitF / 1e6).toFixed(1)}M`, color: "#10b981" },
        { key: "aCvM", value: aMissCap / aMissF / 1e6, label: "Alpha Conv > Part (miss)", detail: `$${(aMissCap / aMissF / 1e6).toFixed(1)}M`, color: "#f59e0b" },
      ];
    })(),
    summaryLeft: { title: "Mega Fund", color: "#0ea5e9", text: "$5M for 5M shares @ $1.00. Participating preferred with 1.25× liq pref ($6.25M), fully participating (no cap). Cumulative 10% dividend capped at 25%. Mega owns 41.7% as-converted." },
    summaryRight: { title: "Alpha Ventures", color: "#10b981", text: "$5M for Series A. If target hit: 4.76M shares @ $1.05, participating with 3× cap ($15M). If missed: 5.26M shares @ $0.95 (escrowed shares released). After cap, converts to common." },
  },
  butchered: {
    title: "Butchered Data",
    subtitle: "Series A — Alpha vs Mega",
    maxFV: 50,
    lines: [
      { key: "firmValue", label: "Firm Value (45° line)", color: "#64748b", dash: "6,4", fn: (fv) => fv },
      { key: "alpha", label: "Alpha — Straight preferred, 1× liq pref (44.4%)", color: "#10b981", fn: (fv) => butcheredAlpha(fv * 1e6) / 1e6 },
      { key: "mega", label: "Mega — Participating, 1× liq pref, 2.5× cap (50%)", color: "#0ea5e9", fn: (fv) => butcheredMega(fv * 1e6) / 1e6 },
    ],
    verticals: (() => {
      const mF = 0.5, mCap = 2.5 * 6000000;
      const aF = 4 / 9, aLP = 4000000;
      return [
        { key: "aLiq", value: 4.0, label: "Alpha 1× Liq Pref", detail: "$4M", color: "#10b981" },
        { key: "mLiq", value: 6.0, label: "Mega 1× Liq Pref", detail: "$6M", color: "#0ea5e9" },
        { key: "aCv", value: aLP / aF / 1e6, label: "Alpha Conv > Liq Pref", detail: `$${(aLP / aF / 1e6).toFixed(0)}M`, color: "#10b981" },
        { key: "m25x", value: mCap / 1e6, label: "Mega 2.5× Cap", detail: `$${(mCap / 1e6).toFixed(0)}M`, color: "#0ea5e9" },
        { key: "mCv", value: mCap / mF / 1e6, label: "Mega Conv > Participate", detail: `$${(mCap / mF / 1e6).toFixed(0)}M`, color: "#0ea5e9" },
      ];
    })(),
    summaryLeft: { title: "Alpha", color: "#10b981", text: "$4M for 4M shares @ $1.00. Post-money $9M. Straight (non-participating) preferred: 1× liq pref ($4M), then either takes liq pref OR converts to common (44.4%). 25% option pool. Broad-based weighted avg anti-dilution." },
    summaryRight: { title: "Mega", color: "#0ea5e9", text: "$6M for 6M shares @ $1.00. Post-money $12M. Participating preferred: 1× liq pref ($6M) then participates until 2.5× cap ($15M total). After cap, converts. 50% as-converted. 15% option pool. Full-ratchet anti-dilution." },
  },
};

const PAD = { top: 30, right: 30, bottom: 60, left: 75 };
const CW = 820, CH = 460;
const IW = CW - PAD.left - PAD.right;
const IH = CH - PAD.top - PAD.bottom;
const NPTS = 500;

const C = { bg: "#0f172a", card: "#1e293b", border: "#334155", grid: "#1e293b", axis: "#94a3b8", text: "#e2e8f0", muted: "#64748b" };

export default function PayoffDiagram() {
  const [caseKey, setCaseKey] = useState("trendsetter");
  const cd = CASES[caseKey];

  const [lt, setLt] = useState({});
  const [vt, setVt] = useState({});
  const [hover, setHover] = useState(null);

  const lOn = (k) => lt[`${caseKey}_${k}`] !== false;
  const vOn = (k) => vt[`${caseKey}_${k}`] === true;

  const maxFV = cd.maxFV;
  const xS = useCallback((v) => PAD.left + (v / maxFV) * IW, [maxFV]);
  const yS = useCallback((v) => PAD.top + IH - (v / maxFV) * IH, [maxFV]);

  const pts = useMemo(() => {
    const a = [];
    for (let i = 0; i <= NPTS; i++) {
      const fv = (i / NPTS) * maxFV;
      const p = { fv };
      cd.lines.forEach((l) => { p[l.key] = l.fn(fv); });
      a.push(p);
    }
    return a;
  }, [caseKey]);

  const mkPath = useCallback(
    (key) => pts.map((d, i) => `${i === 0 ? "M" : "L"}${xS(d.fv).toFixed(1)},${yS(d[key]).toFixed(1)}`).join(" "),
    [pts, xS, yS]
  );

  const onMove = useCallback((e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const mx = ((e.clientX - r.left) / r.width) * CW;
    const fv = ((mx - PAD.left) / IW) * maxFV;
    if (fv < 0 || fv > maxFV) { setHover(null); return; }
    const idx = Math.min(Math.round((fv / maxFV) * NPTS), NPTS);
    setHover({ x: xS(pts[idx].fv), d: pts[idx] });
  }, [pts, maxFV, xS]);

  const gv = [];
  for (let v = 0; v <= maxFV; v += 5) gv.push(v);

  return (
    <div style={{ background: C.bg, minHeight: "100vh", padding: "20px 24px", fontFamily: "'JetBrains Mono','SF Mono','Fira Code',monospace", color: C.text }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 21, fontWeight: 700, margin: 0, color: "#f8fafc", letterSpacing: "-0.02em" }}>{cd.title} — Investor Payoff Diagram</h1>
            <p style={{ fontSize: 11, color: C.muted, margin: "4px 0 0" }}>{cd.subtitle}</p>
          </div>
          <select value={caseKey} onChange={(e) => { setCaseKey(e.target.value); setHover(null); }}
            style={{ background: C.card, color: C.text, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 14px", fontSize: 13, fontFamily: "inherit", cursor: "pointer", outline: "none", minWidth: 240 }}>
            <option value="trendsetter">Case 1 — Trendsetter Inc.</option>
            <option value="butchered">Case 2 — Butchered Data</option>
          </select>
        </div>

        <div style={{ background: C.card, borderRadius: 10, padding: "20px 16px 16px", border: `1px solid ${C.border}`, marginBottom: 18 }}>
          <svg viewBox={`0 0 ${CW} ${CH}`} width="100%" style={{ display: "block", cursor: "crosshair" }}
            onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
            {gv.map((v) => (
              <g key={v}>
                <line x1={xS(v)} x2={xS(v)} y1={PAD.top} y2={PAD.top + IH} stroke={C.grid} strokeWidth={0.5} />
                <line x1={PAD.left} x2={PAD.left + IW} y1={yS(v)} y2={yS(v)} stroke={C.grid} strokeWidth={0.5} />
                <text x={xS(v)} y={PAD.top + IH + 22} textAnchor="middle" fontSize={10} fill={C.axis}>${v}M</text>
                {v > 0 && <text x={PAD.left - 10} y={yS(v) + 4} textAnchor="end" fontSize={10} fill={C.axis}>${v}M</text>}
              </g>
            ))}
            <text x={PAD.left + IW / 2} y={CH - 4} textAnchor="middle" fontSize={11} fill={C.axis} fontWeight={600}>Firm Value at Exit ($M)</text>
            <text x={14} y={PAD.top + IH / 2} textAnchor="middle" fontSize={11} fill={C.axis} fontWeight={600}
              transform={`rotate(-90,14,${PAD.top + IH / 2})`}>Investor Payoff ($M)</text>

            {cd.verticals.map((vc) => vOn(vc.key) ? (
              <g key={vc.key}>
                <line x1={xS(vc.value)} x2={xS(vc.value)} y1={PAD.top} y2={PAD.top + IH}
                  stroke={vc.color} strokeWidth={1.2} strokeDasharray="4,3" opacity={0.7} />
                <text x={xS(vc.value) + 4} y={PAD.top + 12} fontSize={8} fill={vc.color} opacity={0.9}>{vc.label}</text>
                <text x={xS(vc.value) + 4} y={PAD.top + 22} fontSize={7} fill={vc.color} opacity={0.6}>${vc.value.toFixed(1)}M</text>
              </g>
            ) : null)}

            {cd.lines.map((lc) => lOn(lc.key) ? (
              <path key={lc.key} d={mkPath(lc.key)} fill="none" stroke={lc.color}
                strokeWidth={lc.key === "firmValue" ? 1.5 : 2.2}
                strokeDasharray={lc.dash || "none"} strokeLinecap="round" strokeLinejoin="round" />
            ) : null)}

            {hover && (
              <g>
                <line x1={hover.x} x2={hover.x} y1={PAD.top} y2={PAD.top + IH} stroke="#475569" strokeWidth={0.8} strokeDasharray="3,3" />
                {cd.lines.map((lc) => lOn(lc.key) ? (
                  <circle key={lc.key} cx={hover.x} cy={yS(hover.d[lc.key])} r={3.5} fill={lc.color} />
                ) : null)}
                <foreignObject x={Math.min(hover.x + 12, CW - 210)} y={PAD.top + 10} width={200} height={30 + cd.lines.length * 20}>
                  <div xmlns="http://www.w3.org/1999/xhtml" style={{
                    background: "rgba(15,23,42,0.95)", border: `1px solid ${C.border}`,
                    borderRadius: 6, padding: "8px 10px", fontSize: 10, fontFamily: "inherit", color: C.text, lineHeight: 1.7 }}>
                    <div style={{ fontWeight: 700, marginBottom: 2 }}>Firm Value: ${hover.d.fv.toFixed(1)}M</div>
                    {cd.lines.filter((l) => l.key !== "firmValue" && lOn(l.key)).map((l) => (
                      <div key={l.key} style={{ color: l.color }}>{l.label.split("—")[0].split("—")[0].trim()}: ${hover.d[l.key].toFixed(2)}M</div>
                    ))}
                  </div>
                </foreignObject>
              </g>
            )}
          </svg>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={{ background: C.card, borderRadius: 10, padding: "16px 20px", border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: C.muted, marginBottom: 12 }}>Payoff Lines</div>
            {cd.lines.map((lc) => (
              <label key={lc.key} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10, cursor: "pointer", fontSize: 12 }}>
                <input type="checkbox" checked={lOn(lc.key)} onChange={() => setLt((s) => ({ ...s, [`${caseKey}_${lc.key}`]: !lOn(lc.key) }))}
                  style={{ accentColor: lc.color, marginTop: 2 }} />
                <span><span style={{ color: lc.color, fontWeight: 600 }}>■</span> {lc.label}</span>
              </label>
            ))}
          </div>
          <div style={{ background: C.card, borderRadius: 10, padding: "16px 20px", border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: C.muted, marginBottom: 12 }}>Key Thresholds</div>
            {cd.verticals.map((vc) => (
              <label key={vc.key} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10, cursor: "pointer", fontSize: 12 }}>
                <input type="checkbox" checked={vOn(vc.key)} onChange={() => setVt((s) => ({ ...s, [`${caseKey}_${vc.key}`]: !vOn(vc.key) }))}
                  style={{ accentColor: vc.color, marginTop: 2 }} />
                <span><span style={{ color: vc.color, fontWeight: 600 }}>┆</span> {vc.label}<br /><span style={{ fontSize: 10, color: C.muted }}>{vc.detail}</span></span>
              </label>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 18, background: C.card, borderRadius: 10, padding: "16px 20px", border: `1px solid ${C.border}`, fontSize: 11, color: C.muted, lineHeight: 1.7 }}>
          <div style={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Term Sheet Summary — {cd.title}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div><span style={{ color: cd.summaryLeft.color, fontWeight: 700 }}>{cd.summaryLeft.title}</span> — {cd.summaryLeft.text}</div>
            <div><span style={{ color: cd.summaryRight.color, fontWeight: 700 }}>{cd.summaryRight.title}</span> — {cd.summaryRight.text}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
