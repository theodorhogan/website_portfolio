import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, CartesianGrid, Legend, Area, AreaChart } from "recharts";

const C = {
  bg:"#0a0e17",panel:"#111827",panelBorder:"#1e293b",
  accent:"#ef4444",accentDim:"#991b1b",warn:"#f59e0b",warnDim:"#92400e",
  safe:"#10b981",blue:"#3b82f6",purple:"#a78bfa",
  text:"#e2e8f0",textDim:"#64748b",textMuted:"#475569",
  highlight:"#f97316",cyan:"#22d3ee",
};
const F="'JetBrains Mono','Fira Code','Courier New',monospace";

// ═══════════ PRODUCTION DATA ═══════════
const prodData = [
  {country:"Saudi Arabia",pre:9.0,cur:7.5,flag:"🇸🇦",dis:false,bp:2.0,hz:89,note:"Pre-emptive cuts Mar 9. Ras Tanura shut. Diverting to Yanbu."},
  {country:"Iraq",pre:4.3,cur:1.3,flag:"🇮🇶",dis:true,bp:0,hz:97,note:"Rumaila & West Qurna 2 shut. Storage maxed. Exports ~0.8M bpd."},
  {country:"UAE",pre:3.2,cur:2.0,flag:"🇦🇪",dis:true,bp:0.6,hz:66,note:"ADNOC Ruwais refinery (922K bpd) shut Mar 10 after drone strike. ADCOP to Fujairah struck 3x. Cutting offshore."},
  {country:"Kuwait",pre:2.57,cur:1.5,flag:"🇰🇼",dis:true,bp:0,hz:100,note:"Force majeure. Zero bypass. Airport fuel tanks hit."},
  {country:"Qatar",pre:1.8,cur:0.3,flag:"🇶🇦",dis:true,bp:0,hz:100,note:"Ras Laffan LNG halted. Force majeure. Won't restart until war ends."},
  {country:"Iran",pre:3.2,cur:2.0,flag:"🇮🇷",dis:false,bp:0.4,hz:80,note:"Tehran oil depots struck. Jask terminal active. Shadow fleet exporting."},
  {country:"Bahrain",pre:0.2,cur:0.05,flag:"🇧🇭",dis:true,bp:0,hz:100,note:"BAPCO hit by ballistic missile + drone. Force majeure Mar 9."},
  {country:"Oman",pre:1.0,cur:0.7,flag:"🇴🇲",dis:false,bp:0.5,hz:50,note:"Duqm & Salalah struck. Partially operational."},
];
const totPre=prodData.reduce((s,d)=>s+d.pre,0);
const totCur=prodData.reduce((s,d)=>s+d.cur,0);
const totLost=totPre-totCur;

// ═══════════ STRUCTURAL DAMAGE (with economic fields) ═══════════
// replCost = replacement value midpoint ($B)
// estDmgLo/Hi = estimated physical damage range ($B)
// dailyLossNum = daily revenue loss ($M)
const dmg = [
  {fac:"Ras Laffan LNG Complex",co:"Qatar",flag:"🇶🇦",op:"QatarEnergy",preCap:"81Mt LNG/yr",preM:1.8,curM:0,pctOff:100,
   replCost:35,estDmgLo:0.5,estDmgHi:2.0,assetVal:"$30-40B",annRev:"$60-80B/yr",dailyLoss:"$180-220M",dailyLossNum:200,
   phys:"Moderate (under assessment)",sev:5,cat:"Kinetic + Precautionary",catColor:C.accent,
   desc:"Drone strike. First-ever full cold shutdown. CEO: won't restart until war ends. NFE expansion delayed to 2027.",
   recovery:"4-8 wks min after ceasefire. If damaged: months.",strategic:"Removes 20% global LNG exports. Morgan Stanley: 2026 surplus wiped."},
  {fac:"Rumaila Oil Field",co:"Iraq",flag:"🇮🇶",op:"BP / Basra Oil Co.",preCap:"1.5M bpd",preM:1.5,curM:0,pctOff:100,
   replCost:25,estDmgLo:0,estDmgHi:0,assetVal:"$20-30B",annRev:"$40-50B/yr",dailyLoss:"$120M",dailyLossNum:120,
   phys:"None (operational)",sev:4,cat:"Storage Bottleneck",catColor:C.cyan,
   desc:"No physical damage. Storage full, tankers can't transit. 36% of Iraq output.",
   recovery:"Days after route opens. >4-6 wks: reservoir damage risk.",strategic:"90% of Iraq gov revenue. Reservoir damage could permanently reduce capacity."},
  {fac:"Ras Tanura Refinery",co:"Saudi Arabia",flag:"🇸🇦",op:"Saudi Aramco",preCap:"550K bpd + export terminal",preM:0.55,curM:0,pctOff:100,
   replCost:10,estDmgLo:0.05,estDmgHi:0.2,assetVal:"$8-12B",annRev:"$15-20B/yr",dailyLoss:"$45-55M",dailyLossNum:50,
   phys:"Minor (debris fire)",sev:3,cat:"Precautionary",catColor:C.blue,
   desc:"Two drones intercepted, debris fire. Satellite: burn scars, 'limited damage.' Rerouting to Yanbu.",
   recovery:"Days if security allows. Aramco: 'few weeks' for reroute.",strategic:"Largest Saudi refinery (16% national). 40-year emergency plan activated."},
  {fac:"BAPCO Sitra Refinery",co:"Bahrain",flag:"🇧🇭",op:"Bapco/TotalEnergies",preCap:"405K bpd ($7.3B upgrade)",preM:0.2,curM:0,pctOff:100,
   replCost:7.3,estDmgLo:1.0,estDmgHi:3.0,assetVal:"$7.3B",annRev:"$8-12B/yr",dailyLoss:"$25-35M",dailyLossNum:30,
   phys:"Mod-Severe (ballistic missile)",sev:5,cat:"Kinetic Damage",catColor:C.accent,
   desc:"Direct ballistic missile hit Mar 5. Large fires. Second drone Mar 9 → force majeure. Two crude units shut.",
   recovery:"If conversion units hit: 6-12 months. Assessment ongoing.",strategic:"Bahrain's ONLY refinery. 100% import-dependent. $7.3B modernization at risk."},
  {fac:"Fujairah Oil Terminals",co:"UAE",flag:"🇦🇪",op:"Vopak/FOIZ",preCap:"~10M bbl storage + bypass",preM:0.3,curM:0.05,pctOff:83,
   replCost:6.5,estDmgLo:0.3,estDmgHi:1.0,assetVal:"$5-8B",annRev:"$3-5B/yr",dailyLoss:"$10-15M",dailyLossNum:12,
   phys:"Moderate (3 strikes/7 days)",sev:4,cat:"Strategic Target",catColor:C.purple,
   desc:"Struck Mar 3, 7, 9. Barge loadings suspended. Multiple tanks damaged.",
   recovery:"Tank repairs 2-6 wks each. Under active attack.",strategic:"ADCOP bypass terminus — Iran eliminating the alternative route."},
  {fac:"West Qurna 2",co:"Iraq",flag:"🇮🇶",op:"Iraq (ex-Lukoil)",preCap:"400K bpd",preM:0.4,curM:0,pctOff:100,
   replCost:12,estDmgLo:0,estDmgHi:0,assetVal:"$10-15B",annRev:"$12B/yr",dailyLoss:"$32M",dailyLossNum:32,
   phys:"None (operational)",sev:3,cat:"Storage Bottleneck",catColor:C.cyan,
   desc:"Storage full, no export route.",recovery:"Days after route opens. Reservoir risk with time.",strategic:"With Rumaila: Iraq lost 70% southern output."},
  {fac:"Mussafah Fuel Terminal",co:"UAE",flag:"🇦🇪",op:"ADNOC",preCap:"Fuel storage",preM:0.1,curM:0,pctOff:100,
   replCost:1.5,estDmgLo:0.1,estDmgHi:0.3,assetVal:"$1-2B",annRev:"$1-2B/yr",dailyLoss:"$3-5M",dailyLossNum:4,
   phys:"Moderate (direct hit)",sev:3,cat:"Kinetic",catColor:C.accent,
   desc:"Direct drone hit Mar 2, fire in tanks.",recovery:"Weeks.",strategic:"Abu Dhabi fuel distribution reduced."},
  {fac:"Port of Duqm",co:"Oman",flag:"🇴🇲",op:"State",preCap:"Fuel storage",preM:0.05,curM:0.01,pctOff:80,
   replCost:0.75,estDmgLo:0.05,estDmgHi:0.2,assetVal:"$500M-1B",annRev:"$500M/yr",dailyLoss:"$1-2M",dailyLossNum:1.5,
   phys:"Moderate (tank explosion)",sev:3,cat:"Kinetic",catColor:C.accent,
   desc:"Multiple drones Mar 3. Tank explosion.",recovery:"Weeks.",strategic:"'Safe' alternative port now shown reachable."},
  {fac:"Shaybah Oil Field",co:"Saudi Arabia",flag:"🇸🇦",op:"Saudi Aramco",preCap:"1M bpd",preM:1.0,curM:1.0,pctOff:0,
   replCost:17.5,estDmgLo:0,estDmgHi:0,assetVal:"$15-20B",annRev:"$30B/yr",dailyLoss:"$0",dailyLossNum:0,
   phys:"None (intercepted)",sev:2,cat:"Intercepted",catColor:C.safe,
   desc:"Targeted Mar 7-8 with drone waves. ALL intercepted.",recovery:"Operational.",strategic:"Successful hit could mirror 2019 Abqaiq."},
  {fac:"Hidd Desalination",co:"Bahrain",flag:"🇧🇭",op:"State",preCap:"90M gal/day water",preM:0,curM:0,pctOff:100,
   replCost:2.5,estDmgLo:0.2,estDmgHi:0.5,assetVal:"$2-3B",annRev:"Critical",dailyLoss:"Incalculable",dailyLossNum:0,
   phys:"Moderate (loitering munitions)",sev:5,cat:"Escalation",catColor:"#f43f5e",
   desc:"Loitering munitions struck water infra Mar 9.",recovery:"Under assessment.",strategic:"RED LINE: water supply targeted."},
  {fac:"Kuwait Airport Fuel",co:"Kuwait",flag:"🇰🇼",op:"State",preCap:"Aviation fuel",preM:0,curM:0,pctOff:100,
   replCost:0.35,estDmgLo:0.05,estDmgHi:0.15,assetVal:"$200-500M",annRev:"Aviation",dailyLoss:"Disruption",dailyLossNum:0,
   phys:"Moderate (drone hits)",sev:3,cat:"Kinetic",catColor:C.accent,
   desc:"Drones struck fuel tanks at airport Mar 7-8.",recovery:"Weeks.",strategic:"Civilian infra targeting."},
  {fac:"Port of Salalah",co:"Oman",flag:"🇴🇲",op:"State",preCap:"Fuel handling",preM:0.02,curM:0.01,pctOff:50,
   replCost:0.3,estDmgLo:0.01,estDmgHi:0.05,assetVal:"$300M",annRev:"$200M/yr",dailyLoss:"$0.5M",dailyLossNum:0.5,
   phys:"Minor",sev:2,cat:"Kinetic",catColor:C.accent,
   desc:"Drone strike Mar 3.",recovery:"Days-weeks.",strategic:"Ports outside Strait not immune."},
  {fac:"ADNOC Ruwais Complex",co:"UAE",flag:"🇦🇪",op:"ADNOC",preCap:"922K bpd refining + petrochems",preM:0.92,curM:0,pctOff:100,
   replCost:15,estDmgLo:0.1,estDmgHi:0.5,assetVal:"$12-18B",annRev:"$20-30B/yr",dailyLoss:"$55-80M",dailyLossNum:65,
   phys:"Minor (drone strike fire)",sev:4,cat:"Precautionary",catColor:C.blue,
   desc:"NEW Mar 10: Drone strike caused fire in Ruwais industrial city. ADNOC shut refinery as precaution. Downstream ops (petrochems, fertilizer, industrial gas) continue. Abu Dhabi's central downstream hub.",
   recovery:"Could restart quickly if security allows — damage appears limited. But persistent drone threat.",
   strategic:"Ruwais is ADNOC's downstream crown jewel (922K bpd = larger than Ras Tanura). Shutdown removes major refining capacity. Combined with Ras Tanura + BAPCO, ~1.9M bpd refining now offline across Gulf."},
  {fac:"Strait of Hormuz (MINING)",co:"Iran",flag:"🇮🇷",op:"IRGC Navy",preCap:"20M bpd transit capacity",preM:0,curM:0,pctOff:100,
   replCost:0,estDmgLo:0,estDmgHi:0,assetVal:"N/A",annRev:"$1.8T/yr transit value",dailyLoss:"$5B+ global",dailyLossNum:0,
   phys:"CONFIRMED MINING (Mar 10-11)",sev:5,cat:"Escalation",catColor:"#f43f5e",
   desc:"NEW Mar 10-11: CNN/US intel confirms Iran has begun laying mines in Strait. 'Few dozen' deployed. Iran retains 80-90% of small boats/minelayers. US sank 16 minelayers in response. US has NO dedicated minesweepers in Gulf (last 4 decommissioned Sept 2025).",
   recovery:"Mine clearance = 2+ months post-ceasefire even with full NATO effort. 1991 Gulf War took 2+ months with 12+ allied MCM vessels. Advanced influence mines ignore minesweeper signatures.",
   strategic:"WORST-CASE SCENARIO NOW MATERIALIZING. Mining transforms the Strait from a contested waterway to an impassable one. Even after military victory, mines persist. This could extend the closure by months beyond any ceasefire."},
];

// ═══════════ ECONOMIC AGGREGATES ═══════════
const totPreM=dmg.reduce((s,d)=>s+d.preM,0);
const totCurM=dmg.reduce((s,d)=>s+d.curM,0);
const totOffM=totPreM-totCurM;
const totRepl=dmg.reduce((s,d)=>s+d.replCost,0);
const totDmgLo=dmg.reduce((s,d)=>s+d.estDmgLo,0);
const totDmgHi=dmg.reduce((s,d)=>s+d.estDmgHi,0);
const totDmgMid=(totDmgLo+totDmgHi)/2;
const totDailyRev=dmg.reduce((s,d)=>s+d.dailyLossNum,0);
const cum11d=totDailyRev*11;
const dmgPctRepl=((totDmgMid/totRepl)*100).toFixed(1);

// Charts
const econChart=dmg.filter(d=>d.preM>0).map(d=>({name:d.fac.length>22?d.fac.slice(0,20)+"…":d.fac,preWar:d.preM,current:d.curM,offline:d.preM-d.curM})).sort((a,b)=>b.offline-a.offline);

const replChart=dmg.filter(d=>d.replCost>=1).map(d=>({
  name:d.fac.length>18?d.fac.slice(0,16)+"…":d.fac,
  replacement:d.replCost,
  estDamage:(d.estDmgLo+d.estDmgHi)/2,
  flag:d.flag,
})).sort((a,b)=>b.replacement-a.replacement);

const layersChart=[
  {name:"Replacement Value\n(all facilities)",val:totRepl,fill:"#334155"},
  {name:"Est. Physical Damage\n(kinetic hits)",val:totDmgMid,fill:C.accent},
  {name:"Revenue Lost\n(11 days)",val:cum11d/1000,fill:C.warn},
  {name:"Projected Revenue\nLoss (30 days)",val:(totDailyRev*30)/1000,fill:C.highlight},
];

// ═══════════ OTHER DATA ═══════════
const vessels=[
  {d:"Feb 28",v:"3 unnamed tankers",t:"Missile/Drone",c:true,dm:"1 ablaze off Oman, 2 struck",ca:"Unknown"},
  {d:"Mar 1",v:"Skylight",t:"Projectile",c:true,dm:"Struck north of Khasab",ca:"2 killed, 3 injured"},
  {d:"Mar 1",v:"MKD VYOM",t:"Drone boat",c:true,dm:"Fire & engine explosion",ca:"1 killed"},
  {d:"Mar 1",v:"LCT Ayeh",t:"Unknown",c:true,dm:"Crew wounded",ca:"1 critical"},
  {d:"Mar 1",v:"Hercules Star",t:"Unknown",c:true,dm:"Struck off UAE",ca:"Unknown"},
  {d:"Mar 2",v:"Stena Imperative",t:"Drone x2",c:true,dm:"Struck at Bahrain port",ca:"1 killed, 2 injured"},
  {d:"Mar 2",v:"Athe Nova",t:"Drone x2",c:true,dm:"Ablaze transiting Strait",ca:"None"},
  {d:"Mar 4",v:"Safeen Prestige",t:"Missile",c:true,dm:"Crew evacuated",ca:"Unknown"},
  {d:"Mar 4",v:"Sonangol Namibe",t:"Explosion",c:true,dm:"Hull breach, oil spill",ca:"None"},
  {d:"Mar 5",v:"Tanker nr Iraq",t:"Drone",c:false,dm:"Near Khor al Zubair",ca:"Unknown"},
  {d:"Mar 6",v:"Tugboat (rescue)",t:"Missile x2",c:true,dm:"Sank",ca:"3 missing"},
  {d:"Mar 7",v:"PRIMA",t:"Drone",c:true,dm:"Chemical tanker",ca:"Unknown"},
  {d:"Mar 7",v:"Louise P",t:"Drone",c:false,dm:"IRGC claims US tanker",ca:"Unknown"},
  {d:"Mar 7",v:"Mussafah 2",t:"Missile x2",c:true,dm:"Assisting Safeen",ca:"Unknown"},
  {d:"Mar 11",v:"Cargo ship (unnamed)",t:"Projectile",c:true,dm:"Ablaze in Strait of Hormuz",ca:"Unknown"},
  {d:"Mar 11",v:"Mayuree Naree",t:"Projectile x2",c:true,dm:"Thai bulk carrier. Fire, engine room damage. IRGC claimed.",ca:"3 missing, 20 evacuated"},
  {d:"Mar 11",v:"Express Rome",t:"Projectile",c:true,dm:"Liberia-flagged container ship hit off UAE coast. IRGC claimed.",ca:"Unknown"},
];
const infra=[
  {d:"Mar 2",f:"Ras Tanura Refinery",co:"🇸🇦 Saudi Arabia",cap:"550K bpd",st:"Shut",pd:"Minor",det:"Drone debris fire. Precautionary."},
  {d:"Mar 2",f:"Ras Laffan LNG",co:"🇶🇦 Qatar",cap:"81Mt LNG/yr",st:"Shut",pd:"Moderate",det:"Drone strike. Force majeure Mar 4."},
  {d:"Mar 2",f:"Mussafah Terminal",co:"🇦🇪 UAE",cap:"Storage",st:"Damaged",pd:"Moderate",det:"Direct drone hit, tank fire."},
  {d:"Mar 3",f:"Fujairah Oil Terminal",co:"🇦🇪 UAE",cap:"Strategic storage",st:"Damaged",pd:"Moderate",det:"Debris fire. More strikes Mar 7, 9."},
  {d:"Mar 3",f:"Port of Duqm",co:"🇴🇲 Oman",cap:"Fuel storage",st:"Damaged",pd:"Moderate",det:"Drone hits, tank explosion."},
  {d:"Mar 3",f:"Port of Salalah",co:"🇴🇲 Oman",cap:"Fuel handling",st:"Damaged",pd:"Minor",det:"Drone strike."},
  {d:"Mar 3",f:"Rumaila Oil Field",co:"🇮🇶 Iraq",cap:"1.5M bpd",st:"Shut",pd:"None",det:"Operational: storage full."},
  {d:"Mar 3",f:"West Qurna 2",co:"🇮🇶 Iraq",cap:"400K bpd",st:"Shut",pd:"None",det:"Operational: storage full."},
  {d:"Mar 5",f:"BAPCO Sitra",co:"🇧🇭 Bahrain",cap:"405K bpd",st:"Struck",pd:"Mod-Severe",det:"Ballistic missile direct hit. FM Mar 9."},
  {d:"Mar 7",f:"Shaybah Field",co:"🇸🇦 Saudi Arabia",cap:"1M bpd",st:"OK",pd:"None",det:"Drone waves intercepted."},
  {d:"Mar 7-8",f:"Kuwait Airport Fuel",co:"🇰🇼 Kuwait",cap:"Aviation",st:"Damaged",pd:"Moderate",det:"Drone hits on fuel tanks."},
  {d:"Mar 9",f:"Vopak Fujairah",co:"🇦🇪 UAE",cap:"Storage",st:"Struck",pd:"Moderate",det:"Drone strikes on terminal."},
  {d:"Mar 9",f:"Hidd Desalination",co:"🇧🇭 Bahrain",cap:"90M gal/day",st:"Struck",pd:"Moderate",det:"Loitering munitions. Water escalation."},
  {d:"Mar 10",f:"ADNOC Ruwais Complex",co:"🇦🇪 UAE",cap:"922K bpd refining",st:"Shut",pd:"Minor",det:"Drone strike fire. Precautionary shutdown of refinery. Downstream ops continue."},
  {d:"Mar 10",f:"Manama residential",co:"🇧🇭 Bahrain",cap:"Civilian",st:"Struck",pd:"Moderate",det:"Iranian attack hit residential building. 1 woman killed, 8 wounded."},
  {d:"Mar 10-11",f:"Strait minelaying",co:"🇮🇷 Iran (offensive)",cap:"Maritime denial",st:"Active",pd:"N/A",det:"Iran began laying mines. US sank 16 minelayers. 'Few dozen' mines deployed."},
  {d:"Mar 11",f:"Cargo ship in Strait",co:"International waters",cap:"Cargo vessel",st:"Struck",pd:"Moderate",det:"Cargo ship ablaze after hit by projectile in Strait."},
  {d:"Mar 11",f:"Mayuree Naree (vessel)",co:"Strait of Hormuz",cap:"Bulk carrier",st:"Struck",pd:"Moderate",det:"Thai-flagged. 2 projectiles. Engine room fire. 3 missing, 20 evacuated. IRGC claimed."},
  {d:"Mar 11",f:"Express Rome (vessel)",co:"Off UAE coast",cap:"Container ship",st:"Struck",pd:"Unknown",det:"Liberia-flagged. Hit nr Ras al Khaymah. IRGC claimed."},
];
const priceData=[{d:"Feb 27",b:72.87},{d:"Feb 28",b:78},{d:"Mar 1",b:79.3},{d:"Mar 2",b:84},{d:"Mar 3",b:86},{d:"Mar 4",b:83},{d:"Mar 5",b:90},{d:"Mar 6",b:93},{d:"Mar 7",b:95},{d:"Mar 8",b:99},{d:"Mar 9",b:119.5},{d:"Mar 10",b:87.8},{d:"Mar 11",b:92}];
const straitData=[{d:"Pre-war",c:85},{d:"Feb 28",c:17},{d:"Mar 1",c:3},{d:"Mar 2",c:0},{d:"Mar 3",c:2},{d:"Mar 4",c:5},{d:"Mar 5",c:4},{d:"Mar 6",c:3},{d:"Mar 7",c:3},{d:"Mar 8",c:2},{d:"Mar 9",c:1},{d:"Mar 10",c:1},{d:"Mar 11",c:1}];

// ═══════════ COMPONENTS ═══════════
const Bg=({children,bg,color,border})=><span style={{display:"inline-block",padding:"2px 7px",borderRadius:4,fontSize:10,fontWeight:700,background:bg,color,border:`1px solid ${border}`,fontFamily:F,letterSpacing:"0.05em",textTransform:"uppercase",whiteSpace:"nowrap"}}>{children}</span>;
const SC=({label,value,sub,color=C.text,icon})=>(<div style={{background:C.panel,border:`1px solid ${C.panelBorder}`,borderRadius:8,padding:"13px 15px",flex:1,minWidth:150,position:"relative",overflow:"hidden"}}><div style={{position:"absolute",top:0,left:0,right:0,height:2,background:color}}/><div style={{fontSize:9,color:C.textDim,fontFamily:F,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:4}}>{icon} {label}</div><div style={{fontSize:21,fontWeight:800,color,fontFamily:F,lineHeight:1.1}}>{value}</div>{sub&&<div style={{fontSize:10,color:C.textMuted,marginTop:2,fontFamily:F}}>{sub}</div>}</div>);
const Sec=({children,accent=C.accent})=>(<div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14,marginTop:28}}><div style={{width:4,height:22,background:accent,borderRadius:2}}/><h2 style={{margin:0,fontSize:13,fontWeight:700,color:C.text,fontFamily:F,letterSpacing:"0.04em",textTransform:"uppercase"}}>{children}</h2><div style={{flex:1,height:1,background:C.panelBorder}}/></div>);
const P=({children,style})=><div style={{background:C.panel,border:`1px solid ${C.panelBorder}`,borderRadius:8,padding:20,...style}}>{children}</div>;
const Tip=({active,payload,label})=>{if(!active||!payload?.length)return null;return <div style={{background:"#1e293b",border:`1px solid ${C.panelBorder}`,borderRadius:6,padding:"8px 12px",fontFamily:F,fontSize:11}}><div style={{color:C.textDim,marginBottom:3}}>{label}</div>{payload.map((p,i)=><div key={i} style={{color:p.color||C.text}}>{p.name}: <strong>{typeof p.value==="number"?p.value.toFixed(2):p.value}</strong></div>)}</div>};
const Dots=({level})=><div style={{display:"flex",gap:2}}>{[1,2,3,4,5].map(i=><div key={i} style={{width:12,height:5,borderRadius:2,background:i<=level?(level>=4?C.accent:level>=3?C.warn:C.blue):"#1e293b"}}/>)}</div>;
const MBar=({pct,color})=><div style={{background:"#1e293b",borderRadius:3,height:6,width:"100%",overflow:"hidden"}}><div style={{width:`${Math.min(pct,100)}%`,height:"100%",borderRadius:3,background:color||C.accent}}/></div>;

// ═══════════ MAIN APP ═══════════
const TABS=["Overview","Structural Damage","Gulf Aggregate","Vessel Attacks","Infrastructure","Production"];

export default function App(){
  const[tab,setTab]=useState("Overview");
  return(
    <div style={{background:C.bg,minHeight:"100vh",color:C.text,fontFamily:F}}>
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700;800&display=swap" rel="stylesheet"/>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}} ::-webkit-scrollbar{width:6px;height:6px} ::-webkit-scrollbar-track{background:${C.bg}} ::-webkit-scrollbar-thumb{background:${C.panelBorder};border-radius:3px} table{border-collapse:collapse;width:100%} th,td{padding:8px 10px;text-align:left;font-family:${F};font-size:11px;border-bottom:1px solid ${C.panelBorder}} th{color:${C.textDim};font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase}`}</style>

      <div style={{background:"linear-gradient(180deg,#1a0505 0%,#0a0e17 100%)",borderBottom:`1px solid ${C.accentDim}`,padding:"20px 28px 14px"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:2}}>
          <div style={{width:9,height:9,borderRadius:"50%",background:C.accent,boxShadow:"0 0 12px #ef444488",animation:"pulse 2s infinite"}}/>
          <span style={{fontSize:10,color:C.accent,fontWeight:700,letterSpacing:"0.15em"}}>LIVE SITREP — DAY 12</span>
        </div>
        <h1 style={{margin:"2px 0",fontSize:22,fontWeight:800,background:"linear-gradient(90deg,#f87171,#fbbf24)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Strait of Hormuz — Hydrocarbon Impact Assessment</h1>
        <div style={{fontSize:11,color:C.textDim,marginBottom:14}}>28 Feb 2026 (Operation Epic Fury) → 11 Mar 2026, 18:40 CET | BREAKING: IEA releases record 400M bbl from reserves; 3 more ships hit today; Russia advising Iran on drone tactics</div>
        <div style={{display:"flex",gap:2,flexWrap:"wrap"}}>{TABS.map(t=><button key={t} onClick={()=>setTab(t)} style={{background:tab===t?C.panel:"transparent",border:tab===t?`1px solid ${C.panelBorder}`:"1px solid transparent",borderBottom:tab===t?`1px solid ${C.bg}`:"none",borderRadius:"6px 6px 0 0",padding:"7px 14px",color:tab===t?C.text:C.textMuted,fontFamily:F,fontSize:11,fontWeight:600,cursor:"pointer",letterSpacing:"0.05em",textTransform:"uppercase"}}>{t}</button>)}</div>
      </div>

      <div style={{padding:"0 28px 48px",maxWidth:1320,margin:"0 auto"}}>

{/* ═══ OVERVIEW ═══ */}
{tab==="Overview"&&<>
  <div style={{display:"flex",gap:10,flexWrap:"wrap",marginTop:20}}>
    <SC label="Pre-War Output" value={`${totPre.toFixed(1)}M`} sub="bpd" color={C.textDim} icon="◈"/>
    <SC label="Current Output" value={`${totCur.toFixed(1)}M`} sub="bpd" color={C.warn} icon="▼"/>
    <SC label="Lost" value={`${totLost.toFixed(1)}M`} sub={`bpd (${((totLost/totPre)*100).toFixed(0)}%)`} color={C.accent} icon="✕"/>
    <SC label="Brent" value="~$92" sub="Peak $119.50 | IEA release" color={C.highlight} icon="◆"/>
    <SC label="Vessels Hit" value="17+" sub="7+ killed, 3+ missing today" color={C.accent} icon="⚠"/>
    <SC label="Strait" value="−97%" sub="2/day vs 85" color={C.accent} icon="◇"/>
  </div>
  <Sec accent={C.warn}>Production by Country (M bpd)</Sec>
  <P><ResponsiveContainer width="100%" height={270}><BarChart data={prodData} barGap={4}><CartesianGrid strokeDasharray="3 3" stroke={C.panelBorder}/><XAxis dataKey="country" tick={{fill:C.textDim,fontSize:10,fontFamily:F}}/><YAxis tick={{fill:C.textDim,fontSize:10,fontFamily:F}} unit="M"/><Tooltip content={<Tip/>}/><Legend wrapperStyle={{fontFamily:F,fontSize:11}}/><Bar dataKey="pre" name="Pre-War" fill="#475569" radius={[3,3,0,0]}/><Bar dataKey="cur" name="Current" radius={[3,3,0,0]}>{prodData.map((e,i)=><Cell key={i} fill={e.dis?C.accent:C.warn}/>)}</Bar></BarChart></ResponsiveContainer></P>
  <div style={{display:"flex",gap:14,marginTop:6,flexWrap:"wrap"}}>
    <div style={{flex:1.2,minWidth:360}}><Sec accent={C.highlight}>Brent Crude ($/bbl)</Sec><P><ResponsiveContainer width="100%" height={180}><AreaChart data={priceData}><defs><linearGradient id="pg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.highlight} stopOpacity={0.3}/><stop offset="95%" stopColor={C.highlight} stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke={C.panelBorder}/><XAxis dataKey="d" tick={{fill:C.textDim,fontSize:9,fontFamily:F}}/><YAxis domain={[60,130]} tick={{fill:C.textDim,fontSize:9,fontFamily:F}} unit="$"/><Tooltip content={<Tip/>}/><Area type="monotone" dataKey="b" stroke={C.highlight} fill="url(#pg)" strokeWidth={2} name="Brent"/></AreaChart></ResponsiveContainer></P></div>
    <div style={{flex:0.8,minWidth:280}}><Sec accent={C.blue}>Strait Crossings/Day</Sec><P><ResponsiveContainer width="100%" height={180}><BarChart data={straitData}><CartesianGrid strokeDasharray="3 3" stroke={C.panelBorder}/><XAxis dataKey="d" tick={{fill:C.textDim,fontSize:8,fontFamily:F}} angle={-25} textAnchor="end" height={45}/><YAxis tick={{fill:C.textDim,fontSize:9,fontFamily:F}}/><Tooltip content={<Tip/>}/><Bar dataKey="c" name="Crossings" radius={[3,3,0,0]}>{straitData.map((e,i)=><Cell key={i} fill={i===0?C.blue:e.c===0?C.accent:e.c<10?C.warn:C.safe}/>)}</Bar></BarChart></ResponsiveContainer></P></div>
  </div>
</>}

{/* ═══ STRUCTURAL DAMAGE ═══ */}
{tab==="Structural Damage"&&<>
  <div style={{display:"flex",gap:10,flexWrap:"wrap",marginTop:20}}>
    <SC label="Replacement Value" value={`$${totRepl.toFixed(0)}B`} sub="total affected assets" color={C.textDim} icon="🏗"/>
    <SC label="Est. Physical Damage" value={`$${totDmgLo.toFixed(1)}-${totDmgHi.toFixed(1)}B`} sub={`midpoint $${totDmgMid.toFixed(1)}B (${dmgPctRepl}% of replacement)`} color={C.accent} icon="💥"/>
    <SC label="Daily Revenue Loss" value={`$${totDailyRev.toFixed(0)}M`} sub="all facilities combined" color={C.warn} icon="📉"/>
    <SC label="11-Day Cumul. Rev Loss" value={`$${(cum11d/1000).toFixed(1)}B`} sub="and accelerating daily" color={C.highlight} icon="💰"/>
    <SC label="MINES CONFIRMED" value="Active" sub="Few dozen laid. US sank 16 minelayers." color={"#f43f5e"} icon="💣"/>
  </div>

  {/* ── THE BIG COMPARISON: Replacement vs Damage vs Revenue ── */}
  <Sec accent={C.purple}>Economic Damage vs Replacement Value — The Full Picture ($B)</Sec>
  <P>
    <div style={{display:"flex",gap:24,flexWrap:"wrap",alignItems:"flex-start"}}>
      <div style={{flex:1.3,minWidth:380}}>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={layersChart} layout="vertical" barGap={6} margin={{left:10}}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.panelBorder}/>
            <XAxis type="number" tick={{fill:C.textDim,fontSize:10,fontFamily:F}} unit="$B"/>
            <YAxis dataKey="name" type="category" width={140} tick={{fill:C.textDim,fontSize:9,fontFamily:F}}/>
            <Tooltip content={<Tip/>}/>
            <Bar dataKey="val" name="$B" radius={[0,4,4,0]}>
              {layersChart.map((e,i)=><Cell key={i} fill={e.fill}/>)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={{flex:1,minWidth:300}}>
        <div style={{fontSize:12,color:C.textDim,lineHeight:1.9}}>
          <div style={{marginBottom:12}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
              <div style={{width:12,height:12,borderRadius:2,background:"#334155"}}/>
              <span style={{fontWeight:700,color:C.text}}>Replacement Value: ${totRepl.toFixed(0)}B</span>
            </div>
            <div style={{fontSize:11,color:C.textMuted,paddingLeft:20}}>Total cost to rebuild all affected facilities from scratch. This is the theoretical maximum loss if everything were destroyed.</div>
          </div>
          <div style={{marginBottom:12}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
              <div style={{width:12,height:12,borderRadius:2,background:C.accent}}/>
              <span style={{fontWeight:700,color:C.accent}}>Est. Physical Damage: ${totDmgLo.toFixed(1)}-${totDmgHi.toFixed(1)}B</span>
            </div>
            <div style={{fontSize:11,color:C.textMuted,paddingLeft:20}}>Only <strong style={{color:C.text}}>{dmgPctRepl}%</strong> of replacement value — most shutdowns are precautionary or operational, not structural. But BAPCO ($1-3B) and Ras Laffan ($0.5-2B) assessments are still preliminary.</div>
          </div>
          <div style={{marginBottom:12}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
              <div style={{width:12,height:12,borderRadius:2,background:C.warn}}/>
              <span style={{fontWeight:700,color:C.warn}}>Revenue Lost (11 days): ${(cum11d/1000).toFixed(1)}B</span>
            </div>
            <div style={{fontSize:11,color:C.textMuted,paddingLeft:20}}>Already <strong style={{color:C.text}}>exceeds the physical damage estimate</strong>. Revenue loss compounds daily regardless of whether facilities are physically damaged or operationally shut.</div>
          </div>
          <div>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
              <div style={{width:12,height:12,borderRadius:2,background:C.highlight}}/>
              <span style={{fontWeight:700,color:C.highlight}}>Projected 30-day: ${((totDailyRev*30)/1000).toFixed(1)}B</span>
            </div>
            <div style={{fontSize:11,color:C.textMuted,paddingLeft:20}}>If the situation persists, revenue losses dwarf physical damage by an order of magnitude. The economic harm is overwhelmingly from the <em>blockade</em>, not the <em>bombs</em>.</div>
          </div>
        </div>
      </div>
    </div>
  </P>

  {/* ── Replacement Cost vs Estimated Damage per Facility ── */}
  <Sec accent={C.accent}>Replacement Cost vs Estimated Damage — Per Facility ($B)</Sec>
  <P>
    <ResponsiveContainer width="100%" height={340}>
      <BarChart data={replChart} layout="vertical" margin={{left:10}}>
        <CartesianGrid strokeDasharray="3 3" stroke={C.panelBorder}/>
        <XAxis type="number" tick={{fill:C.textDim,fontSize:10,fontFamily:F}} unit="$B"/>
        <YAxis dataKey="name" type="category" width={150} tick={{fill:C.textDim,fontSize:9,fontFamily:F}}/>
        <Tooltip content={<Tip/>}/><Legend wrapperStyle={{fontFamily:F,fontSize:11}}/>
        <Bar dataKey="replacement" name="Replacement Value" fill="#334155" radius={[0,3,3,0]}/>
        <Bar dataKey="estDamage" name="Est. Physical Damage" fill={C.accent} radius={[0,3,3,0]}/>
      </BarChart>
    </ResponsiveContainer>
    <div style={{fontSize:11,color:C.textMuted,marginTop:10,lineHeight:1.6}}>
      The disparity is striking: <strong style={{color:C.text}}>most facilities have suffered minimal physical damage relative to their value</strong>. The two Iraqi fields ($37B combined replacement) have zero physical damage — they're shut purely because oil has nowhere to go. The real economic destruction comes from the Strait blockade and insurance collapse, not from the kinetic strikes themselves. However, BAPCO Bahrain (up to $3B damage on a $7.3B asset = up to 41% destroyed) and Ras Laffan (up to $2B on $35B) are notable exceptions where physical repair will be a major factor in recovery.
    </div>
  </P>

  {/* ── Capacity chart ── */}
  <Sec accent={C.warn}>Capacity Offline (M bpd equivalent)</Sec>
  <P><ResponsiveContainer width="100%" height={300}>
    <BarChart data={econChart} layout="vertical" barGap={2} margin={{left:10}}>
      <CartesianGrid strokeDasharray="3 3" stroke={C.panelBorder}/>
      <XAxis type="number" tick={{fill:C.textDim,fontSize:10,fontFamily:F}} unit="M"/>
      <YAxis dataKey="name" type="category" width={170} tick={{fill:C.textDim,fontSize:9,fontFamily:F}}/>
      <Tooltip content={<Tip/>}/><Legend wrapperStyle={{fontFamily:F,fontSize:11}}/>
      <Bar dataKey="current" name="Current" fill={C.safe} radius={[0,3,3,0]} stackId="a"/>
      <Bar dataKey="offline" name="Offline" fill={C.accent} radius={[0,3,3,0]} stackId="a"/>
    </BarChart>
  </ResponsiveContainer></P>

  {/* ── Facility table ── */}
  <Sec accent={C.blue}>Full Facility Table</Sec>
  <div style={{overflowX:"auto"}}><table>
    <thead><tr style={{background:"#0f172a"}}><th>Facility</th><th>Replacement</th><th>Est. Damage</th><th>Dmg/Repl %</th><th>% Offline</th><th>Daily Rev Loss</th><th>Category</th><th>Sev.</th></tr></thead>
    <tbody>{dmg.map((d,i)=>{const dp=(d.estDmgLo+d.estDmgHi)/2;const pct=d.replCost>0?((dp/d.replCost)*100):0;return <tr key={i} style={{background:i%2===0?"transparent":"#0f172a"}}>
      <td style={{fontWeight:600}}>{d.flag} {d.fac}</td>
      <td style={{color:C.textDim}}>${d.replCost}B</td>
      <td style={{color:dp>0?C.accent:C.safe,fontWeight:600}}>{dp>0?`$${d.estDmgLo}-${d.estDmgHi}B`:"$0"}</td>
      <td><div style={{display:"flex",alignItems:"center",gap:4}}>
        <span style={{color:pct>20?C.accent:pct>5?C.warn:C.safe,fontWeight:700,minWidth:28}}>{pct.toFixed(0)}%</span>
        <div style={{width:40}}><MBar pct={pct*2} color={pct>20?C.accent:pct>5?C.warn:C.safe}/></div>
      </div></td>
      <td style={{color:d.pctOff>=80?C.accent:d.pctOff>0?C.warn:C.safe,fontWeight:700}}>{d.pctOff}%</td>
      <td style={{color:C.warn,fontWeight:600,fontSize:10}}>{d.dailyLoss}</td>
      <td><Bg bg={`${d.catColor}22`} color={d.catColor} border={`${d.catColor}44`}>{d.cat}</Bg></td>
      <td><Dots level={d.sev}/></td>
    </tr>})}</tbody>
    <tfoot><tr style={{borderTop:`2px solid ${C.panelBorder}`,background:"#0f172a"}}>
      <td style={{fontWeight:700}}>TOTAL</td>
      <td style={{fontWeight:700}}>${totRepl.toFixed(0)}B</td>
      <td style={{fontWeight:700,color:C.accent}}>${totDmgLo.toFixed(1)}-${totDmgHi.toFixed(1)}B</td>
      <td style={{fontWeight:700,color:C.warn}}>{dmgPctRepl}%</td>
      <td style={{fontWeight:700,color:C.accent}}>{((totOffM/totPreM)*100).toFixed(0)}%</td>
      <td style={{fontWeight:700,color:C.warn}}>${totDailyRev.toFixed(0)}M/day</td>
      <td colSpan={2} style={{color:C.textDim,fontSize:10}}>11d: ${(cum11d/1000).toFixed(1)}B rev lost</td>
    </tr></tfoot>
  </table></div>

  {/* ── Long-term risks ── */}
  <Sec accent={C.purple}>Long-Term Structural Risks</Sec>
  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
    {[{c:C.accent,t:"RESERVOIR DAMAGE — Iraq ($37B assets, $0 physical damage)",x:"Rumaila + West Qurna 2: zero physical damage but >4-6 week shutdown causes reservoir degradation. Workover costs: months + $100Ms. Paradox: no bombs fell, but the blockade may permanently reduce Iraq's production capacity."},
      {c:C.accent,t:"LNG RESTART — Qatar ($35B asset, $0.5-2B damage est.)",x:"Ras Laffan: damage assessment ongoing but even undamaged, LNG trains need 4-8 weeks restart. CEO: won't restart until war ends. If infrastructure hit: months. Revenue loss ($200M/day) compounds far faster than any repair cost."},
      {c:C.warn,t:"REFINING — Bahrain ($7.3B asset, $1-3B damage est.)",x:"BAPCO took the hardest hit relative to its value — up to 41% damage ratio. Only refinery in country. If bottom-of-barrel units destroyed, 6-12 month rebuild. Bahrain now 100% import-dependent."},
      {c:C.warn,t:"BYPASS — Fujairah ($6.5B asset, $0.3-1B damage est.)",x:"Iran systematically targeting the ADCOP bypass terminus. 3 strikes in 7 days. Even partial degradation eliminates the UAE's workaround for the Strait closure."},
      {c:C.blue,t:"INSURANCE + IEA 400M BBL RELEASE",x:"IEA announced record 400M bbl strategic release (2x Ukraine). But analysts: '4 days of global production, 16 days of Hormuz volume — if that doesn't sound like much, it isn't' (Macquarie). US $20B DFC reinsurance launched but shipowners say safety is the bottleneck. Gulf exports at <10% of pre-war levels (IEA). Brent rebounded to ~$92 after announcement — market not convinced."},
      {c:"#f43f5e",t:"⚠ MINES CONFIRMED + RUSSIA ADVISING IRAN",x:"Iran laying mines in Strait (US intel). US sank 16 minelayers but has NO minesweepers in Gulf. NEW: Russia giving Iran specific tactical drone advice (CNN/Western intel) — representing escalated foreign support. IRGC now demands ships get permission to transit. 3 more ships hit today alone (17+ total). Clearance = 2+ months post-ceasefire."},
      {c:C.warn,t:"NEW: ADNOC RUWAIS SHUT (Mar 10) — $15B+ asset",x:"UAE's central downstream hub (922K bpd refining + petrochems) shut after drone strike. Combined with Ras Tanura (550K) + BAPCO (405K), now ~1.9M bpd of Gulf refining offline. Refinery shutdowns create downstream fuel shortages independent of crude supply."},
    ].map((r,i)=><P key={i} style={{padding:14,borderLeft:`3px solid ${r.c}`}}>
      <div style={{fontWeight:700,color:r.c,fontSize:11,marginBottom:6,textTransform:"uppercase",letterSpacing:"0.04em"}}>{r.t}</div>
      <div style={{fontSize:11,color:C.textDim,lineHeight:1.65}}>{r.x}</div>
    </P>)}
  </div>
</>}

{/* ═══ GULF AGGREGATE ═══ */}
{tab==="Gulf Aggregate"&&<>
  <div style={{display:"flex",gap:10,flexWrap:"wrap",marginTop:20}}>
    <SC label="Gulf Reserves" value="~800B" sub="bbl" color={C.blue} icon="🛢"/><SC label="Global Share" value="~25%" sub="production" color={C.blue} icon="🌍"/><SC label="Normal Transit" value="~20M" sub="bpd via Strait" color={C.blue} icon="🚢"/><SC label="Refining" value="~5.2M" sub="bpd (~1.9M offline)" color={C.accent} icon="🏭"/>
  </div>
  <Sec accent={C.accent}>Aggregate Impact</Sec>
  <P><div style={{display:"flex",gap:24,flexWrap:"wrap"}}>
    <div style={{flex:1,minWidth:240}}><ResponsiveContainer width="100%" height={240}><PieChart><Pie data={[{name:"Producing",value:totCur},{name:"Lost",value:totLost}]} cx="50%" cy="50%" innerRadius={50} outerRadius={85} startAngle={90} endAngle={-270} paddingAngle={3} dataKey="value"><Cell fill={C.safe}/><Cell fill={C.accent}/></Pie><Tooltip content={<Tip/>}/><Legend wrapperStyle={{fontFamily:F,fontSize:11}}/></PieChart></ResponsiveContainer><div style={{textAlign:"center"}}><div style={{fontSize:28,fontWeight:800,color:C.accent}}>{((totLost/totPre)*100).toFixed(0)}%</div><div style={{fontSize:11,color:C.textDim}}>Gulf capacity offline</div></div></div>
    <div style={{flex:1.5,minWidth:320}}><table><tbody>
      {[["Pre-war",`${totPre.toFixed(1)}M bpd`],["Current",`${totCur.toFixed(1)}M bpd`,C.warn],["Lost",`−${totLost.toFixed(1)}M bpd (${((totLost/totPre)*100).toFixed(0)}%)`,C.accent],[""],["Strait normal","~20M bpd + 20% LNG"],["Strait current","Near zero",C.accent],["Bypass usable","~3.0M of 8.0M",C.warn],["Zero-bypass","IQ, KW, QA, BH",C.accent],[""],["Brent","$72.87→$92 (+26%)",C.highlight],["Peak","$119.50 (+64%)",C.accent],["LNG","EU +60%, Asia +40%",C.warn],["IEA release","Record 400M bbl announced",C.blue],["Force majeures","QA, KW, BH (+IQ)",C.purple]].map((r,i)=>{if(r.length===1&&r[0]==="")return <tr key={i}><td colSpan={2} style={{height:6}}></td></tr>;return <tr key={i}><td style={{color:C.textMuted,padding:"4px 0"}}>{r[0]}</td><td style={{color:r[2]||C.text,fontWeight:r[2]?700:500,textAlign:"right",padding:"4px 0"}}>{r[1]}</td></tr>})}
    </tbody></table></div>
  </div></P>
  <Sec accent={C.warn}>Hormuz Dependency</Sec>
  <P><ResponsiveContainer width="100%" height={230}><BarChart data={prodData}><CartesianGrid strokeDasharray="3 3" stroke={C.panelBorder}/><XAxis dataKey="country" tick={{fill:C.textDim,fontSize:10,fontFamily:F}}/><YAxis tick={{fill:C.textDim,fontSize:10,fontFamily:F}} unit="%" domain={[0,100]}/><Tooltip content={<Tip/>}/><Bar dataKey="hz" name="% via Hormuz" radius={[3,3,0,0]}>{prodData.map((e,i)=><Cell key={i} fill={e.hz>=95?C.accent:e.hz>=80?C.warn:C.safe}/>)}</Bar></BarChart></ResponsiveContainer></P>
  <Sec accent={C.safe}>Recovery Scenarios</Sec>
  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
    {[{t:"Optimistic: 1-2 wks",c:C.safe,i:["Strait reopens w/ escorts","Insurance: 2-4 wks","IQ/KW: 1-2 wks","QA LNG: 4-8 wks","Brent $70-80","Recovery: 2-3 mo"]},{t:"Base: 4-6 wks",c:C.warn,i:["Storage exhaustion","IQ reservoir damage","QA 2+ mo offline","BAPCO: months","Brent $90-120","Recovery: 4-8 mo"]},{t:"Pessimistic",c:C.accent,i:["Mines (2+ mo clear)","Infra campaign","Reservoir damage","QA delayed years","Brent $120-200","Recovery: 12-24+ mo"]}].map((s,i)=><P key={i} style={{padding:14,borderTop:`3px solid ${s.c}`}}><div style={{fontWeight:700,color:s.c,fontSize:11,marginBottom:8}}>{s.t}</div>{s.i.map((x,j)=><div key={j} style={{fontSize:10,color:C.textDim,lineHeight:1.55,paddingLeft:10,position:"relative",marginBottom:3}}><span style={{position:"absolute",left:0,color:s.c}}>›</span>{x}</div>)}</P>)}
  </div>
</>}

{/* ═══ VESSEL ATTACKS ═══ */}
{tab==="Vessel Attacks"&&<>
  <Sec accent={C.accent}>Vessel Attacks — Feb 28 to Mar 7</Sec>
  <div style={{fontSize:11,color:C.textMuted,marginBottom:14}}>{vessels.length} incidents | {vessels.filter(a=>a.c).length} confirmed | 7+ killed, 3+ missing</div>
  <div style={{overflowX:"auto"}}><table><thead><tr style={{background:"#0f172a"}}><th>Date</th><th>Vessel</th><th>Type</th><th>Status</th><th>Damage</th><th>Casualties</th></tr></thead><tbody>{vessels.map((a,i)=><tr key={i} style={{background:i%2===0?"transparent":"#0f172a"}}><td style={{fontWeight:600,whiteSpace:"nowrap"}}>{a.d}</td><td style={{fontWeight:500}}>{a.v}</td><td style={{color:C.textDim}}>{a.t}</td><td><Bg bg={a.c?"#1e3a5f":"#3f3f00"} color={a.c?"#93c5fd":"#fde047"} border={a.c?"#2563eb44":"#eab30844"}>{a.c?"CONFIRMED":"UNCONFIRMED"}</Bg></td><td style={{color:C.textDim,fontSize:10}}>{a.dm}</td><td style={{color:a.ca.includes("killed")||a.ca.includes("missing")?C.accent:C.textDim,fontWeight:600}}>{a.ca}</td></tr>)}</tbody></table></div>
</>}

{/* ═══ INFRASTRUCTURE ═══ */}
{tab==="Infrastructure"&&<>
  <Sec accent={C.warn}>Energy Infrastructure Attacks</Sec>
  <div style={{overflowX:"auto"}}><table><thead><tr style={{background:"#0f172a"}}><th>Date</th><th>Facility</th><th>Country</th><th>Capacity</th><th>Status</th><th>Damage</th><th>Detail</th></tr></thead><tbody>{infra.map((a,i)=><tr key={i} style={{background:i%2===0?"transparent":"#0f172a"}}><td style={{fontWeight:600,whiteSpace:"nowrap"}}>{a.d}</td><td style={{fontWeight:500}}>{a.f}</td><td style={{color:C.textDim}}>{a.co}</td><td style={{color:C.textDim,fontSize:10}}>{a.cap}</td><td><Bg bg={a.st==="Shut"||a.st==="Struck"?`${C.accent}22`:a.st==="OK"?`${C.safe}22`:`${C.warn}22`} color={a.st==="Shut"||a.st==="Struck"?C.accent:a.st==="OK"?C.safe:C.warn} border={a.st==="Shut"||a.st==="Struck"?`${C.accent}44`:a.st==="OK"?`${C.safe}44`:`${C.warn}44`}>{a.st}</Bg></td><td><Bg bg={a.pd==="None"?`${C.safe}22`:a.pd==="Minor"?`${C.blue}22`:`${C.accent}22`} color={a.pd==="None"?C.safe:a.pd==="Minor"?C.blue:C.accent} border={a.pd==="None"?`${C.safe}44`:a.pd==="Minor"?`${C.blue}44`:`${C.accent}44`}>{a.pd}</Bg></td><td style={{color:C.textDim,fontSize:10,maxWidth:220}}>{a.det}</td></tr>)}</tbody></table></div>
</>}

{/* ═══ PRODUCTION ═══ */}
{tab==="Production"&&<>
  <Sec accent={C.warn}>Country-by-Country</Sec>
  {prodData.map((d,i)=>{const pct=((d.pre-d.cur)/d.pre*100).toFixed(0);return <P key={i} style={{marginBottom:10,padding:14}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6,flexWrap:"wrap",gap:6}}>
      <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:18}}>{d.flag}</span><span style={{fontSize:14,fontWeight:700}}>{d.country}</span><Bg bg={d.dis?`${C.accent}22`:`${C.warn}22`} color={d.dis?C.accent:C.warn} border={d.dis?`${C.accent}44`:`${C.warn}44`}>{d.dis?"DISRUPTED":"REDUCED"}</Bg>{d.hz===100&&<Bg bg="#7f1d1d" color="#fca5a5" border="#991b1b">100% HORMUZ</Bg>}</div>
      <div><span style={{fontSize:20,fontWeight:800,color:d.dis?C.accent:C.warn}}>{d.cur}M</span><span style={{fontSize:12,color:C.textMuted}}> / {d.pre}M</span><span style={{marginLeft:10,fontSize:13,fontWeight:700,color:parseInt(pct)>50?C.accent:C.warn}}>▼{pct}%</span></div>
    </div>
    <MBar pct={d.cur/d.pre*100} color={d.dis?C.accent:C.warn}/>
    <div style={{fontSize:11,color:C.textMuted,lineHeight:1.5,marginTop:6}}>{d.note}{d.bp>0&&<span style={{color:C.safe}}> Bypass: {d.bp}M bpd.</span>}</div>
  </P>})}
</>}

      <div style={{marginTop:36,paddingTop:14,borderTop:`1px solid ${C.panelBorder}`,fontSize:9,color:C.textMuted,lineHeight:1.5}}>
        <strong>SOURCES:</strong> Reuters, Bloomberg, CNBC, Al Jazeera, NPR, FT, CNN, PBS, CBS, ABC, Axios, CSIS, USNI News, ICG, Windward, IEA, Critical Threats, Long War Journal, Rapidan, Morgan Stanley, Rystad, JPMorgan, Macquarie, S&P Global, EIA (STEO Mar 10), Vantor, DFC, UKMTO.
        <br/><strong>DISCLAIMER:</strong> Estimates as of 11 Mar 2026 18:40 CET (Day 12). Replacement values are industry benchmarks. Mining/vessel attack info per US intel reporting (CNN, Axios) and UKMTO. IEA release details (pace, allocation) still TBD. Rapidly evolving.
      </div>
      </div>
    </div>
  );
}
