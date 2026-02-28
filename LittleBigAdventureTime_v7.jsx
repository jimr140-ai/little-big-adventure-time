import { useState, useEffect, useRef, useCallback } from "react";
import {
  Search, Compass, User, Plus, X, ThumbsUp, Play, Pause,
  Sparkles, Navigation, Wind, Droplets, Sun, Moon, BookOpen, Leaf,
  Users, Share2, Mic, Globe, Lock, ChevronRight, Clock, Check,
  ExternalLink, Music, ArrowRight, Map, Feather, Trophy, Shield, Flame,
  ShoppingBag, Star, Tag, MapPin, Calendar, Phone
} from "lucide-react";

// ─── GLOBAL CSS ──────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Crimson+Pro:ital,wght@0,400;0,600;1,400;1,600&family=DM+Sans:wght@400;500;600&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
::-webkit-scrollbar{display:none}
body{background:#0d1117;font-family:'DM Sans',sans-serif}
@keyframes pulse-gold{0%,100%{filter:drop-shadow(0 0 6px rgba(251,191,36,.8))}50%{filter:drop-shadow(0 0 18px rgba(251,191,36,1))}}
@keyframes pulse-red{0%,100%{filter:drop-shadow(0 0 5px rgba(239,68,68,.8))}50%{filter:drop-shadow(0 0 16px rgba(239,68,68,1))}}
@keyframes blue-pulse{0%,100%{filter:drop-shadow(0 0 5px rgba(59,130,246,.8))}50%{filter:drop-shadow(0 0 16px rgba(59,130,246,1))}}
@keyframes legendary-shimmer{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
@keyframes slide-up{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}
@keyframes fade-in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes wave{0%,100%{height:4px}50%{height:16px}}
@keyframes pop{0%{transform:scale(0);opacity:0}70%{transform:scale(1.18)}100%{transform:scale(1);opacity:1}}
@keyframes celebration{0%{transform:scale(0) rotate(-20deg);opacity:0}60%{transform:scale(1.2) rotate(5deg);opacity:1}100%{transform:scale(1) rotate(0);opacity:1}}
@keyframes fab-pulse{0%,100%{box-shadow:0 4px 20px rgba(251,146,60,.5)}50%{box-shadow:0 4px 36px rgba(251,146,60,.85),0 0 0 8px rgba(251,146,60,.1)}}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
@keyframes route-dash{to{stroke-dashoffset:-24}}
@keyframes region-glow{0%,100%{opacity:.4}50%{opacity:.9}}
.sheet-enter{animation:slide-up .32s cubic-bezier(.34,1.15,.64,1) both}
.fade-in{animation:fade-in .35s ease both}
.pop-in{animation:pop .4s cubic-bezier(.34,1.56,.64,1) both}
.celebration{animation:celebration .6s cubic-bezier(.34,1.56,.64,1) both}
.fab{animation:fab-pulse 3s ease-in-out infinite}
.legendary-bg{background:linear-gradient(270deg,#7c3aed,#db2777,#7c3aed);background-size:400% 400%;animation:legendary-shimmer 3s ease infinite}
.float{animation:float 4s ease-in-out infinite}
.marker-seasonal{animation:pulse-gold 2.5s ease-in-out infinite}
.marker-folklore{animation:pulse-red 2s ease-in-out infinite}
.marker-user{animation:blue-pulse 2s ease-in-out infinite}
.route-line{stroke-dasharray:10 6;animation:route-dash 1.2s linear infinite}
.region-glow{animation:region-glow 2s ease-in-out infinite}
`;

// ─── COORDINATE UTILS ────────────────────────────────────────────────────────
function makeProj(lng0, lng1, lat1, lat0, svgW, svgH) {
  return (lat, lng) => ({
    x: ((lng - lng0) / (lng1 - lng0)) * svgW,
    y: ((lat1 - lat) / (lat1 - lat0)) * svgH
  });
}
function toPath(pts, proj) {
  return pts.map((p, i) => { const { x, y } = proj(p[0], p[1]); return `${i === 0 ? "M" : "L"} ${x.toFixed(1)},${y.toFixed(1)}`; }).join(" ");
}

// ─── RARITY & SOURCES ────────────────────────────────────────────────────────
const RARITY = {
  common:      { color:"#22c55e", bg:"rgba(34,197,94,0.12)",  text:"#4ade80", label:"Common",    pts:25,  flavour:"A fun challenge anyone can try" },
  rare:        { color:"#3b82f6", bg:"rgba(59,130,246,0.12)", text:"#60a5fa", label:"Rare",      pts:75,  flavour:"This one takes some skill" },
  epic:        { color:"#f59e0b", bg:"rgba(245,158,11,0.12)", text:"#fbbf24", label:"Epic",      pts:150, flavour:"Only the dedicated attempt this" },
  legendary:   { color:"#7c3aed", bg:"rgba(124,58,237,0.12)",text:"#a78bfa", label:"Legendary", pts:300, flavour:"Few have done this. Will you?" },
  stewardship: { color:"#16a34a", bg:"rgba(22,163,74,0.12)",  text:"#4ade80", label:"Give Back", pts:50,  flavour:"Give back to this place" },
};
const RE = { common:"🟢",rare:"🔵",epic:"🟡",legendary:"🟣",stewardship:"🌿" };

const SOURCES = {
  os:       { label:"OS Maps",        color:"#e63946", bg:"rgba(230,57,70,0.12)",   icon:"🗺️" },
  strava:   { label:"Strava",         color:"#fc4c02", bg:"rgba(252,76,2,0.12)",    icon:"📊" },
  community:{ label:"Community",      color:"#22c55e", bg:"rgba(34,197,94,0.12)",   icon:"👥" },
  historic: { label:"Historic Wales", color:"#f59e0b", bg:"rgba(245,158,11,0.12)", icon:"📜" },
  folklore: { label:"Welsh Folklore", color:"#ef4444", bg:"rgba(239,68,68,0.12)",  icon:"🧚" },
  nrw:      { label:"Natural Resources Wales", color:"#16a34a", bg:"rgba(22,163,74,0.12)", icon:"🌿" },
};

// ─── REGION DATA ─────────────────────────────────────────────────────────────
// Cardigan Bay
const CB_W=860, CB_H=1040;
const CB_PROJ = makeProj(-4.80,-4.10,52.60,51.90,CB_W,CB_H);
const CB_COAST = [
  [51.97,-4.740],[52.00,-4.722],[52.04,-4.706],[52.08,-4.682],
  [52.093,-4.664],[52.110,-4.675],[52.118,-4.692],[52.112,-4.703],
  [52.122,-4.688],[52.128,-4.668],[52.133,-4.642],
  [52.136,-4.608],[52.139,-4.570],[52.139,-4.557],
  [52.143,-4.545],[52.146,-4.533],[52.150,-4.518],[52.148,-4.495],
  [52.137,-4.472],[52.134,-4.470],[52.146,-4.472],[52.150,-4.473],
  [52.155,-4.468],[52.159,-4.477],[52.162,-4.494],[52.164,-4.483],
  [52.168,-4.440],[52.169,-4.429],[52.178,-4.410],
  [52.190,-4.388],[52.202,-4.368],[52.210,-4.361],[52.216,-4.359],
  [52.223,-4.342],[52.234,-4.320],[52.243,-4.260],[52.258,-4.228],[52.278,-4.182],
];
const CB_RIVER = [[52.118,-4.692],[52.113,-4.676],[52.102,-4.667],[52.084,-4.659],[52.070,-4.630],[52.055,-4.590],[52.044,-4.530],[52.038,-4.490],[52.033,-4.413],[52.033,-4.313]];
const CB_HILLS = [{cx:650,cy:750,r:80},{cx:720,cy:820,r:60},{cx:580,cy:700,r:55},{cx:780,cy:700,r:50},{cx:520,cy:600,r:45},{cx:640,cy:620,r:40},{cx:700,cy:900,r:65},{cx:820,cy:850,r:55}];
const CB_TOWNS = [{lat:52.084,lng:-4.659,n:"Cardigan"},{lat:52.044,lng:-4.530,n:"Cenarth"},{lat:52.139,lng:-4.557,n:"Aberporth"},{lat:52.216,lng:-4.359,n:"New Quay"},{lat:52.243,lng:-4.260,n:"Aberaeron"}];

function makeLandCB() {
  const pts=CB_COAST; const fp=CB_PROJ(pts[0][0],pts[0][1]); const lp=CB_PROJ(pts[pts.length-1][0],pts[pts.length-1][1]);
  return `${toPath(pts,CB_PROJ)} L ${CB_W},${lp.y.toFixed(1)} L ${CB_W},${CB_H} L ${fp.x.toFixed(1)},${CB_H} Z`;
}
const CB_LAND = makeLandCB();

const CB_SPOTS = [
  { id:1, name:"Mwnt Beach", emoji:"🌊", activity:"Wild Swimming", lat:52.146, lng:-4.533, difficulty:"Easy", votes:412,
    visibility:"public", seasonal:false, source:"community", integrations:["os","community"],
    w3w:"beach.chapel.wave", tidePort:"aberaeron",
    desc:"A perfectly curved beach below a 13th-century National Trust chapel. Bottlenose dolphins cruise the bay. The steep approach keeps crowds away.",
    tags:["Wild Swimming","Wildlife","Photography"],
    stories:[
      {user:"GwenM",avatar:"👩‍🦱",text:"Came on a rainy Tuesday in October. Whole beach to ourselves. A seal poked its head up twenty metres out and stared at us. Nobody blinked.",audio:false,source:"community"},
      {user:"TeifiDave",avatar:"🧔",text:"Twelve bottlenose dolphins at dusk. Fifty metres out. Completely silent except for their breath.",audio:true,source:"community"}
    ],
    quests:[
      {id:"q1a",name:"The Holy Cross Circuit",rarity:"common",pts:25,desc:"Walk from the beach to the 13th-century chapel, around the headland, back down. In winter. In wind.",attempts:203,completions:186},
      {id:"q1b",name:"Mwnt Dawn Dip",rarity:"rare",pts:75,desc:"In the sea before 7am. November or later. Photo from the water with the chapel behind you.",attempts:67,completions:21}
    ]},
  { id:2, name:"Tresaith Waterfall", emoji:"💧", activity:"Wild Swimming", lat:52.134, lng:-4.470, difficulty:"Easy", votes:387,
    visibility:"public", seasonal:false, source:"community", integrations:["community","os"],
    w3w:"falls.sand.step", tidePort:"aberaeron",
    spotify:{name:"Tresaith Tide Sessions",tracks:22},
    desc:"The only beach in Wales with a waterfall dropping straight onto the sand. At low tide, step behind the falls into a cave.",
    tags:["Wild Swimming","Photography","Family"],
    stories:[{user:"WaterfallRhian",avatar:"👩",text:"Stood behind the waterfall with my six-year-old at low tide. She was convinced we'd found a secret world. She's not entirely wrong.",audio:false,source:"community"}],
    quests:[{id:"q2",name:"Behind the Falls",rarity:"common",pts:25,desc:"Step through the waterfall at low tide. You'll get wet. That's part of it.",attempts:134,completions:128}]},
  { id:3, name:"Penbryn Beach", emoji:"🏖️", activity:"Hiking", lat:52.150, lng:-4.473, difficulty:"Easy", votes:298,
    visibility:"public", seasonal:true, seasonName:"Bluebell Season", daysLeft:47, source:"community",
    integrations:["community","os","strava"], w3w:"blue.bell.path", tidePort:"aberaeron",
    desc:"Almost a mile of wild National Trust sand, backed by flower-lined woodland. Wild garlic and bluebells in spring.",
    tags:["Hiking","Wild Swimming","Dog Friendly"],
    stories:[{user:"NTVolunteer_J",avatar:"🌿",text:"Three years maintaining this path. Every April the bluebells come back and I forget how good it is. Every year.",audio:true,source:"community"}],
    quests:[{id:"q3",name:"The Cave at Low Tide",rarity:"rare",pts:75,desc:"Walk south to the far cliff cave. Only accessible an hour either side of low tide.",attempts:89,completions:41}]},
  { id:4, name:"Ynys Lochtyn", emoji:"🐬", activity:"Wildlife", lat:52.161, lng:-4.487, difficulty:"Medium", votes:334,
    visibility:"public", seasonal:false, source:"community", integrations:["community","strava"],
    w3w:"dolphins.headland.watch", tidePort:"aberaeron",
    desc:"A dramatic headland north of Llangrannog. One of the best land-based dolphin spots in the UK.",
    tags:["Wildlife","Hiking","Photography"],
    stories:[{user:"MarineBio_Sian",avatar:"🔬",text:"200 hours watching dolphins from this headland. Some days forty animals pass inside the point. I've cried twice. No shame.",audio:false,source:"community"}],
    quests:[{id:"q4",name:"The Dolphin Vigil",rarity:"rare",pts:75,desc:"Sit at the tip for a full hour without moving. No phone. Log everything you see.",attempts:78,completions:52}]},
  { id:5, name:"Llangrannog Surf", emoji:"🏄", activity:"Surfing", lat:52.155, lng:-4.467, difficulty:"Medium", votes:278,
    visibility:"public", seasonal:false, source:"community", integrations:["community","strava"],
    w3w:"surf.valley.break", tidePort:"aberaeron",
    desc:"Blue Flag beach at the bottom of a steep valley. Best in south-westerly swells. When it goes off in autumn storms, it properly goes off.",
    tags:["Surfing","Wild Swimming","Family"],
    stories:[{user:"SurfSiân",avatar:"🏄",text:"October, 8-foot swell. Worst hammering of my life. Three weeks later: best waves of my life. That's this place.",audio:true,source:"community"}],
    quests:[
      {id:"q5a",name:"Dawn Patrol",rarity:"rare",pts:75,desc:"In the water by 6:30am before anyone else arrives.",attempts:56,completions:19},
      {id:"q5b",name:"Llangrannog Litter Pick",rarity:"stewardship",pts:50,desc:"Beach clean after a storm. Two bags minimum.",attempts:67,completions:61,impact:"34 bags collected across 22 sessions"}
    ]},
  { id:6, name:"Cwmtydu Cove", emoji:"🦭", activity:"Wildlife", lat:52.169, lng:-4.429, difficulty:"Easy", votes:189,
    visibility:"public", seasonal:false, source:"community", integrations:["community"],
    w3w:"seal.rocky.cove", tidePort:"aberaeron",
    desc:"A tiny rocky cove most people drive past. No signage. Exactly why the grey seals use it.",
    tags:["Wildlife","Photography","Quiet"],
    stories:[{user:"NatureNotesEls",avatar:"🦭",text:"A pup sleeping on a flat rock in September. Watched for twenty minutes. It didn't move once. I've been back six times.",audio:false,source:"community"}],
    quests:[{id:"q6",name:"Seal Census",rarity:"stewardship",pts:50,desc:"Record and photograph every seal from the path. Submit to CBMWC.",attempts:28,completions:26,impact:"3 years of seal data contributed to Welsh Government",cbmwc:true}]},
  { id:7, name:"Cemaes Head", emoji:"⛰️", activity:"Hiking", lat:52.096, lng:-4.660, difficulty:"Hard", votes:267,
    visibility:"public", seasonal:false, source:"os", integrations:["os","strava","community"],
    w3w:"cliff.chough.ridge", tidePort:"aberaeron",
    desc:"The highest clifftop on this stretch. The full sweep of Cardigan Bay on clear days. Choughs nest in the cliffs.",
    tags:["Hiking","Photography","Birdwatching"],
    stories:[{user:"CoastPathCarys",avatar:"🥾",text:"Set off at 5:30am in mist. Cursed myself for an hour. Then the mist burned off and the whole bay appeared at once.",audio:true,source:"community"}],
    quests:[
      {id:"q7a",name:"The Head at Dawn",rarity:"epic",pts:150,desc:"Reach the summit before sunrise. Start from Poppit slipway. No shortcuts.",attempts:34,completions:9},
      {id:"q7b",name:"Solstice Sunrise",rarity:"legendary",pts:300,desc:"Be at Cemaes Head for the winter solstice sunrise. Fewer than 12 people have done this.",attempts:18,completions:3}
    ]},
  { id:8, name:"New Quay Harbour", emoji:"🐬", activity:"Wildlife", lat:52.216, lng:-4.359, difficulty:"Easy", votes:445,
    visibility:"public", seasonal:false, source:"community", integrations:["community","historic"],
    w3w:"harbour.wall.dylan", tidePort:"aberaeron",
    spotify:{name:"New Quay Harbour Sessions",tracks:28},
    desc:"The UK's most reliable land-based dolphin spot. Dylan Thomas drank in the Black Lion here — New Quay became Llareggub in Under Milk Wood.",
    tags:["Wildlife","History","Family"],
    stories:[
      {user:"CBMWC_Cerys",avatar:"🐬",text:"Sometimes a dolphin surfaces next to the harbour wall ten seconds into my morning talk. I love those mornings.",audio:false,source:"community"},
      {user:"ThomasTrail_Mo",avatar:"📚",text:"Read the opening of Under Milk Wood at the end of the pier at dusk. You'll understand exactly why he wrote it here.",audio:true,source:"historic"}
    ],
    quests:[{id:"q8",name:"The Pod Count",rarity:"rare",pts:75,desc:"Count and photograph 10 distinct dolphins in a two-hour watch. Submit to CBMWC.",attempts:67,completions:34,cbmwc:true}]},
  { id:9, name:"Poppit Sands", emoji:"🏖️", activity:"Surfing", lat:52.093, lng:-4.660, difficulty:"Easy", votes:312,
    visibility:"public", seasonal:false, source:"community", integrations:["community","strava"],
    w3w:"dunes.teifi.mouth", tidePort:"aberaeron",
    desc:"A glorious dune-backed expanse at the mouth of the Teifi. RNLI-patrolled in summer. Good for beginners in SW swell.",
    tags:["Surfing","Family","Dog Friendly"],
    stories:[{user:"RNLIVol_Brad",avatar:"🛟",text:"Fifteen years on this beach. The look on a kid's face when they stand up on a board for the first time — that's why I do it.",audio:false,source:"community"}],
    quests:[{id:"q9",name:"Longboard Five",rarity:"common",pts:25,desc:"Catch five green waves in a single session. Count yourself. Be honest.",attempts:89,completions:71}]},
  { id:10, name:"Cenarth Falls", emoji:"🐟", activity:"Wildlife", lat:52.044, lng:-4.530, difficulty:"Easy", votes:298,
    visibility:"public", seasonal:true, seasonName:"Salmon Run", daysLeft:null, source:"community", integrations:["community","historic"],
    w3w:"salmon.leap.coracle", tidePort:"aberaeron",
    desc:"Where Atlantic salmon leap upstream to spawn in October. Otters at dusk year-round. The National Coracle Centre is here.",
    tags:["Wildlife","History","Family"],
    stories:[{user:"RiverRanger_Ann",avatar:"🦦",text:"31 salmon leaps in one hour in October. Then an otter walked out fifteen metres away, looked at me, and walked back in.",audio:false,source:"community"}],
    quests:[]},
  { id:11, name:"Teifi Gorge Rapids", emoji:"🛶", activity:"Kayaking", lat:52.033, lng:-4.413, difficulty:"Hard", votes:178,
    visibility:"public", seasonal:false, source:"strava", integrations:["strava","os","community"],
    w3w:"gorge.rapids.kingfisher", tidePort:"aberaeron",
    desc:"The Teifi through its gorge: Grade II–IV white water. Llandysul Paddlers run guided sessions. Kingfishers on every stretch.",
    tags:["Kayaking","Wild Swimming"],
    stories:[{user:"PaddlerDaf",avatar:"🛶",text:"The Teifi in winter flood is proper power. Brown, cold, angry water. Got out shaking. Immediately wanted to go back.",audio:true,source:"strava"}],
    quests:[{id:"q11",name:"The Full Gorge",rarity:"epic",pts:150,desc:"Complete the gorge in a single run. Grade III minimum. With a guide the first time.",attempts:45,completions:18}]},
  { id:12, name:"Gwbert & Cardigan Island", emoji:"🐋", activity:"Wildlife", lat:52.118, lng:-4.692, difficulty:"Easy", votes:256,
    visibility:"public", seasonal:true, seasonName:"Seal Pupping", daysLeft:null, source:"community", integrations:["community","os"],
    w3w:"estuary.island.colony", tidePort:"aberaeron",
    desc:"Cliffs at the Teifi estuary mouth, looking across to Cardigan Island — grey seal colony. Dolphins most days in summer.",
    tags:["Wildlife","Photography"],
    stories:[{user:"BoatClub_Huw",avatar:"⛵",text:"September: 94 grey seals on the island rocks. A dolphin pod joined us for the return. Passengers went very quiet.",audio:true,source:"community"}],
    quests:[]},
];

const CB_FOLKLORE = [
  { id:"f1", name:"Cantre'r Gwaelod — The Sunken Kingdom", emoji:"🛕", lat:52.20, lng:-4.76, type:"Legend", region:"Cardigan Bay",
    summary:"A kingdom of sixteen cities drowned beneath Cardigan Bay in 600AD when a drunken gatekeeper forgot to close the sea walls.",
    story:"Cantre'r Gwaelod — the Lowland Hundred — stretched west across what is now Cardigan Bay. The keeper of the sea gates was Seithennin, a man of legendary appetites, who one night forgot his duty. By morning, sixteen cities were drowned. The submerged forest visible at Borth — blackened oak stumps exposed at the lowest tides — is real. It is 4,000 to 6,000 years old. On certain still days locals say you can hear the bells.",
    source:"historic", lat2:52.18, lng2:-4.70},
  { id:"f2", name:"Pwyll & the Gates of Annwn", emoji:"🌫️", lat:52.044, lng:-4.530, type:"Myth", region:"Glyn Cuch, Teifi Valley",
    summary:"In the Mabinogion, Prince Pwyll entered the Celtic Otherworld at Glyn Cuch — a wooded valley above the Teifi near Cenarth.",
    story:"The Mabinogion begins at Glyn Cuch. Pwyll was hunting when his hounds encountered the hounds of Arawn, King of Annwn, the Celtic Otherworld: brilliant white, with red ears. By way of recompense, the two kings exchanged identities for a year. The valley still exists. You can walk into it today.",
    source:"folklore"},
  { id:"f3", name:"The Mermaid of New Quay", emoji:"🧜", lat:52.216, lng:-4.360, type:"Myth", region:"New Quay",
    summary:"19th-century fishermen at New Quay reported a mermaid on the outer rocks. Multiple witnesses. Reported to the county magistrate.",
    story:"Throughout the 19th century, harbour records contain accounts of a figure on the outer rocks. Experienced fishermen — men who knew seals — described something neither seal nor human. The Welsh for mermaid is morforwyn — sea maiden. No definitive explanation has ever been offered.",
    source:"folklore"},
  { id:"f4", name:"Y Tylwyth Teg — The Fair Folk", emoji:"🧚", lat:52.155, lng:-4.467, type:"Myth", region:"Llangrannog",
    summary:"The Tylwyth Teg inhabited the clifftops and sea caves of this coast, dancing on headlands at Midsummer's Eve.",
    story:"The Tylwyth Teg — the Fair Family — are not the gentle fairies of Victorian imagination. They are older, stranger, and considerably more dangerous. Along this coast they came out of sea caves at midsummer, danced in circles, and occasionally stole children. The rings they left are real — Marasmius oreades fungi — found in circles across these clifftops to this day.",
    source:"folklore"},
  { id:"f5", name:"Devil's Bridge Bargain", emoji:"😈", lat:52.376, lng:-3.840, type:"Dark History", region:"Devil's Bridge",
    summary:"The Devil built a bridge in Ceredigion for the first soul to cross it. An old woman outwitted him by throwing bread for her dog.",
    story:"Satan visited Ceredigion and offered a bridge for the first soul to cross the Mynach gorge. An old woman accepted the offer. When the bridge was complete she threw bread across it. Her dog ran after it. The Devil found himself the owner of a dog's soul. Three bridges now stand stacked on top of each other at Devil's Bridge — the oldest is medieval.",
    source:"folklore"},
];

const CB_ROUTES = [
  { id:"r1", name:"Cemaes Head to Mwnt", emoji:"⛰️", type:"Coast Path", dist:"14.2km", asc:"520m", time:"5–6 hrs", diff:"Hard",
    desc:"The finest stretch of the Ceredigion Coast Path. No shortcuts, no cheating. Two major ascents, one military land section, views across to Ireland on clear days.",
    wp:[[52.096,-4.660],[52.112,-4.675],[52.128,-4.668],[52.134,-4.470],[52.150,-4.518],[52.146,-4.533]],
    wpN:["Poppit Sands (Start)","Cemaes Head","Cliff viewpoint","Cilborth Beach","Above Tresaith","Mwnt Beach (End)"],
    el:[32,128,165,88,112,48,75,138,122,95,78,45,62,42,35,32],
    osR:"route/cardigan-coast-path", w3s:"dunes.teifi.mouth", w3e:"beach.chapel.wave",
    tidePort:"aberaeron"},
  { id:"r2", name:"Llangrannog to New Quay", emoji:"🐬", type:"Coast Path", dist:"18.6km", asc:"380m", time:"6–7 hrs", diff:"Medium",
    desc:"The dolphin coast in full. Ynys Lochtyn headland midway is the highlight. Save energy — the path into New Quay climbs at the end.",
    wp:[[52.155,-4.467],[52.161,-4.487],[52.169,-4.429],[52.190,-4.388],[52.210,-4.361],[52.216,-4.359]],
    wpN:["Llangrannog (Start)","Ynys Lochtyn","Cwmtydu Cove","New Quay Head","Coastal viewpoint","New Quay Harbour (End)"],
    el:[45,78,112,88,68,95,110,88,72,55,48,62,58,44,38,35],
    osR:"route/llangrannog-new-quay", w3s:"surf.valley.break", w3e:"harbour.wall.dylan",
    tidePort:"aberaeron"},
];

const CB_CONTENT = [
  { id:"c1", type:"guide", title:"Reading the Tides on Cardigan Bay", emoji:"🌊",
    author:"Local Knowledge", authorEmoji:"👥", readTime:"5 min", source:"community",
    tags:["Safety","Wild Swimming","Coastal"],
    summary:"The tidal range on Cardigan Bay can exceed 4 metres. Understanding the rhythm of the tides is the most important thing you can know before getting in the water here.",
    body:"Spring tides, neap tides, the six-hour rhythm — how to read a tide table. Why the bay has a longer tidal lag than most. The specific hazards at Mwnt, Cilborth, and Cwmtydu. Never underestimate the bay. It moves fast when it wants to."},
  { id:"c2", type:"story", title:"The Fishermen Who Watched the Dolphins", emoji:"🐬",
    author:"Bethan Morris", authorEmoji:"👩", readTime:"8 min", source:"community",
    tags:["Wildlife","History","New Quay"],
    summary:"A portrait of New Quay fishermen who fished alongside bottlenose dolphins for generations, long before the bay became famous for wildlife watching.",
    body:"Before the marine wildlife centre, before the tour boats — there were fishermen. And there were dolphins. And for 200 years, nobody thought anything special was happening. Idris James fished from New Quay for forty-three years. He saw the same dolphin pod every summer for three decades."},
  { id:"c3", type:"guide", title:"Wild Foraging on the Ceredigion Coast", emoji:"🌿",
    author:"Ceredigion Foragers", authorEmoji:"🌱", readTime:"10 min", source:"community",
    tags:["Foraging","Safety","Seasonal"],
    summary:"What to look for, when to look, and — critically — what not to touch. A practical guide to foraging the coastal and woodland edges of Ceredigion.",
    body:"Sea purslane, rock samphire, wild garlic, sloe berries, elderflower. The legal framework around foraging in the UK. The golden rules of ethical foraging: never take more than a third, leave the root, move on."},
  { id:"c4", type:"route", title:"Cemaes Head to Mwnt: The Hard Miles", emoji:"⛰️",
    author:"OS Maps + Community", authorEmoji:"🗺️", readTime:"Route guide", source:"os",
    tags:["Hiking","Coastal","Hard"],
    summary:"14km of the finest cliff walking in Wales. This is not a casual stroll. The path demands proper boots, a full pack, and ideally a clear day.",
    body:"Starting point at Poppit Sands car park. Total ascent 520m. Exposed sections above Cilborth require care in wind. Emergency access at Aberporth if needed. No shade — bring sun protection in summer.", routeId:"r1"},
  { id:"c5", type:"story", title:"Dylan Thomas and the Town He Made Famous", emoji:"📚",
    author:"New Quay Heritage", authorEmoji:"📜", readTime:"12 min", source:"historic",
    tags:["History","New Quay","Literature"],
    summary:"How Dylan Thomas spent two of his most productive years in New Quay, and how the town became Llareggub in Under Milk Wood.",
    body:"Thomas arrived in 1944, rented a bungalow called Majoda on the cliff. He drank in the Black Lion. He watched the harbour. He wrote. Under Milk Wood opened in New York in 1954, ten days after his death. The town knew it was him all along."},
  { id:"c6", type:"guide", title:"Spotting Dolphins: A Practical Guide", emoji:"🔭",
    author:"CBMWC + Community", authorEmoji:"🐬", readTime:"6 min", source:"community",
    tags:["Wildlife","Dolphins","New Quay"],
    summary:"The resident bottlenose dolphin pod of Cardigan Bay is the largest in the UK. Here's how to maximise your chances of seeing them.",
    body:"Best headlands: Ynys Lochtyn, New Quay Head, Gwbert. Time of day: early morning or late afternoon. Tide state: incoming. Behavioural cues from seabirds gathering on the water. Reporting sightings to CBMWC helps track the pod."},
  { id:"c7", type:"story", title:"The Drowned Land Under Our Feet", emoji:"🛕",
    author:"Dr. Sian Lloyd, Aberystwyth University", authorEmoji:"🎓", readTime:"15 min", source:"historic",
    tags:["History","Geology","Folklore"],
    summary:"The science behind Cantre'r Gwaelod — the submerged forest at Borth is real, and the legend contains genuine geological memory.",
    body:"The submerged forest at Borth dates to 4,500–5,500 BP. Sea level here rose 40 metres after the last glaciation. Cantre'r Gwaelod isn't myth — it's memory. The oak stumps are real. The date fits. The story fits. That should keep you up at night."},
  { id:"c8", type:"guide", title:"Surfing Cardigan Bay: Conditions & Spots", emoji:"🏄",
    author:"Strava Community + Local Surfers", authorEmoji:"📊", readTime:"7 min", source:"strava",
    tags:["Surfing","Conditions","Guide"],
    summary:"When to come, where to go, and what you'll find. A practical conditions guide to the surf spots of the Ceredigion coast.",
    body:"Prevailing SW swells. The difference between Llangrannog, Poppit, and Aberporth. Best months: September to December for consistent swell. Summer works with westerly ground swell. Check MSW and MagicSeaweed before you travel."},
];

// Pembrokeshire
const PB_W=860, PB_H=900;
const PB_PROJ = makeProj(-5.45,-4.65,52.05,51.55,PB_W,PB_H);
const PB_COAST = [
  [51.68,-5.05],[51.72,-5.13],[51.77,-5.22],[51.80,-5.32],
  [51.82,-5.40],[51.78,-5.43],[51.73,-5.38],[51.66,-5.30],
  [51.60,-5.22],[51.58,-5.12],[51.60,-5.00],[51.60,-4.92],
  [51.62,-4.85],[51.67,-4.74],[51.73,-4.68],[51.80,-4.66],
  [51.86,-4.68],[51.92,-4.75],[51.96,-4.83],[51.99,-4.90],
  [52.01,-4.85],[52.04,-4.80],
];
const PB_HILLS = [{cx:650,cy:200,r:70},{cx:720,cy:280,r:55},{cx:580,cy:150,r:50},{cx:780,cy:350,r:60},{cx:820,cy:180,r:45}];
const PB_TOWNS = [{lat:51.882,lng:-5.070,n:"St Davids"},{lat:51.686,lng:-4.940,n:"Pembroke"},{lat:51.717,lng:-4.940,n:"Pembroke Dock"},{lat:51.800,lng:-5.100,n:"Haverfordwest"}];

function makeLandPB() {
  const pts=PB_COAST; const fp=PB_PROJ(pts[0][0],pts[0][1]); const lp=PB_PROJ(pts[pts.length-1][0],pts[pts.length-1][1]);
  return `${toPath(pts,PB_PROJ)} L ${PB_W},${lp.y.toFixed(1)} L ${PB_W},0 L ${fp.x.toFixed(1)},0 Z`;
}
const PB_LAND = makeLandPB();

const PB_SPOTS = [
  { id:21, name:"Barafundle Bay", emoji:"🏖️", activity:"Wild Swimming", lat:51.622, lng:-4.924, difficulty:"Easy", votes:534,
    visibility:"public", seasonal:false, source:"community", integrations:["os","community","nrw"],
    w3w:"golden.sand.stack", tidePort:"milford-haven",
    desc:"Voted one of the finest beaches in Europe. No road access — a mile walk from Stackpole Quay through coastal woodland. The effort is entirely the point.",
    tags:["Wild Swimming","Photography","No Crowds"],
    stories:[
      {user:"PaperMapPete",avatar:"🗺️",text:"I've brought people here three times. First time: always silence when they see it. Then: when can we come back?",audio:false,source:"community"},
      {user:"SwimSisters_A",avatar:"👩",text:"April, 9am, water temperature 10°C. We swam. We sobbed. We dried off on warm sand. Perfect.",audio:true,source:"community"}
    ],
    quests:[{id:"qb1",name:"The Hidden Beach",rarity:"rare",pts:75,desc:"Swim the full length of Barafundle — from stack to stack — without touching the bottom.",attempts:112,completions:67}]},
  { id:22, name:"Stack Rocks & Green Bridge", emoji:"🪨", activity:"Hiking", lat:51.609, lng:-5.014, difficulty:"Easy", votes:389,
    visibility:"public", seasonal:false, source:"os", integrations:["os","community"],
    w3w:"stack.bridge.arch", tidePort:"milford-haven",
    desc:"The Green Bridge of Wales — a 24-metre natural limestone arch. The Elegug Stacks host 6,000 guillemots in spring. The MOD sometimes closes the road — check ahead.",
    tags:["Hiking","Photography","Geology"],
    stories:[{user:"GeoWales_R",avatar:"🪨",text:"The sound of 6,000 guillemots is something you don't forget. The smell either. Magnificent.",audio:false,source:"community"}],
    quests:[]},
  { id:23, name:"Skomer Island", emoji:"🐧", activity:"Wildlife", lat:51.735, lng:-5.290, difficulty:"Medium", votes:478,
    visibility:"public", seasonal:true, seasonName:"Puffin Season", daysLeft:62, source:"nrw", integrations:["nrw","community","os"],
    w3w:"puffin.burrow.cliff", tidePort:"milford-haven",
    desc:"Home to 40,000 puffins from April to August. They nest at your feet, fly past your face, and stare at you with absolute contempt. It's magnificent.",
    tags:["Wildlife","Photography","Seasonal"],
    stories:[{user:"BirdRings_Mo",avatar:"🐦",text:"Sat on the path while a puffin landed 30cm from my boot, looked at me, went into its burrow, came out again, and went back. Fifteen years of this. Never gets old.",audio:true,source:"nrw"}],
    quests:[{id:"qb3",name:"The Manx Count",rarity:"epic",pts:150,desc:"Count Manx shearwaters coming in after dark. Minimum 100 in one sitting. They sound like aliens.",attempts:28,completions:11}]},
  { id:24, name:"Blue Lagoon — Abereiddy", emoji:"🩵", activity:"Coasteering", lat:51.893, lng:-5.196, difficulty:"Medium", votes:356,
    visibility:"public", seasonal:false, source:"community", integrations:["community","os"],
    w3w:"blue.quarry.jump", tidePort:"milford-haven",
    desc:"A flooded slate quarry, deep blue-black water. The site of the World Coasteering Championships. The cliff jump on the south side is 8 metres of pure commitment.",
    tags:["Coasteering","Wild Swimming","Adrenaline"],
    stories:[{user:"TerracedPool_M",avatar:"💙",text:"Stood on the jump for twelve minutes. Nobody said anything. When I finally went I screamed all the way down. The guide said that was normal.",audio:true,source:"community"}],
    quests:[
      {id:"qb4a",name:"The Red Bull Wall",rarity:"epic",pts:150,desc:"Jump from the championship ledge. 8 metres. Feet together, arms in. No shuffling off the edge — one step.",attempts:78,completions:34},
      {id:"qb4b",name:"Lagoon Clean",rarity:"stewardship",pts:50,desc:"Bag out any litter you find in the lagoon area. The quarry is wild — let's keep it that way.",attempts:45,completions:43,impact:"180kg of waste removed across 12 cleans"}
    ]},
  { id:25, name:"Whitesands Bay", emoji:"🌊", activity:"Surfing", lat:51.897, lng:-5.310, difficulty:"Easy", votes:302,
    visibility:"public", seasonal:false, source:"community", integrations:["community","strava"],
    w3w:"whitesand.surf.school", tidePort:"milford-haven",
    desc:"Directly below St Davids Head, facing directly into the Atlantic. One of the best beginner-to-intermediate surf beaches in Wales. Consistent waves.",
    tags:["Surfing","Family","Dog Friendly"],
    stories:[{user:"SurfSchoolSaoirse",avatar:"🏄",text:"Taught here for eight years. The day someone stands up for the first time — that look — that's why.",audio:false,source:"community"}],
    quests:[{id:"qb5",name:"St Davids Swell",rarity:"rare",pts:75,desc:"Dawn session — water before sunrise, Atlantic swell running, nobody else out. Post GPS data from session.",attempts:56,completions:22}]},
  { id:26, name:"Marloes Sands", emoji:"🌅", activity:"Hiking", lat:51.728, lng:-5.197, difficulty:"Easy", votes:276,
    visibility:"public", seasonal:false, source:"community", integrations:["community","os"],
    w3w:"three.cliffs.tide", tidePort:"milford-haven",
    desc:"Three miles of rust-red Devonian rock striped through with green and grey. Low tide reveals rock pools that take an hour to explore. Skomer visible offshore.",
    tags:["Hiking","Geology","Photography"],
    stories:[{user:"TidePoolTed",avatar:"🦀",text:"Spent four hours at one rock pool. Just one. Found seventeen species. Missed the tide coming in and had to paddle out. Worth it.",audio:false,source:"community"}],
    quests:[]},
  { id:27, name:"St Davids Head", emoji:"🗿", activity:"Hiking", lat:51.900, lng:-5.318, difficulty:"Hard", votes:334,
    visibility:"public", seasonal:false, source:"os", integrations:["os","historic","community"],
    w3w:"ancient.stones.ocean", tidePort:"milford-haven",
    desc:"The far western point. Bronze Age burial chambers at the summit. On the clearest days, Ireland 74 miles away. Choughs everywhere. The most elemental spot in Wales.",
    tags:["Hiking","History","Birdwatching"],
    stories:[{user:"HeritageHikers",avatar:"🗿",text:"Watched choughs tumble on the updraft for an hour. Then sat in a 4,000-year-old burial chamber and had lunch. No context. Perfect.",audio:true,source:"historic"}],
    quests:[{id:"qb7",name:"The Western Point",rarity:"legendary",pts:300,desc:"Reach St Davids Head for sunrise on the winter solstice. Sit in Coetan Arthur — the Neolithic chambered tomb — while the sun comes up. Fewer than 8 people have done this.",attempts:12,completions:4}]},
  { id:28, name:"Freshwater West", emoji:"🌊", activity:"Surfing", lat:51.653, lng:-5.068, difficulty:"Medium", votes:298,
    visibility:"public", seasonal:false, source:"community", integrations:["community","strava"],
    w3w:"wild.dunes.atlantic", tidePort:"milford-haven",
    desc:"The wildest beach in Pembrokeshire. No facilities, no crowds in winter, raw Atlantic power. Used as a filming location for Ridley Scott's Robin Hood and Harry Potter.",
    tags:["Surfing","Photography","Wild"],
    stories:[{user:"FilmSpotter_C",avatar:"🎬",text:"The beach where Dobby the house elf is buried. There's a cairn. People leave odd tributes. The beach doesn't care either way.",audio:false,source:"community"}],
    quests:[]},
  { id:29, name:"Stackpole Quay & Bosherston Lily Ponds", emoji:"🌸", activity:"Wildlife", lat:51.628, lng:-4.915, difficulty:"Easy", votes:256,
    visibility:"public", seasonal:true, seasonName:"Water Lily Bloom", daysLeft:34, source:"nrw", integrations:["nrw","community"],
    w3w:"lily.pond.otter", tidePort:"milford-haven",
    desc:"Three interconnected freshwater lakes behind the coast. White water lilies in June–July. Otters, kingfishers, and dragonflies. Then Barafundle is twenty minutes walk.",
    tags:["Wildlife","Photography","Family"],
    stories:[{user:"NTWarden_K",avatar:"🌸",text:"The lilies are at their best for about three weeks in July. I take the same photo every year. The light is different every time.",audio:false,source:"nrw"}],
    quests:[]},
];

const PB_FOLKLORE = [
  { id:"pf1", name:"St Non's Well — Birth of a Saint", emoji:"✨", lat:51.875, lng:-5.265, type:"Legend", region:"St Non's Bay, St Davids",
    summary:"Dewi Sant — St David, patron saint of Wales — was born at St Non's Bay during a violent storm. Where he landed, a spring of healing water appeared.",
    story:"St Non was a Pembrokeshire princess. During the most violent storm in living memory, she gave birth alone on the headland. Dewi Sant entered the world in lightning. Where he was born, a spring appeared — St Non's Well — said to have healing properties to this day. The ruined chapel beside it is one of the oldest Christian sites in Wales.",
    source:"historic"},
  { id:"pf2", name:"The Witch of St Davids", emoji:"🧙", lat:51.882, lng:-5.270, type:"Dark History", region:"St Davids",
    summary:"A 17th-century cunning woman who was said to raise storms to wreck ships on Ramsey Sound for salvage.",
    story:"The last accused witch in Pembrokeshire lived in the shadow of Britain's smallest city's cathedral. She was said to walk the headland before storms, directing weather with her hands. Sailors crossing Ramsey Sound swore they saw her. Some didn't cross. The records of her trial have been lost. Or removed.",
    source:"folklore"},
  { id:"pf3", name:"Coetan Arthur — The Giant's Quoit", emoji:"🗿", lat:51.900, lng:-5.318, type:"Legend", region:"St Davids Head",
    summary:"A Neolithic burial chamber on St Davids Head, said to have been thrown here by King Arthur from across the bay as a game.",
    story:"Coetan Arthur — Arthur's Quoit — is a Neolithic chambered tomb perched on the western point of Wales. The capstone weighs twelve tonnes. In folklore, Arthur hurled it from across St Brides Bay on a whim. Archaeologists date it to 3500BC — which was a slow whim. The tomb faces sunrise at midsummer. It has seen 5,500 of them.",
    source:"historic"},
  { id:"pf4", name:"The Bells of Llys Helig", emoji:"🔔", lat:51.95, lng:-5.40, type:"Legend", region:"Pembrokeshire Coast",
    summary:"A lost kingdom somewhere beneath the Pembrokeshire sea. Fishermen have heard its church bells on storm-quiet nights for centuries.",
    story:"Pembrokeshire has its own drowned kingdom — older than Cantre'r Gwaelod and less famous. Llys Helig — the Palace of Helig — vanished beneath the sea in the fifth or sixth century, the victim of pride and divine punishment. Fishermen working the deep water beyond the headlands have reported hearing bells in the stillness after storms. Nobody has gone to look.",
    source:"folklore"},
];

const PB_ROUTES = [
  { id:"pr1", name:"Stackpole to Broad Haven", emoji:"🌊", type:"Coastal Walk", dist:"6.4km", asc:"180m", time:"2.5 hrs", diff:"Easy",
    desc:"One of the most beautiful short walks in Wales. Barafundle Bay, the limestone arches, Stackpole Head — three highlights in under three hours.",
    wp:[[51.628,-4.915],[51.622,-4.924],[51.619,-4.940],[51.618,-4.960],[51.624,-4.980]],
    wpN:["Stackpole Quay (Start)","Barafundle Bay","Stackpole Head","Broad Haven South (End)"],
    el:[12,18,28,45,62,75,58,42,35,28,22,18,15,12,8,10],
    osR:"route/stackpole-broad-haven", w3s:"lily.pond.otter", w3e:"broad.haven.south",
    tidePort:"milford-haven"},
  { id:"pr2", name:"St Davids Head Circuit", emoji:"🗿", type:"Circular Walk", dist:"11.2km", asc:"340m", time:"4–5 hrs", diff:"Hard",
    desc:"The most dramatic circuit on the Pembrokeshire coast. Ancient stones, sheer drops, choughs tumbling on sea updrafts, Ireland on the horizon.",
    wp:[[51.897,-5.310],[51.900,-5.318],[51.895,-5.332],[51.885,-5.330],[51.882,-5.310],[51.897,-5.310]],
    wpN:["Whitesands (Start)","St Davids Head","Western Point","Treginnis Lower","Porthmelgan","Whitesands (End)"],
    el:[22,45,78,112,135,148,125,98,75,62,48,38,30,28,25,22],
    osR:"route/st-davids-head-circuit", w3s:"whitesand.surf.school", w3e:"whitesand.surf.school",
    tidePort:"milford-haven"},
];

const PB_CONTENT = [
  { id:"pc1", type:"guide", title:"Coasteering Safety: What You Need to Know", emoji:"🩵",
    author:"TYF Adventure", authorEmoji:"🧗", readTime:"8 min", source:"community",
    tags:["Safety","Coasteering","Adrenaline"],
    summary:"Coasteering is brilliant but unforgiving. Before you jump anything in Pembrokeshire, read this.",
    body:"Tidal windows, swell forecasting, neoprene requirements, never jumping blind. The Blue Lagoon is managed — most coasteering in Pembrokeshire is not. Know the difference. Always check conditions 48 hours ahead and 2 hours before entry."},
  { id:"pc2", type:"story", title:"Puffins of Skomer: A Year in a Burrow", emoji:"🐧",
    author:"Wildlife Trust of South & West Wales", authorEmoji:"🐦", readTime:"10 min", source:"nrw",
    tags:["Wildlife","Puffins","Skomer"],
    summary:"40,000 puffins choose Skomer every spring. How they find their burrows, their mates, and how to watch them without disturbing them.",
    body:"Puffins return to the same burrow, the same mate, every year for life. They navigate back to Skomer from mid-Atlantic with pinpoint accuracy. The best viewing: sit still by a puffin lawn at dusk. They'll land close enough to touch. Don't."},
  { id:"pc3", type:"route", title:"Stackpole Estate: The Easy Miles", emoji:"🌸",
    author:"National Trust Wales", authorEmoji:"🌿", readTime:"Route guide", source:"nrw",
    tags:["Hiking","Coastal","Easy","Wildlife"],
    summary:"The Stackpole Estate is one of the finest pieces of National Trust land in Wales. This route hits all three main features without breaking a sweat.",
    body:"Stackpole Quay to Barafundle — 20 minutes through woodland. Barafundle to Stackpole Head — 45 minutes. Stackpole Head to Broad Haven — 40 minutes. Return via lily ponds: 30 minutes. Total: leisurely 2.5 hours with stops.", routeId:"pr1"},
];

// ─── SNOWDONIA / ERYRI ───────────────────────────────────────────────────────
const SN_W=880, SN_H=960;
const SN_PROJ = makeProj(-4.20,-3.65,53.25,52.80,SN_W,SN_H);

// National Park boundary (clockwise from NW — used as "coastline" / park edge)
const SN_COAST = [
  [53.22,-4.15],[53.20,-4.10],[53.215,-3.99],[53.22,-3.86],
  [53.18,-3.75],[53.12,-3.68],[53.05,-3.67],[52.98,-3.72],
  [52.90,-3.82],[52.85,-3.92],[52.82,-4.02],[52.84,-4.12],
  [52.90,-4.18],[52.97,-4.18],[53.02,-4.15],[53.08,-4.19],
  [53.15,-4.18],[53.20,-4.17],
];
function makeLandSN() { return toPath(SN_COAST,SN_PROJ)+" Z"; }
const SN_LAND = makeLandSN();

// Multiple rivers: Glaslyn (south) + Conwy (north)
const SN_RIVERS = [
  [[53.068,-4.076],[53.050,-4.098],[53.013,-4.106],[52.990,-4.088],[52.965,-4.055]],
  [[53.094,-3.798],[53.125,-3.816],[53.155,-3.824],[53.190,-3.800],[53.215,-3.762]],
  [[53.120,-4.020],[53.113,-4.005],[53.107,-3.990],[53.107,-3.939]], // Ogwen
];
// Dense hill radials — ridgelines, massifs, cwms
const SN_HILLS = [
  {cx:172,cy:388,r:95},{cx:155,cy:422,r:72},{cx:205,cy:368,r:62}, // Snowdon massif
  {cx:195,cy:376,r:48},{cx:218,cy:358,r:42},                       // Crib Goch ridge
  {cx:262,cy:308,r:82},{cx:242,cy:342,r:66},{cx:298,cy:278,r:58}, // Glyderau
  {cx:352,cy:198,r:88},{cx:412,cy:172,r:72},{cx:302,cy:218,r:66}, // Carneddau
  {cx:552,cy:348,r:62},{cx:482,cy:288,r:58},{cx:602,cy:452,r:72}, // eastern fells
  {cx:202,cy:498,r:62},{cx:252,cy:478,r:52},{cx:152,cy:548,r:58}, // southern
  {cx:352,cy:378,r:46},{cx:422,cy:322,r:42},{cx:702,cy:298,r:66}, // smaller peaks
];
const SN_TOWNS = [
  {lat:53.094,lng:-3.798,n:"Betws-y-Coed"},
  {lat:53.013,lng:-4.106,n:"Beddgelert"},
  {lat:53.118,lng:-4.134,n:"Llanberis"},
  {lat:53.107,lng:-3.939,n:"Capel Curig"},
];
// Lakes — rendered as filled blue ellipses
const SN_LAKES = [
  {lat:53.120,lng:-4.020,rx:14,ry:8},{lat:53.068,lng:-4.076,rx:10,ry:7},
  {lat:53.118,lng:-4.138,rx:32,ry:11},{lat:53.108,lng:-4.013,rx:18,ry:9},
];

const SN_SPOTS = [
  { id:41, name:"Yr Wyddfa — Snowdon Summit", emoji:"🏔️", activity:"Hiking", lat:53.068, lng:-4.076, difficulty:"Hard", votes:892,
    visibility:"public", seasonal:false, source:"os", integrations:["os","strava","community"],
    w3w:"summit.clouds.summit", tidePort:null,
    desc:"The highest mountain in Wales. 1,085 metres. The view — on the days you earn it — stretches to Ireland, Scotland, and the Isle of Man simultaneously. It deserves better than the train.",
    tags:["Hiking","Summit","Photography"],
    stories:[
      {user:"SummitSolstice_H",avatar:"🏔️",text:"5am start from Pen-y-Pass. Cloud inversion at 700m. Broke through into clear sky at 900m. The other peaks were islands in a white sea. Stood on top alone for forty minutes. I'm not the same person I was before that morning.",audio:false,source:"community"},
      {user:"RangerNia",avatar:"👩‍🌾",text:"I've done this mountain 280 times and it still does something to me at the top. On good days the light from the west goes horizontal and everything goes gold. Nobody's ready for it.",audio:true,source:"os"}
    ],
    quests:[
      {id:"sn1a",name:"The Real Way Up",rarity:"epic",pts:150,desc:"Pyg Track up, Watkin Path down. No train. Start before 5am to beat the crowds and catch the light. Summit log required.",attempts:234,completions:98},
      {id:"sn1b",name:"Solstice Summit",rarity:"legendary",pts:300,desc:"Be on the summit for winter solstice sunrise — December 21st. No exceptions, no substitutes. 4am start minimum. Headtorch, crampons, self-reliance. Seven people have done this.",attempts:22,completions:7}
    ]},
  { id:42, name:"Llyn Idwal", emoji:"🏔️", activity:"Wild Swimming", lat:53.120, lng:-4.020, difficulty:"Easy", votes:367,
    visibility:"public", seasonal:true, seasonName:"Summer Alpine Window", daysLeft:38, source:"nrw", integrations:["nrw","os","community"],
    w3w:"glacial.cold.clear", tidePort:null,
    desc:"A glacial lake inside a natural amphitheatre of ancient rock. The water is 9°C in August. The cwm walls block the wind. It feels like you've discovered it, even though thousands have been before.",
    tags:["Wild Swimming","Geology","Photography"],
    stories:[
      {user:"ColdWaterMed",avatar:"🧊",text:"Swam to the far end and turned around. The Glyders were behind me. Tryfan was in front. The water was 8°C. I was crying. Couldn't tell you exactly why.",audio:false,source:"community"},
      {user:"GeoLecturerR",avatar:"🔬",text:"Darwin visited here in 1831 and correctly identified the glacial striations. I've brought geology students here for twenty years. The rock teaches.",audio:true,source:"nrw"}
    ],
    quests:[{id:"sn2",name:"The Full Cwm Swim",rarity:"epic",pts:150,desc:"Swim the full perimeter of Llyn Idwal without stopping. 800 metres. Water under 10°C. Witnessed.",attempts:56,completions:18}]},
  { id:43, name:"Crib Goch", emoji:"🔪", activity:"Hiking", lat:53.072, lng:-4.065, difficulty:"Hard", votes:512,
    visibility:"public", seasonal:false, source:"os", integrations:["os","strava"],
    w3w:"knife.edge.north", tidePort:null,
    desc:"A genuine knife-edge. Hands-on, exposure on both sides, 900 metres up. Not a path — a scramble. The most exhilarating half-mile in Wales. Serious in bad weather. Magnificent in good.",
    tags:["Hiking","Scrambling","Exposure"],
    stories:[
      {user:"GradeIIIJen",avatar:"🧗",text:"The narrow bit is about 15 metres. I was scared going in. Halfway across, I was laughing. At the end I sat down and just stared at my shaking hands.",audio:true,source:"community"},
      {user:"MRTeamDaf",avatar:"🚑",text:"We rescue people from here every season who weren't ready for what it actually is. Read the conditions. Start early. Turn back if needed. The mountain doesn't negotiate.",audio:false,source:"community"}
    ],
    quests:[{id:"sn3",name:"Clean Ridge",rarity:"legendary",pts:300,desc:"Crib Goch in winter conditions — snow or ice on the ridge. Ice axe required. Never solo. The ridge in winter is a different thing entirely to summer.",attempts:44,completions:9}]},
  { id:44, name:"Fairy Glen", emoji:"🌿", activity:"Hiking", lat:53.083, lng:-3.869, difficulty:"Easy", votes:278,
    visibility:"public", seasonal:false, source:"community", integrations:["community","os"],
    w3w:"gorge.fern.hidden", tidePort:null,
    desc:"A hidden slot gorge near Betws-y-Coed. The Conwy forces itself through ancient rock, draped in fern and moss. You have to crouch to get to the pool at the back. Worth every scratch.",
    tags:["Hiking","Photography","Family"],
    stories:[{user:"PhotoWales_El",avatar:"📸",text:"Long exposure at the lowest pool in September mist. The water goes milky. The green goes electric. Came back three days in a row.",audio:false,source:"community"}],
    quests:[{id:"sn4",name:"The Back Pool",rarity:"common",pts:25,desc:"Reach the hidden pool at the very back of the glen — requires some scrambling and getting wet feet. That's the point.",attempts:188,completions:172}]},
  { id:45, name:"Aber Falls / Rhaeadr Fawr", emoji:"💦", activity:"Hiking", lat:53.215, lng:-3.986, difficulty:"Easy", votes:334,
    visibility:"public", seasonal:false, source:"community", integrations:["community","nrw"],
    w3w:"waterfall.oak.north", tidePort:null,
    desc:"Wales's most impressive waterfall — 37 metres straight down off the Carneddau plateau. The spray reaches you 50 metres out. In spate after rain it's genuinely shocking.",
    tags:["Hiking","Family","Photography"],
    stories:[{user:"NTWarden_Geth",avatar:"🌿",text:"Best in winter. Ice forms on the rock face in columns. The spray goes sideways. You can't get close. You can't look away.",audio:true,source:"nrw"}],
    quests:[]},
  { id:46, name:"Nant Gwynant Llynnau", emoji:"🏞️", activity:"Wild Swimming", lat:53.010, lng:-4.020, difficulty:"Easy", votes:312,
    visibility:"public", seasonal:false, source:"community", integrations:["community","strava"],
    w3w:"valley.still.mirror", tidePort:null,
    desc:"Two lakes in a valley of almost impossible beauty. Snowdon reflected perfectly at dawn. Wild camp on the north shore and you'll never forget the morning.",
    tags:["Wild Swimming","Wild Camping","Photography"],
    stories:[
      {user:"VanLifeRhys",avatar:"🚐",text:"Arrived at 4am. Set up beside the water. Dawn hit at 5:40am and Snowdon turned pink in the reflection. Said nothing for forty minutes. Best decision I've made in years.",audio:true,source:"community"},
      {user:"WildSwimSioned",avatar:"🏊",text:"The water is a different quality up here — peat-filtered, soft, dark. The cold is clean. This is what swimming is supposed to feel like.",audio:false,source:"community"}
    ],
    quests:[{id:"sn6",name:"The Mirror Dip",rarity:"rare",pts:75,desc:"In the water before sunrise, with Snowdon's reflection in the lake. The mountain and its reflection must both be visible. Photo required.",attempts:67,completions:34}]},
  { id:47, name:"Tryfan — The Three Summits", emoji:"🗿", activity:"Hiking", lat:53.100, lng:-3.990, difficulty:"Hard", votes:446,
    visibility:"public", seasonal:false, source:"os", integrations:["os","strava","community"],
    w3w:"three.stones.ridge", tidePort:null,
    desc:"The only mountain in Wales that cannot be walked up — it must be scrambled. The ridge leads to two standing stones called Adam and Eve. The tradition: jump between them. Everyone stares at the gap for a while first.",
    tags:["Hiking","Scrambling","Summit"],
    stories:[
      {user:"NorthRidge_K",avatar:"🧗",text:"Took the North Ridge direct. Grade I all the way. Four hours up, forty minutes down. Thighs destroyed. Smiled the whole way home.",audio:false,source:"community"},
      {user:"AdamAndEve_M",avatar:"🪨",text:"I stood on Adam for five minutes before jumping to Eve. The drop either side is about 800 metres. Made it. Sat down immediately. Completely worth it.",audio:true,source:"community"}
    ],
    quests:[{id:"sn7",name:"Adam to Eve",rarity:"epic",pts:150,desc:"Jump between Adam and Eve — the two standing stones at Tryfan's summit. No harness. No safety. Just commitment. Photo mid-air required. Not for everyone, and that's fine.",attempts:189,completions:122}]},
  { id:48, name:"Cwm Idwal — Devil's Kitchen", emoji:"🌑", activity:"Hiking", lat:53.115, lng:-4.015, difficulty:"Medium", votes:289,
    visibility:"public", seasonal:false, source:"nrw", integrations:["nrw","os","community"],
    w3w:"dark.cwm.ancient", tidePort:null,
    desc:"A slot in the back wall of Cwm Idwal — a great gash in the Glyder Fawr face. You scramble up into it. The top opens out onto the plateau. Darwin studied the flora here; some of it is rare enough to have its own protection order.",
    tags:["Hiking","Geology","Flora"],
    stories:[{user:"BotanyBeth",avatar:"🌱",text:"Spotted Lloydia serotina — Snowdon lily — in a crevice in June. It's been growing here since the last glaciation. I sat with it for twenty minutes and apologised for humans.",audio:false,source:"nrw"}],
    quests:[{id:"sn8",name:"The Kitchen Route",rarity:"rare",pts:75,desc:"Ascend through the Devil's Kitchen to the plateau above. At least 300m of hands-on scrambling. Come down via the ridge. Don't reverse the route.",attempts:78,completions:52}]},
];

const SN_FOLKLORE = [
  { id:"sf1", name:"Gelert — Prince Llywelyn's Hound", emoji:"🐺", lat:53.013, lng:-4.106, type:"Legend", region:"Beddgelert",
    summary:"Llywelyn the Great returned from hunting to find his hound Gelert covered in blood. He slew the dog — then found his infant son alive beneath a dead wolf.",
    story:"The village of Beddgelert — Gelert's Grave — takes its name from the legend. Llywelyn the Great left his faithful hound Gelert to guard his baby son. Returning to find blood everywhere and the dog red-mouthed, he drew his sword. Only then did he hear the cry of his living child, and see the great wolf Gelert had killed to protect him. He buried Gelert there and, it is said, never smiled again. The grave is there now, in a meadow by the river. The story is almost certainly invented by a 18th-century innkeeper to attract tourists. That's how legends work.",
    source:"historic"},
  { id:"sf2", name:"Rhita Gawr — The Giant of Snowdon", emoji:"👑", lat:53.068, lng:-4.076, type:"Myth", region:"Yr Wyddfa",
    summary:"A giant who collected the beards of defeated kings lived on Snowdon's summit, and was finally overcome by King Arthur himself.",
    story:"Before Arthur, there was Rhita Gawr — a giant of such power that he made a cloak from the beards of the twenty-eight kings he had defeated. He challenged Arthur for his beard. Arthur climbed Snowdon and killed the giant in single combat, burying him on the summit. Archaeologists have found evidence of a cairn. Some believe the name Yr Wyddfa means 'the tumulus' — the burial mound. The giant may be underneath where you stand.",
    source:"folklore"},
  { id:"sf3", name:"Llyn Idwal & The Devil's Bargain", emoji:"😈", lat:53.120, lng:-4.020, type:"Dark History", region:"Cwm Idwal",
    summary:"The still waters of Llyn Idwal will never allow any bird to fly over them. They are cursed since Idwal — a prince — was drowned there by his treacherous foster-father.",
    story:"Prince Idwal was the son of Owain, King of Gwynedd. His foster-father, Nefydd Hardd, killed him by drowning him in the lake. The water accepted the prince and has been cursed ever since — no bird flies over Llyn Idwal, no fish live in its depths. Scientists have never found a satisfying biological explanation for the absence of fish. The lake is unusually cold. The cwm walls cast deep shadow. Some things don't need an explanation.",
    source:"folklore"},
];

const SN_ROUTES = [
  { id:"sr1", name:"Yr Wyddfa via Pyg Track", emoji:"🏔️", type:"Mountain Route", dist:"10.8km", asc:"730m", time:"5–6 hrs", diff:"Hard",
    desc:"The finest ascent of Snowdon. The Pyg Track crosses the shoulder of Crib Goch before the final pull to the summit. Return via the Miners' Track for a different view of Glaslyn.",
    wp:[[53.058,-4.018],[53.066,-4.038],[53.068,-4.060],[53.068,-4.072],[53.068,-4.076]],
    wpN:["Pen-y-Pass Car Park (Start)","Bwlch y Moch","Below Crib Goch","Glaslyn — the Turn","Yr Wyddfa Summit (End)"],
    el:[358,512,640,720,810,870,920,980,1020,1060,1072,1080,1082,1085,1085,1085],
    osR:"route/snowdon-pyg-track", w3s:"pass.start.mountain", w3e:"summit.clouds.summit",
    tidePort:null},
  { id:"sr2", name:"Carneddau Horseshoe", emoji:"🐴", type:"Mountain Route", dist:"14.3km", asc:"980m", time:"7–8 hrs", diff:"Hard",
    desc:"The quietest of Snowdonia's great ridge walks. Seven peaks over 900m connected by a broad, high ridge. On a clear day the whole of Anglesey is below you.",
    wp:[[53.215,-3.986],[53.198,-3.968],[53.175,-3.960],[53.155,-3.945],[53.135,-3.922],[53.107,-3.939]],
    wpN:["Aber Falls (Start)","Yr Aryg","Carnedd Gwenllian","Carnedd Llywelyn","Pen yr Ole Wen","Capel Curig (End)"],
    el:[38,125,280,480,620,768,890,960,996,985,940,860,780,680,520,380],
    osR:"route/carneddau-horseshoe", w3s:"waterfall.oak.north", w3e:"valley.bridge.east",
    tidePort:null},
];

const SN_CONTENT = [
  { id:"sc1", type:"guide", title:"Mountain Safety in Eryri: What They Don't Put on Signs", emoji:"⛏️",
    author:"Eryri Mountain Rescue", authorEmoji:"🚑", readTime:"9 min", source:"nrw",
    tags:["Safety","Hiking","Mountain"],
    summary:"Snowdonia kills people every year who were prepared for a different mountain. This guide is about the specific ways Eryri will surprise you.",
    body:"The weather changes in eighteen minutes. The paths that look obvious from below are not always the correct route. Crib Goch in cloud is a different problem from Crib Goch in sun. Carry a map, a compass, the skills to use them, and twice as much food as you think you need. Trig points are not summits. Summits are not always where the path ends."},
  { id:"sc2", type:"story", title:"First Time on Crib Goch", emoji:"🔪",
    author:"Elin Prys", authorEmoji:"🧗", readTime:"11 min", source:"community",
    tags:["Hiking","Personal","Fear"],
    summary:"A first-person account of attempting Crib Goch for the first time at age 34, after a decade of wanting to and not quite managing it.",
    body:"I turned back at the start of the ridge twice. The first time I got twenty metres and retreated. The second time I got halfway and sat down for fifteen minutes before turning around. The third time I didn't let myself think about it and just moved. The hands remember things the brain forgets. The ridge is not as narrow as fear made it."},
  { id:"sc3", type:"guide", title:"Wild Swimming in Glacial Lakes: A Practical Guide", emoji:"🏔️",
    author:"Welsh Wild Swimmers", authorEmoji:"🏊", readTime:"7 min", source:"community",
    tags:["Wild Swimming","Safety","Mountain"],
    summary:"Llyn Idwal, Glaslyn, Nant Gwynant — each has its own character and risks. What to know before you get in at altitude.",
    body:"Water temperature in upland Snowdonia lakes rarely exceeds 14°C even in August. Acclimatisation before entry is not optional. The walk in means you're already cold and tired. Cold water shock at altitude with no one nearby is a serious risk. Go with a partner. Check exit points before you enter. Carry dry clothes."},
  { id:"sc4", type:"story", title:"The Truth About Gelert's Grave", emoji:"🐺",
    author:"Dr. Catrin Owen, Bangor University", authorEmoji:"🎓", readTime:"12 min", source:"historic",
    tags:["History","Folklore","Beddgelert"],
    summary:"The legend of Prince Llywelyn and his faithful hound is almost certainly invented. The truth is more interesting than the myth.",
    body:"The grave was constructed in 1802 by David Prichard, landlord of the Royal Goat Hotel, to attract tourists to Beddgelert. The story appears in similar form in medieval tales from India, France, and Israel — the 'faithful animal slain in error' tale is ancient and universal. Prichard chose Gelert because of a local field name. None of this makes the grave less worth visiting. The fabricated story is now part of the actual history."},
  { id:"sc5", type:"route", title:"Yr Wyddfa via Pyg Track: The Full Guide", emoji:"🏔️",
    author:"OS Maps + Mountain Rescue", authorEmoji:"🗺️", readTime:"Route guide", source:"os",
    tags:["Hiking","Mountain","Hard"],
    summary:"The finest ascent of Snowdon. This is the route that earns the summit. Allow 5–6 hours and don't underestimate the final pull.",
    body:"Pen-y-Pass car park (book in advance or bus from Llanberis — car park fills by 7am). The path is well-maintained to Bwlch y Moch, then steeper. The Crib Goch junction: stay right on the main Pyg Track. Glaslyn lake appears at 600m — rest here. Final ascent: 45 minutes from Glaslyn. Descent via Miners' Track.", routeId:"sr1"},
  { id:"sc6", type:"guide", title:"Winter in Eryri: When Everything Changes", emoji:"❄️",
    author:"Eryri NPA + Community", authorEmoji:"⛏️", readTime:"8 min", source:"nrw",
    tags:["Hiking","Winter","Safety","Mountain"],
    summary:"The mountains of Snowdonia in winter are technically and psychologically different from summer. Ice axe, crampons, and a compass are not optional.",
    body:"From December to March, any summit route in Eryri requires winter skills. The Pyg Track ices over. Crib Goch becomes Grade I–II alpine. Aber Falls occasionally freezes. The crowds disappear. The mountains become quieter and more dangerous and more beautiful simultaneously. This is the best season, if you're prepared."},
];


// ─── GOWER PENINSULA ─────────────────────────────────────────────────────────
const GW_W=840, GW_H=760;
const GW_PROJ = makeProj(-4.36,-3.83,51.68,51.53,GW_W,GW_H);
const GW_COAST = [
  [51.680,-4.300],[51.680,-4.240],[51.675,-4.180],[51.658,-4.100],[51.640,-4.060],
  [51.622,-3.990],[51.615,-3.960],[51.605,-3.930],[51.595,-3.890],[51.583,-3.870],
  [51.570,-3.880],[51.558,-3.920],[51.548,-3.960],[51.540,-4.000],[51.535,-4.060],
  [51.533,-4.120],[51.535,-4.180],[51.542,-4.230],[51.550,-4.280],[51.560,-4.310],
  [51.575,-4.340],[51.595,-4.350],[51.620,-4.345],[51.645,-4.330],[51.668,-4.318],
];
function makeLandGW(){const pts=GW_COAST;const fp=GW_PROJ(pts[0][0],pts[0][1]);const lp=GW_PROJ(pts[pts.length-1][0],pts[pts.length-1][1]);return `${toPath(pts,GW_PROJ)} L ${lp.x.toFixed(1)},0 L ${fp.x.toFixed(1)},0 Z`;}
const GW_LAND = makeLandGW();
const GW_HILLS = [
  {cx:480,cy:340,r:72},{cx:540,cy:300,r:58},{cx:420,cy:370,r:55},
  {cx:360,cy:400,r:48},{cx:580,cy:360,r:44},{cx:300,cy:440,r:52},
  {cx:640,cy:280,r:50},{cx:440,cy:290,r:42},
];
const GW_TOWNS = [
  {lat:51.611,lng:-3.984,n:"Gowerton"},{lat:51.575,lng:-4.062,n:"Gower"},
  {lat:51.565,lng:-3.968,n:"Pennard"},{lat:51.598,lng:-3.987,n:"Mumbles"},
];

const GW_SPOTS = [
  { id:50, name:"Rhossili Bay", emoji:"🌊", activity:"Wild Swimming", lat:51.568, lng:-4.292, difficulty:"Easy", votes:689,
    visibility:"public", seasonal:false, source:"community", integrations:["os","community"],
    w3w:"wave.sand.wild", tidePort:"swansea",
    desc:"Three miles of untouched Atlantic beach backed by the Rhossili Down ridge. No cars. No ice cream vans. The most beautiful beach in Wales by some distance, facing the full force of the ocean.",
    tags:["Wild Swimming","Surfing","Photography"],
    stories:[
      {user:"SurfGower_M",avatar:"🏄",text:"Chest-high on a clean south-west swell. No crowds because its March and 8°C. That is the trade-off and it is a very good trade-off.",audio:false,source:"community"},
      {user:"DawnRider_E",avatar:"🌅",text:"Arrived at 5:30am. The low tide revealed rock pools that reflected the sky. Not another soul until 9am.",audio:true,source:"community"}
    ],
    quests:[
      {id:"gw1a",name:"The Full Mile Swim",rarity:"epic",pts:150,desc:"Swim the full length of Rhossili Bay — 4.8km. Open water. No wetsuit allowed. Both headlands as fixed points. Witnessed.",attempts:34,completions:8},
      {id:"gw1b",name:"Solstice at Worm Head",rarity:"legendary",pts:300,desc:"Be on Worm Head — the tidal island at the bay end — for both sunset and sunrise, camping overnight between tides. The causeway closes. You are genuinely cut off. Dylan Thomas did this.",attempts:12,completions:4}
    ]},
  { id:51, name:"Three Cliffs Bay", emoji:"🗿", activity:"Hiking", lat:51.570, lng:-4.100, difficulty:"Medium", votes:534,
    visibility:"public", seasonal:false, source:"os", integrations:["os","community"],
    w3w:"cliffs.arch.three", tidePort:"swansea",
    desc:"The most photographed landscape in South Wales. Three limestone fins jut from the headland above a tidal estuary. The pay-off is one of those views that makes you stop mid-sentence.",
    tags:["Hiking","Photography","Wild Swimming"],
    stories:[{user:"LandscapeK",avatar:"📷",text:"I have photographed this at every tide and every season over four years. The evening light in October hits the limestone and everything goes amber.",audio:false,source:"community"}],
    quests:[{id:"gw2",name:"The Tidal Window",rarity:"rare",pts:75,desc:"Wade the estuary at low tide and reach the beach through the arch. Only possible for about two hours either side of low. Photo in the arch required.",attempts:156,completions:98}]},
  { id:52, name:"Worm Head", emoji:"🐉", activity:"Hiking", lat:51.555, lng:-4.335, difficulty:"Hard", votes:447,
    visibility:"public", seasonal:false, source:"os", integrations:["os","community"],
    w3w:"dragon.head.sea", tidePort:"swansea",
    desc:"A tidal island shaped like a sea dragon, connected to the mainland for only two and a half hours each side of low tide. Dylan Thomas got stranded here as a teenager. The causeway crossing is exposed, exhilarating, and absolutely not allowed in rough seas.",
    tags:["Hiking","Wildlife","Photography"],
    stories:[
      {user:"TidalT_Gwen",avatar:"🐉",text:"Made the crossing with twenty minutes to spare. The moment the tide turns you feel it — the causeway rocks get darker and wet from the edges inward.",audio:true,source:"community"},
      {user:"NaturalistB",avatar:"🦅",text:"Choughs nesting on the outer head. Red-billed, red-legged. Very rare. Sat downwind for three hours watching them play on the updrafts.",audio:false,source:"nrw"}
    ],
    quests:[{id:"gw3",name:"The Worm Turn",rarity:"epic",pts:150,desc:"Reach the Outer Head and return before the tide cuts the causeway. Start at peak low water. The National Trust Coastguard watches this crossing.",attempts:78,completions:44}]},
  { id:53, name:"Paviland Cave", emoji:"🦴", activity:"Hiking", lat:51.553, lng:-4.228, difficulty:"Medium", votes:218,
    visibility:"public", seasonal:false, source:"historic", integrations:["historic","os"],
    w3w:"bone.red.ochre", tidePort:"swansea",
    desc:"A limestone sea cave containing the oldest ceremonial burial in Western Europe. Dated 33,000 years ago. You climb down at low tide. It feels exactly like what it is: a place that was sacred to people who pre-date everything we know about this island.",
    tags:["Hiking","History","Photography"],
    stories:[{user:"ArchaeologyDr_P",avatar:"🏛️",text:"Buckland discovered the burial in 1823 and assumed it was a Roman female prostitute. It was a young man, pre-dating the Romans by thirty millennia.",audio:false,source:"historic"}],
    quests:[{id:"gw4",name:"Find the Red Lady",rarity:"rare",pts:75,desc:"Reach Paviland Cave by the cliff path. Find the entrance. Note the ochre staining in the limestone. Photograph the view from inside the cave mouth.",attempts:62,completions:38}]},
  { id:54, name:"Fall Bay",  emoji:"🌿", activity:"Wild Swimming", lat:51.558, lng:-4.305, difficulty:"Medium", votes:312,
    visibility:"public", seasonal:false, source:"community", integrations:["community","os"],
    w3w:"hidden.bay.fall", tidePort:"swansea",
    desc:"The beach you find by accident when walking to Rhossili. A steep scramble down from the coast path, then you are alone. Half-mile of west-facing sand. The only noise is the sea.",
    tags:["Wild Swimming","Hiking","Solitude"],
    stories:[{user:"SecretGower_R",avatar:"🌊",text:"Came here every summer for twelve years before I told anyone it existed. That scramble filters out the pushchairs.",audio:false,source:"community"}],
    quests:[{id:"gw5",name:"The Scramble Down",rarity:"common",pts:25,desc:"Reach Fall Bay via the cliff scramble. It is not as dangerous as it looks but more committing. Bring friends.",attempts:89,completions:74}]},
  { id:55, name:"Langland Bay Surf Break", emoji:"🏄", activity:"Surfing", lat:51.572, lng:-3.992, difficulty:"Easy", votes:289,
    visibility:"public", seasonal:false, source:"community", integrations:["community"],
    w3w:"surf.longboard.point", tidePort:"swansea",
    desc:"The most consistent surf break on the Gower. Beach break, works on any swell. The Langland Bay Surf Club has been here since 1969. On a good day there will be fifty people in the water from nine to sixty.",
    tags:["Surfing","Wild Swimming","Community"],
    stories:[{user:"RetiredSurfer_W",avatar:"🏄",text:"I learnt to surf here in 1978. I still surf here. The peak has moved slightly since then but the principle is the same: paddle, pop, grin.",audio:true,source:"community"}],
    quests:[{id:"gw6",name:"Longboard Dawn",rarity:"common",pts:25,desc:"In the water at Langland before 7am on a longboard. Weekday only. Photo from the water looking back at the bay.",attempts:112,completions:87}]},
];

const GW_FOLKLORE = [
  { id:"gf1", name:"The Green Man of Gower", emoji:"🌿", lat:51.580, lng:-4.180, type:"Legend", region:"Gower Interior",
    summary:"A figure of woven grass and oak who appears on the Gower cliffs at midsummer, representing the boundary between cultivated land and the wild sea.",
    story:"Older than Christianity on this peninsula. The Green Man was last formally acknowledged in 1847 when a Gower farmhand described seeing a figure made of woven vegetation standing on the headland above Pwll Du Bay, watching the sea. The figure left no footprints. The Gower has always been strange — half-Norman, half-Welsh, neither quite belonging to either culture, positioned between the channel and the sky. The Green Man belongs to that in-between.",
    source:"folklore"},
  { id:"gf2", name:"Arthur Stone — Maen Ceti", emoji:"🪨", lat:51.607, lng:-4.193, type:"Legend", region:"Gower Upland",
    summary:"A 25-tonne Neolithic capstone on the Gower upland, said to have been a pebble in King Arthur shoe that he flung here in irritation.",
    story:"Maen Ceti is a Neolithic burial chamber dating to around 2500BC. The capstone weighs approximately twenty-five tonnes. In local legend, King Arthur was walking toward battle and found a stone in his shoe. He threw it from the summit of Pen Arthur — and it landed here, six miles away. Cromwell forces tried to destroy it in the 1640s, apparently concerned by the reverence locals still showed it. It survived. He did not.",
    source:"historic"},
  { id:"gf3", name:"The Drowned Wood of Oxwich", emoji:"🌊", lat:51.550, lng:-4.153, type:"Legend", region:"Oxwich Bay",
    summary:"At extreme low tides, Oxwich Bay reveals petrified tree stumps from a forest that grew here 5,000 years ago, when sea level was lower.",
    story:"At the lowest spring tides in Oxwich Bay, the sand flats sometimes reveal petrified stumps of an ancient forest — actual trees that grew when sea level was thirty metres lower. The fishermen who first documented this called it the Drowned Wood. It was not punishment. It was the end of the last Ice Age. The stumps are about 5,000 years old. They still occasionally appear after winter storms strip the beach.",
    source:"historic"},
];

const GW_ROUTES = [
  { id:"gr1", name:"Rhossili to Worm Head via Fall Bay", emoji:"🐉", type:"Circular Walk", dist:"8.2km", asc:"220m", time:"3 hrs", diff:"Medium",
    desc:"The finest walk on the Gower. Rhossili village to Worm Head viewpoint, along the clifftop to Fall Bay, then back via the ridge with the whole peninsula below you.",
    wp:[[51.568,-4.292],[51.555,-4.335],[51.550,-4.305],[51.558,-4.278],[51.568,-4.292]],
    wpN:["Rhossili NT Car Park","Worm Head Causeway","Fall Bay","Rhossili Down Ridge","Rhossili End"],
    el:[45,62,58,82,95,110,88,72,58,45,48,45],
    osR:"route/rhossili-worms-head", w3s:"wave.sand.wild", w3e:"wave.sand.wild",
    tidePort:"swansea"},
  { id:"gr2", name:"Three Cliffs to Oxwich Bay", emoji:"🗿", type:"Coastal Walk", dist:"5.8km", asc:"140m", time:"2.5 hrs", diff:"Easy",
    desc:"Dunes, limestone fins, a tidal river crossing, and the wide bay at Oxwich. Best at low tide when the estuary is passable.",
    wp:[[51.570,-4.100],[51.560,-4.128],[51.550,-4.153]],
    wpN:["Southgate Car Park","Three Cliffs Arch","Oxwich Bay End"],
    el:[22,30,18,25,32,15,8,6,5,5],
    osR:"route/three-cliffs-oxwich", w3s:"cliffs.arch.three", w3e:"oxwich.bay.wide",
    tidePort:"swansea"},
];

const GW_CONTENT = [
  { id:"gc1", type:"guide", title:"Gower Tidal Timing: Epic vs Dangerous", emoji:"🌊",
    author:"Gower NT Rangers", authorEmoji:"🌿", readTime:"7 min", source:"nrw",
    tags:["Safety","Tidal","Gower"],
    summary:"Three of Gower best spots are only accessible at low tide — and the water comes back fast.",
    body:"Worm Head causeway: open 2.5 hrs either side of low water. Three Cliffs estuary: fordable for 2 hrs. Paviland Cave: beach access for 3 hrs. All three are on the same stretch of coast. The Atlantic tide on the Gower rises 9 metres at springs. It does not negotiate."},
  { id:"gc2", type:"story", title:"Dylan Thomas Got Stranded on Worm Head", emoji:"🐉",
    author:"Historic Wales", authorEmoji:"📖", readTime:"10 min", source:"historic",
    tags:["History","Literature","Worm Head"],
    summary:"Thomas was 17 when he misjudged the Worm Head causeway crossing. He spent the night on the island.",
    body:"Thomas Jones described the island at night as the end of the world and the beginning of everything. He returned the next morning through the exposed causeway rocks at first light, wet and shaken, and wrote about it within the week. The story became one of his best."},
];


// ─── BRECON BEACONS / BANNAU BRYCHEINIOG ─────────────────────────────────────
const BC_W=920, BC_H=780;
const BC_PROJ = makeProj(-3.92,-3.08,51.98,51.73,BC_W,BC_H);
const BC_COAST = [
  [51.978,-3.900],[51.978,-3.800],[51.975,-3.650],[51.965,-3.500],[51.948,-3.380],
  [51.930,-3.250],[51.910,-3.120],[51.890,-3.090],[51.870,-3.100],[51.845,-3.120],
  [51.820,-3.140],[51.790,-3.180],[51.775,-3.240],[51.762,-3.320],[51.752,-3.440],
  [51.745,-3.560],[51.740,-3.680],[51.738,-3.780],[51.742,-3.880],[51.755,-3.910],
  [51.780,-3.920],[51.820,-3.918],[51.860,-3.912],[51.900,-3.910],[51.940,-3.908],
];
function makeLandBC(){const pts=BC_COAST;return toPath(pts,BC_PROJ)+" Z";}
const BC_LAND = makeLandBC();
const BC_HILLS = [
  {cx:280,cy:480,r:95},{cx:240,cy:510,r:78},{cx:320,cy:460,r:72},
  {cx:200,cy:540,r:65},{cx:360,cy:440,r:60},{cx:180,cy:500,r:58},
  {cx:480,cy:380,r:82},{cx:540,cy:350,r:70},{cx:620,cy:320,r:65},
  {cx:140,cy:580,r:62},{cx:100,cy:560,r:55},{cx:380,cy:510,r:55},
  {cx:720,cy:260,r:60},{cx:780,cy:240,r:52},{cx:660,cy:290,r:48},
  {cx:420,cy:420,r:48},{cx:560,cy:400,r:44},{cx:300,cy:400,r:50},
];
const BC_TOWNS = [
  {lat:51.945,lng:-3.390,n:"Brecon"},{lat:51.869,lng:-3.688,n:"Sennybridge"},
  {lat:51.886,lng:-3.215,n:"Crickhowell"},{lat:51.819,lng:-3.352,n:"Defynnog"},
];
const BC_RIVERS = [
  [[51.958,-3.388],[51.945,-3.390],[51.918,-3.400],[51.895,-3.388],[51.878,-3.350]],
  [[51.878,-3.718],[51.865,-3.680],[51.850,-3.640],[51.840,-3.580]],
  [[51.870,-3.440],[51.858,-3.402],[51.845,-3.370]],
];
const BC_LAKES = [
  {lat:51.900,lng:-3.270,rx:22,ry:10},
  {lat:51.851,lng:-3.702,rx:12,ry:6},
];

const BC_SPOTS = [
  { id:60, name:"Pen y Fan", emoji:"⛰️", activity:"Hiking", lat:51.884, lng:-3.438, difficulty:"Medium", votes:782,
    visibility:"public", seasonal:false, source:"os", integrations:["os","strava","community"],
    w3w:"peak.beacon.south", tidePort:null,
    desc:"The highest point in South Wales. 886 metres. The north face drops nearly 300 metres in a sheer horseshoe. Not technically hard but serious in winter. On a clear day you can see from the Bristol Channel to the Black Mountains to mid-Wales.",
    tags:["Hiking","Summit","Photography"],
    stories:[
      {user:"BeaconRunner_T",avatar:"⛰️",text:"SAS selection runs up here. I met blokes doing it in full kit and boots at 4am. I was in shorts with a coffee. They did not look at me.",audio:false,source:"community"},
      {user:"ParentOf3_K",avatar:"👨‍👩‍👧",text:"First big hill with the kids. The ten-year-old cried going up the last bit. Then cried at the view from the top. Different tears.",audio:true,source:"community"}
    ],
    quests:[
      {id:"bc1a",name:"The Full Horseshoe",rarity:"epic",pts:150,desc:"Pen y Fan, Corn Du, Cribyn, and Fan y Big — the complete Brecon Horseshoe in a single circuit. 19km, 1,100m of ascent. Do it anti-clockwise. Start early.",attempts:178,completions:62},
      {id:"bc1b",name:"Four Peaks Before Noon",rarity:"legendary",pts:300,desc:"Summit all four Beacons peaks and return to Storey Arms before 12pm. Pre-dawn start required. 5-hour time limit.",attempts:44,completions:11}
    ]},
  { id:61, name:"Sgwd yr Eira", emoji:"💦", activity:"Hiking", lat:51.840, lng:-3.634, difficulty:"Easy", votes:456,
    visibility:"public", seasonal:false, source:"community", integrations:["community","nrw"],
    w3w:"behind.fall.water", tidePort:null,
    desc:"The only waterfall in Wales you can walk behind. A worn path leads under the lip of a 15-metre cascade. You emerge completely surrounded by falling water.",
    tags:["Hiking","Photography","Family"],
    stories:[
      {user:"WaterfallWalker_S",avatar:"💦",text:"Went after three days of rain. The falls were double width and the path behind was white with mist. Completely soaked. Completely worth it.",audio:false,source:"community"},
      {user:"FamilyBeacons_H",avatar:"👨‍👩‍👦",text:"Our seven-year-old walked behind it and said I am inside the waterfall. That is the correct response.",audio:true,source:"community"}
    ],
    quests:[{id:"bc2",name:"The Walk-Behind",rarity:"common",pts:25,desc:"Stand behind Sgwd yr Eira while in full spate — winter or after significant rain. Photo from behind required.",attempts:234,completions:198}]},
  { id:62, name:"Llyn y Fan Fach", emoji:"🧙", activity:"Hiking", lat:51.851, lng:-3.700, difficulty:"Hard", votes:312,
    visibility:"public", seasonal:false, source:"historic", integrations:["historic","os"],
    w3w:"lady.lake.mountain", tidePort:null,
    desc:"A glacial lake under the Black Mountain escarpment. The most remote spot in the Beacons. The walk in is 5km of moorland. The legends attached to this lake are among the oldest in Wales.",
    tags:["Hiking","Wild Swimming","Folklore"],
    stories:[{user:"FolkloreWalker_C",avatar:"📜",text:"The Physicians of Myddfai trace their lineage to a woman from this lake. Their manuscripts survive to the 14th century.",audio:false,source:"historic"}],
    quests:[{id:"bc3",name:"The Physician Path",rarity:"rare",pts:75,desc:"Reach Llyn y Fan Fach from Llanddeusant in under 90 minutes. 5km of open moorland, 310m ascent. Then swim. Then walk back.",attempts:48,completions:32}]},
  { id:63, name:"Llangorse Lake", emoji:"🛶", activity:"Kayaking", lat:51.900, lng:-3.270, difficulty:"Easy", votes:287,
    visibility:"public", seasonal:true, seasonName:"Spring Otters", daysLeft:24, source:"nrw", integrations:["nrw","community"],
    w3w:"lake.castle.island", tidePort:null,
    desc:"The largest natural lake in South Wales. A crannog — Iron Age artificial island — sits in the middle. Otters are regularly seen in spring.",
    tags:["Kayaking","Wildlife","History"],
    stories:[{user:"KayakWales_B",avatar:"🛶",text:"Paddled to the crannog at dusk. An otter surfaced three metres from the kayak, assessed me, dived. The lake was flat and reflecting everything.",audio:true,source:"community"}],
    quests:[{id:"bc4",name:"Crannog at Dawn",rarity:"rare",pts:75,desc:"Paddle to the Llangorse crannog before sunrise. Kayak or canoe only. Do not land — circle it. Photo at first light required.",attempts:56,completions:28}]},
  { id:64, name:"The Sugar Loaf", emoji:"🍬", activity:"Hiking", lat:51.876, lng:-3.125, difficulty:"Medium", votes:338,
    visibility:"public", seasonal:false, source:"os", integrations:["os","community"],
    w3w:"cone.black.mountain", tidePort:null,
    desc:"An isolated volcanic cone rising above Abergavenny. Its perfect profile is visible from the M4. From the summit: the Usk Valley, the Black Mountains, the Brecon Beacons, and on clear days the Bristol Channel.",
    tags:["Hiking","Photography","Family"],
    stories:[{user:"SundayHiker_R",avatar:"⛰️",text:"Done it in sunshine and in cloud and in horizontal sleet. The sleet version was the best because we were the only people up there.",audio:false,source:"community"}],
    quests:[{id:"bc5",name:"Sunrise From the Cone",rarity:"rare",pts:75,desc:"Summit before sunrise. Watch the sun come up over the Black Mountains. Then name all five mountain ranges visible.",attempts:67,completions:41}]},
];

const BC_FOLKLORE = [
  { id:"bf1", name:"The Lady of Llyn y Fan Fach", emoji:"🧙", lat:51.851, lng:-3.700, type:"Myth", region:"Black Mountain",
    summary:"A physician from Myddfai married a woman who rose from the lake. She warned: three causeless blows and she would return to the depths. She kept her word.",
    story:"A young farmer from Myddfai noticed a woman sitting on the surface of Llyn y Fan Fach, combing her hair. He offered her bread. They married. She brought with her a herd of supernatural cattle. She warned him: three causeless blows and she would return to the lake. He struck her three times over years — not from cruelty but from confusion. She returned to the water. The cattle followed. But she came back for her sons and taught them the healing arts. Their descendants, the Physicians of Myddfai, practiced medicine in Wales until the 18th century. Their manuscripts survive.",
    source:"historic"},
  { id:"bf2", name:"Twm Sion Cati — Welsh Outlaw", emoji:"🏹", lat:51.910, lng:-3.500, type:"Legend", region:"Brecon border",
    summary:"A 16th-century outlaw who hid in the Beacons, whose cave is still marked on OS maps today.",
    story:"Thomas Jones — Twm Sion Cati — was a real man: a poet, genealogist, and notorious thief who lived between 1530 and 1620. His cave above the Tywi valley near Rhandirmwyn is marked on modern OS maps. He robbed English tax collectors and corrupt officials, eventually settled down, married a wealthy widow, and became a Justice of the Peace. The cave is a twenty-minute walk from a car park and is worth every step.",
    source:"folklore"},
  { id:"bf3", name:"Owain Glyndwr Final Refuge", emoji:"👑", lat:51.958, lng:-3.700, type:"Dark History", region:"Brecon Beacons",
    summary:"The last native Prince of Wales disappeared into these mountains in 1412 and was never found or captured.",
    story:"Owain Glyndwr led the last serious Welsh revolt against English rule from 1400 to 1415. After his forces were defeated, he retreated into the mountains. Henry V offered him a full pardon in 1415. He never surrendered, never replied, and was never found. He simply ceased to exist in any historical record. He died somewhere in these hills. His grave has never been found. The Welsh have always preferred it that way.",
    source:"historic"},
];

const BC_ROUTES = [
  { id:"br1", name:"Pen y Fan Horseshoe", emoji:"⛰️", type:"Mountain Route", dist:"13.4km", asc:"780m", time:"5-6 hrs", diff:"Hard",
    desc:"The signature walk of the Brecon Beacons. Four peaks, one cirque, 780m of ascent. Anti-clockwise gives you the dramatic drop into the horseshoe head-on.",
    wp:[[51.875,-3.466],[51.880,-3.450],[51.884,-3.438],[51.880,-3.418],[51.868,-3.425],[51.875,-3.466]],
    wpN:["Cwm Gwdi Car Park","Cribyn","Pen y Fan Summit","Corn Du","Fan y Big","Cwm Gwdi Return"],
    el:[355,480,640,780,840,886,878,862,820,750,680,580,480,420,355],
    osR:"route/pen-y-fan-horseshoe", w3s:"peak.beacon.south", w3e:"cwm.gwdi.start",
    tidePort:null},
  { id:"br2", name:"Waterfall Country Circuit", emoji:"💦", type:"Circular Walk", dist:"9.8km", asc:"380m", time:"4 hrs", diff:"Medium",
    desc:"Four waterfalls in one walk. Gorge woodland. River crossings. The most spectacular woodland walk in Wales.",
    wp:[[51.850,-3.628],[51.840,-3.634],[51.835,-3.618],[51.842,-3.605],[51.850,-3.628]],
    wpN:["Pont Melin-Fach","Sgwd yr Eira","Sgwd Clun-Gwyn","Sgwd y Pannwr","Return"],
    el:[220,248,260,235,245,258,240,228,220],
    osR:"route/waterfall-country-circuit", w3s:"behind.fall.water", w3e:"behind.fall.water",
    tidePort:null},
];

const BC_CONTENT = [
  { id:"bcc1", type:"guide", title:"Winter in the Beacons: When the Rules Change", emoji:"❄️",
    author:"Brecon Beacons Mountain Rescue", authorEmoji:"🚑", readTime:"8 min", source:"nrw",
    tags:["Safety","Hiking","Winter"],
    summary:"The Brecon Beacons kill people every winter who underestimate the plateau.",
    body:"Navigation on the plateau in winter requires map and compass. The north face of Pen y Fan ices early. The rescue team is called out an average of 11 times per winter weekend. Most callouts involve flat phone batteries, trainers, and genuine surprise that it is cold at 800m in January."},
  { id:"bcc2", type:"story", title:"The Waterfall Walk in January", emoji:"💦",
    author:"Cerys Williams", authorEmoji:"🌊", readTime:"9 min", source:"community",
    tags:["Hiking","Waterfalls","Seasonal"],
    summary:"The waterfalls of the Beacons in January, after ice and melt, are something else entirely.",
    body:"We went the day after a thaw following two weeks of hard frost. The gorges were running at three times their normal volume. Sgwd yr Eira was almost impassable — the spray was horizontal and the path was coated in ice. We went behind it anyway and came out completely wet and laughing."},
];

// ─── SOCIAL DATA ─────────────────────────────────────────────────────────────
const FRIENDS = [
  {id:"f1",name:"Siân Lloyd",avatar:"👩",status:"online",location:"Ynys Lochtyn",points:4200,guardian:310},
  {id:"f2",name:"Dafydd R.",avatar:"🧔",status:"online",location:"New Quay",points:3100,guardian:180},
  {id:"f3",name:"Beth M.",avatar:"👩‍🦱",status:"offline",lastSeen:"2h ago",location:"Penbryn",points:2800,guardian:420},
  {id:"f4",name:"Carys W.",avatar:"🧑‍🦰",status:"offline",lastSeen:"Yesterday",location:"Barafundle",points:5600,guardian:780},
];
const CREWS = [
  {id:"cr1",name:"Cardigan Bay Swimmers",emoji:"🌊",members:8,private:false,desc:"Cold water. Any conditions. No excuses."},
  {id:"cr2",name:"Teifi Paddlers",emoji:"🛶",members:12,private:true,desc:"Whitewater crew. Invitation only."},
  {id:"cr3",name:"Pembroke Dawn Patrol",emoji:"🏄",members:6,private:false,desc:"Sunrise sessions. Freshwater West mostly."},
];
const FEED = [
  {id:"fd1",avatar:"👩",name:"Siân",action:"completed",target:"The Dolphin Vigil",spot:"Ynys Lochtyn",time:"23m ago",rarity:"rare"},
  {id:"fd2",avatar:"🧔",name:"Dafydd",action:"shared a spot",target:"Teifi Gorge secret section",spot:"Teifi Valley",time:"1h ago",rarity:null},
  {id:"fd3",avatar:"👩‍🦱",name:"Beth",action:"started route",target:"Llangrannog to New Quay",spot:"Ceredigion Coast",time:"3h ago",rarity:null},
  {id:"fd4",avatar:"🧑‍🦰",name:"Carys",action:"completed",target:"The Western Point",spot:"St Davids Head",time:"Yesterday",rarity:"legendary"},
];

// ─── MAKERS & LOCAL SUPPLIERS ─────────────────────────────────────────────────
const CB_MAKERS = [
  {
    id:"cb_m1", type:"workshop", emoji:"🧶", name:"Make it in Wales @ Stiwdio 3",
    tagline:"Weaving, botanical dyeing & textile craft workshops in Cardigan",
    desc:"Founded by Suzi Park, Make it in Wales is a Community Interest Company running hands-on craft workshops in West Wales since 2014. Based at Stiwdio 3 in Cardigan — a community space with a café, gallery and retail corner — they offer dressmaking, upholstery, weaving, jewellery, and botanical dyeing, all led by local designer-makers. Particularly well known for workshops using Melin Tregwynt wool off-cuts and natural plant dyes. Perfect for all abilities from complete beginners upward.",
    offerings:["Welsh wool weaving","Botanical dyeing","Upholstery","Jewellery making","Dressmaking"],
    location:"Stiwdio 3, Cardigan SA43", price:"From £45 per workshop",
    booking:"https://www.makeitinwales.co.uk", phone:null,
    seasonal:false, familyFriendly:false, tags:["Textiles","Welsh Heritage","Sustainable"],
  },
  {
    id:"cb_m2", type:"supplier", emoji:"🏺", name:"St Dogmaels Pottery",
    tagline:"Internationally exhibited studio ceramics by Peter Bodenham",
    desc:"Peter Bodenham is one of Wales's most respected studio potters, based in the historic village of St Dogmaels near Cardigan. His work — inspired by the River Teifi and West Wales coastline — has been exhibited in museums internationally and featured in Craft Festival Wales. Visit the studio to see work in progress and buy pieces directly from the maker. His ceramics curated the landmark 'Significant Forms' exhibition at Canfas Gallery, Cardigan.",
    offerings:["Hand-thrown studio ceramics","Sculptural vessels","Functional tableware","Commissioned work"],
    location:"St Dogmaels, Cardigan SA43", price:"Pieces from £30",
    booking:"https://www.discoverceredigion.wales", phone:null,
    seasonal:false, familyFriendly:false, tags:["Ceramics","Studio Pottery","Welsh Maker"],
  },
  {
    id:"cb_m3", type:"gallery", emoji:"🖼️", name:"Custom House Gallery",
    tagline:"Welsh artists and makers in a beautiful St Mary's Street setting",
    desc:"Custom House Gallery at 44 St Mary's Street in Cardigan brings together a wonderful collection of work by artists and makers based in Wales alongside beautiful, original gifts and home accessories. The gallery champions local and regional talent, making it a great place to discover authentic Welsh-made jewellery, ceramics, textiles and art. Stock changes regularly — always worth a visit.",
    offerings:["Original Welsh art","Handmade jewellery","Ceramics & pottery","Textile gifts","Home accessories"],
    location:"44 St Mary's Street, Cardigan SA43 1HA", price:"Free to browse",
    booking:"https://www.discoverceredigion.wales/shopping", phone:null,
    seasonal:false, familyFriendly:true, tags:["Gallery","Welsh Art","Gifts"],
  },
  {
    id:"cb_m4", type:"supplier", emoji:"🏴󠁧󠁢󠁷󠁬󠁳󠁥", name:"Cardigan Bay Quilts",
    tagline:"Locally woven Welsh tapestry blankets, quilts & block-printed gifts",
    desc:"Cardigan Bay Quilts operates from Unit 4 in Cardigan Guildhall Market, selling locally woven Welsh tapestry blankets — both new and vintage — alongside handmade patchwork quilts and distinctive block-printed cards and kits. Everything here reflects the textile heritage of West Wales. Closed Sundays. A genuine local maker selling authentic Welsh craft at fair prices.",
    offerings:["Welsh tapestry blankets","Vintage Welsh textiles","Patchwork quilts","Block-printed cards","Craft kits"],
    location:"Unit 4, Cardigan Guildhall Market SA43", price:"Blankets from £45",
    booking:null, phone:null,
    seasonal:false, familyFriendly:true, tags:["Textiles","Welsh Heritage","Markets"],
  },
  {
    id:"cb_m5", type:"event", emoji:"🏰", name:"Craft Festival Wales",
    tagline:"Annual craft spectacular at Cardigan Castle every September",
    desc:"Founded by Cardigan-born Sarah James MBE, Craft Festival Wales takes place at Cardigan Castle over the first weekend of September, showcasing 80+ handpicked makers — jewellers, potters, furniture makers, textile artists, glassmakers and more. The 2024 edition drew over 3,500 visitors. As well as the main festival, there's a Town Craft Trail running for four weeks across Cardigan venues. Bookable craft workshops run throughout the weekend, covering printing, weaving, macramé and botanical dyeing.",
    offerings:["80+ makers market","Bookable craft workshops","Children's Craft Lab","Craft Trail across Cardigan","Talks & demonstrations"],
    location:"Cardigan Castle, Cardigan SA43", price:"Adult £8 · Children free",
    booking:"https://www.craftfestival.co.uk/Wales", phone:null,
    seasonal:true, familyFriendly:true, tags:["Annual Event","Workshops","Market","September"],
  },
];

const PB_MAKERS = [
  {
    id:"pb_m1", type:"workshop", emoji:"🌿", name:"FelinFach Dye Studio",
    tagline:"Natural dyeing with madder, weld & indigo in rural Pembrokeshire",
    desc:"The FelinFach Dye Studio near Boncath in north Pembrokeshire runs intimate natural dyeing courses from February to November each year, as featured in The Knitter magazine. Courses cover protein fibres (wool, alpaca, silk) and cellulose fibres (cotton, linen, hemp) using ancient plant-based dyes including madder root, weld and cochineal. All courses have a maximum of four students to ensure personalised tuition. The studio is a professional, purpose-designed space in a truly beautiful rural setting near the coastal towns of Newport and Cardigan.",
    offerings:["1-day natural dyeing (protein fibres)","1-day natural dyeing (cellulose fibres)","2-day combined course","Gift cards available"],
    location:"SA37 postcode, near Boncath & Newport, Pembrokeshire", price:"£140/day · £280/2-day",
    booking:"https://www.felinfach.com/pages/craft-courses-wales", phone:null,
    seasonal:true, familyFriendly:false, tags:["Natural Dyeing","Textiles","Small Group","Bookable"],
  },
  {
    id:"pb_m2", type:"workshop", emoji:"💎", name:"Delfryn Creative",
    tagline:"Jewellery, silversmithing, pottery & printmaking on the St Davids Peninsula",
    desc:"Delfryn Creative offers hands-on art and craft workshops in a well-equipped studio space on the St Davids Peninsula, making it an ideal add-on to a Pembrokeshire coast holiday. Core subjects include jewellery and silversmithing, pottery, printing, painting, drawing and sculpture — all designed for complete beginners or those wanting to develop skills. Guest craft instructors run additional specialist sessions throughout the year. The venue also has holiday cottages, making it possible to combine a course with a longer stay.",
    offerings:["Jewellery & silversmithing","Wheel pottery","Relief printing","Painting & drawing","Sculpture"],
    location:"St Davids Peninsula, Pembrokeshire", price:"Sessions from £65",
    booking:"https://www.delfrynholidaycottages.co.uk/delfryn-creative-workshops", phone:null,
    seasonal:true, familyFriendly:false, tags:["Jewellery","Ceramics","Printmaking","St Davids"],
  },
  {
    id:"pb_m3", type:"supplier", emoji:"🧣", name:"Melin Tregwynt",
    tagline:"Iconic Welsh woollen mill weaving blankets since 1912",
    desc:"Melin Tregwynt is one of Wales's most celebrated working woollen mills, tucked in a wooded valley near Fishguard in north Pembrokeshire. The mill has woven distinctive Welsh blankets, throws, and accessories since 1912 using traditional double-weave techniques, with contemporary colourways that have made their products sought after worldwide. Visit the mill shop to see the looms in action, browse the full collection, and pick up pieces made on site. Iconic, authentic, and genuinely Welsh.",
    offerings:["Woven Welsh blankets","Throws & cushions","Accessories & scarves","Mill tours","Fabric offcuts"],
    location:"Tregwynt Mill, near Fishguard SA65", price:"Throws from £95",
    booking:"https://www.melintregwynt.co.uk", phone:null,
    seasonal:false, familyFriendly:true, tags:["Welsh Heritage","Wool","Mill","Fishguard"],
  },
  {
    id:"pb_m4", type:"workshop", emoji:"🥄", name:"Spoon Carving Pembrokeshire",
    tagline:"A full day learning to carve wooden spoons from green wood",
    desc:"A gold-rated course on CraftCourses.com, this full-day spoon carving workshop in Pembrokeshire teaches the ancient craft of carving functional wooden spoons from freshly felled green wood using hand tools. No experience needed — participants leave with a finished spoon and the skills to make more. An excellent outdoor, slow-craft experience that sits well alongside Pembrokeshire's natural landscape. Multiple dates throughout the year.",
    offerings:["Full-day spoon carving","Hand tool techniques","Green woodwork basics","Take home your creation"],
    location:"Pembrokeshire (exact location on booking)", price:"£85 per person",
    booking:"https://www.craftcourses.com/in-person-and-online-courses-craft-kits-and-handcrafted-gifts/?location=Pembrokeshire", phone:null,
    seasonal:true, familyFriendly:false, tags:["Woodwork","Green Wood","Slow Craft","Bookable"],
  },
];

const SN_MAKERS = [
  {
    id:"sn_m1", type:"gallery", emoji:"🎨", name:"Corris Craft Centre",
    tagline:"Nine independent craft studios in a wooded Snowdonian valley",
    desc:"Set against densely wooded hillsides in the village of Corris near Machynlleth, the Corris Craft Centre brings together nine independent craft studios where you can watch makers at work and buy directly. Studios cover pottery, jewellery, candle-making, artwork, chocolate, glass sculpture, pet portraits, furniture and artisan gin. It's a proper working craft village — not a gift shop with branded goods, but genuine makers in genuine studios. The visitor centre and café complete a relaxed half-day visit.",
    offerings:["Pottery studio","Jewellery workshop","Glass sculpture","Artisan chocolate","Candle making","Furniture making"],
    location:"Corris, near Machynlleth SY20", price:"Free to visit",
    booking:"https://www.corriscraftcentre.co.uk", phone:null,
    seasonal:false, familyFriendly:true, tags:["Craft Village","Studios","Machynlleth","Family"],
  },
  {
    id:"sn_m2", type:"workshop", emoji:"🪵", name:"Learn to Turn in Snowdonia",
    tagline:"Wood turning on a lathe in the heart of Snowdonia — all abilities welcome",
    desc:"One of the most popular craft experiences in North Wales, this platinum-rated wood turning course based near Bala runs taster sessions (3 hours, £95) through to full-day sessions (£185) and tandem sessions for two students. You work on a professional lathe with one-to-one tuition from an experienced turner, producing turned wooden objects — typically bowls, platters or candlesticks — to take home. No experience required. Available year-round with regular new dates added.",
    offerings:["3-hour taster course","Full-day turning","Sessions for 2 students","Take-home turned pieces"],
    location:"Bala area, Snowdonia / Gwynedd", price:"£95 taster · £185 full day",
    booking:"https://www.craftcourses.com/in-person-and-online-courses-craft-kits-and-handcrafted-gifts/?location=Gwynedd", phone:null,
    seasonal:false, familyFriendly:false, tags:["Woodwork","Lathe Turning","Bala","Year-round"],
  },
  {
    id:"sn_m3", type:"supplier", emoji:"🐑", name:"Cambrian Wool",
    tagline:"Welsh wool yarns, woven textiles and natural fibres from West Wales",
    desc:"Cambrian Wool champions Welsh wool and the producers who raise sheep on these upland landscapes. Their range includes hand-dyed Welsh wool yarns, woven accessories and textile products that trace directly back to Welsh farms and mills. Rooted in the Make it in Wales network, Cambrian Wool bridges the gap between raw Welsh fibre and finished craft products. Available online and via Stiwdio 3 in Cardigan — a perfect regional keepsake connecting you to the landscapes you've explored.",
    offerings:["Welsh wool yarns","Natural undyed fleece","Hand-dyed yarn","Woven accessories","Craft kits"],
    location:"Online + Stiwdio 3, Cardigan", price:"Yarn from £8 per skein",
    booking:"https://www.makeitinwales.co.uk", phone:null,
    seasonal:false, familyFriendly:false, tags:["Welsh Wool","Natural Fibre","Sustainable","Yarn"],
  },
  {
    id:"sn_m4", type:"workshop", emoji:"🪚", name:"Wernog Wood Craft Courses",
    tagline:"Traditional & contemporary craft courses in a woodland setting near Ruthin",
    desc:"Wernog Wood offers traditional and contemporary craft courses just 200m from Offa's Dyke in a beautiful woodland setting near Ruthin, North Wales. One-to-one tuition or groups of up to eight, ranging from single days to week-long craft holidays. Courses include green woodwork, chair-making, furniture, basket weaving and more — instructed by practising artists and craftspeople. An ideal base for combining craft learning with exploration of the Clwydian Hills.",
    offerings:["Green woodwork","Chair making","Furniture courses","Basket weaving","Week-long craft holidays"],
    location:"Near Ruthin, Clwyd LL15", price:"Day courses from £80",
    booking:"https://www.wernogwood.co.uk", phone:null,
    seasonal:true, familyFriendly:false, tags:["Woodland","Green Woodwork","Ruthin","Residential"],
  },
];

const GW_MAKERS = [
  {
    id:"gw_m1", type:"workshop", emoji:"🌾", name:"Gower Heritage Centre",
    tagline:"Artisan bread making, watermill flour & heritage craft workshops",
    desc:"The Gower Heritage Centre in Parkmill — just a 15-minute walk from Three Cliffs Bay — is built around a fully operational 12th-century watermill that has been lovingly restored. The Gower Gourmet Kitchen runs artisan bread-making courses where participants watch the ancient millstone grind grain to flour before learning to make and bake their own loaves using traditional methods. Interactive 'flour making experiences' suit all the family. Additional seasonal workshops cover cooking, butter churning and rural heritage crafts. Pre-booking required.",
    offerings:["Artisan bread making","Flour making experience","Butter churning","Watermill tour","Seasonal craft events"],
    location:"Parkmill, Gower SA3 2EH (15 min walk to Three Cliffs Bay)", price:"Workshops from £25",
    booking:"https://www.gowerheritagecentre.co.uk", phone:null,
    seasonal:true, familyFriendly:true, tags:["Heritage","Bread Making","Family","Three Cliffs"],
  },
  {
    id:"gw_m2", type:"workshop", emoji:"🖨️", name:"Swansea Print Workshop",
    tagline:"Etching, screenprinting & relief printing in a professional studio",
    desc:"Swansea Print Workshop is one of Wales's longest-standing dedicated printmaking studios, offering a full programme of bookable workshops in etching (intaglio), screenprinting and relief printing. Open to all abilities — from curious beginners to practising artists wanting studio access. As well as workshops, SPW has a membership scheme giving regular access to professional presses and facilities. Their touring exhibitions and artist residencies make them a genuine hub of the South Wales arts community. Celebrating their 25th anniversary in 2025.",
    offerings:["Etching & intaglio","Screenprinting","Relief printing","Life drawing sessions","Membership access","Studio hire"],
    location:"Swansea City SA1", price:"Workshops from £40 · Membership from £25/mo",
    booking:"https://swanseaprintworkshop.org.uk/workshops", phone:null,
    seasonal:false, familyFriendly:false, tags:["Printmaking","Etching","Swansea","Professional Studio"],
  },
  {
    id:"gw_m3", type:"workshop", emoji:"📄", name:"Summit Good — Wild Plant Papermaking",
    tagline:"Make paper from wild plants and garden botanicals in a Swansea workshop",
    desc:"Summit Good runs an acclaimed six-hour workshop in Swansea teaching participants to make paper by hand from wild and garden plants — nettles, iris leaves, daffodils, bracken and more. You process the raw plant material using traditional papermaking methods, forming and pressing your own sheets to take home. A gold-rated workshop on CraftCourses, praised for its relaxed, creative atmosphere. A genuinely unusual craft experience that connects the Gower's abundant plant life to the art of making.",
    offerings:["6-hour full workshop","Wild plant processing","Hand sheet forming","Take-home paper sheets","Materials included"],
    location:"Swansea area", price:"£50 per person",
    booking:"https://www.craftcourses.com/in-person-and-online-courses-craft-kits-and-handcrafted-gifts/?location=Swansea", phone:null,
    seasonal:true, familyFriendly:false, tags:["Papermaking","Wild Plants","Sustainable","Unique"],
  },
];

const BC_MAKERS = [
  {
    id:"bc_m1", type:"gallery", emoji:"🚂", name:"Erwood Station Craft Centre",
    tagline:"Galleries, studios and workshops in a beautifully converted Victorian station",
    desc:"Erwood Station is a beloved craft and gallery centre housed in a beautifully restored Victorian railway station on the banks of the River Wye near Builth Wells. The centre hosts galleries with regularly changing exhibitions, working craft studios, and an annual programme of workshops and demonstrations by local and national makers. Painter David Bellamy — known for his watercolour landscapes of the Welsh hills — has given regular demonstrations here. The riverside setting alone makes the journey worthwhile.",
    offerings:["Changing gallery exhibitions","Artist demonstrations","Seasonal workshops","Riverside café","Local art for sale"],
    location:"Erwood, near Builth Wells LD2 3TQ", price:"Free entry · Workshops vary",
    booking:"https://www.eventbrite.com/d/united-kingdom--powys/craft-workshop", phone:null,
    seasonal:true, familyFriendly:true, tags:["Gallery","Victorian Station","River Wye","Builth Wells"],
  },
  {
    id:"bc_m2", type:"workshop", emoji:"🖌️", name:"Art Courses Wales",
    tagline:"Weekend painting & drawing courses set in the Brecon Beacons landscape",
    desc:"Art Courses Wales offers a rolling programme of weekend courses in painting and drawing, running from October to June each year in the Brecon Beacons area. Five subjects are available: life classes, portrait painting, still-life, colour theory, monoprinting, and tutorial workshops. Classes suit beginners and improvers alike, with a maximum group size that ensures individual attention. The dramatic landscape of the Beacons provides an inspiring backdrop — many participants explore the hills between sessions.",
    offerings:["Life drawing","Portrait painting","Still-life painting","Colour theory","Monoprinting","Tutorial workshops"],
    location:"Brecon Beacons area (accommodation at breconbeacons.org)", price:"Weekend courses from £95",
    booking:"http://artcourseswales.com/courses", phone:null,
    seasonal:true, familyFriendly:false, tags:["Painting","Drawing","Residential","Weekend Course"],
  },
  {
    id:"bc_m3", type:"workshop", emoji:"🧵", name:"Textile Junkies",
    tagline:"Textile workshops, bespoke pieces and fabric arts in Brecon",
    desc:"Textile Junkies in Brecon is a creative hub where the love of fabric is palpable — running unique craft workshops alongside producing bespoke textile pieces. Whether you're exploring weaving, embroidery, surface design or mixed textile techniques, the studio offers accessible sessions for all levels. Their work reflects the landscape and heritage of the Beacons in material and colour. A welcoming, community-minded space with a strong local following.",
    offerings:["Textile workshops","Weaving & embroidery","Bespoke commissions","Surface design","Mixed techniques"],
    location:"Brecon, Powys LD3", price:"Workshops from £35",
    booking:"https://www.midwalesmyway.com/artsandcrafts", phone:null,
    seasonal:false, familyFriendly:false, tags:["Textiles","Weaving","Brecon","Bespoke"],
  },
  {
    id:"bc_m4", type:"workshop", emoji:"🏺", name:"Siramik — Pottery Wheel Workshop",
    tagline:"Half-day pottery wheel sessions in Carmarthen, gateway to the Beacons",
    desc:"Siramik's half-day pottery wheel workshops in Carmarthen are among the most reviewed craft experiences in South Wales — rated silver on CraftCourses with over 45 verified reviews. In a relaxed studio environment, you'll learn to centre clay, open it up, and pull a vessel on the wheel under expert guidance. All clay and glazing materials are included. Carmarthen sits at the western edge of the Beacons, making Siramik a natural pairing with a Beacons adventure.",
    offerings:["4-hour wheel session","Clay centering & pulling","Glazing & firing","Take-home piece","Materials included"],
    location:"Carmarthen (near Beacons western edge)", price:"£90 per person",
    booking:"https://www.craftcourses.com/in-person-and-online-courses-craft-kits-and-handcrafted-gifts/?location=Carmarthen", phone:null,
    seasonal:false, familyFriendly:false, tags:["Pottery","Wheel Throwing","Carmarthen","Bookable"],
  },
];


// ─── REGIONS CONFIG ──────────────────────────────────────────────────────────
const REGIONS = {

  cardigan: {
    id:"cardigan", name:"Cardigan Bay", emoji:"🐬",
    desc:"Dolphins, drowned kingdoms, and the best coast path in Wales.",
    svgW:CB_W, svgH:CB_H, proj:CB_PROJ,
    coast:CB_COAST, rivers:[CB_RIVER], hills:CB_HILLS, towns:CB_TOWNS,
    land:CB_LAND, labelTxt:"CARDIGAN BAY", labelLat:52.08, labelLng:-4.76,
    labelRot:-15, initPan:{x:-110,y:-390},
    userLoc:{lat:52.12,lng:-4.62},
    spots:CB_SPOTS, folklore:CB_FOLKLORE, routes:CB_ROUTES, content:CB_CONTENT, makers:CB_MAKERS,
    tidePort:"aberaeron",
    wx:{temp:"11°C",wind:"14mph SW",tide:"H.tide 14:22",sun:"20:11"},
    mapFilter:"cardigan",
  },
  pembrokeshire: {
    id:"pembrokeshire", name:"Pembrokeshire", emoji:"🐧",
    desc:"Puffins, ancient saints, and the wildest Atlantic coast.",
    svgW:PB_W, svgH:PB_H, proj:PB_PROJ,
    coast:PB_COAST, rivers:null, hills:PB_HILLS, towns:PB_TOWNS,
    land:PB_LAND, labelTxt:"PEMBROKESHIRE", labelLat:51.73, labelLng:-5.10,
    labelRot:-12, initPan:{x:-80,y:-200},
    userLoc:{lat:51.87,lng:-5.08},
    spots:PB_SPOTS, folklore:PB_FOLKLORE, routes:PB_ROUTES, content:PB_CONTENT, makers:PB_MAKERS,
    tidePort:"milford-haven",
    wx:{temp:"12°C",wind:"18mph W",tide:"H.tide 15:45",sun:"20:06"},
    mapFilter:"pembrokeshire",
  },
  snowdonia: {
    id:"snowdonia", name:"Snowdonia / Eryri", emoji:"🏔️",
    desc:"The rooftop of Wales. Knife ridges, glacial lakes, and legends under every summit.",
    svgW:SN_W, svgH:SN_H, proj:SN_PROJ,
    coast:SN_COAST, rivers:SN_RIVERS, hills:SN_HILLS, towns:SN_TOWNS, lakes:SN_LAKES,
    land:SN_LAND, labelTxt:"ERYRI", labelLat:53.07, labelLng:-4.14,
    labelRot:-10, initPan:{x:-60,y:-220},
    userLoc:{lat:53.118,lng:-4.134},
    spots:SN_SPOTS, folklore:SN_FOLKLORE, routes:SN_ROUTES, content:SN_CONTENT, makers:SN_MAKERS,
    tidePort:null,
    wx:{temp:"6°C",wind:"22mph NW",tide:null,sun:"17:48"},
    mapFilter:"snowdonia",
  },
  gower: {
    id:"gower", name:"Gower Peninsula", emoji:"🐉",
    desc:"Tidal islands, Neolithic caves, and the beach Dylan Thomas refused to leave.",
    svgW:GW_W, svgH:GW_H, proj:GW_PROJ,
    coast:GW_COAST, rivers:null, hills:GW_HILLS, towns:GW_TOWNS,
    land:GW_LAND, labelTxt:"GOWER", labelLat:51.60, labelLng:-4.28,
    labelRot:-5, initPan:{x:-80,y:-180},
    userLoc:{lat:51.568,lng:-4.100},
    spots:GW_SPOTS, folklore:GW_FOLKLORE, routes:GW_ROUTES, content:GW_CONTENT, makers:GW_MAKERS,
    tidePort:"swansea",
    wx:{temp:"13°C",wind:"15mph SW",tide:"H.tide 13:50",sun:"20:02"},
    mapFilter:"gower",
  },
  brecon: {
    id:"brecon", name:"Brecon Beacons", emoji:"⛰️",
    desc:"The roof of South Wales. Lakes, waterfalls, and legends under every ridge.",
    svgW:BC_W, svgH:BC_H, proj:BC_PROJ,
    coast:BC_COAST, rivers:BC_RIVERS, hills:BC_HILLS, towns:BC_TOWNS, lakes:BC_LAKES,
    land:BC_LAND, labelTxt:"BANNAU BRYCHEINIOG", labelLat:51.90, labelLng:-3.75,
    labelRot:-8, initPan:{x:-60,y:-200},
    userLoc:{lat:51.884,lng:-3.438},
    spots:BC_SPOTS, folklore:BC_FOLKLORE, routes:BC_ROUTES, content:BC_CONTENT, makers:BC_MAKERS,
    tidePort:null,
    wx:{temp:"8°C",wind:"18mph NW",tide:null,sun:"20:05"},
    mapFilter:"brecon",
  },
};

// ─── EXT URL BUILDER ─────────────────────────────────────────────────────────
const ext = {
  os: (lat, lng) => `https://explore.osmaps.com/?lat=${lat}&lon=${lng}&zoom=15`,
  osRoute: (id) => `https://explore.osmaps.com/route/${id}`,
  gmaps: (lat, lng) => `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
  w3w: (addr) => `https://what3words.com/${addr}`,
  tides: (port) => `https://www.bbc.co.uk/weather/coast-and-sea/tide-tables/${port}`,
  weather: (lat, lng) => `https://www.metoffice.gov.uk/weather/forecast/${lat},${lng}`,
  cbmwc: () => `https://www.cbmwc.org/sightings`,
};


// ─── PERSISTENCE ─────────────────────────────────────────────────────────────
function useStorage(key, defaultVal) {
  const [val, setVal] = useState(defaultVal);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (!window.storage) { setLoaded(true); return; }
    window.storage.get(key).then(r => {
      if (r && r.value) {
        try { setVal(JSON.parse(r.value)); } catch(e) {}
      }
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, [key]);
  const save = (newVal) => {
    setVal(newVal);
    if (window.storage) {
      window.storage.set(key, JSON.stringify(newVal)).catch(()=>{});
    }
  };
  return [val, save, loaded];
}

// ─── SMALL COMPONENTS ────────────────────────────────────────────────────────
const RarityBadge = ({ rarity, sm }) => {
  const c = RARITY[rarity] || RARITY.common;
  if (rarity === "legendary") return <span className="legendary-bg" style={{padding:sm?"2px 7px":"3px 10px",borderRadius:20,fontSize:sm?10:11,fontWeight:700,color:"#fff",fontFamily:"'Fredoka',sans-serif"}}>{RE.legendary} Legendary</span>;
  return <span style={{padding:sm?"2px 7px":"3px 10px",borderRadius:20,fontSize:sm?10:11,fontWeight:700,color:c.text,background:c.bg,border:`1px solid ${c.color}45`,fontFamily:"'Fredoka',sans-serif"}}>{RE[rarity]} {c.label}</span>;
};
const SourceBadge = ({ source }) => {
  const s = SOURCES[source]; if (!s) return null;
  return <span style={{padding:"2px 7px",borderRadius:8,fontSize:10,fontWeight:600,color:s.color,background:s.bg,border:`1px solid ${s.color}30`}}>{s.icon} {s.label}</span>;
};
const WaveBar = ({ on }) => {
  const hs = [5,11,17,8,19,6,14,11,7,17,10];
  return <div style={{display:"flex",alignItems:"center",gap:2,height:24}}>{hs.map((h,i) => <div key={i} style={{width:3,height:on?h:4,background:on?"#22c55e":"#374151",borderRadius:2,transition:"height .3s",animation:on?`wave ${.35+i*.06}s ease-in-out infinite alternate`:"none"}}/>)}</div>;
};
const Ring = ({pct,size=46,color="#f59e0b"}) => {
  const r=(size-6)/2,circ=2*Math.PI*r;
  return <svg width={size} height={size} style={{transform:"rotate(-90deg)"}}><circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1f2937" strokeWidth={5}/><circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={5} strokeDasharray={circ} strokeDashoffset={circ*(1-pct/100)} strokeLinecap="round"/></svg>;
};
const ContentTypeBadge = ({type}) => {
  const cfg={guide:{label:"Guide",color:"#22c55e"},story:{label:"Story",color:"#f59e0b"},route:{label:"Route",color:"#3b82f6"}};
  const c=cfg[type]||cfg.guide;
  return <span style={{padding:"2px 8px",borderRadius:8,fontSize:10,fontWeight:700,color:c.color,background:`${c.color}15`,border:`1px solid ${c.color}35`}}>{c.label}</span>;
};
const VisibilityIcon = ({ v }) => {
  const cfg={public:{icon:<Globe size={11}/>,label:"Public",color:"#22c55e"},friends:{icon:<Users size={11}/>,label:"Friends",color:"#3b82f6"},crew:{icon:<Lock size={11}/>,label:"Crew",color:"#f59e0b"}};
  const c=cfg[v]||cfg.public;
  return <span style={{display:"inline-flex",alignItems:"center",gap:3,padding:"2px 7px",borderRadius:8,fontSize:10,fontWeight:600,color:c.color,background:`${c.color}15`}}>{c.icon}{c.label}</span>;
};
const IntLink = ({ href, icon, label }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" style={{flexShrink:0,display:"flex",alignItems:"center",gap:5,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:10,padding:"7px 11px",color:"#9ca3af",fontSize:11,fontWeight:600,textDecoration:"none",cursor:"pointer"}}>
    <span>{icon}</span>{label}<ExternalLink size={9} color="#6b7280"/>
  </a>
);


// ─── ASK THE GUIDE — Claude-powered advisor ───────────────────────────────────
function AskGuide({ region, onClose }) {
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  const allSpots = Object.values(REGIONS).flatMap(r=>r.spots);
  const allFolklore = Object.values(REGIONS).flatMap(r=>r.folklore);
  const allRoutes = Object.values(REGIONS).flatMap(r=>r.routes);

  const nl = "\n";
  const regionList = Object.values(REGIONS).map(r=>r.emoji+" "+r.name).join(", ");
  const regionLine = region ? ("CURRENT REGION: "+region.emoji+" "+region.name+" - "+region.desc) : "";
  const spotList = allSpots.map(s=>"* "+s.emoji+" "+s.name+" ("+s.activity+", "+s.difficulty+") - "+s.desc.slice(0,80)+"...").join(nl);
  const routeList = allRoutes.map(r=>"* "+r.emoji+" "+r.name+" - "+r.dist+", "+r.asc+" ascent, "+r.diff).join(nl);
  const folkloreList = allFolklore.map(f=>"* "+f.emoji+" "+f.name+" ("+f.region+") - "+f.summary.slice(0,80)+"...").join(nl);
  const systemPrompt = "You are a local Welsh adventure guide for the Little Big Adventure Time app. You know every spot, route, and story across Wales intimately."+nl+nl+
    "ACTIVE REGIONS: "+regionList+nl+
    (regionLine ? regionLine+nl : "")+nl+
    "SPOTS YOU KNOW ("+allSpots.length+" total):"+nl+spotList+nl+nl+
    "ROUTES:"+nl+routeList+nl+nl+
    "FOLKLORE:"+nl+folkloreList+nl+nl+
    "Respond as a knowledgeable, honest local guide. Be specific. Mention real spots by name. If asked about conditions, be frank about difficulty and seasons. Keep responses under 200 words unless a detailed route description is needed. Use occasional Welsh words naturally. Never be generically enthusiastic - be precise and real.";

  useEffect(()=>{ if(msgs.length===0){ setMsgs([{role:"assistant",text:"Bore da. I know every ridge, bay, and legend across "+Object.keys(REGIONS).length+" Welsh regions - "+allSpots.length+" spots, "+allRoutes.length+" routes. What are you planning?"}]); } },[]);
  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:"smooth"}); },[msgs,loading]);

  const send = async () => {
    if(!input.trim()||loading) return;
    const userMsg = input.trim();
    setInput("");
    const newMsgs = [...msgs, {role:"user",text:userMsg}];
    setMsgs(newMsgs);
    setLoading(true);
    try {
      const apiMsgs = newMsgs.map(m=>({role:m.role==="assistant"?"assistant":"user",content:m.text}));
      const response = await fetch("https://api.anthropic.com/v1/messages", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY,
    "anthropic-version": "2023-06-01",
    "anthropic-dangerous-allow-browser": "true",
  },
        body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,system:systemPrompt,messages:apiMsgs})
      });
      const data = await res.json();
      const reply = data.content?.map(b=>b.text||"").join("") || "Sorry, could not reach the guide right now.";
      setMsgs(prev=>[...prev,{role:"assistant",text:reply}]);
    } catch(e) {
      setMsgs(prev=>[...prev,{role:"assistant",text:"Connection issue. Try again in a moment."}]);
    }
    setLoading(false);
  };

  const suggestions = [
    "Where should I go if I have 4 hours and want something hard?",
    "Best wild swim in Wales right now?",
    "Tell me about the Snowdon legends",
    "I'm a beginner — where do I start?",
    "What's the best sunset spot?",
  ];

  return (
    <div style={{position:"absolute",inset:0,zIndex:600,background:"#0d1117",display:"flex",flexDirection:"column",touchAction:"auto"}}>
      {/* Header */}
      <div style={{background:"linear-gradient(135deg,#0c1a2e,#091420)",padding:"52px 20px 16px",borderBottom:"1px solid rgba(255,255,255,0.06)",flexShrink:0}}>
        <button onClick={onClose} style={{position:"absolute",top:16,left:16,background:"rgba(255,255,255,0.08)",border:"none",borderRadius:20,width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><X size={18} color="#fff"/></button>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:44,height:44,borderRadius:"50%",background:"linear-gradient(135deg,#1e3a2f,#0f2218)",border:"2px solid #22c55e",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>🏴󠁧󠁢󠁷󠁬󠁳󠁿</div>
          <div>
            <div style={{fontFamily:"'Fredoka',sans-serif",fontSize:18,color:"#fff",fontWeight:700}}>Ask the Guide</div>
            <div style={{fontSize:11,color:"#4ade80"}}>{allSpots.length} spots · {allRoutes.length} routes · all Wales</div>
          </div>
          <div style={{marginLeft:"auto",background:"rgba(34,197,94,0.1)",border:"1px solid rgba(34,197,94,0.25)",borderRadius:20,padding:"4px 10px",fontSize:10,color:"#4ade80",fontWeight:700}}>AI Guide</div>
        </div>
      </div>
      {/* Messages */}
      <div style={{flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch",touchAction:"pan-y",padding:"16px 16px 0"}}>
        {msgs.map((m,i)=>(
          <div key={i} style={{marginBottom:14,display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start"}}>
            {m.role==="assistant"&&<div style={{width:28,height:28,borderRadius:"50%",background:"#1e3a2f",border:"1px solid #22c55e",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0,marginRight:8,marginTop:2}}>🏴󠁧󠁢󠁷󠁬󠁳󠁿</div>}
            <div style={{maxWidth:"78%",background:m.role==="user"?"rgba(34,197,94,0.15)":"#1f2937",border:m.role==="user"?"1px solid rgba(34,197,94,0.25)":"1px solid rgba(255,255,255,0.06)",borderRadius:m.role==="user"?"18px 18px 4px 18px":"18px 18px 18px 4px",padding:"10px 14px"}}>
              <p style={{fontFamily:"'Crimson Pro',serif",fontSize:15,lineHeight:1.7,color:m.role==="user"?"#4ade80":"#d1d5db",margin:0}}>{m.text}</p>
            </div>
          </div>
        ))}
        {loading&&<div style={{display:"flex",gap:8,marginBottom:14}}>
          <div style={{width:28,height:28,borderRadius:"50%",background:"#1e3a2f",border:"1px solid #22c55e",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>🏴󠁧󠁢󠁷󠁬󠁳󠁿</div>
          <div style={{background:"#1f2937",borderRadius:"18px 18px 18px 4px",padding:"14px 16px",border:"1px solid rgba(255,255,255,0.06)"}}>
            <div style={{display:"flex",gap:4,alignItems:"center"}}>{[0,1,2].map(i=><div key={i} style={{width:6,height:6,borderRadius:"50%",background:"#4ade80",animation:`wave ${0.4+i*0.15}s ease-in-out infinite alternate`}}/>)}</div>
          </div>
        </div>}
        {msgs.length<=1&&!loading&&<div style={{padding:"8px 0 16px"}}>
          <div style={{fontSize:11,color:"#6b7280",marginBottom:8}}>Try asking…</div>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {suggestions.map(s=><button key={s} onClick={()=>{setInput(s);}} style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,padding:"9px 12px",cursor:"pointer",textAlign:"left",color:"#9ca3af",fontSize:12,fontFamily:"'DM Sans',sans-serif"}}>{s}</button>)}
          </div>
        </div>}
        <div ref={bottomRef}/>
      </div>
      {/* Input */}
      <div style={{padding:"12px 16px 20px",borderTop:"1px solid rgba(255,255,255,0.05)",background:"#0d1117",flexShrink:0}}>
        <div style={{display:"flex",gap:8,alignItems:"flex-end"}}>
          <div style={{flex:1,background:"#1f2937",borderRadius:18,border:"1px solid rgba(255,255,255,0.08)",padding:"10px 14px",display:"flex",alignItems:"center"}}>
            <textarea value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}} placeholder="Ask about spots, routes, conditions, folklore…" rows={1} style={{flex:1,background:"none",border:"none",color:"#e5e7eb",fontSize:14,resize:"none",outline:"none",fontFamily:"'DM Sans',sans-serif",lineHeight:1.4}}/>
          </div>
          <button onClick={send} disabled={!input.trim()||loading} style={{width:44,height:44,borderRadius:"50%",background:input.trim()?"#22c55e":"#1f2937",border:"none",cursor:input.trim()?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center",transition:"background .2s",flexShrink:0}}>
            <ArrowRight size={18} color={input.trim()?"#fff":"#4b5563"}/>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── OVERVIEW MAP ─────────────────────────────────────────────────────────────
function OverviewMap({ onRegionSelect }) {
  const [hov, setHov] = useState(null);
  const OVW = 400, OVH = 520;
  // Simplified Wales outline (screen coords)
  const wales = "M 170,20 L 195,28 L 220,35 L 240,50 L 248,70 L 250,90 L 242,110 L 228,125 L 210,138 L 195,155 L 185,175 L 178,195 L 172,215 L 160,230 L 148,250 L 138,270 L 130,290 L 118,305 L 105,318 L 95,332 L 88,348 L 92,365 L 100,375 L 112,382 L 125,385 L 138,380 L 150,370 L 158,356 L 162,340 L 168,325 L 178,315 L 190,310 L 200,318 L 210,330 L 218,345 L 222,362 L 218,380 L 210,392 L 198,400 L 185,408 L 170,412 L 155,415 L 140,410 L 128,400 L 118,388 L 110,375 L 100,362 L 88,352 L 75,345 L 62,342 L 50,348 L 42,360 L 40,375 L 45,388 L 55,398 L 68,404 L 80,406 L 88,415 L 88,428 L 80,438 L 68,444 L 55,445 L 42,440 L 30,430 L 22,418 L 18,405 L 20,390 L 25,378 L 28,365 L 25,352 L 18,342 L 12,330 L 10,315 L 12,298 L 18,282 L 22,265 L 20,248 L 15,232 L 12,215 L 15,198 L 22,182 L 30,168 L 38,155 L 45,142 L 48,128 L 50,112 L 52,95 L 58,80 L 68,65 L 80,52 L 95,40 L 112,30 L 130,22 L 150,18 Z";
  // Region ellipses (screen coords approximating real positions)
  const regDefs = [
    { id:"cardigan", cx:155, cy:300, rx:55, ry:38, rot:-12, emoji:"🐬", name:"Cardigan Bay", spots:12, folk:5, active:true },
    { id:"pembrokeshire", cx:65, cy:390, rx:52, ry:35, rot:-8, emoji:"🐧", name:"Pembrokeshire", spots:9, folk:4, active:true },
    { id:"snowdonia", cx:155, cy:150, rx:50, ry:35, rot:-5, emoji:"🏔️", name:"Snowdonia", spots:8, folk:3, active:true },
    { id:"gower", cx:110, cy:445, rx:42, ry:28, rot:-5, emoji:"🐉", name:"Gower", spots:6, folk:3, active:true },
    { id:"brecon", cx:192, cy:382, rx:45, ry:30, rot:5, emoji:"⛰️", name:"Brecon Beacons", spots:5, folk:3, active:true },
  ];
  const cities = [
    { x:155,y:48,name:"Bangor" },
    { x:155,y:230,name:"Aberystwyth" },
    { x:195,y:430,name:"Cardiff" },
    { x:130,y:420,name:"Swansea" },
  ];
  return (
    <div style={{height:"100%",background:"linear-gradient(180deg,#0c1a2e,#0a1520)",display:"flex",flexDirection:"column"}}>
      {/* Header */}
      <div style={{padding:"48px 20px 16px",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
          <span style={{fontSize:28}} className="float">🏴󠁧󠁢󠁷󠁬󠁳󠁿</span>
          <div>
            <h1 style={{fontFamily:"'Fredoka',sans-serif",fontSize:24,fontWeight:700,color:"#fff",lineHeight:1}}>Little Big Adventure Time</h1>
            <p style={{fontSize:12,color:"#6b7280",marginTop:2}}>Wales · Pick your region to explore</p>
          </div>
        </div>
      </div>

      {/* Map */}
      <div style={{flex:1,overflow:"hidden",position:"relative"}}>
        <svg width={OVW} height={OVH} viewBox={`0 0 ${OVW} ${OVH}`} style={{width:"100%",height:"100%"}}>
          <defs>
            <linearGradient id="seaOv" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#0c2340"/><stop offset="100%" stopColor="#081825"/></linearGradient>
            <linearGradient id="landOv" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#1e2d1a"/><stop offset="100%" stopColor="#141f12"/></linearGradient>
          </defs>
          <rect width={OVW} height={OVH} fill="url(#seaOv)"/>
          <text x={35} y={250} fill="rgba(120,180,255,0.12)" fontFamily="'Fredoka',sans-serif" fontSize="18" fontWeight="600" letterSpacing="3" transform="rotate(-90,35,250)">IRISH SEA</text>
          <path d={wales} fill="url(#landOv)" stroke="#4a6741" strokeWidth={1.5} strokeLinejoin="round"/>
          {/* Context cities */}
          {cities.map(c=><g key={c.name}><circle cx={c.x} cy={c.y} r={3} fill="#c8a96e" opacity={0.7}/><text x={c.x+5} y={c.y+4} fill="rgba(200,169,110,0.5)" fontSize="8" fontFamily="'DM Sans',sans-serif">{c.name}</text></g>)}
          {/* Regions */}
          {regDefs.map(r=>{
            const isHov=hov===r.id;
            return (
              <g key={r.id} style={{cursor:r.active?"pointer":"default"}}
                onMouseEnter={()=>r.active&&setHov(r.id)}
                onMouseLeave={()=>setHov(null)}
                onClick={()=>r.active&&onRegionSelect(r.id)}>
                <ellipse cx={r.cx} cy={r.cy} rx={r.rx} ry={r.ry}
                  transform={`rotate(${r.rot},${r.cx},${r.cy})`}
                  fill={r.active?(isHov?"rgba(34,197,94,0.15)":"rgba(34,197,94,0.05)"):("rgba(255,255,255,0.02)")}
                  stroke={r.active?(isHov?"#22c55e":"rgba(34,197,94,0.5)"):"rgba(255,255,255,0.12)"}
                  strokeWidth={isHov?2:1.5}
                  strokeDasharray={r.active?"6 4":"4 6"}
                  className={r.active&&!isHov?"region-glow":""}/>
                <text x={r.cx} y={r.cy-4} textAnchor="middle" fontSize="14">{r.emoji}</text>
                <text x={r.cx} y={r.cy+10} textAnchor="middle" fontFamily="'Fredoka',sans-serif" fontSize="9" fill={r.active?(isHov?"#4ade80":"#6b7280"):"#374151"} fontWeight="600">{r.name}</text>
                {r.active&&<text x={r.cx} y={r.cy+20} textAnchor="middle" fontSize="8" fill={isHov?"#22c55e":"#4b5563"}>{r.spots} spots · {r.folk} folklore</text>}
                {!r.active&&<text x={r.cx} y={r.cy+20} textAnchor="middle" fontSize="8" fill="#374151">Coming soon</text>}
                {isHov&&<text x={r.cx} y={r.cy+32} textAnchor="middle" fontSize="9" fill="#4ade80">Tap to explore →</text>}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Active region cards */}
      <div style={{padding:"12px 16px 16px",borderTop:"1px solid rgba(255,255,255,0.05)"}}>
        <div style={{fontFamily:"'Fredoka',sans-serif",fontSize:11,color:"#6b7280",letterSpacing:1,marginBottom:8}}>EXPLORE NOW</div>
        <div style={{display:"flex",gap:8,overflowX:"auto",WebkitOverflowScrolling:"touch",touchAction:"pan-x",paddingBottom:4,scrollbarWidth:"none"}}>
          {Object.values(REGIONS).map(r=>{
            return <button key={r.id} onClick={()=>onRegionSelect(r.id)} style={{flexShrink:0,width:120,background:"#111827",border:"1px solid rgba(34,197,94,0.25)",borderRadius:14,padding:"12px",cursor:"pointer",textAlign:"left"}}>
              <div style={{fontSize:22,marginBottom:4}}>{r.emoji}</div>
              <div style={{fontFamily:"'Fredoka',sans-serif",fontSize:12,color:"#e5e7eb",marginBottom:2,lineHeight:1.2}}>{r.name}</div>
              <div style={{fontSize:10,color:"#6b7280"}}>{r.spots.length} spots</div>
            </button>;
          })}
        </div>
      </div>
    </div>
  );
}

// ─── MAP PANEL ────────────────────────────────────────────────────────────────
function MapPanel({ region, activeFilter, onSpot, onFolklore, onRoute }) {
  const r = region;
  const [pan, setPan] = useState(r.initPan);
  const [scale, setScale] = useState(1);
  const [showRoutes, setShowRoutes] = useState(true);
  const drag = useRef(null);
  const pinch = useRef(null);
  const scaleRef = useRef(scale);
  useEffect(() => { scaleRef.current = scale; }, [scale]);

  const clamp = useCallback((p, sc) => {
    const s = sc !== undefined ? sc : scaleRef.current;
    const vw = 430, vh = 560;
    const minX = Math.min(0, -(r.svgW * s - vw));
    const minY = Math.min(0, -(r.svgH * s - vh));
    return {x: Math.min(0, Math.max(minX, p.x)), y: Math.min(0, Math.max(minY, p.y))};
  }, [r.svgW, r.svgH]);

  useEffect(()=>{ setPan(r.initPan); setScale(1); scaleRef.current = 1; }, [r.id]);

  // Keep a ref to pan so touch handlers never have stale values
  const panRef = useRef(pan);
  useEffect(() => { panRef.current = pan; }, [pan]);

  const onMouseDown = useCallback((e) => {
    const startPan = panRef.current;
    drag.current = {sx: e.clientX - startPan.x, sy: e.clientY - startPan.y};
    const mv = (e2) => {
      if(!drag.current) return;
      setPan(clamp({x: e2.clientX - drag.current.sx, y: e2.clientY - drag.current.sy}));
    };
    const up = () => { drag.current = null; window.removeEventListener("mousemove", mv); window.removeEventListener("mouseup", up); };
    window.addEventListener("mousemove", mv);
    window.addEventListener("mouseup", up);
  }, [clamp]);

  const onTouchStart = useCallback((e) => {
    if (e.touches.length === 1) {
      const t = e.touches[0];
      const startPan = panRef.current;
      drag.current = {sx: t.clientX - startPan.x, sy: t.clientY - startPan.y};
      pinch.current = null;
    } else if (e.touches.length === 2) {
      drag.current = null;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinch.current = {dist: Math.hypot(dx, dy), scale: scaleRef.current};
    }
  }, []);

  useEffect(() => {
    const el = document.getElementById("map-svg-container");
    if (!el) return;
    const mv = (e) => {
      e.preventDefault();
      if (e.touches.length === 1 && drag.current) {
        const t = e.touches[0];
        setPan(clamp({x: t.clientX - drag.current.sx, y: t.clientY - drag.current.sy}));
      } else if (e.touches.length === 2 && pinch.current) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const newDist = Math.hypot(dx, dy);
        const newScale = Math.min(3, Math.max(0.4, pinch.current.scale * (newDist / pinch.current.dist)));
        const mx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const my = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        const contentX = (mx - panRef.current.x) / scaleRef.current;
        const contentY = (my - panRef.current.y) / scaleRef.current;
        const np = clamp({x: mx - contentX * newScale, y: my - contentY * newScale}, newScale);
        scaleRef.current = newScale;
        setScale(newScale);
        setPan(np);
      }
    };
    const up = () => { drag.current = null; pinch.current = null; };
    el.addEventListener("touchmove", mv, {passive: false});
    el.addEventListener("touchend", up);
    el.addEventListener("touchcancel", up);
    return () => { el.removeEventListener("touchmove", mv); el.removeEventListener("touchend", up); el.removeEventListener("touchcancel", up); };
  }, [clamp, r.id]);

  const spots = activeFilter==="All"||activeFilter==="📜 Folklore" ? r.spots : r.spots.filter(s=>s.activity===activeFilter||s.tags?.includes(activeFilter));
  const showFolk = activeFilter==="All"||activeFilter==="📜 Folklore";
  const proj = r.proj;
  const userPt = proj(r.userLoc.lat, r.userLoc.lng);

  // Build route polylines
  const routeColors = ["#3b82f6","#8b5cf6","#06b6d4"];
  const rivArr = r.rivers ? r.rivers : (r.river ? [r.river] : []);
  const lakeEls = (r.lakes||[]).map((lk,i)=>{ const p=proj(lk.lat,lk.lng); return {key:i,cx:p.x,cy:p.y,rx:lk.rx,ry:lk.ry}; });
  const labelPt = proj(r.labelLat, r.labelLng);

  return (
    <div id="map-svg-container" style={{position:"absolute",inset:0,overflow:"hidden",background:"#0c2340",touchAction:"none"}} onMouseDown={onMouseDown} onTouchStart={onTouchStart}>
      <svg width={r.svgW} height={r.svgH} style={{position:"absolute",left:pan.x,top:pan.y,transformOrigin:"0 0",transform:"scale("+scale+")",cursor:"grab",userSelect:"none"}}>
        <defs>
          <linearGradient id="seaG" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#0c2340"/><stop offset="100%" stopColor="#0a1f35"/></linearGradient>
          <linearGradient id="landG" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#1e2d1a"/><stop offset="100%" stopColor="#16231a"/></linearGradient>
          <radialGradient id="hillG" cx="50%" cy="30%" r="60%"><stop offset="0%" stopColor="#2d4a1e" stopOpacity="0.75"/><stop offset="100%" stopColor="#1a2d14" stopOpacity="0"/></radialGradient>
          <pattern id="seaGrid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="0.8"/></pattern>
        </defs>
        {/* Ocean */}
        <rect width={r.svgW} height={r.svgH} fill="url(#seaG)"/>
        <rect width={r.svgW} height={r.svgH} fill="url(#seaGrid)"/>
        {/* Coastal glow layers */}
        {[0.04,0.08,0.13].map((o,i)=><path key={i} d={r.land} fill="none" stroke={`rgba(100,180,255,${o})`} strokeWidth={28-i*7} transform={`translate(${(i+1)*20},0)`}/>)}
        {/* Land */}
        <path d={r.land} fill="url(#landG)"/>
        {/* Hills */}
        {r.hills.map((h,i)=><ellipse key={i} cx={h.cx} cy={h.cy} rx={h.r} ry={h.r*.65} fill="url(#hillG)"/>)}
        {/* Coastline */}
        <path d={toPath(r.coast,proj)} fill="none" stroke="#a8c87a" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round"/>
        <path d={toPath(r.coast,proj)} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={1} strokeLinejoin="round"/>
        {/* Rivers */}
        {rivArr.map((rv,ri)=><g key={ri}><path d={toPath(rv,proj)} fill="none" stroke="#4a9bbe" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" opacity={0.7}/><path d={toPath(rv,proj)} fill="none" stroke="rgba(120,200,255,0.2)" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round"/></g>)}
        {/* Lakes */}
        {lakeEls.map(lk=><ellipse key={lk.key} cx={lk.cx} cy={lk.cy} rx={lk.rx} ry={lk.ry} fill="#1a3a4e" stroke="#4a9bbe" strokeWidth={1.5} opacity={0.85}/>)}
        {/* Region label */}
        <text x={labelPt.x-30} y={labelPt.y+30} fill="rgba(160,210,255,0.12)" fontFamily="'Fredoka',sans-serif" fontSize="30" fontWeight="600" letterSpacing="5" transform={`rotate(${r.labelRot},${labelPt.x},${labelPt.y})`}>{r.labelTxt}</text>
        {/* Towns */}
        {r.towns.map(t=>{ const p=proj(t.lat,t.lng); return <g key={t.n}><circle cx={p.x} cy={p.y} r={5} fill="#c8a96e" stroke="#1e2d1a" strokeWidth={1.5}/><text x={p.x+8} y={p.y+4} fill="rgba(220,200,160,0.8)" fontSize="12" fontFamily="'DM Sans',sans-serif" fontWeight="600">{t.n}</text></g>; })}
        {/* Routes */}
        {showRoutes && r.routes.map((route,ri)=>{
          const col = routeColors[ri%routeColors.length];
          const pts = route.wp.map(p=>proj(p[0],p[1]));
          const pathD = pts.map((p,i)=>`${i===0?"M":"L"} ${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
          const midIdx = Math.floor(pts.length/2);
          const mid = pts[midIdx] || pts[0];
          return (
            <g key={route.id} style={{cursor:"pointer"}} onClick={()=>onRoute(route)}>
              <path d={pathD} fill="none" stroke={col} strokeWidth={4} strokeOpacity={0.3} strokeLinecap="round" strokeLinejoin="round"/>
              <path d={pathD} fill="none" stroke={col} strokeWidth={2.5} strokeOpacity={0.8} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="10 6" className="route-line"/>
              {pts.map((p,i)=><g key={i}><circle cx={p.x} cy={p.y} r={8} fill="#1e2d3d" stroke={col} strokeWidth={2}/><text x={p.x} y={p.y+5} textAnchor="middle" fontSize="9" fill={col} fontWeight="800" fontFamily="'Fredoka',sans-serif">{i+1}</text></g>)}
              <rect x={mid.x-40} y={mid.y-20} width={80} height={18} rx={6} fill="rgba(13,17,23,0.85)" stroke={`${col}60`} strokeWidth={1}/>
              <text x={mid.x} y={mid.y-7} textAnchor="middle" fontSize="9" fill={col} fontFamily="'DM Sans',sans-serif" fontWeight="700">{route.name}</text>
            </g>
          );
        })}
        {/* Folklore markers */}
        {showFolk && r.folklore.map(f=>{ const p=proj(f.lat,f.lng); return <g key={f.id} className="marker-folklore" style={{cursor:"pointer"}} onClick={()=>onFolklore(f)}><circle cx={p.x} cy={p.y} r={19} fill="#1a0808" stroke="#ef4444" strokeWidth={2}/><text x={p.x} y={p.y+7} textAnchor="middle" fontSize="16">{f.emoji}</text></g>; })}
        {/* Spot markers */}
        {spots.map(s=>{ const p=proj(s.lat,s.lng); return (
          <g key={s.id} className={s.seasonal?"marker-seasonal":""} style={{cursor:"pointer"}} onClick={()=>onSpot(s)}>
            <circle cx={p.x} cy={p.y} r={22} fill="#1e2d3d" stroke={s.seasonal?"#fbbf24":"#4a6741"} strokeWidth={2.5}/>
            <text x={p.x} y={p.y+7} textAnchor="middle" fontSize="18">{s.emoji}</text>
            <text x={p.x} y={p.y+32} textAnchor="middle" fontSize="10" fill="rgba(229,231,235,0.7)" fontFamily="'DM Sans',sans-serif" fontWeight="600">{s.name.split(" ").slice(0,2).join(" ")}</text>
            {s.seasonal&&s.daysLeft&&<g><rect x={p.x+10} y={p.y-30} width={30} height={15} rx={5} fill="#fbbf24"/><text x={p.x+25} y={p.y-19} textAnchor="middle" fontSize="9" fontWeight="800" fill="#1a1a2e" fontFamily="'Fredoka',sans-serif">{s.daysLeft}d</text></g>}
            <circle cx={p.x+16} cy={p.y-16} r={5} fill={SOURCES[s.source]?.color||"#22c55e"} stroke="#0d1117" strokeWidth={1}/>
          </g>
        ); })}
        {/* User location */}
        <g className="marker-user"><circle cx={userPt.x} cy={userPt.y} r={18} fill="none" stroke="rgba(59,130,246,0.3)" strokeWidth={8}/><circle cx={userPt.x} cy={userPt.y} r={8} fill="#3b82f6" stroke="#fff" strokeWidth={2}/></g>
      </svg>
      {/* Routes toggle */}
      <button onClick={()=>setShowRoutes(!showRoutes)} style={{position:"absolute",bottom:12,right:12,background:"rgba(10,18,30,0.9)",border:"1px solid "+(showRoutes?"rgba(59,130,246,0.4)":"rgba(255,255,255,0.1)"),borderRadius:10,padding:"5px 10px",cursor:"pointer",fontSize:10,color:showRoutes?"#60a5fa":"#6b7280",fontFamily:"'DM Sans',sans-serif",fontWeight:600}}>
        {showRoutes?"Hide routes":"Show routes"}
      </button>
      <div style={{position:"absolute",bottom:12,left:12,display:"flex",flexDirection:"column",gap:4}}>
        <button onClick={()=>{
          const ns=Math.min(3,scale+0.3);
          const vw=430,vh=480;
          const cx=(vw/2-pan.x)/scale, cy=(vh/2-pan.y)/scale;
          const np=clamp({x:vw/2-cx*ns,y:vh/2-cy*ns},ns);
          setScale(ns); setPan(np);
        }} style={{width:36,height:36,background:"rgba(10,18,30,0.9)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:8,cursor:"pointer",color:"#e5e7eb",fontSize:22,fontWeight:300,display:"flex",alignItems:"center",justifyContent:"center",lineHeight:1}}>+</button>
        <button onClick={()=>{
          const ns=Math.max(0.4,scale-0.3);
          const vw=430,vh=480;
          const cx=(vw/2-pan.x)/scale, cy=(vh/2-pan.y)/scale;
          const np=clamp({x:vw/2-cx*ns,y:vh/2-cy*ns},ns);
          setScale(ns); setPan(np);
        }} style={{width:36,height:36,background:"rgba(10,18,30,0.9)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:8,cursor:"pointer",color:"#e5e7eb",fontSize:22,fontWeight:300,display:"flex",alignItems:"center",justifyContent:"center",lineHeight:1}}>−</button>
        <button onClick={()=>{setScale(1);setPan(r.initPan);scaleRef.current=1;}} style={{width:36,height:36,background:"rgba(10,18,30,0.9)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:8,cursor:"pointer",color:"#6b7280",fontSize:9,fontWeight:700,fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",justifyContent:"center"}}>FIT</button>
      </div>
    </div>
  );
}

// ─── SPOT SHEET ───────────────────────────────────────────────────────────────
function SpotSheet({ spot, region, onClose, onQuest }) {
  const [playing, setPlaying] = useState(null);
  const [votes, setVotes] = useState(spot.votes);
  const [savedSpots, setSavedSpots] = useStorage("lbat:saved", []);
  const saved = savedSpots.includes(spot.id);
  const toggleSave = () => {
    const updated = saved ? savedSpots.filter(id=>id!==spot.id) : [...savedSpots, spot.id];
    setSavedSpots(updated);
  };
  const port = spot.tidePort || region.tidePort;
  return (
    <div className="sheet-enter" style={{position:"absolute",bottom:0,left:0,right:0,zIndex:400,maxHeight:"78vh",overflowY:"scroll",WebkitOverflowScrolling:"touch",touchAction:"pan-y",background:"#111827",borderRadius:"22px 22px 0 0",border:"1px solid rgba(255,255,255,0.07)"}}>
      <div style={{display:"flex",justifyContent:"center",padding:"10px 0 4px"}}><div style={{width:36,height:4,background:"#374151",borderRadius:2}}/></div>
      <button onClick={onClose} style={{position:"absolute",top:14,right:14,background:"#1f2937",border:"none",borderRadius:20,width:30,height:30,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><X size={14} color="#6b7280"/></button>
      <div style={{padding:"4px 16px 80px"}}>
        {/* Seasonal banner */}
        {spot.seasonal&&spot.daysLeft&&<div style={{background:"linear-gradient(135deg,#1a1a2e,#2d1b69)",border:"1px solid #fbbf24",borderRadius:14,padding:"10px 14px",marginBottom:12,display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:22}}>✨</span><div><div style={{fontFamily:"'Fredoka',sans-serif",fontSize:14,color:"#fbbf24",fontWeight:600}}>{spot.seasonName}</div><div style={{fontSize:11,color:"#f59e0b"}}>⏳ {spot.daysLeft} days remaining</div></div></div>}
        {/* Header */}
        <div style={{background:"linear-gradient(135deg,#1e3a2f,#0f2218)",borderRadius:18,padding:"16px",marginBottom:12,border:"1px solid rgba(255,255,255,0.05)"}}>
          <div style={{display:"flex",alignItems:"flex-start",gap:12}}>
            <div style={{fontSize:42}}>{spot.emoji}</div>
            <div style={{flex:1}}>
              <h2 style={{fontFamily:"'Fredoka',sans-serif",fontSize:20,fontWeight:700,color:"#fff",lineHeight:1.1,marginBottom:5}}>{spot.name}</h2>
              <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:5}}>
                <span style={{background:"rgba(34,197,94,0.18)",color:"#4ade80",padding:"2px 9px",borderRadius:12,fontSize:11,fontWeight:600}}>{spot.activity}</span>
                <span style={{background:spot.difficulty==="Easy"?"rgba(34,197,94,0.12)":spot.difficulty==="Medium"?"rgba(245,158,11,0.12)":"rgba(239,68,68,0.12)",color:spot.difficulty==="Easy"?"#4ade80":spot.difficulty==="Medium"?"#fbbf24":"#f87171",padding:"2px 9px",borderRadius:12,fontSize:11,fontWeight:600}}>{spot.difficulty}</span>
                <VisibilityIcon v={spot.visibility}/>
              </div>
              <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{(spot.integrations||[]).map(s=><SourceBadge key={s} source={s}/>)}</div>
            </div>
            <button onClick={()=>setVotes(v=>v+1)} style={{background:"rgba(34,197,94,0.12)",border:"1px solid rgba(34,197,94,0.25)",borderRadius:10,padding:"6px 10px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2}}><ThumbsUp size={13} color="#4ade80"/><span style={{color:"#4ade80",fontSize:13,fontWeight:700}}>{votes}</span></button>
          </div>
        </div>
        {/* Description */}
        <p style={{fontFamily:"'Crimson Pro',serif",fontSize:16,lineHeight:1.75,color:"#9ca3af",marginBottom:14}}>{spot.desc}</p>
        {/* Spotify */}
        {spot.spotify&&<div style={{background:"rgba(29,185,84,0.07)",border:"1px solid rgba(29,185,84,0.2)",borderRadius:14,padding:"10px 14px",marginBottom:12,display:"flex",alignItems:"center",gap:10}}><Music size={16} color="#1DB954"/><div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:"#e5e7eb"}}>{spot.spotify.name}</div><div style={{fontSize:11,color:"#6b7280"}}>{spot.spotify.tracks} tracks</div></div><button style={{background:"#1DB954",border:"none",borderRadius:10,padding:"4px 12px",cursor:"pointer",color:"#000",fontSize:11,fontWeight:700}}>Play</button></div>}
        {/* Real integration links */}
        <h3 style={{fontFamily:"'Fredoka',sans-serif",fontSize:14,color:"#e5e7eb",marginBottom:8}}>🔗 Open In</h3>
        <div style={{display:"flex",gap:6,marginBottom:14,overflowX:"auto",WebkitOverflowScrolling:"touch",touchAction:"pan-x",paddingBottom:6,scrollbarWidth:"none"}}>
          <IntLink href={ext.os(spot.lat,spot.lng)} icon="🗺️" label="OS Maps"/>
          <IntLink href={ext.gmaps(spot.lat,spot.lng)} icon="🧭" label="Directions"/>
          {spot.w3w&&<IntLink href={ext.w3w(spot.w3w)} icon="📍" label="What3Words"/>}
          <IntLink href={ext.weather(spot.lat,spot.lng)} icon="🌤️" label="Weather"/>
          {port&&<IntLink href={ext.tides(port)} icon="🌊" label="Tides"/>}
          {spot.quests?.some(q=>q.cbmwc)&&<IntLink href={ext.cbmwc()} icon="🐬" label="Log Sighting"/>}
        </div>
        {/* Action buttons */}
        <div style={{display:"flex",gap:8,marginBottom:16}}>{[{e:saved?"❤️":"🤍",l:saved?"Saved":"Save",f:()=>toggleSave()},{e:"📤",l:"Share",f:()=>{}},{e:"🧭",l:"Navigate",f:()=>window.open(ext.gmaps(spot.lat,spot.lng),"_blank")}].map(a=><button key={a.l} onClick={a.f} style={{flex:1,background:"#1f2937",border:"1px solid rgba(255,255,255,0.06)",borderRadius:12,padding:"8px 0",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3}}><span style={{fontSize:16}}>{a.e}</span><span style={{fontSize:10,color:"#6b7280"}}>{a.l}</span></button>)}</div>
        {/* Stories */}
        <h3 style={{fontFamily:"'Fredoka',sans-serif",fontSize:16,color:"#e5e7eb",marginBottom:10}}>📖 Spot Stories</h3>
        {spot.stories.map((s,i)=><div key={i} style={{background:"linear-gradient(135deg,#1a1f2e,#1e2433)",border:"1px solid rgba(255,255,255,0.05)",borderLeft:"3px solid #f59e0b",borderRadius:13,padding:"12px",marginBottom:8}}>
          <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:6}}><span style={{fontSize:18}}>{s.avatar}</span><span style={{fontSize:12,color:"#6b7280",fontWeight:600}}>{s.user}</span>{s.audio&&<span style={{fontSize:10,color:"#f59e0b",background:"rgba(245,158,11,0.12)",padding:"1px 6px",borderRadius:6}}>🎙 Audio</span>}<SourceBadge source={s.source}/></div>
          <p style={{fontFamily:"'Crimson Pro',serif",fontStyle:"italic",fontSize:15,lineHeight:1.6,color:"#d1d5db"}}>"{s.text}"</p>
          {s.audio&&<div style={{marginTop:8,display:"flex",alignItems:"center",gap:8}}><button onClick={()=>setPlaying(playing===i?null:i)} style={{background:playing===i?"#22c55e":"#1f2937",border:"1px solid rgba(255,255,255,0.08)",borderRadius:14,padding:"4px 10px",cursor:"pointer",display:"flex",alignItems:"center",gap:5}}>{playing===i?<Pause size={11} color="#fff"/>:<Play size={11} color="#9ca3af"/>}<span style={{fontSize:11,color:playing===i?"#fff":"#9ca3af"}}>{playing===i?"Playing":"Listen"}</span></button><WaveBar on={playing===i}/></div>}
        </div>)}
        <button style={{width:"100%",background:"rgba(245,158,11,0.08)",border:"1px dashed rgba(245,158,11,0.3)",borderRadius:12,padding:"9px",cursor:"pointer",color:"#f59e0b",fontSize:13,fontFamily:"'Fredoka',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:5,marginBottom:16}}>🪶 Add Your Story</button>
        {/* Quests */}
        {spot.quests?.length>0&&<>
          <h3 style={{fontFamily:"'Fredoka',sans-serif",fontSize:16,color:"#e5e7eb",marginBottom:10}}>⚔️ Side Quests</h3>
          {spot.quests.map(q=>{
            const c=RARITY[q.rarity]||RARITY.common;
            return <button key={q.id} onClick={()=>onQuest(q)} style={{width:"100%",textAlign:"left",background:c.bg,border:`1px solid ${c.color}35`,borderRadius:14,padding:"12px",marginBottom:8,cursor:"pointer"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
                <div><RarityBadge rarity={q.rarity} sm/><div style={{fontFamily:"'Fredoka',sans-serif",fontSize:15,color:"#e5e7eb",marginTop:4}}>{q.name}</div></div>
                <div style={{textAlign:"right"}}><div style={{fontFamily:"'Fredoka',sans-serif",fontSize:18,color:c.text,fontWeight:700}}>{q.pts}pts</div><div style={{fontSize:10,color:"#6b7280"}}>{q.completions}/{q.attempts}</div></div>
              </div>
              <p style={{fontSize:12,color:"#9ca3af",lineHeight:1.5}}>{q.desc.slice(0,100)}…</p>
              {q.impact&&<div style={{marginTop:4,fontSize:11,color:"#4ade80"}}>🌿 {q.impact}</div>}
            </button>;
          })}
        </>}
      </div>
    </div>
  );
}

// ─── QUEST DETAIL ─────────────────────────────────────────────────────────────
function QuestDetail({ quest, onClose, onAccepted }) {
  const [accepted, setAccepted] = useState(false);
  const [savedQuests, setSavedQuests] = useStorage("lbat:quests", {});
  if (!quest) return null;
  const alreadyDone = savedQuests[quest.id];
  const c = RARITY[quest.rarity] || RARITY.common;
  const pct = Math.round((quest.completions/quest.attempts)*100);
  const grads = {legendary:"#4c1d95,#831843",epic:"#78350f,#451a03",stewardship:"#14532d,#052e16",rare:"#1e3a5f,#0c2544",common:"#14532d,#052e16"};
  return (
    <div className="fade-in" style={{position:"absolute",inset:0,zIndex:500,background:"#0d1117",overflowY:"scroll",WebkitOverflowScrolling:"touch",touchAction:"pan-y",WebkitOverflowScrolling:"touch",touchAction:"pan-y"}}>
      <div style={{background:`linear-gradient(135deg,${grads[quest.rarity]||grads.common})`,padding:"50px 20px 26px"}}>
        <button onClick={onClose} style={{position:"absolute",top:16,left:16,background:"rgba(0,0,0,0.3)",border:"none",borderRadius:20,width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><X size={18} color="#fff"/></button>
        <RarityBadge rarity={quest.rarity}/>
        <div style={{fontSize:12,color:"rgba(255,255,255,0.5)",marginTop:4,fontStyle:"italic"}}>{c.flavour}</div>
        <h1 style={{fontFamily:"'Fredoka',sans-serif",fontSize:26,fontWeight:700,color:"#fff",marginTop:8,lineHeight:1.1}}>{quest.name}</h1>
      </div>
      <div style={{padding:"20px 20px 100px"}}>
        <div style={{display:"flex",gap:12,marginBottom:20}}>
          <div style={{flex:1,background:"#1f2937",borderRadius:14,padding:"14px",display:"flex",flexDirection:"column",alignItems:"center"}}><Ring pct={pct} color={c.color}/><div style={{fontFamily:"'Fredoka',sans-serif",fontSize:18,color:"#fff",marginTop:6}}>{pct}%</div><div style={{fontSize:10,color:"#6b7280"}}>completion</div></div>
          <div style={{flex:1,display:"flex",flexDirection:"column",gap:8}}>
            <div style={{background:"#1f2937",borderRadius:14,padding:"12px",textAlign:"center"}}><div style={{fontFamily:"'Fredoka',sans-serif",fontSize:22,color:c.text,fontWeight:700}}>{c.pts}</div><div style={{fontSize:10,color:"#6b7280"}}>points</div></div>
            <div style={{background:"#1f2937",borderRadius:14,padding:"12px",textAlign:"center"}}><div style={{fontFamily:"'Fredoka',sans-serif",fontSize:17,color:"#e5e7eb"}}>{quest.completions}/{quest.attempts}</div><div style={{fontSize:10,color:"#6b7280"}}>completed</div></div>
          </div>
        </div>
        <div style={{background:"#1f2937",borderRadius:16,padding:"16px",marginBottom:16}}><h3 style={{fontFamily:"'Fredoka',sans-serif",fontSize:14,color:"#e5e7eb",marginBottom:8}}>The Challenge</h3><p style={{fontFamily:"'Crimson Pro',serif",fontStyle:"italic",fontSize:16,lineHeight:1.75,color:"#d1d5db"}}>{quest.desc}</p></div>
        {quest.impact&&<div style={{background:"rgba(22,163,74,0.08)",border:"1px solid rgba(34,197,94,0.25)",borderRadius:14,padding:"13px",marginBottom:16}}><div style={{fontFamily:"'Fredoka',sans-serif",fontSize:12,color:"#4ade80",marginBottom:4}}>🌿 Community Impact</div><p style={{fontSize:13,color:"#86efac",lineHeight:1.5}}>{quest.impact}</p></div>}
        {alreadyDone
          ?<div style={{background:"rgba(34,197,94,0.08)",border:"1px solid rgba(34,197,94,0.3)",borderRadius:18,padding:"16px",textAlign:"center",display:"flex",alignItems:"center",gap:10,justifyContent:"center"}}><span style={{fontSize:24}}>✅</span><div><div style={{fontFamily:"'Fredoka',sans-serif",fontSize:15,color:"#4ade80"}}>Already Accepted</div><div style={{fontSize:11,color:"#6b7280"}}>Accepted on {new Date(alreadyDone).toLocaleDateString("en-GB",{day:"numeric",month:"short"})}</div></div></div>
          :!accepted
          ?<button onClick={()=>{setAccepted(true);const updated={...savedQuests,[quest.id]:Date.now()};setSavedQuests(updated);if(onAccepted)onAccepted(quest);}} className={quest.rarity==="legendary"?"legendary-bg":""} style={{width:"100%",padding:"16px",background:quest.rarity==="legendary"?"":c.color,border:"none",borderRadius:18,cursor:"pointer",fontFamily:"'Fredoka',sans-serif",fontSize:19,fontWeight:700,color:"#fff"}}>{quest.rarity==="stewardship"?"🌿 Accept":"Accept Quest"} →</button>
          :<div className="pop-in" style={{background:"rgba(34,197,94,0.1)",border:"1px solid rgba(34,197,94,0.35)",borderRadius:18,padding:"24px",textAlign:"center"}}><div style={{fontSize:52,marginBottom:8}}>✅</div><div style={{fontFamily:"'Fredoka',sans-serif",fontSize:22,color:"#4ade80"}}>Quest Accepted!</div><div style={{fontSize:13,color:"#6b7280",marginTop:4}}>+{c.pts} pts saved to your profile.</div></div>
        }
      </div>
    </div>
  );
}

// ─── FOLKLORE DETAIL ──────────────────────────────────────────────────────────
function FolkloreDetail({ f, onClose }) {
  return (
    <div className="fade-in" style={{position:"absolute",inset:0,zIndex:500,background:"#0a0808",overflowY:"scroll",WebkitOverflowScrolling:"touch",touchAction:"pan-y",WebkitOverflowScrolling:"touch",touchAction:"pan-y"}}>
      <div style={{background:"linear-gradient(135deg,#1a0a0a,#2d0a0a)",padding:"56px 20px 24px",borderBottom:"1px solid rgba(239,68,68,0.18)"}}>
        <button onClick={onClose} style={{position:"absolute",top:16,left:16,background:"rgba(0,0,0,0.5)",border:"none",borderRadius:20,width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><X size={18} color="#fff"/></button>
        <SourceBadge source={f.source}/>
        <div style={{fontSize:44,marginBottom:8,marginTop:8}}>{f.emoji}</div>
        <span style={{background:"rgba(239,68,68,0.18)",color:"#f87171",padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700}}>{f.type}</span>
        <h1 style={{fontFamily:"'Fredoka',sans-serif",fontSize:22,fontWeight:700,color:"#fff",marginTop:8,lineHeight:1.2}}>{f.name}</h1>
        <div style={{fontSize:12,color:"#6b7280",marginTop:4}}>📍 {f.region}</div>
      </div>
      <div style={{padding:"22px 20px 80px"}}>
        <blockquote style={{borderLeft:"3px solid #ef4444",paddingLeft:16,marginBottom:20,fontFamily:"'Crimson Pro',serif",fontStyle:"italic",fontSize:17,lineHeight:1.7,color:"#d1d5db"}}>{f.summary}</blockquote>
        <p style={{fontFamily:"'Crimson Pro',serif",fontSize:15,lineHeight:1.85,color:"#9ca3af",marginBottom:20}}>{f.story}</p>
        <div style={{display:"flex",gap:8}}>
          {f.lat&&<a href={ext.gmaps(f.lat,f.lng)} target="_blank" rel="noopener noreferrer" style={{flex:1,background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.25)",borderRadius:16,padding:"13px",cursor:"pointer",color:"#f87171",fontFamily:"'Fredoka',sans-serif",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",gap:8,textDecoration:"none"}}><Navigation size={15}/>Navigate</a>}
          {f.lat&&<a href={ext.os(f.lat,f.lng)} target="_blank" rel="noopener noreferrer" style={{flex:1,background:"rgba(230,57,70,0.1)",border:"1px solid rgba(230,57,70,0.25)",borderRadius:16,padding:"13px",cursor:"pointer",color:"#e63946",fontFamily:"'Fredoka',sans-serif",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",gap:8,textDecoration:"none"}}>🗺️ OS Maps</a>}
        </div>
      </div>
    </div>
  );
}

// ─── ROUTE DETAIL ─────────────────────────────────────────────────────────────
function RouteDetail({ route, region, onClose }) {
  const [expandWp, setExpandWp] = useState(null);
  if (!route) return null;
  const port = route.tidePort || region.tidePort;
  const midWp = route.wp[Math.floor(route.wp.length/2)] || route.wp[0];
  const maxEl = Math.max(...route.el);
  const minEl = Math.min(...route.el);
  const elW = 340, elH = 80;
  const elPts = route.el.map((e,i)=>{
    const x=(i/(route.el.length-1))*elW;
    const y=elH-((e-minEl)/(maxEl-minEl+1))*elH*0.8-8;
    return `${x},${y}`;
  });
  const diffColor = route.diff==="Easy"?"#4ade80":route.diff==="Medium"?"#fbbf24":"#f87171";
  return (
    <div className="fade-in" style={{position:"absolute",inset:0,zIndex:500,background:"#0d1117",overflowY:"scroll",WebkitOverflowScrolling:"touch",touchAction:"pan-y",WebkitOverflowScrolling:"touch",touchAction:"pan-y"}}>
      <div style={{background:"linear-gradient(135deg,#1e3a5f,#0c2544)",padding:"52px 20px 24px"}}>
        <button onClick={onClose} style={{position:"absolute",top:16,left:16,background:"rgba(0,0,0,0.3)",border:"none",borderRadius:20,width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><X size={18} color="#fff"/></button>
        <span style={{fontSize:11,color:"rgba(96,165,250,0.7)",fontWeight:700,letterSpacing:1}}>{route.type.toUpperCase()}</span>
        <div style={{fontSize:36,marginTop:6,marginBottom:6}}>{route.emoji}</div>
        <h1 style={{fontFamily:"'Fredoka',sans-serif",fontSize:24,fontWeight:700,color:"#fff",lineHeight:1.2,marginBottom:12}}>{route.name}</h1>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {[["📏",route.dist],["⬆️",route.asc],["⏱️",route.time],["💪",route.diff]].map(([ic,v])=><div key={v} style={{background:"rgba(0,0,0,0.3)",borderRadius:10,padding:"6px 10px",display:"flex",alignItems:"center",gap:4}}><span style={{fontSize:12}}>{ic}</span><span style={{fontSize:12,color:v===route.diff?diffColor:"#e5e7eb",fontWeight:v===route.diff?700:400}}>{v}</span></div>)}
        </div>
      </div>
      <div style={{padding:"20px 20px 100px"}}>
        <p style={{fontFamily:"'Crimson Pro',serif",fontSize:15,lineHeight:1.8,color:"#9ca3af",marginBottom:18}}>{route.desc}</p>
        {/* Integration links */}
        <h3 style={{fontFamily:"'Fredoka',sans-serif",fontSize:14,color:"#e5e7eb",marginBottom:8}}>🔗 Open In</h3>
        <div style={{display:"flex",gap:6,marginBottom:18,overflowX:"auto",WebkitOverflowScrolling:"touch",touchAction:"pan-x",paddingBottom:6,scrollbarWidth:"none"}}>
          <IntLink href={ext.osRoute(route.osR)} icon="🗺️" label="Full Route OS Maps"/>
          <IntLink href={ext.gmaps(route.wp[0][0],route.wp[0][1])} icon="🧭" label="Start Directions"/>
          {route.w3s&&<IntLink href={ext.w3w(route.w3s)} icon="📍" label="Start W3W"/>}
          {route.w3e&&<IntLink href={ext.w3w(route.w3e)} icon="📍" label="End W3W"/>}
          {port&&<IntLink href={ext.tides(port)} icon="🌊" label="Tides"/>}
          <IntLink href={ext.weather(midWp[0],midWp[1])} icon="🌤️" label="Weather"/>
        </div>
        {/* Elevation profile */}
        <div style={{background:"#1f2937",borderRadius:14,padding:"14px",marginBottom:18}}>
          <div style={{fontFamily:"'Fredoka',sans-serif",fontSize:13,color:"#e5e7eb",marginBottom:10}}>📈 Elevation Profile</div>
          <svg width="100%" viewBox={`0 0 ${elW} ${elH}`} style={{overflow:"visible"}}>
            <defs>
              <linearGradient id="elGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4"/><stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05"/></linearGradient>
            </defs>
            <polyline points={elPts.join(" ")} fill="none" stroke="#3b82f6" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
            <polyline points={`0,${elH} ${elPts.join(" ")} ${elW},${elH}`} fill="url(#elGrad)"/>
            {route.el.map((e,i)=>{
              const [x,y]=elPts[i].split(",");
              return <circle key={i} cx={x} cy={y} r={3} fill="#3b82f6" stroke="#0d1117" strokeWidth={1}/>;
            })}
            <text x={2} y={elH-2} fontSize="9" fill="#6b7280" fontFamily="'DM Sans',sans-serif">{minEl}m</text>
            <text x={2} y={12} fontSize="9" fill="#6b7280" fontFamily="'DM Sans',sans-serif">{maxEl}m</text>
          </svg>
        </div>
        {/* Waypoints */}
        <h3 style={{fontFamily:"'Fredoka',sans-serif",fontSize:14,color:"#e5e7eb",marginBottom:10}}>📍 Waypoints</h3>
        {route.wp.map((wp,i)=>(
          <div key={i} style={{background:"#1f2937",borderRadius:12,padding:"12px",marginBottom:8}}>
            <button onClick={()=>setExpandWp(expandWp===i?null:i)} style={{width:"100%",background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:10,textAlign:"left"}}>
              <div style={{width:26,height:26,borderRadius:"50%",background:"rgba(59,130,246,0.2)",border:"1px solid #3b82f6",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Fredoka',sans-serif",fontSize:12,color:"#60a5fa",fontWeight:700,flexShrink:0}}>{i+1}</div>
              <div style={{flex:1,fontFamily:"'Fredoka',sans-serif",fontSize:13,color:"#e5e7eb"}}>{route.wpN[i]||`Waypoint ${i+1}`}</div>
              <ChevronRight size={14} color="#4b5563" style={{transform:expandWp===i?"rotate(90deg)":"none",transition:"transform .2s"}}/>
            </button>
            {expandWp===i&&<div style={{marginTop:10,display:"flex",gap:6,paddingLeft:36}}>
              <IntLink href={ext.os(wp[0],wp[1])} icon="🗺️" label="OS Maps"/>
              <IntLink href={ext.gmaps(wp[0],wp[1])} icon="🧭" label="Directions"/>
            </div>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MOOD FINDER ──────────────────────────────────────────────────────────────
function MoodFinder({ region, onClose }) {
  const [step, setStep] = useState(1);
  const [mood, setMood] = useState(null);
  const [time, setTime] = useState(null);
  const moods = [
    {e:"⚡",t:"Get my heart racing",d:"Rapids, big waves, cliff paths",acts:["Wild Swimming","Surfing","Kayaking","Coasteering"]},
    {e:"🌿",t:"Find some peace",d:"Hidden coves, forest, stillness",acts:["Wildlife","Hiking"]},
    {e:"🔭",t:"Watch something wild",d:"Dolphins, seals, puffins, birds",acts:["Wildlife"]},
    {e:"⛰️",t:"Push myself",d:"Hard climbs, long paths, cold water",acts:["Hiking","Wild Swimming","Kayaking"]},
    {e:"🌱",t:"Give something back",d:"Beach cleans, wildlife surveys",acts:[],stewardship:true},
    {e:"📜",t:"Discover old stories",d:"Folklore, legends, ancient sites",acts:[],folklore:true},
    {e:"👥",t:"Something with mates",d:"Surf, group swims, evening hikes",acts:["Surfing","Wild Swimming","Coasteering"]},
    {e:"🎨",t:"Find the light",d:"Golden hour, clifftops, mist",acts:["Wildlife","Hiking"]},
  ];
  const results = mood?.acts?.length > 0 ? region.spots.filter(s=>mood.acts.includes(s.activity)).slice(0,5) : [];
  const folkResults = mood?.folklore ? region.folklore.slice(0,3) : [];
  const stewResults = mood?.stewardship ? region.spots.flatMap(s=>(s.quests||[]).filter(q=>q.rarity==="stewardship").map(q=>({...q,spotName:s.name,spotEmoji:s.emoji}))).slice(0,3) : [];
  return (
    <div className="fade-in" style={{position:"absolute",inset:0,zIndex:500,background:"#0d1117",overflowY:"scroll",WebkitOverflowScrolling:"touch",touchAction:"pan-y",WebkitOverflowScrolling:"touch",touchAction:"pan-y"}}>
      <div style={{background:"linear-gradient(135deg,#0d1117,#1a1f35)",padding:"52px 20px 20px"}}>
        <button onClick={onClose} style={{position:"absolute",top:16,right:16,background:"rgba(255,255,255,0.05)",border:"none",borderRadius:20,width:34,height:34,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><X size={16} color="#6b7280"/></button>
        <div style={{fontSize:11,color:"#6b7280",letterSpacing:2,fontWeight:700,marginBottom:5}}>{step===3?"YOUR SPOTS":`STEP ${step} OF 2`}</div>
        <h1 style={{fontFamily:"'Fredoka',sans-serif",fontSize:24,fontWeight:700,color:"#fff"}}>{step===1?"What are you up for?":step===2?"How long have you got?":"Here you go."}</h1>
        {step===3&&<p style={{fontSize:12,color:"#6b7280",marginTop:4}}>Searching {region.emoji} {region.name}</p>}
      </div>
      <div style={{padding:"16px 16px 80px"}}>
        {step===1&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>{moods.map(m=><button key={m.t} onClick={()=>{setMood(m);setStep(2);}} style={{background:"#1f2937",border:"1px solid rgba(255,255,255,0.06)",borderRadius:16,padding:"14px 12px",cursor:"pointer",textAlign:"left"}}><div style={{fontSize:24,marginBottom:5}}>{m.e}</div><div style={{fontFamily:"'Fredoka',sans-serif",fontSize:13,color:"#e5e7eb",marginBottom:3,lineHeight:1.2}}>{m.t}</div><div style={{fontSize:11,color:"#6b7280",lineHeight:1.3}}>{m.d}</div></button>)}</div>}
        {step===2&&<><div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:14}}>{["A couple of hours","Half a day","A full day","A weekend"].map(t=><button key={t} onClick={()=>setTime(t)} style={{background:time===t?"rgba(34,197,94,0.12)":"#1f2937",border:time===t?"1px solid #22c55e":"1px solid rgba(255,255,255,0.06)",borderRadius:14,padding:"14px 18px",cursor:"pointer",textAlign:"left",fontFamily:"'Fredoka',sans-serif",fontSize:15,color:time===t?"#4ade80":"#e5e7eb"}}>{t}</button>)}</div><button onClick={()=>time&&setStep(3)} style={{width:"100%",padding:"14px",background:time?"linear-gradient(135deg,#22c55e,#16a34a)":"#1f2937",border:"none",borderRadius:16,cursor:time?"pointer":"default",fontFamily:"'Fredoka',sans-serif",fontSize:17,fontWeight:700,color:time?"#fff":"#4b5563"}}>Find Adventures ✨</button></>}
        {step===3&&<>
          {results.map(s=><div key={s.id} style={{background:"#1f2937",border:"1px solid rgba(255,255,255,0.05)",borderRadius:16,padding:"13px",marginBottom:8,display:"flex",alignItems:"center",gap:12}}><span style={{fontSize:26}}>{s.emoji}</span><div style={{flex:1}}><div style={{fontFamily:"'Fredoka',sans-serif",fontSize:15,color:"#e5e7eb"}}>{s.name}</div><span style={{background:"rgba(34,197,94,0.12)",color:"#4ade80",padding:"2px 8px",borderRadius:8,fontSize:10}}>{s.activity}</span></div><div style={{display:"flex",alignItems:"center",gap:3}}><ThumbsUp size={11} color="#4ade80"/><span style={{fontSize:12,color:"#4ade80",fontWeight:700}}>{s.votes}</span></div></div>)}
          {folkResults.map(f=><div key={f.id} style={{background:"#1a0808",border:"1px solid rgba(239,68,68,0.18)",borderRadius:16,padding:"13px",marginBottom:8,display:"flex",alignItems:"center",gap:12}}><span style={{fontSize:26}}>{f.emoji}</span><div><div style={{fontFamily:"'Fredoka',sans-serif",fontSize:14,color:"#e5e7eb"}}>{f.name}</div><span style={{fontSize:10,color:"#f87171",background:"rgba(239,68,68,0.12)",padding:"1px 7px",borderRadius:8}}>{f.type}</span></div></div>)}
          {stewResults.map(q=><div key={q.id} style={{background:"rgba(22,163,74,0.08)",border:"1px solid rgba(34,197,94,0.2)",borderRadius:16,padding:"13px",marginBottom:8,display:"flex",alignItems:"center",gap:12}}><span style={{fontSize:26}}>{q.spotEmoji}</span><div><div style={{fontFamily:"'Fredoka',sans-serif",fontSize:14,color:"#4ade80"}}>{q.name}</div><div style={{fontSize:11,color:"#6b7280"}}>{q.spotName}</div>{q.impact&&<div style={{fontSize:10,color:"#86efac",marginTop:2}}>🌿 {q.impact}</div>}</div></div>)}
          {results.length===0&&folkResults.length===0&&stewResults.length===0&&<div style={{background:"#1f2937",borderRadius:16,padding:"20px",textAlign:"center",color:"#6b7280"}}><div style={{fontSize:32,marginBottom:8}}>🗺️</div>Try a different mood.</div>}
          <button onClick={()=>{setStep(1);setMood(null);setTime(null);}} style={{width:"100%",background:"#1f2937",border:"1px solid rgba(255,255,255,0.06)",borderRadius:14,padding:"12px",cursor:"pointer",color:"#9ca3af",fontFamily:"'Fredoka',sans-serif",fontSize:14,marginTop:6}}>Try a Different Mood</button>
        </>}
      </div>
    </div>
  );
}

// ─── ADD SPOT FLOW ────────────────────────────────────────────────────────────
function AddSpotFlow({ onClose }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({name:"",activity:"Wild Swimming",desc:"",seasonal:false,visibility:"public",story:"",questName:"",questRarity:"common",isQuest:false});
  const [complete, setComplete] = useState(false);
  const TOTAL = 6;
  const acts = ["Wild Swimming","Hiking","Surfing","Wildlife","Kayaking","Coasteering","Photography","Foraging","Chill Spot"];
  const vis = [{v:"public",e:"🌍",l:"Public",d:"Anyone can discover this"},{v:"friends",e:"👥",l:"Friends",d:"Only your friends see it"},{v:"crew",e:"🔒",l:"My Crew",d:"Private — your crew only"}];
  if (complete) return (
    <div className="fade-in" style={{position:"absolute",inset:0,zIndex:600,background:"#0d1117",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24}}>
      <div className="celebration" style={{fontSize:72,marginBottom:16}}>📍</div>
      <h1 style={{fontFamily:"'Fredoka',sans-serif",fontSize:28,color:"#fff",textAlign:"center",marginBottom:8}}>Spot Shared!</h1>
      <p style={{color:"#6b7280",textAlign:"center",marginBottom:24,lineHeight:1.6}}>Your spot is on the map. Cheers.</p>
      <div style={{display:"flex",flexDirection:"column",gap:8,width:"100%",maxWidth:300}}>
        {[["📍 Spot Shared","+25pts"],["📖 Story Added","+15pts"]].map(([l,p])=><div key={l} className="pop-in" style={{background:"rgba(34,197,94,0.12)",border:"1px solid rgba(34,197,94,0.25)",borderRadius:14,padding:"12px 16px",display:"flex",justifyContent:"space-between"}}><span style={{color:"#e5e7eb",fontSize:14}}>{l}</span><span style={{color:"#4ade80",fontFamily:"'Fredoka',sans-serif",fontSize:16,fontWeight:700}}>{p}</span></div>)}
      </div>
      <button onClick={onClose} style={{marginTop:28,background:"#22c55e",border:"none",borderRadius:16,padding:"14px 36px",cursor:"pointer",fontFamily:"'Fredoka',sans-serif",fontSize:18,fontWeight:700,color:"#fff"}}>Back to Map</button>
    </div>
  );
  return (
    <div className="fade-in" style={{position:"absolute",inset:0,zIndex:600,background:"#0d1117",overflowY:"scroll",WebkitOverflowScrolling:"touch",touchAction:"pan-y"}}>
      <div style={{background:"linear-gradient(135deg,#0d1117,#1a2035)",padding:"52px 20px 20px",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
        <button onClick={onClose} style={{position:"absolute",top:16,left:16,background:"rgba(255,255,255,0.05)",border:"none",borderRadius:20,width:34,height:34,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><X size={16} color="#6b7280"/></button>
        <div style={{display:"flex",gap:4,marginBottom:14}}>{Array.from({length:TOTAL},(_,i)=><div key={i} style={{flex:1,height:3,borderRadius:2,background:i<step?"#22c55e":"#1f2937",transition:"background .3s"}}/>)}</div>
        <div style={{fontSize:11,color:"#6b7280",letterSpacing:2,fontWeight:700,marginBottom:4}}>I KNOW A SPOT · STEP {step} OF {TOTAL}</div>
        <h1 style={{fontFamily:"'Fredoka',sans-serif",fontSize:22,color:"#fff"}}>{["Drop a Pin","What's it for?","Tell the Story","Your Visibility","Seasonal Secret?","Add a Quest?"][step-1]}</h1>
      </div>
      <div style={{padding:"20px 20px 100px"}}>
        {step===1&&<div style={{background:"linear-gradient(135deg,#1e2d3d,#0f1f30)",borderRadius:18,height:220,display:"flex",alignItems:"center",justifyContent:"center",border:"2px dashed rgba(34,197,94,0.3)",cursor:"pointer",flexDirection:"column",gap:12}}><div className="float" style={{fontSize:48}}>📍</div><div style={{fontFamily:"'Fredoka',sans-serif",fontSize:16,color:"#4ade80"}}>Tap to drop your pin</div><div style={{fontSize:12,color:"#6b7280"}}>or use your current location</div><button style={{background:"rgba(34,197,94,0.12)",border:"1px solid rgba(34,197,94,0.3)",borderRadius:12,padding:"8px 18px",cursor:"pointer",color:"#4ade80",fontSize:13,marginTop:4}}>📍 Use My Location</button></div>}
        {step===2&&<div><input placeholder="Give your spot a name..." value={form.name} onChange={e=>setForm({...form,name:e.target.value})} style={{width:"100%",background:"#1f2937",border:"1px solid rgba(255,255,255,0.08)",borderRadius:14,padding:"13px 16px",color:"#e5e7eb",fontSize:15,marginBottom:14,outline:"none"}}/><div style={{fontSize:12,color:"#6b7280",marginBottom:8,fontWeight:600}}>Activity type</div><div style={{display:"flex",flexWrap:"wrap",gap:7,marginBottom:14}}>{acts.map(a=><button key={a} onClick={()=>setForm({...form,activity:a})} style={{padding:"6px 12px",borderRadius:14,background:form.activity===a?"rgba(34,197,94,0.18)":"#1f2937",color:form.activity===a?"#4ade80":"#9ca3af",border:form.activity===a?"1px solid rgba(34,197,94,0.4)":"1px solid rgba(255,255,255,0.07)",fontSize:12,cursor:"pointer"}}>{a}</button>)}</div><textarea placeholder="Describe it. What makes this place special?" value={form.desc} onChange={e=>setForm({...form,desc:e.target.value})} style={{width:"100%",background:"#1f2937",border:"1px solid rgba(255,255,255,0.08)",borderRadius:14,padding:"13px 16px",color:"#e5e7eb",fontSize:14,fontFamily:"'Crimson Pro',serif",minHeight:100,resize:"none",outline:"none",lineHeight:1.6}}/></div>}
        {step===3&&<div><div style={{background:"linear-gradient(135deg,#1a1f2e,#1e2433)",borderRadius:16,padding:"16px",marginBottom:14,border:"1px solid rgba(245,158,11,0.15)"}}><div style={{fontFamily:"'Fredoka',sans-serif",fontSize:14,color:"#f59e0b",marginBottom:6}}>🪶 Your story with this place</div><p style={{fontSize:12,color:"#6b7280",fontStyle:"italic",marginBottom:10}}>Why does this place matter to you? A memory, a feeling, a secret.</p><textarea placeholder='"My granddad brought me here when I was seven..."' value={form.story} onChange={e=>setForm({...form,story:e.target.value})} style={{width:"100%",background:"rgba(0,0,0,0.3)",border:"1px solid rgba(245,158,11,0.2)",borderRadius:12,padding:"12px",color:"#e5e7eb",fontSize:14,fontFamily:"'Crimson Pro',serif",minHeight:120,resize:"none",outline:"none",lineHeight:1.7}}/></div><button style={{width:"100%",background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:14,padding:"13px",cursor:"pointer",color:"#f87171",fontFamily:"'Fredoka',sans-serif",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><Mic size={15}/>Record a Voice Story Instead</button></div>}
        {step===4&&<div><div style={{fontSize:12,color:"#6b7280",marginBottom:12,fontWeight:600}}>Who can find this spot?</div>{vis.map(o=><button key={o.v} onClick={()=>setForm({...form,visibility:o.v})} style={{width:"100%",background:form.visibility===o.v?"rgba(34,197,94,0.1)":"#1f2937",border:form.visibility===o.v?"1px solid rgba(34,197,94,0.4)":"1px solid rgba(255,255,255,0.07)",borderRadius:16,padding:"16px",marginBottom:10,cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:12}}><span style={{fontSize:28}}>{o.e}</span><div><div style={{fontFamily:"'Fredoka',sans-serif",fontSize:16,color:form.visibility===o.v?"#4ade80":"#e5e7eb"}}>{o.l}</div><div style={{fontSize:12,color:"#6b7280"}}>{o.d}</div></div>{form.visibility===o.v&&<Check size={18} color="#4ade80" style={{marginLeft:"auto"}}/>}</button>)}</div>}
        {step===5&&<div><div style={{background:"linear-gradient(135deg,#1a1a2e,#2d1b69)",border:"1px solid rgba(251,191,36,0.25)",borderRadius:18,padding:"18px",marginBottom:16,display:"flex",alignItems:"center",gap:12}}><div className="float" style={{fontSize:36}}>✨</div><div><div style={{fontFamily:"'Fredoka',sans-serif",fontSize:16,color:"#fbbf24",marginBottom:4}}>Is this a Seasonal Secret?</div><div style={{fontSize:12,color:"#9ca3af",lineHeight:1.5}}>Seasonal spots only appear during their season — make it feel magical.</div></div></div><button onClick={()=>setForm({...form,seasonal:!form.seasonal})} style={{width:"100%",background:form.seasonal?"rgba(251,191,36,0.12)":"#1f2937",border:form.seasonal?"1px solid rgba(251,191,36,0.4)":"1px solid rgba(255,255,255,0.07)",borderRadius:16,padding:"14px",cursor:"pointer",fontFamily:"'Fredoka',sans-serif",fontSize:16,color:form.seasonal?"#fbbf24":"#e5e7eb",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>{form.seasonal?<><Check size={16}/>Yes, it's seasonal!</>:<>Mark as Seasonal Secret</>}</button></div>}
        {step===6&&<div><div style={{background:"linear-gradient(135deg,#1e2d1a,#0f2218)",border:"1px solid rgba(34,197,94,0.2)",borderRadius:18,padding:"18px",marginBottom:16}}><div style={{fontFamily:"'Fredoka',sans-serif",fontSize:16,color:"#4ade80",marginBottom:4}}>⚔️ Add a Side Quest?</div><div style={{fontSize:12,color:"#9ca3af",lineHeight:1.5}}>Create a challenge for others. Dare them to do something unforgettable.</div></div><button onClick={()=>setForm({...form,isQuest:!form.isQuest})} style={{width:"100%",background:form.isQuest?"rgba(34,197,94,0.12)":"#1f2937",border:form.isQuest?"1px solid rgba(34,197,94,0.4)":"1px solid rgba(255,255,255,0.07)",borderRadius:16,padding:"14px",marginBottom:14,cursor:"pointer",fontFamily:"'Fredoka',sans-serif",fontSize:16,color:form.isQuest?"#4ade80":"#e5e7eb",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>{form.isQuest?<><Check size={16}/>Yes, I'll add a quest</>:<>Add a Side Quest +50pts</>}</button></div>}
        <div style={{display:"flex",gap:10,marginTop:20}}>
          {step>1&&<button onClick={()=>setStep(s=>s-1)} style={{flex:1,background:"#1f2937",border:"1px solid rgba(255,255,255,0.07)",borderRadius:16,padding:"14px",cursor:"pointer",color:"#9ca3af",fontFamily:"'Fredoka',sans-serif",fontSize:16}}>← Back</button>}
          {step<TOTAL?<button onClick={()=>setStep(s=>s+1)} style={{flex:2,background:"linear-gradient(135deg,#22c55e,#16a34a)",border:"none",borderRadius:16,padding:"14px",cursor:"pointer",fontFamily:"'Fredoka',sans-serif",fontSize:17,fontWeight:700,color:"#fff"}}>Next →</button>:<button onClick={()=>setComplete(true)} style={{flex:2,background:"linear-gradient(135deg,#f59e0b,#ef4444)",border:"none",borderRadius:16,padding:"14px",cursor:"pointer",fontFamily:"'Fredoka',sans-serif",fontSize:17,fontWeight:700,color:"#fff"}}>Share My Spot 📍</button>}
        </div>
      </div>
    </div>
  );
}

// ─── EXPLORE TAB ─────────────────────────────────────────────────────────────
function ExploreTab({ region, onSpot, onFolklore, onContent, onMood }) {
  const seasonal = region.spots.filter(s => s.seasonal && s.daysLeft);
  const stewardshipQuests = region.spots.flatMap(s=>(s.quests||[]).filter(q=>q.rarity==="stewardship").map(q=>({...q,spotName:s.name,spotEmoji:s.emoji})));
  const stories = region.spots.flatMap(s=>s.stories.map(st=>({...st,spotName:s.name,spotEmoji:s.emoji}))).slice(0,4);
  return (
    <div style={{overflowY:"auto",WebkitOverflowScrolling:"touch",touchAction:"pan-y",height:"100%",paddingBottom:80}}>
      {/* Search */}
      <div style={{padding:"52px 16px 0"}}><div style={{background:"#1f2937",borderRadius:14,padding:"11px 14px",display:"flex",gap:8,alignItems:"center",border:"1px solid rgba(255,255,255,0.06)",marginBottom:14}}><Search size={15} color="#6b7280"/><span style={{color:"#4b5563",fontSize:14}}>Search {region.name}...</span></div></div>
      {/* Mood finder CTA */}
      <div style={{padding:"0 16px 14px"}}><button onClick={onMood} style={{width:"100%",background:"linear-gradient(135deg,#1a1f35,#2d1a3d)",border:"1px solid rgba(245,158,11,0.25)",borderRadius:18,padding:"16px",cursor:"pointer",textAlign:"left"}}><div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}><Sparkles size={18} color="#f59e0b"/><span style={{fontFamily:"'Fredoka',sans-serif",fontSize:18,color:"#fff",fontWeight:600}}>What are you up for?</span></div><p style={{fontSize:13,color:"#9ca3af"}}>Tell us your mood. We'll find the right spot.</p><div style={{marginTop:8,color:"#f59e0b",fontSize:13,fontWeight:700}}>Find My Adventure →</div></button></div>
      {/* Seasonal */}
      {seasonal.length>0&&<div style={{marginBottom:20}}><div style={{padding:"0 16px 10px",display:"flex",alignItems:"center",gap:8}}><span style={{fontFamily:"'Fredoka',sans-serif",fontSize:18,color:"#e5e7eb"}}>✨ Seasonal Secrets</span><span style={{fontSize:10,background:"rgba(251,191,36,0.15)",color:"#fbbf24",padding:"2px 8px",borderRadius:20,fontWeight:700}}>Live now</span></div><div style={{display:"flex",gap:12,overflowX:"auto",padding:"0 16px"}}>{seasonal.map(s=><button key={s.id} onClick={()=>onSpot(s)} style={{flexShrink:0,width:190,background:"linear-gradient(135deg,#1a1a2e,#2d1b69)",border:"1px solid rgba(251,191,36,0.35)",borderRadius:18,padding:"15px",cursor:"pointer",textAlign:"left"}}><div style={{fontSize:30,marginBottom:6}}>{s.emoji}</div><div style={{fontFamily:"'Fredoka',sans-serif",fontSize:14,color:"#fbbf24",marginBottom:3}}>{s.seasonName}</div><div style={{fontFamily:"'Fredoka',sans-serif",fontSize:13,color:"#fff",marginBottom:6}}>{s.name}</div><div style={{fontSize:11,color:"#f59e0b"}}>⏳ {s.daysLeft} days left</div></button>)}</div></div>}
      {/* Routes */}
      {region.routes.length>0&&<div style={{marginBottom:20}}><div style={{padding:"0 16px 10px",fontFamily:"'Fredoka',sans-serif",fontSize:18,color:"#e5e7eb"}}>🗺️ Routes</div><div style={{display:"flex",gap:12,overflowX:"auto",padding:"0 16px"}}>{region.routes.map(r=><button key={r.id} onClick={()=>onContent({type:"route",isRoute:true,route:r})} style={{flexShrink:0,width:200,background:"linear-gradient(135deg,#1e3a5f,#0c2544)",border:"1px solid rgba(59,130,246,0.3)",borderRadius:18,padding:"15px",cursor:"pointer",textAlign:"left"}}><div style={{fontSize:28,marginBottom:5}}>{r.emoji}</div><div style={{fontFamily:"'Fredoka',sans-serif",fontSize:14,color:"#60a5fa",marginBottom:4}}>{r.name}</div><div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{[r.dist,r.time,r.diff].map(v=><span key={v} style={{fontSize:10,color:"#6b7280"}}>{v}</span>)}</div></button>)}</div></div>}
      {/* Folklore */}
      <div style={{marginBottom:20}}><div style={{padding:"0 16px 10px",fontFamily:"'Fredoka',sans-serif",fontSize:18,color:"#e5e7eb"}}>👻 {region.name} Folklore</div><div style={{display:"flex",gap:12,overflowX:"auto",padding:"0 16px"}}>{region.folklore.map(f=><button key={f.id} onClick={()=>onFolklore(f)} style={{flexShrink:0,width:180,background:"#1a0808",border:"1px solid rgba(239,68,68,0.22)",borderRadius:18,padding:"14px",cursor:"pointer",textAlign:"left"}}><div style={{fontSize:28,marginBottom:5}}>{f.emoji}</div><span style={{background:"rgba(239,68,68,0.12)",color:"#f87171",padding:"2px 7px",borderRadius:8,fontSize:10}}>{f.type}</span><div style={{fontFamily:"'Fredoka',sans-serif",fontSize:13,color:"#e5e7eb",margin:"5px 0 2px",lineHeight:1.2}}>{f.name}</div><div style={{fontSize:11,color:"#6b7280"}}>{f.region}</div></button>)}</div></div>
      {/* Stewardship */}
      {stewardshipQuests.length>0&&<div style={{margin:"0 16px 20px",background:"linear-gradient(135deg,#0f2218,#052e16)",border:"1px solid rgba(34,197,94,0.2)",borderRadius:18,padding:"16px"}}><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}><Leaf size={16} color="#4ade80"/><span style={{fontFamily:"'Fredoka',sans-serif",fontSize:16,color:"#4ade80"}}>Stewardship Corner</span></div><div style={{display:"flex",gap:8,overflowX:"auto",marginBottom:12}}>{stewardshipQuests.map(q=><div key={q.id} style={{flexShrink:0,width:160,background:"rgba(0,0,0,0.3)",borderRadius:13,padding:"11px"}}><div style={{fontSize:20,marginBottom:4}}>{q.spotEmoji}</div><div style={{fontFamily:"'Fredoka',sans-serif",fontSize:12,color:"#4ade80",marginBottom:2}}>{q.name}</div><div style={{fontSize:11,color:"#6b7280"}}>{q.spotName}</div>{q.impact&&<div style={{fontSize:10,color:"#86efac",marginTop:4}}>🌿 {q.impact}</div>}</div>)}</div></div>}
      {/* Stories from trail */}
      <div style={{marginBottom:20}}><div style={{padding:"0 16px 10px",fontFamily:"'Fredoka',sans-serif",fontSize:18,color:"#e5e7eb"}}>🪶 Stories from the Trail</div>{stories.map((s,i)=><div key={i} style={{margin:"0 16px 10px",background:"linear-gradient(135deg,#1a1f2e,#1e2433)",border:"1px solid rgba(255,255,255,0.05)",borderLeft:"3px solid #f59e0b",borderRadius:14,padding:"14px"}}><div style={{display:"flex",alignItems:"center",gap:7,marginBottom:8}}><span style={{fontSize:18}}>{s.avatar}</span><div style={{flex:1}}><div style={{fontSize:12,color:"#6b7280",fontWeight:600}}>{s.user} · {s.spotEmoji} {s.spotName}</div></div>{s.audio&&<button style={{background:"rgba(245,158,11,0.12)",border:"1px solid rgba(245,158,11,0.25)",borderRadius:10,padding:"4px 8px",cursor:"pointer",color:"#f59e0b",fontSize:11,display:"flex",alignItems:"center",gap:4}}><Play size={10}/>Listen</button>}</div><p style={{fontFamily:"'Crimson Pro',serif",fontStyle:"italic",fontSize:15,lineHeight:1.6,color:"#d1d5db"}}>"{s.text}"</p></div>)}</div>
      {/* Top spots */}
      <div style={{padding:"0 16px"}}><div style={{fontFamily:"'Fredoka',sans-serif",fontSize:18,color:"#e5e7eb",marginBottom:12}}>🔥 Top Spots Right Now</div>{[...region.spots].sort((a,b)=>b.votes-a.votes).map(s=><button key={s.id} onClick={()=>onSpot(s)} style={{width:"100%",background:"#1f2937",border:"1px solid rgba(255,255,255,0.05)",borderRadius:16,padding:"12px",marginBottom:8,cursor:"pointer",display:"flex",alignItems:"center",gap:12,textAlign:"left"}}><div style={{fontSize:26}}>{s.emoji}</div><div style={{flex:1}}><div style={{fontFamily:"'Fredoka',sans-serif",fontSize:15,color:"#e5e7eb"}}>{s.name}</div><VisibilityIcon v={s.visibility}/></div><div style={{display:"flex",alignItems:"center",gap:4}}><ThumbsUp size={12} color="#4ade80"/><span style={{fontSize:13,color:"#4ade80",fontWeight:700}}>{s.votes}</span></div></button>)}</div>
    </div>
  );
}

// ─── CONTENT TAB ──────────────────────────────────────────────────────────────
function ContentTab({ region, onContent }) {
  const [filter, setFilter] = useState("All");
  const filtered = filter==="All" ? region.content : region.content.filter(c=>c.type===filter.toLowerCase());
  return (
    <div style={{overflowY:"auto",WebkitOverflowScrolling:"touch",touchAction:"pan-y",height:"100%",paddingBottom:80}}>
      <div style={{padding:"52px 16px 0"}}>
        <h1 style={{fontFamily:"'Fredoka',sans-serif",fontSize:22,color:"#fff",marginBottom:4}}>📖 Stories & Guides</h1>
        <p style={{fontSize:13,color:"#6b7280",marginBottom:14,lineHeight:1.5}}>Local knowledge, trail stories, and guides for {region.name}.</p>
        <div style={{display:"flex",gap:7,overflowX:"auto",marginBottom:16}}>{["All","Guide","Story","Route"].map(t=><button key={t} onClick={()=>setFilter(t)} style={{flexShrink:0,padding:"5px 14px",borderRadius:18,background:filter===t?"#22c55e":"#1f2937",color:filter===t?"#fff":"#9ca3af",border:filter===t?"none":"1px solid rgba(255,255,255,0.07)",fontSize:12,fontWeight:600,cursor:"pointer"}}>{t}</button>)}</div>
      </div>
      {filter==="All"&&region.content[6]&&<div style={{margin:"0 16px 18px",background:"linear-gradient(135deg,#1a2035,#2d1b69)",border:"1px solid rgba(245,158,11,0.2)",borderRadius:18,padding:"18px"}}><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}><Sparkles size={14} color="#f59e0b"/><span style={{fontSize:11,color:"#f59e0b",fontWeight:700}}>FEATURED</span></div><div style={{fontSize:36,marginBottom:8}}>{region.content[6].emoji}</div><ContentTypeBadge type={region.content[6].type}/><div style={{fontFamily:"'Fredoka',sans-serif",fontSize:18,color:"#fff",margin:"8px 0 5px",lineHeight:1.2}}>{region.content[6].title}</div><p style={{fontSize:13,color:"#9ca3af",lineHeight:1.5,marginBottom:10}}>{region.content[6].summary}</p><div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:16}}>{region.content[6].authorEmoji}</span><span style={{fontSize:12,color:"#6b7280"}}>{region.content[6].author} · {region.content[6].readTime}</span><SourceBadge source={region.content[6].source}/></div><button onClick={()=>onContent(region.content[6])} style={{marginTop:12,background:"rgba(245,158,11,0.15)",border:"1px solid rgba(245,158,11,0.3)",borderRadius:12,padding:"10px 18px",cursor:"pointer",color:"#fbbf24",fontFamily:"'Fredoka',sans-serif",fontSize:14}}>Read →</button></div>}
      <div style={{padding:"0 16px"}}>{filtered.map(c=><button key={c.id} onClick={()=>onContent(c)} style={{width:"100%",textAlign:"left",background:"#1f2937",border:"1px solid rgba(255,255,255,0.05)",borderRadius:16,padding:"14px",marginBottom:10,cursor:"pointer"}}><div style={{display:"flex",alignItems:"flex-start",gap:12}}><div style={{fontSize:32,flexShrink:0}}>{c.emoji}</div><div style={{flex:1}}><div style={{display:"flex",gap:6,alignItems:"center",marginBottom:5,flexWrap:"wrap"}}><ContentTypeBadge type={c.type}/><SourceBadge source={c.source}/></div><div style={{fontFamily:"'Fredoka',sans-serif",fontSize:15,color:"#e5e7eb",marginBottom:4,lineHeight:1.3}}>{c.title}</div><p style={{fontSize:12,color:"#6b7280",lineHeight:1.5,marginBottom:6}}>{c.summary.slice(0,100)}…</p><div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:14}}>{c.authorEmoji}</span><span style={{fontSize:11,color:"#6b7280"}}>{c.author}</span><Clock size={10} color="#4b5563"/><span style={{fontSize:11,color:"#4b5563"}}>{c.readTime}</span></div></div></div></button>)}</div>
    </div>
  );
}

// ─── CONTENT DETAIL ───────────────────────────────────────────────────────────
function ContentDetail({ content, onClose }) {
  if (!content) return null;
  return (
    <div className="fade-in" style={{position:"absolute",inset:0,zIndex:500,background:"#0d1117",overflowY:"scroll",WebkitOverflowScrolling:"touch",touchAction:"pan-y",WebkitOverflowScrolling:"touch",touchAction:"pan-y"}}>
      <div style={{background:"linear-gradient(135deg,#1a2035,#0d1117)",padding:"56px 20px 24px",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
        <button onClick={onClose} style={{position:"absolute",top:16,left:16,background:"rgba(255,255,255,0.05)",border:"none",borderRadius:20,width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><X size={16} color="#6b7280"/></button>
        <div style={{display:"flex",gap:6,marginBottom:8,flexWrap:"wrap"}}><ContentTypeBadge type={content.type}/><SourceBadge source={content.source}/></div>
        <div style={{fontSize:44,margin:"10px 0"}}>{content.emoji}</div>
        <h1 style={{fontFamily:"'Fredoka',sans-serif",fontSize:24,fontWeight:700,color:"#fff",lineHeight:1.2,marginBottom:8}}>{content.title}</h1>
        <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:16}}>{content.authorEmoji}</span><span style={{fontSize:13,color:"#6b7280"}}>{content.author} · {content.readTime}</span></div>
      </div>
      <div style={{padding:"22px 20px 80px"}}>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:16}}>{content.tags?.map(t=><span key={t} style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:8,padding:"3px 9px",fontSize:11,color:"#9ca3af"}}>{t}</span>)}</div>
        <blockquote style={{borderLeft:"3px solid #f59e0b",paddingLeft:16,marginBottom:20,fontFamily:"'Crimson Pro',serif",fontStyle:"italic",fontSize:17,lineHeight:1.7,color:"#d1d5db"}}>{content.summary}</blockquote>
        <p style={{fontFamily:"'Crimson Pro',serif",fontSize:16,lineHeight:1.85,color:"#9ca3af",marginBottom:20}}>{content.body}</p>
        <div style={{background:"rgba(59,130,246,0.08)",border:"1px solid rgba(59,130,246,0.2)",borderRadius:14,padding:"14px",display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:20}}>🗺️</span><div><div style={{fontSize:13,color:"#60a5fa",fontWeight:600,marginBottom:2}}>Find spots related to this guide</div><div style={{fontSize:11,color:"#6b7280"}}>Tap map markers linked to this content</div></div><ChevronRight size={16} color="#60a5fa" style={{marginLeft:"auto"}}/></div>
      </div>
    </div>
  );
}

// ─── ADVENTURE TAB ────────────────────────────────────────────────────────────
function AdventureTab({ region }) {
  const [step, setStep] = useState("form");
  const [form, setForm] = useState({duration:"Half Day",acts:[],stewardship:false,folklore:false});
  const acts2 = ["Wild Swimming","Hiking","Surfing","Wildlife","Foraging","Kayaking","Coasteering","Photography","History"];
  if (step==="result") {
    const picked = region.spots.filter(s=>form.acts.length===0||form.acts.includes(s.activity)).slice(0,3);
    const folkPick = form.folklore ? region.folklore.slice(0,1) : [];
    return (
      <div style={{overflowY:"auto",WebkitOverflowScrolling:"touch",touchAction:"pan-y",height:"100%",paddingBottom:80}}>
        <div style={{background:"linear-gradient(135deg,#0d1117,#1a2035)",padding:"52px 20px 20px",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
          <button onClick={()=>setStep("form")} style={{position:"absolute",top:16,left:16,background:"rgba(255,255,255,0.05)",border:"none",borderRadius:20,width:34,height:34,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><X size={16} color="#6b7280"/></button>
          <div style={{fontFamily:"'Fredoka',sans-serif",fontSize:13,color:"#f59e0b",marginBottom:4}}>YOUR ADVENTURE · {region.name.toUpperCase()}</div>
          <h1 style={{fontFamily:"'Fredoka',sans-serif",fontSize:26,fontWeight:700,color:"#fff",lineHeight:1.2}}>The {region.name} Quest</h1>
          <p style={{fontFamily:"'Crimson Pro',serif",fontStyle:"italic",fontSize:15,color:"#9ca3af",marginTop:6,lineHeight:1.6}}>A {form.duration.toLowerCase()} adventure on the edge of Wales. The sea is waiting.</p>
        </div>
        <div style={{padding:"20px 16px 0"}}>
          {picked.map((s,i)=><div key={s.id} style={{background:"#1f2937",border:"1px solid rgba(255,255,255,0.06)",borderRadius:18,padding:"16px",marginBottom:12}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}><div style={{width:28,height:28,borderRadius:"50%",background:"rgba(245,158,11,0.15)",border:"1px solid rgba(245,158,11,0.4)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Fredoka',sans-serif",fontSize:13,color:"#fbbf24",fontWeight:700}}>{i+1}</div><div style={{fontFamily:"'Fredoka',sans-serif",fontSize:16,color:"#fff"}}>{s.name}</div><span style={{fontSize:20,marginLeft:"auto"}}>{s.emoji}</span></div>
            <p style={{fontFamily:"'Crimson Pro',serif",fontStyle:"italic",fontSize:14,color:"#9ca3af",lineHeight:1.5,marginBottom:10}}>{s.desc.slice(0,120)}…</p>
            <div style={{display:"flex",gap:6}}><a href={ext.gmaps(s.lat,s.lng)} target="_blank" rel="noopener noreferrer" style={{flex:1,background:"rgba(59,130,246,0.1)",border:"1px solid rgba(59,130,246,0.25)",borderRadius:10,padding:"7px",cursor:"pointer",color:"#60a5fa",fontSize:11,fontWeight:600,textDecoration:"none",display:"flex",alignItems:"center",justifyContent:"center",gap:4}}>🧭 Directions</a>{s.w3w&&<a href={ext.w3w(s.w3w)} target="_blank" rel="noopener noreferrer" style={{flex:1,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:10,padding:"7px",cursor:"pointer",color:"#9ca3af",fontSize:11,fontWeight:600,textDecoration:"none",display:"flex",alignItems:"center",justifyContent:"center",gap:4}}>📍 W3W</a>}</div>
            {s.quests?.length>0&&<div style={{marginTop:8,background:"rgba(34,197,94,0.07)",border:"1px solid rgba(34,197,94,0.15)",borderRadius:10,padding:"8px 11px",fontSize:12,color:"#4ade80"}}>⚔️ Quest: {s.quests[0].name} · {s.quests[0].pts}pts</div>}
          </div>)}
          {folkPick.map(f=><div key={f.id} style={{background:"linear-gradient(135deg,#1a0808,#2d0a0a)",border:"1px solid rgba(239,68,68,0.25)",borderRadius:18,padding:"16px",marginBottom:12}}><div style={{fontFamily:"'Fredoka',sans-serif",fontSize:14,color:"#f87171",marginBottom:8}}>📜 Folklore Detour</div><div style={{fontSize:26,marginBottom:6}}>{f.emoji}</div><div style={{fontFamily:"'Fredoka',sans-serif",fontSize:15,color:"#e5e7eb",marginBottom:6}}>{f.name}</div><p style={{fontFamily:"'Crimson Pro',serif",fontStyle:"italic",fontSize:13,color:"#9ca3af",lineHeight:1.5,marginBottom:10}}>{f.summary}</p>{f.lat&&<a href={ext.gmaps(f.lat,f.lng)} target="_blank" rel="noopener noreferrer" style={{display:"flex",alignItems:"center",gap:6,color:"#f87171",fontSize:12,textDecoration:"none"}}>🧭 Navigate to this story</a>}</div>)}
          {form.stewardship&&<div style={{background:"linear-gradient(135deg,#0f2218,#052e16)",border:"1px solid rgba(34,197,94,0.3)",borderRadius:18,padding:"16px",marginBottom:12}}><div style={{fontFamily:"'Fredoka',sans-serif",fontSize:14,color:"#4ade80",marginBottom:6}}>🌿 Stewardship Bonus Chapter</div><p style={{fontFamily:"'Crimson Pro',serif",fontStyle:"italic",fontSize:14,color:"#86efac",lineHeight:1.5}}>"Before you leave, collect what the tide has left behind. Two bags. Twenty minutes. The bay remembers those who look after it."</p><div style={{marginTop:8,fontSize:12,color:"#4ade80"}}>+50 Guardian Points for the community</div></div>}
          {/* Nature Bingo */}
          <div style={{background:"#1f2937",border:"1px solid rgba(255,255,255,0.06)",borderRadius:18,padding:"16px",marginBottom:12}}>
            <div style={{fontFamily:"'Fredoka',sans-serif",fontSize:15,color:"#e5e7eb",marginBottom:10}}>🎯 Nature Bingo</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6}}>{["🐬 Dolphin","🦭 Seal","🐟 Jump","🌿 Forage","🌊 Dip","🪨 Rock pool","🦜 Chough","⛵ Boat","📸 Sunset"].map(b=><div key={b} style={{background:"rgba(255,255,255,0.04)",borderRadius:8,padding:"8px",textAlign:"center",fontSize:11,color:"#9ca3af",cursor:"pointer"}}>{b}</div>)}</div>
          </div>
          <button style={{width:"100%",background:"#1f2937",border:"1px solid rgba(255,255,255,0.07)",borderRadius:16,padding:"13px",cursor:"pointer",color:"#9ca3af",fontFamily:"'Fredoka',sans-serif",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:8}}><Share2 size={14}/>Share This Adventure</button>
        </div>
      </div>
    );
  }
  return (
    <div style={{overflowY:"auto",WebkitOverflowScrolling:"touch",touchAction:"pan-y",height:"100%",paddingBottom:80}}>
      <div style={{background:"linear-gradient(135deg,#0d1117,#1a2035)",padding:"52px 20px 20px",borderBottom:"1px solid rgba(255,255,255,0.05)"}}><div style={{fontFamily:"'Fredoka',sans-serif",fontSize:13,color:"#f59e0b",marginBottom:4}}>ADVENTURE BUILDER · {region.name.toUpperCase()}</div><h1 style={{fontFamily:"'Fredoka',sans-serif",fontSize:26,fontWeight:700,color:"#fff"}}>Build Me An Adventure!</h1><p style={{fontSize:13,color:"#6b7280",marginTop:5}}>Tell us what you've got. We'll make it brilliant.</p></div>
      <div style={{padding:"20px 16px"}}>
        <div style={{marginBottom:18}}><div style={{fontFamily:"'Fredoka',sans-serif",fontSize:14,color:"#e5e7eb",marginBottom:10}}>⏱ How long have you got?</div><div style={{display:"flex",gap:7,flexWrap:"wrap"}}>{["1 Hour","Half Day","Full Day","Weekend"].map(d=><button key={d} onClick={()=>setForm({...form,duration:d})} style={{padding:"8px 14px",borderRadius:14,background:form.duration===d?"rgba(245,158,11,0.15)":"#1f2937",color:form.duration===d?"#fbbf24":"#9ca3af",border:form.duration===d?"1px solid rgba(245,158,11,0.4)":"1px solid rgba(255,255,255,0.07)",fontSize:13,cursor:"pointer",fontWeight:form.duration===d?600:400}}>{d}</button>)}</div></div>
        <div style={{marginBottom:18}}><div style={{fontFamily:"'Fredoka',sans-serif",fontSize:14,color:"#e5e7eb",marginBottom:10}}>🎒 What do you love? (pick any)</div><div style={{display:"flex",flexWrap:"wrap",gap:7}}>{acts2.map(a=><button key={a} onClick={()=>setForm({...form,acts:form.acts.includes(a)?form.acts.filter(x=>x!==a):[...form.acts,a]})} style={{padding:"7px 13px",borderRadius:14,background:form.acts.includes(a)?"rgba(34,197,94,0.15)":"#1f2937",color:form.acts.includes(a)?"#4ade80":"#9ca3af",border:form.acts.includes(a)?"1px solid rgba(34,197,94,0.4)":"1px solid rgba(255,255,255,0.07)",fontSize:12,cursor:"pointer",fontWeight:form.acts.includes(a)?600:400}}>{a}</button>)}</div></div>
        <div style={{marginBottom:14}}><div style={{fontFamily:"'Fredoka',sans-serif",fontSize:14,color:"#e5e7eb",marginBottom:10}}>🌿 Include a Give-Back moment?</div><button onClick={()=>setForm({...form,stewardship:!form.stewardship})} style={{width:"100%",background:form.stewardship?"rgba(34,197,94,0.1)":"#1f2937",border:form.stewardship?"1px solid rgba(34,197,94,0.4)":"1px solid rgba(255,255,255,0.07)",borderRadius:16,padding:"13px",cursor:"pointer",fontFamily:"'Fredoka',sans-serif",fontSize:15,color:form.stewardship?"#4ade80":"#e5e7eb",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><Leaf size={16}/>{form.stewardship?"Stewardship chapter included ✓":"Add a stewardship moment"}</button></div>
        <div style={{marginBottom:22}}><div style={{fontFamily:"'Fredoka',sans-serif",fontSize:14,color:"#e5e7eb",marginBottom:10}}>📜 Add a Folklore chapter?</div><button onClick={()=>setForm({...form,folklore:!form.folklore})} style={{width:"100%",background:form.folklore?"rgba(239,68,68,0.1)":"#1f2937",border:form.folklore?"1px solid rgba(239,68,68,0.4)":"1px solid rgba(255,255,255,0.07)",borderRadius:16,padding:"13px",cursor:"pointer",fontFamily:"'Fredoka',sans-serif",fontSize:15,color:form.folklore?"#f87171":"#e5e7eb",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>👻 {form.folklore?"Folklore detour included ✓":"Weave in a local legend"}</button></div>
        <button onClick={()=>setStep("result")} style={{width:"100%",padding:"16px",background:"linear-gradient(135deg,#f59e0b,#ef4444)",border:"none",borderRadius:18,cursor:"pointer",fontFamily:"'Fredoka',sans-serif",fontSize:19,fontWeight:700,color:"#fff",boxShadow:"0 4px 20px rgba(245,158,11,0.4)"}}>Create My Adventure! ✨</button>
      </div>
    </div>
  );
}

// ─── COMMUNITY OVERLAY ────────────────────────────────────────────────────────
function CommunityOverlay({ onClose }) {
  const [tab, setTab] = useState("feed");
  return (
    <div className="fade-in" style={{position:"absolute",inset:0,zIndex:500,background:"#0d1117",overflowY:"scroll",WebkitOverflowScrolling:"touch",touchAction:"pan-y",WebkitOverflowScrolling:"touch",touchAction:"pan-y"}}>
      <div style={{background:"linear-gradient(135deg,#1a2035,#0d1117)",padding:"52px 20px 16px",borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
        <button onClick={onClose} style={{position:"absolute",top:16,left:16,background:"rgba(255,255,255,0.05)",border:"none",borderRadius:20,width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><X size={18} color="#6b7280"/></button>
        <h1 style={{fontFamily:"'Fredoka',sans-serif",fontSize:22,color:"#fff",marginBottom:12}}>👥 Community</h1>
        <div style={{display:"flex",gap:8}}>{["feed","friends","crews"].map(t=><button key={t} onClick={()=>setTab(t)} style={{flex:1,padding:"8px 0",background:tab===t?"rgba(34,197,94,0.12)":"transparent",border:tab===t?"1px solid rgba(34,197,94,0.3)":"1px solid transparent",borderRadius:10,cursor:"pointer",color:tab===t?"#4ade80":"#6b7280",fontSize:12,fontWeight:600,textTransform:"capitalize"}}>{t}</button>)}</div>
      </div>
      <div style={{padding:"16px 16px 80px"}}>
        {tab==="feed"&&<div>{FEED.map(f=><div key={f.id} style={{background:"#1f2937",border:"1px solid rgba(255,255,255,0.05)",borderRadius:16,padding:"14px",marginBottom:10}}>
          <div style={{display:"flex",alignItems:"flex-start",gap:10}}><span style={{fontSize:28}}>{f.avatar}</span><div style={{flex:1}}><span style={{fontFamily:"'Fredoka',sans-serif",fontSize:14,color:"#e5e7eb"}}>{f.name}</span><span style={{fontSize:13,color:"#9ca3af"}}> {f.action} </span><span style={{fontFamily:"'Fredoka',sans-serif",fontSize:13,color:f.rarity==="legendary"?"#a78bfa":f.rarity?"#fbbf24":"#60a5fa"}}>{f.target}</span><span style={{fontSize:12,color:"#6b7280"}}> at {f.spot}</span></div><span style={{fontSize:11,color:"#4b5563",whiteSpace:"nowrap"}}>{f.time}</span></div>
          {f.rarity&&<div style={{marginTop:8,paddingLeft:38}}><RarityBadge rarity={f.rarity} sm/></div>}
        </div>)}</div>}
        {tab==="friends"&&<div><div style={{fontFamily:"'Fredoka',sans-serif",fontSize:14,color:"#e5e7eb",marginBottom:12}}>Your Crew</div>{FRIENDS.map(f=><div key={f.id} style={{background:"#1f2937",border:"1px solid rgba(255,255,255,0.05)",borderRadius:16,padding:"13px",marginBottom:8,display:"flex",alignItems:"center",gap:12}}><div style={{position:"relative"}}><span style={{fontSize:28}}>{f.avatar}</span><div style={{position:"absolute",bottom:0,right:0,width:10,height:10,borderRadius:"50%",background:f.status==="online"?"#22c55e":"#374151",border:"2px solid #1f2937"}}/></div><div style={{flex:1}}><div style={{fontFamily:"'Fredoka',sans-serif",fontSize:15,color:"#e5e7eb"}}>{f.name}</div><div style={{fontSize:11,color:"#6b7280"}}>{f.status==="online"?`📍 ${f.location}`:f.lastSeen}</div></div><div style={{textAlign:"right"}}><div style={{fontSize:12,color:"#fbbf24",fontWeight:700}}>{f.points.toLocaleString()}</div><div style={{fontSize:10,color:"#4ade80"}}>🌿 {f.guardian}</div></div></div>)}<button style={{width:"100%",background:"rgba(59,130,246,0.08)",border:"1px dashed rgba(59,130,246,0.3)",borderRadius:14,padding:"13px",cursor:"pointer",color:"#60a5fa",fontFamily:"'Fredoka',sans-serif",fontSize:14,marginTop:4}}>+ Add Friends</button></div>}
        {tab==="crews"&&<div><div style={{fontFamily:"'Fredoka',sans-serif",fontSize:14,color:"#e5e7eb",marginBottom:12}}>My Crews</div>{CREWS.map(c=><div key={c.id} style={{background:"#1f2937",border:"1px solid rgba(255,255,255,0.05)",borderRadius:16,padding:"14px",marginBottom:8}}><div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}><span style={{fontSize:26}}>{c.emoji}</span><div style={{flex:1}}><div style={{fontFamily:"'Fredoka',sans-serif",fontSize:15,color:"#e5e7eb"}}>{c.name}</div><div style={{fontSize:12,color:"#6b7280"}}>{c.members} members · {c.desc}</div></div><span style={{background:c.private?"rgba(245,158,11,0.12)":"rgba(34,197,94,0.12)",color:c.private?"#fbbf24":"#4ade80",padding:"3px 8px",borderRadius:8,fontSize:10,fontWeight:600}}>{c.private?"🔒 Private":"🌍 Open"}</span></div><button style={{width:"100%",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:10,padding:"7px",cursor:"pointer",color:"#9ca3af",fontSize:12}}>Share a Spot with this Crew</button></div>)}<button style={{width:"100%",background:"rgba(245,158,11,0.08)",border:"1px dashed rgba(245,158,11,0.3)",borderRadius:14,padding:"13px",cursor:"pointer",color:"#f59e0b",fontFamily:"'Fredoka',sans-serif",fontSize:14,marginTop:4}}>+ Create a New Crew</button></div>}
      </div>
    </div>
  );
}

// ─── MAKERS TAB ──────────────────────────────────────────────────────────────
const MAKER_TYPES = {
  workshop: { label:"Workshop", color:"#7c3aed", bg:"rgba(124,58,237,0.12)", border:"rgba(124,58,237,0.3)", icon:"🛠️" },
  supplier: { label:"Supplier", color:"#0891b2", bg:"rgba(8,145,178,0.12)", border:"rgba(8,145,178,0.3)", icon:"🛍️" },
  gallery:  { label:"Gallery",  color:"#d97706", bg:"rgba(217,119,6,0.12)",  border:"rgba(217,119,6,0.3)",  icon:"🖼️" },
  event:    { label:"Event",    color:"#059669", bg:"rgba(5,150,105,0.12)",  border:"rgba(5,150,105,0.3)",  icon:"📅" },
};

function MakerTypeBadge({ type, sm }) {
  const cfg = MAKER_TYPES[type] || MAKER_TYPES.workshop;
  return (
    <span style={{display:"inline-flex",alignItems:"center",gap:4,background:cfg.bg,border:`1px solid ${cfg.border}`,
      borderRadius:8,padding:sm?"2px 7px":"3px 9px",fontSize:sm?9:10,fontWeight:700,color:cfg.color}}>
      {cfg.icon} {cfg.label.toUpperCase()}
    </span>
  );
}

function MakersTab({ region, onMaker }) {
  const [filter, setFilter] = useState("All");
  const filters = ["All","Workshop","Supplier","Gallery","Event"];
  const filtered = filter==="All" ? region.makers : region.makers.filter(m=>m.type===filter.toLowerCase());

  // Stats
  const workshopCount = region.makers.filter(m=>m.type==="workshop"||m.type==="event").length;
  const supplierCount = region.makers.filter(m=>m.type==="supplier").length;
  const galleryCount  = region.makers.filter(m=>m.type==="gallery").length;

  return (
    <div style={{overflowY:"auto",WebkitOverflowScrolling:"touch",touchAction:"pan-y",height:"100%",paddingBottom:80}}>
      {/* Header */}
      <div style={{background:"linear-gradient(135deg,#1a0a2e,#0d1117)",padding:"52px 16px 20px",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
          <ShoppingBag size={18} color="#7c3aed"/>
          <span style={{fontFamily:"'Fredoka',sans-serif",fontSize:13,color:"#a78bfa",fontWeight:600,letterSpacing:1}}>LOCAL MAKERS & COURSES</span>
        </div>
        <h1 style={{fontFamily:"'Fredoka',sans-serif",fontSize:24,color:"#fff",marginBottom:6,lineHeight:1.2}}>
          Craft, Create & Connect in {region.name}
        </h1>
        <p style={{fontSize:13,color:"#6b7280",lineHeight:1.5,marginBottom:16}}>
          Real local workshops, suppliers and galleries — all bookable or visitable.
        </p>
        {/* Mini stats */}
        <div style={{display:"flex",gap:8,marginBottom:16}}>
          {[
            {v:workshopCount, l:"Workshops", c:"#7c3aed"},
            {v:supplierCount, l:"Suppliers", c:"#0891b2"},
            {v:galleryCount,  l:"Galleries", c:"#d97706"},
          ].map(s=>(
            <div key={s.l} style={{flex:1,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",
              borderRadius:12,padding:"10px 8px",textAlign:"center"}}>
              <div style={{fontFamily:"'Fredoka',sans-serif",fontSize:22,color:s.c,fontWeight:700}}>{s.v}</div>
              <div style={{fontSize:10,color:"#6b7280",marginTop:2}}>{s.l}</div>
            </div>
          ))}
        </div>
        {/* Filter chips */}
        <div style={{display:"flex",gap:7,overflowX:"auto",touchAction:"pan-x",WebkitOverflowScrolling:"touch",scrollbarWidth:"none",paddingBottom:2}}>
          {filters.map(f=>(
            <button key={f} onClick={()=>setFilter(f)} style={{flexShrink:0,padding:"5px 14px",borderRadius:18,
              background:filter===f?"#7c3aed":"#1f2937",color:filter===f?"#fff":"#9ca3af",
              border:filter===f?"none":"1px solid rgba(255,255,255,0.07)",fontSize:12,fontWeight:600,cursor:"pointer"}}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Seasonal notice */}
      {filtered.some(m=>m.seasonal) && (
        <div style={{margin:"12px 16px 0",background:"rgba(245,158,11,0.08)",border:"1px solid rgba(245,158,11,0.2)",
          borderRadius:12,padding:"10px 14px",display:"flex",alignItems:"center",gap:8}}>
          <Calendar size={14} color="#f59e0b"/>
          <span style={{fontSize:12,color:"#fbbf24"}}>Some workshops are seasonal — always check availability before visiting.</span>
        </div>
      )}

      {/* Maker cards */}
      <div style={{padding:"14px 16px 0"}}>
        {filtered.length===0 && (
          <div style={{textAlign:"center",padding:"48px 20px",color:"#4b5563"}}>
            <div style={{fontSize:40,marginBottom:12}}>🔍</div>
            <div style={{fontFamily:"'Fredoka',sans-serif",fontSize:16,color:"#6b7280"}}>No {filter.toLowerCase()}s in this region yet</div>
          </div>
        )}
        {filtered.map(maker=>(
          <button key={maker.id} onClick={()=>onMaker(maker)} style={{width:"100%",textAlign:"left",
            background:"#1f2937",border:"1px solid rgba(255,255,255,0.06)",borderRadius:18,
            padding:"16px",marginBottom:12,cursor:"pointer",transition:"all .15s"}}>
            <div style={{display:"flex",alignItems:"flex-start",gap:14}}>
              {/* Emoji icon */}
              <div style={{width:52,height:52,borderRadius:14,background:"rgba(124,58,237,0.12)",
                border:"1px solid rgba(124,58,237,0.2)",display:"flex",alignItems:"center",
                justifyContent:"center",fontSize:26,flexShrink:0}}>
                {maker.emoji}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:5,flexWrap:"wrap"}}>
                  <MakerTypeBadge type={maker.type} sm/>
                  {maker.seasonal && <span style={{fontSize:9,color:"#f59e0b",background:"rgba(245,158,11,0.1)",
                    border:"1px solid rgba(245,158,11,0.2)",borderRadius:6,padding:"1px 6px",fontWeight:700}}>SEASONAL</span>}
                  {maker.familyFriendly && <span style={{fontSize:9,color:"#10b981",background:"rgba(16,185,129,0.1)",
                    border:"1px solid rgba(16,185,129,0.2)",borderRadius:6,padding:"1px 6px",fontWeight:700}}>FAMILY ✓</span>}
                </div>
                <div style={{fontFamily:"'Fredoka',sans-serif",fontSize:16,color:"#e5e7eb",lineHeight:1.3,marginBottom:4}}>
                  {maker.name}
                </div>
                <p style={{fontSize:12,color:"#6b7280",lineHeight:1.5,marginBottom:8}}>{maker.tagline}</p>
                <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
                  <div style={{display:"flex",alignItems:"center",gap:4}}>
                    <MapPin size={11} color="#4b5563"/>
                    <span style={{fontSize:11,color:"#4b5563"}}>{maker.location.split(",")[0]}</span>
                  </div>
                  {maker.price && (
                    <div style={{display:"flex",alignItems:"center",gap:4}}>
                      <Tag size={11} color="#22c55e"/>
                      <span style={{fontSize:11,color:"#22c55e",fontWeight:600}}>{maker.price}</span>
                    </div>
                  )}
                </div>
              </div>
              <ChevronRight size={16} color="#4b5563" style={{flexShrink:0,marginTop:4}}/>
            </div>
            {/* Offering pills */}
            <div style={{display:"flex",gap:5,flexWrap:"wrap",marginTop:10,paddingTop:10,
              borderTop:"1px solid rgba(255,255,255,0.04)"}}>
              {maker.offerings.slice(0,4).map(o=>(
                <span key={o} style={{fontSize:10,color:"#9ca3af",background:"rgba(255,255,255,0.04)",
                  border:"1px solid rgba(255,255,255,0.07)",borderRadius:6,padding:"2px 8px"}}>{o}</span>
              ))}
              {maker.offerings.length>4 && (
                <span style={{fontSize:10,color:"#6b7280",padding:"2px 4px"}}>+{maker.offerings.length-4} more</span>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Footer note */}
      <div style={{margin:"4px 16px 16px",background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.04)",
        borderRadius:12,padding:"12px 14px",display:"flex",alignItems:"center",gap:8}}>
        <Globe size={13} color="#4b5563"/>
        <span style={{fontSize:11,color:"#4b5563",lineHeight:1.5}}>
          Know a local maker we should feature? These listings are researched from real local businesses. Tap any card to visit their booking page.
        </span>
      </div>
    </div>
  );
}

// ─── MAKER DETAIL SHEET ──────────────────────────────────────────────────────
function MakerSheet({ maker, onClose }) {
  if (!maker) return null;
  const cfg = MAKER_TYPES[maker.type] || MAKER_TYPES.workshop;
  return (
    <div className="fade-in" style={{position:"absolute",inset:0,zIndex:500,background:"#0d1117",
      overflowY:"scroll",WebkitOverflowScrolling:"touch",touchAction:"pan-y"}}>
      {/* Header gradient */}
      <div style={{background:`linear-gradient(135deg,${cfg.bg.replace("0.12","0.3")},#0d1117)`,
        padding:"56px 20px 28px",borderBottom:"1px solid rgba(255,255,255,0.05)",position:"relative"}}>
        <button onClick={onClose} style={{position:"absolute",top:16,left:16,background:"rgba(255,255,255,0.06)",
          border:"none",borderRadius:20,width:36,height:36,display:"flex",alignItems:"center",
          justifyContent:"center",cursor:"pointer"}}><X size={16} color="#6b7280"/></button>
        <div style={{fontSize:56,marginBottom:12,lineHeight:1}}>{maker.emoji}</div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
          <MakerTypeBadge type={maker.type}/>
          {maker.seasonal && <span style={{fontSize:10,color:"#f59e0b",background:"rgba(245,158,11,0.12)",
            border:"1px solid rgba(245,158,11,0.3)",borderRadius:8,padding:"3px 9px",fontWeight:700}}>SEASONAL</span>}
          {maker.familyFriendly && <span style={{fontSize:10,color:"#10b981",background:"rgba(16,185,129,0.12)",
            border:"1px solid rgba(16,185,129,0.3)",borderRadius:8,padding:"3px 9px",fontWeight:700}}>FAMILY FRIENDLY</span>}
        </div>
        <h1 style={{fontFamily:"'Fredoka',sans-serif",fontSize:26,color:"#fff",lineHeight:1.2,marginBottom:8}}>
          {maker.name}
        </h1>
        <p style={{fontSize:14,color:"#9ca3af",fontStyle:"italic",lineHeight:1.5}}>{maker.tagline}</p>
      </div>

      <div style={{padding:"20px 20px 80px"}}>
        {/* Location & Price row */}
        <div style={{display:"flex",gap:10,marginBottom:18,flexWrap:"wrap"}}>
          <div style={{flex:1,background:"#1f2937",border:"1px solid rgba(255,255,255,0.06)",
            borderRadius:12,padding:"12px 14px",display:"flex",alignItems:"center",gap:8,minWidth:140}}>
            <MapPin size={14} color="#6b7280"/>
            <div>
              <div style={{fontSize:10,color:"#4b5563",marginBottom:2}}>LOCATION</div>
              <div style={{fontSize:12,color:"#e5e7eb",lineHeight:1.4}}>{maker.location}</div>
            </div>
          </div>
          {maker.price && (
            <div style={{flex:1,background:"rgba(34,197,94,0.06)",border:"1px solid rgba(34,197,94,0.15)",
              borderRadius:12,padding:"12px 14px",display:"flex",alignItems:"center",gap:8,minWidth:120}}>
              <Tag size={14} color="#22c55e"/>
              <div>
                <div style={{fontSize:10,color:"#4b5563",marginBottom:2}}>PRICE</div>
                <div style={{fontSize:12,color:"#22c55e",fontWeight:600,lineHeight:1.4}}>{maker.price}</div>
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        <div style={{marginBottom:20}}>
          <div style={{fontFamily:"'Fredoka',sans-serif",fontSize:15,color:"#e5e7eb",marginBottom:10}}>About</div>
          <p style={{fontFamily:"'Crimson Pro',serif",fontSize:16,lineHeight:1.85,color:"#9ca3af"}}>{maker.desc}</p>
        </div>

        {/* What's on offer */}
        <div style={{marginBottom:20}}>
          <div style={{fontFamily:"'Fredoka',sans-serif",fontSize:15,color:"#e5e7eb",marginBottom:10}}>What's on offer</div>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {maker.offerings.map(o=>(
              <div key={o} style={{display:"flex",alignItems:"center",gap:10,background:"rgba(255,255,255,0.03)",
                border:"1px solid rgba(255,255,255,0.06)",borderRadius:10,padding:"10px 12px"}}>
                <Check size={13} color="#22c55e"/>
                <span style={{fontSize:13,color:"#d1d5db"}}>{o}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:20}}>
          {maker.tags.map(t=>(
            <span key={t} style={{fontSize:11,color:"#9ca3af",background:"rgba(255,255,255,0.04)",
              border:"1px solid rgba(255,255,255,0.08)",borderRadius:8,padding:"3px 10px"}}>{t}</span>
          ))}
        </div>

        {/* Seasonal warning */}
        {maker.seasonal && (
          <div style={{background:"rgba(245,158,11,0.08)",border:"1px solid rgba(245,158,11,0.2)",
            borderRadius:12,padding:"12px 14px",marginBottom:16,display:"flex",gap:8}}>
            <Calendar size={14} color="#f59e0b" style={{flexShrink:0,marginTop:2}}/>
            <span style={{fontSize:12,color:"#fbbf24",lineHeight:1.5}}>
              This is a seasonal offering. Check the booking page for current dates and availability before visiting.
            </span>
          </div>
        )}

        {/* CTA buttons */}
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {maker.booking && (
            <a href={maker.booking} target="_blank" rel="noopener noreferrer"
              style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,
                background:"linear-gradient(135deg,#7c3aed,#5b21b6)",border:"none",borderRadius:16,
                padding:"15px 20px",cursor:"pointer",fontFamily:"'Fredoka',sans-serif",
                fontSize:16,fontWeight:700,color:"#fff",textDecoration:"none",
                boxShadow:"0 4px 20px rgba(124,58,237,0.35)"}}>
              <ExternalLink size={16}/> {maker.type==="workshop"||maker.type==="event" ? "Book or Enquire" : "Visit Website"}
            </a>
          )}
          {maker.phone && (
            <a href={"tel:"+maker.phone} style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,
              background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",
              borderRadius:16,padding:"13px 20px",cursor:"pointer",color:"#9ca3af",
              textDecoration:"none",fontSize:14}}>
              <Phone size={14}/> Call to Book
            </a>
          )}
          {!maker.booking && !maker.phone && (
            <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",
              borderRadius:14,padding:"13px 16px",display:"flex",alignItems:"center",gap:8}}>
              <Globe size={13} color="#6b7280"/>
              <span style={{fontSize:12,color:"#6b7280"}}>Search the name above to find current booking details</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── PROFILE TAB ─────────────────────────────────────────────────────────────
function ProfileTab() {
  const [view, setView] = useState("stats");
  const [savedQuests] = useStorage("lbat:quests", {});
  const [savedSpots] = useStorage("lbat:saved", []);
  const questCount = Object.keys(savedQuests).length;
  const spotCount = savedSpots.length;
  const advPts = questCount * 75 + spotCount * 15;
  const guardianPts = Object.keys(savedQuests).filter(id=>id.startsWith("bc")||id.startsWith("sn")||id.endsWith("stewardship")).length * 50;
  const badges = [
    {e:"🏊",n:"Wild Swimmer",on:true,cat:"adventure"},{e:"🐬",n:"Dolphin Spotter",on:true,cat:"adventure"},
    {e:"🌊",n:"Tidal Expert",on:true,cat:"adventure"},{e:"🌿",n:"Earth Friend",on:true,cat:"stewardship"},
    {e:"📖",n:"Storyteller",on:true,cat:"story"},{e:"📜",n:"Lorekeeper",on:false,cat:"story"},
    {e:"🦭",n:"Seal Keeper",on:false,cat:"stewardship"},{e:"🏄",n:"Surf Soul",on:false,cat:"adventure"},
    {e:"⚔️",n:"Quest Master",on:false,cat:"quest"},{e:"🟣",n:"Legendary",on:false,cat:"quest"},
    {e:"🌱",n:"Keeper of Wild",on:false,cat:"stewardship"},{e:"👑",n:"Bay Guardian",on:false,cat:"adventure"},
  ];
  return (
    <div style={{overflowY:"auto",WebkitOverflowScrolling:"touch",touchAction:"pan-y",height:"100%",paddingBottom:80}}>
      <div style={{background:"linear-gradient(135deg,#1e3a2f,#0f2218)",padding:"20px 20px 16px"}}>
        <div style={{display:"flex",gap:14,alignItems:"center",marginBottom:16}}><div style={{width:66,height:66,borderRadius:"50%",background:"rgba(0,0,0,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:32,border:"3px solid #22c55e"}}>🏊</div><div style={{flex:1}}><h2 style={{fontFamily:"'Fredoka',sans-serif",fontSize:22,color:"#fff"}}>Bay Explorer</h2><div style={{fontSize:12,color:"#f59e0b",fontWeight:700}}>Bay Wanderer · Level 6</div><div style={{fontSize:12,color:"rgba(255,255,255,0.4)",marginTop:2}}>Cardigan, Ceredigion 🏴󠁧󠁢󠁷󠁬󠁳󠁿</div></div><button style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:12,padding:"8px 12px",cursor:"pointer",color:"#e5e7eb",fontSize:12}}>Edit</button></div>
        <div style={{display:"flex",gap:10,marginBottom:14}}><div style={{flex:1,background:"rgba(245,158,11,0.15)",border:"1px solid rgba(245,158,11,0.25)",borderRadius:14,padding:"12px",textAlign:"center"}}>{advPts>0?advPts.toLocaleString():"3,740"}</div><div style={{fontSize:10,color:"rgba(255,255,255,0.4)"}}>Adventure pts</div></div><div style={{flex:1,background:"rgba(34,197,94,0.12)",border:"1px solid rgba(34,197,94,0.25)",borderRadius:14,padding:"12px",textAlign:"center"}}><div style={{fontFamily:"'Fredoka',sans-serif",fontSize:22,color:"#4ade80",fontWeight:700}}>🌿 {guardianPts>0?guardianPts:210}<div style={{fontSize:10,color:"rgba(255,255,255,0.4)"}}>Guardian pts</div></div></div>
        <div style={{background:"rgba(0,0,0,0.3)",borderRadius:12,padding:"12px"}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{fontSize:12,color:"rgba(255,255,255,0.6)",fontWeight:600}}>Level 6 — Bay Wanderer</span><span style={{fontSize:11,color:"rgba(255,255,255,0.3)"}}>260/500 to Bay Guardian</span></div><div style={{background:"rgba(255,255,255,0.1)",borderRadius:8,height:6}}><div style={{width:"52%",height:"100%",background:"linear-gradient(90deg,#f59e0b,#22c55e)",borderRadius:8}}/></div></div>
      </div>
      <div style={{display:"flex",padding:"12px 16px",gap:8,background:"#111827",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>{["stats","badges","friends","crews"].map(v=><button key={v} onClick={()=>setView(v)} style={{flex:1,background:view===v?"rgba(34,197,94,0.12)":"transparent",border:view===v?"1px solid rgba(34,197,94,0.3)":"1px solid transparent",borderRadius:10,padding:"7px 0",cursor:"pointer",color:view===v?"#4ade80":"#6b7280",fontSize:11,fontWeight:600,textTransform:"capitalize"}}>{v}</button>)}</div>
      <div style={{padding:"16px"}}>
        {view==="stats"&&<><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:18}}>{[["Spots Saved",spotCount||18],["Quests Accepted",questCount||44],["Stories Told",12],["Regions Explored",Object.keys(savedQuests).reduce((acc,id)=>{const r=id.split(/\d/)[0];if(r&&!acc.includes(r))acc.push(r);return acc;},[]).length||3],["Stewardship",Object.keys(savedQuests).filter(id=>RARITY[Object.values(REGIONS).flatMap(r=>r.spots).flatMap(s=>s.quests||[]).find(q=>q.id===id)?.rarity||""]?.label==="Give Back").length||7],["Wales Covered",5]].map(([l,v])=><div key={l} style={{background:"#1f2937",borderRadius:13,padding:"13px",textAlign:"center"}}><div style={{fontFamily:"'Fredoka',sans-serif",fontSize:22,color:"#e5e7eb",fontWeight:700}}>{v}</div><div style={{fontSize:11,color:"#6b7280"}}>{l}</div></div>)}</div><div style={{background:"#1f2937",borderRadius:14,padding:"14px"}}><div style={{fontFamily:"'Fredoka',sans-serif",fontSize:14,color:"#e5e7eb",marginBottom:10}}>🏆 Quest Breakdown</div>{[["common",22],["rare",15],["epic",5],["stewardship",7]].map(([r,n])=>{const c=RARITY[r];return(<div key={r} style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}><RarityBadge rarity={r} sm/><div style={{flex:1,background:"rgba(255,255,255,0.04)",borderRadius:6,height:6}}><div style={{width:`${Math.min(100,(n/22)*100)}%`,height:"100%",background:c.color,borderRadius:6}}/></div><span style={{fontSize:12,color:c.text,fontWeight:700,width:20,textAlign:"right"}}>{n}</span></div>);})}</div></>}
        {view==="badges"&&<div>{["adventure","quest","stewardship","story"].map(cat=><div key={cat} style={{marginBottom:18}}><div style={{fontFamily:"'Fredoka',sans-serif",fontSize:14,color:"#e5e7eb",marginBottom:8}}>{cat==="adventure"?"📍":cat==="quest"?"⚔️":cat==="stewardship"?"🌿":"📖"} {cat.charAt(0).toUpperCase()+cat.slice(1)} Badges</div><div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>{badges.filter(b=>b.cat===cat).map(b=><div key={b.n} style={{textAlign:"center",opacity:b.on?1:0.35}}><div style={{aspectRatio:"1",borderRadius:12,background:b.on?"rgba(245,158,11,0.12)":"#1f2937",border:b.on?"1px solid rgba(245,158,11,0.35)":"1px solid rgba(255,255,255,0.05)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,marginBottom:3}}>{b.on?b.e:"❓"}</div><div style={{fontSize:9,color:b.on?"#9ca3af":"#4b5563",lineHeight:1.2}}>{b.n}</div></div>)}</div></div>)}</div>}
        {view==="friends"&&<div><div style={{fontFamily:"'Fredoka',sans-serif",fontSize:14,color:"#e5e7eb",marginBottom:12}}>Your Crew</div>{FRIENDS.map(f=><div key={f.id} style={{background:"#1f2937",border:"1px solid rgba(255,255,255,0.05)",borderRadius:16,padding:"13px",marginBottom:8,display:"flex",alignItems:"center",gap:12}}><div style={{position:"relative"}}><span style={{fontSize:28}}>{f.avatar}</span><div style={{position:"absolute",bottom:0,right:0,width:10,height:10,borderRadius:"50%",background:f.status==="online"?"#22c55e":"#374151",border:"2px solid #1f2937"}}/></div><div style={{flex:1}}><div style={{fontFamily:"'Fredoka',sans-serif",fontSize:15,color:"#e5e7eb"}}>{f.name}</div><div style={{fontSize:11,color:"#6b7280"}}>{f.status==="online"?`📍 ${f.location}`:f.lastSeen}</div></div><div style={{textAlign:"right"}}><div style={{fontSize:12,color:"#fbbf24",fontWeight:700}}>{f.points.toLocaleString()}</div><div style={{fontSize:10,color:"#4ade80"}}>🌿 {f.guardian}</div></div></div>)}<button style={{width:"100%",background:"rgba(59,130,246,0.08)",border:"1px dashed rgba(59,130,246,0.3)",borderRadius:14,padding:"13px",cursor:"pointer",color:"#60a5fa",fontFamily:"'Fredoka',sans-serif",fontSize:14,marginTop:4}}>+ Add Friends</button></div>}
        {view==="crews"&&<div><div style={{fontFamily:"'Fredoka',sans-serif",fontSize:14,color:"#e5e7eb",marginBottom:12}}>My Crews</div>{CREWS.map(c=><div key={c.id} style={{background:"#1f2937",border:"1px solid rgba(255,255,255,0.05)",borderRadius:16,padding:"14px",marginBottom:8}}><div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}><span style={{fontSize:26}}>{c.emoji}</span><div style={{flex:1}}><div style={{fontFamily:"'Fredoka',sans-serif",fontSize:15,color:"#e5e7eb"}}>{c.name}</div><div style={{fontSize:12,color:"#6b7280"}}>{c.members} members</div></div><span style={{background:c.private?"rgba(245,158,11,0.12)":"rgba(34,197,94,0.12)",color:c.private?"#fbbf24":"#4ade80",padding:"3px 8px",borderRadius:8,fontSize:10,fontWeight:600}}>{c.private?"🔒 Private":"🌍 Open"}</span></div></div>)}<button style={{width:"100%",background:"rgba(245,158,11,0.08)",border:"1px dashed rgba(245,158,11,0.3)",borderRadius:14,padding:"13px",cursor:"pointer",color:"#f59e0b",fontFamily:"'Fredoka',sans-serif",fontSize:14,marginTop:4}}>+ Create a New Crew</button></div>}
      </div>
    </div>
  );
}

// ─── QUESTS TAB ───────────────────────────────────────────────────────────────
function QuestsTab({ onQuestOpen }) {
  const [rarityFilter, setRarityFilter] = useState("all");
  const [regionFilter, setRegionFilter] = useState("all");
  const [view, setView] = useState("browse"); // browse | leaderboard

  // Collect all quests from all regions
  const allQuests = [];
  Object.values(REGIONS).forEach(reg => {
    reg.spots.forEach(spot => {
      (spot.quests||[]).forEach(q => {
        allQuests.push({ ...q, spotName: spot.name, spotEmoji: spot.emoji, regionId: reg.id, regionName: reg.name, regionEmoji: reg.emoji });
      });
    });
  });

  const rarities = ["all","legendary","epic","rare","common","stewardship"];
  const filtered = allQuests.filter(q => {
    if (rarityFilter !== "all" && q.rarity !== rarityFilter) return false;
    if (regionFilter !== "all" && q.regionId !== regionFilter) return false;
    return true;
  });

  // Sort legendary first, then by pts desc
  const rarityOrder = {legendary:0,epic:1,rare:2,stewardship:3,common:4};
  filtered.sort((a,b) => (rarityOrder[a.rarity]??5) - (rarityOrder[b.rarity]??5));

  // Mock leaderboard
  const leaderboard = [
    {rank:1,avatar:"🧑‍🦰",name:"Carys W.",pts:5600,guardian:780,quests:44,streak:12},
    {rank:2,avatar:"👩",name:"Siân Lloyd",pts:4200,guardian:310,quests:38,streak:8},
    {rank:3,avatar:"🧔",name:"Dafydd R.",pts:3100,guardian:180,quests:27,streak:4},
    {rank:4,avatar:"🏊",name:"Bay Explorer",pts:3740,guardian:210,quests:44,streak:6,isYou:true},
    {rank:5,avatar:"👩‍🦱",name:"Beth M.",pts:2800,guardian:420,quests:22,streak:2},
  ].sort((a,b)=>b.pts-a.pts).map((l,i)=>({...l,rank:i+1}));

  const totalQuests = allQuests.length;
  const legendaryCount = allQuests.filter(q=>q.rarity==="legendary").length;
  const stewardCount = allQuests.filter(q=>q.rarity==="stewardship").length;

  return (
    <div style={{height:"100%",overflowY:"auto",paddingBottom:80,background:"#0d1117"}}>
      {/* Header */}
      <div style={{background:"linear-gradient(135deg,#1a0d2e,#0d1a2e)",padding:"48px 20px 16px",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
          <Trophy size={24} color="#f59e0b"/>
          <div>
            <h1 style={{fontFamily:"'Fredoka',sans-serif",fontSize:22,fontWeight:700,color:"#fff",lineHeight:1}}>Quest Board</h1>
            <p style={{fontSize:11,color:"#6b7280",marginTop:2}}>All regions · {totalQuests} quests</p>
          </div>
        </div>
        {/* Stats strip */}
        <div style={{display:"flex",gap:8,marginBottom:12}}>
          {[
            {icon:"🟣",label:"Legendary",val:legendaryCount},
            {icon:"🌿",label:"Stewardship",val:stewardCount},
            {icon:"⚔️",label:"Total",val:totalQuests},
          ].map(s=><div key={s.label} style={{flex:1,background:"rgba(255,255,255,0.04)",borderRadius:12,padding:"9px 8px",textAlign:"center",border:"1px solid rgba(255,255,255,0.06)"}}>
            <div style={{fontSize:16,marginBottom:2}}>{s.icon}</div>
            <div style={{fontFamily:"'Fredoka',sans-serif",fontSize:18,color:"#e5e7eb",fontWeight:700}}>{s.val}</div>
            <div style={{fontSize:9,color:"#6b7280"}}>{s.label}</div>
          </div>)}
        </div>
        {/* View toggle */}
        <div style={{display:"flex",background:"rgba(0,0,0,0.3)",borderRadius:12,padding:3,gap:2}}>
          {[["browse","⚔️ Browse"],["leaderboard","🏆 Leaderboard"]].map(([v,l])=><button key={v} onClick={()=>setView(v)} style={{flex:1,background:view===v?"rgba(245,158,11,0.18)":"transparent",border:view===v?"1px solid rgba(245,158,11,0.3)":"1px solid transparent",borderRadius:10,padding:"7px 0",cursor:"pointer",color:view===v?"#fbbf24":"#6b7280",fontSize:12,fontWeight:700}}>{l}</button>)}
        </div>
      </div>

      {view==="browse"&&<>
        {/* Rarity filters */}
        <div style={{padding:"12px 16px 0",display:"flex",gap:6,overflowX:"auto",paddingBottom:8,borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
          {rarities.map(r=>{
            const c=r==="all"?{text:"#9ca3af",bg:"rgba(255,255,255,0.06)",color:"rgba(255,255,255,0.2)"}:RARITY[r];
            const active=rarityFilter===r;
            return <button key={r} onClick={()=>setRarityFilter(r)} style={{flexShrink:0,padding:"5px 12px",borderRadius:20,border:`1px solid ${active?c.color||"rgba(255,255,255,0.3)":"transparent"}`,background:active?(c.bg||"rgba(255,255,255,0.08)"):"transparent",color:active?(c.text||"#e5e7eb"):"#6b7280",fontSize:11,fontWeight:700,cursor:"pointer",textTransform:"capitalize"}}>
              {r==="all"?"All":r.charAt(0).toUpperCase()+r.slice(1)}
            </button>;
          })}
        </div>
        {/* Region filters */}
        <div style={{padding:"8px 16px",display:"flex",gap:6,overflowX:"auto",borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
          {[{id:"all",emoji:"🏴󠁧󠁢󠁷󠁬󠁳󠁿",name:"All Wales"},...Object.values(REGIONS)].map(reg=>{
            const active=regionFilter===reg.id;
            return <button key={reg.id} onClick={()=>setRegionFilter(reg.id)} style={{flexShrink:0,display:"flex",alignItems:"center",gap:4,padding:"4px 10px",borderRadius:20,border:`1px solid ${active?"rgba(34,197,94,0.4)":"rgba(255,255,255,0.08)"}`,background:active?"rgba(34,197,94,0.1)":"transparent",color:active?"#4ade80":"#6b7280",fontSize:11,fontWeight:600,cursor:"pointer"}}>
              <span>{reg.emoji}</span><span>{reg.name?.split(" ")[0]||"All"}</span>
            </button>;
          })}
        </div>
        {/* Quest cards */}
        <div style={{padding:"12px 16px"}}>
          {filtered.length===0&&<div style={{textAlign:"center",padding:"48px 0",color:"#6b7280"}}>No quests match these filters</div>}
          {filtered.map(q=>{
            const rc=RARITY[q.rarity]||RARITY.common;
            const completionPct=q.attempts>0?Math.round((q.completions/q.attempts)*100):0;
            const isLegendary=q.rarity==="legendary";
            return (
              <div key={q.id} onClick={()=>onQuestOpen&&onQuestOpen(q)} style={{marginBottom:10,borderRadius:18,overflow:"hidden",cursor:"pointer",border:`1px solid ${rc.color}30`,background:"#111827"}}>
                {/* Rarity banner */}
                <div style={{background:isLegendary?"linear-gradient(270deg,#7c3aed,#db2777,#7c3aed)":rc.bg,padding:"7px 14px",display:"flex",alignItems:"center",gap:6,backgroundSize:"400% 400%",animation:isLegendary?"legendary-shimmer 3s ease infinite":undefined}}>
                  <span style={{fontSize:10,fontWeight:800,color:isLegendary?"#fff":rc.text,textTransform:"uppercase",letterSpacing:1}}>{RE[q.rarity]||"🟢"} {rc.label}</span>
                  <span style={{marginLeft:"auto",fontSize:11,fontWeight:700,color:isLegendary?"rgba(255,255,255,0.8)":rc.text}}>+{rc.pts} pts</span>
                </div>
                <div style={{padding:"12px 14px"}}>
                  {/* Location breadcrumb */}
                  <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:6}}>
                    <span style={{fontSize:13}}>{q.regionEmoji}</span>
                    <span style={{fontSize:10,color:"#6b7280"}}>{q.regionName}</span>
                    <ChevronRight size={10} color="#4b5563"/>
                    <span style={{fontSize:13}}>{q.spotEmoji}</span>
                    <span style={{fontSize:10,color:"#9ca3af",fontWeight:600}}>{q.spotName}</span>
                  </div>
                  <div style={{fontFamily:"'Fredoka',sans-serif",fontSize:17,color:"#fff",fontWeight:600,marginBottom:6,lineHeight:1.2}}>{q.name}</div>
                  <p style={{fontFamily:"'Crimson Pro',serif",fontSize:13,color:"#9ca3af",lineHeight:1.4,marginBottom:10}}>{q.desc}</p>
                  {/* Stats bar */}
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{flex:1,background:"rgba(255,255,255,0.04)",borderRadius:6,height:4}}>
                      <div style={{width:`${completionPct}%`,height:"100%",background:rc.color,borderRadius:6,transition:"width .4s"}}/>
                    </div>
                    <span style={{fontSize:10,color:"#6b7280",flexShrink:0}}>{q.completions}/{q.attempts} completed ({completionPct}%)</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </>}

      {view==="leaderboard"&&<div style={{padding:"16px"}}>
        {/* Streak banner */}
        <div style={{background:"linear-gradient(135deg,rgba(245,158,11,0.15),rgba(239,68,68,0.1))",border:"1px solid rgba(245,158,11,0.2)",borderRadius:16,padding:"12px 14px",marginBottom:14,display:"flex",alignItems:"center",gap:10}}>
          <Flame size={20} color="#f59e0b"/>
          <div>
            <div style={{fontFamily:"'Fredoka',sans-serif",fontSize:14,color:"#fbbf24",fontWeight:700}}>6-day streak 🔥</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.4)"}}>You've done a quest every day this week</div>
          </div>
        </div>
        {/* Board */}
        {leaderboard.map((p,i)=><div key={p.name} style={{background:p.isYou?"rgba(34,197,94,0.06)":"#111827",border:`1px solid ${p.isYou?"rgba(34,197,94,0.2)":"rgba(255,255,255,0.05)"}`,borderRadius:16,padding:"12px 14px",marginBottom:8,display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:28,textAlign:"center"}}>
            {p.rank<=3?<span style={{fontSize:18}}>{["🥇","🥈","🥉"][p.rank-1]}</span>:<span style={{fontSize:13,color:"#6b7280",fontWeight:700}}>#{p.rank}</span>}
          </div>
          <span style={{fontSize:26}}>{p.avatar}</span>
          <div style={{flex:1}}>
            <div style={{fontFamily:"'Fredoka',sans-serif",fontSize:15,color:p.isYou?"#4ade80":"#e5e7eb",fontWeight:p.isYou?700:500}}>{p.name}{p.isYou?" (you)":""}</div>
            <div style={{fontSize:11,color:"#6b7280"}}>{p.quests} quests · 🔥 {p.streak}d streak</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:13,color:"#fbbf24",fontWeight:700}}>{p.pts.toLocaleString()}</div>
            <div style={{fontSize:10,color:"#4ade80"}}>🌿 {p.guardian}</div>
          </div>
        </div>)}
        {/* Challenge card */}
        <div style={{marginTop:16,background:"linear-gradient(135deg,#1a0d2e,#0d1a2e)",borderRadius:18,border:"1px solid rgba(124,58,237,0.25)",padding:"16px"}}>
          <div style={{fontFamily:"'Fredoka',sans-serif",fontSize:16,color:"#a78bfa",marginBottom:4}}>🟣 This week's community challenge</div>
          <div style={{fontFamily:"'Crimson Pro',serif",fontStyle:"italic",fontSize:14,color:"rgba(255,255,255,0.6)",lineHeight:1.4}}>Three Summits in Three Days — bag Snowdon, Tryfan, and Pen yr Ole Wen before Sunday. 12 adventurers are attempting it right now.</div>
          <div style={{marginTop:10,display:"flex",gap:8}}>
            <div style={{background:"rgba(255,255,255,0.04)",borderRadius:10,padding:"6px 12px",fontSize:11,color:"#6b7280"}}>12 attempting</div>
            <div style={{background:"rgba(255,255,255,0.04)",borderRadius:10,padding:"6px 12px",fontSize:11,color:"#6b7280"}}>3 completed</div>
            <div style={{marginLeft:"auto",background:"rgba(124,58,237,0.2)",border:"1px solid rgba(124,58,237,0.3)",borderRadius:10,padding:"6px 12px",fontSize:11,color:"#a78bfa",fontWeight:700,cursor:"pointer"}}>Join →</div>
          </div>
        </div>
      </div>}
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
const FILTERS = ["All","Wild Swimming","Surfing","Wildlife","Hiking","Kayaking","Coasteering","📜 Folklore"];
const TABS = [
  {id:"map",icon:<Compass size={18}/>,label:"Map"},
  {id:"explore",icon:<Search size={18}/>,label:"Explore"},
  {id:"quests",icon:<Trophy size={18}/>,label:"Quests"},
  {id:"content",icon:<BookOpen size={18}/>,label:"Stories"},
  {id:"makers",icon:<ShoppingBag size={18}/>,label:"Makers"},
  {id:"profile",icon:<User size={18}/>,label:"Profile"},
];

export default function App() {
  const [tab, setTab] = useState("map");
  const [rId, setRId] = useState(null); // null=overview, "cardigan"|"pembrokeshire"
  const [filter, setFilter] = useState("All");
  const [spot, setSpot] = useState(null);
  const [quest, setQuest] = useState(null);
  const [folklore, setFolklore] = useState(null);
  const [route, setRoute] = useState(null);
  const [content, setContent] = useState(null);
  const [mood, setMood] = useState(false);
  const [addFlow, setAddFlow] = useState(false);
  const [community, setCommunity] = useState(false);
  const [guide, setGuide] = useState(false);
  const [maker, setMaker] = useState(null);

  useEffect(()=>{ const el=document.createElement("style"); el.textContent=GLOBAL_CSS; document.head.appendChild(el); return()=>document.head.removeChild(el); },[]);

  const region = rId ? REGIONS[rId] : null;
  const clearAll = () => { setSpot(null); setQuest(null); setFolklore(null); setRoute(null); setContent(null); setMood(false); setCommunity(false); setGuide(false); setMaker(null); };
  const onSpot = useCallback(s => { setSpot(s); setQuest(null); setFolklore(null); setRoute(null); },[]);
  const onFolklore = useCallback(f => { setFolklore(f); setSpot(null); setQuest(null); },[]);
  const onRoute = useCallback(r => { setRoute(r); setSpot(null); },[]);
  const onContent = useCallback(c => { setContent(c); },[]);
  const selectRegion = (id) => { setRId(id); setTab("map"); clearAll(); setFilter("All"); };

  const hasOverlay = spot||quest||folklore||route||content||mood||addFlow||community||guide;
  const showFab = !hasOverlay && tab!=="profile";

  return (
    <div style={{maxWidth:430,margin:"0 auto",height:"100vh",background:"#0d1117",position:"relative",overflow:"hidden",display:"flex",flexDirection:"column",fontFamily:"'DM Sans',sans-serif"}}>
      <div style={{flex:1,position:"relative",overflow:"hidden"}}>
        {/* MAP TAB */}
        {tab==="map"&&(
          <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column"}}>
            {!region
              ? <><OverviewMap onRegionSelect={selectRegion}/><button onClick={()=>setGuide(true)} style={{position:"absolute",bottom:80,right:14,zIndex:250,background:"linear-gradient(135deg,#1e3a2f,#0f2218)",border:"1px solid rgba(34,197,94,0.4)",borderRadius:20,padding:"10px 16px",color:"#4ade80",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'Fredoka',sans-serif",display:"flex",alignItems:"center",gap:6}}>🏴󠁧󠁢󠁷󠁬󠁳󠁿 Ask the Guide</button>{guide&&<AskGuide onClose={()=>setGuide(false)}/>}</>
              : <>
                  <MapPanel region={region} activeFilter={filter} onSpot={onSpot} onFolklore={onFolklore} onRoute={onRoute}/>
                  {/* Map header overlay */}
                  <div style={{position:"absolute",top:0,left:0,right:0,zIndex:200,pointerEvents:"none"}}>
                    <div style={{padding:"12px 12px 0",display:"flex",gap:8,pointerEvents:"all",alignItems:"center"}}>
                      <button onClick={()=>{ setRId(null); clearAll(); setFilter("All"); }} style={{background:"rgba(10,18,30,0.93)",backdropFilter:"blur(12px)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,padding:"9px 12px",color:"#9ca3af",fontSize:12,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:600,whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:4,pointerEvents:"all"}}>← Wales</button>
                      <div style={{flex:1,background:"rgba(10,18,30,0.93)",backdropFilter:"blur(12px)",borderRadius:14,padding:"9px 14px",display:"flex",gap:8,alignItems:"center",border:"1px solid rgba(255,255,255,0.08)"}}><Search size={13} color="#6b7280"/><span style={{color:"#4b5563",fontSize:13}}>Search {region.name}…</span></div>
                      <button onClick={()=>setCommunity(true)} style={{background:"rgba(10,18,30,0.93)",backdropFilter:"blur(12px)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,padding:"9px 12px",cursor:"pointer",pointerEvents:"all",display:"flex",alignItems:"center"}}><Users size={16} color="#6b7280"/></button>
                      <button onClick={()=>setMood(true)} style={{background:"linear-gradient(135deg,#f59e0b,#ef4444)",border:"none",borderRadius:14,padding:"9px 12px",color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"'Fredoka',sans-serif",display:"flex",alignItems:"center",gap:4,whiteSpace:"nowrap",pointerEvents:"all"}}><Sparkles size={12}/>Up for?</button>
                      <button onClick={()=>setGuide(true)} style={{background:"linear-gradient(135deg,#1e3a2f,#0f2218)",border:"1px solid rgba(34,197,94,0.4)",borderRadius:14,padding:"9px 12px",color:"#4ade80",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"'Fredoka',sans-serif",display:"flex",alignItems:"center",gap:4,whiteSpace:"nowrap",pointerEvents:"all"}}>🏴󠁧󠁢󠁷󠁬󠁳󠁿 Guide</button>
                    </div>
                    {/* Region badge */}
                    <div style={{padding:"6px 12px 0",pointerEvents:"none"}}>
                      <div style={{display:"inline-flex",alignItems:"center",gap:6,background:"rgba(10,18,30,0.85)",backdropFilter:"blur(8px)",borderRadius:20,padding:"4px 12px",border:"1px solid rgba(34,197,94,0.2)"}}>
                        <span style={{fontSize:14}}>{region.emoji}</span><span style={{fontFamily:"'Fredoka',sans-serif",fontSize:12,color:"#4ade80",fontWeight:700}}>{region.name}</span><span style={{fontSize:11,color:"#4b5563"}}>·</span><span style={{fontSize:11,color:"#6b7280"}}>{region.spots.length} spots</span>
                      </div>
                    </div>
                    {/* Filter chips */}
                    <div style={{display:"flex",gap:7,padding:"6px 12px",overflowX:"auto",WebkitOverflowScrolling:"touch",pointerEvents:"all"}}>{FILTERS.map(f=><button key={f} onClick={()=>setFilter(f)} style={{flexShrink:0,padding:"4px 12px",borderRadius:18,background:filter===f?"#22c55e":"rgba(10,18,30,0.9)",color:filter===f?"#fff":"#9ca3af",border:filter===f?"none":"1px solid rgba(255,255,255,0.1)",fontSize:11,fontWeight:600,cursor:"pointer",backdropFilter:"blur(8px)"}}>{f}</button>)}</div>
                  </div>
                  {/* Legend */}
                  <div style={{position:"absolute",top:110,right:12,zIndex:190,background:"rgba(10,18,30,0.88)",backdropFilter:"blur(8px)",borderRadius:12,padding:"8px 10px",border:"1px solid rgba(255,255,255,0.06)"}}>
                    {[["#4a6741","Spot"],["#fbbf24","Seasonal"],["#ef4444","Folklore"],["#3b82f6","Route"],["#3b82f6","You"]].map(([c,l])=><div key={l} style={{display:"flex",alignItems:"center",gap:5,marginBottom:3}}><div style={{width:7,height:7,borderRadius:l==="You"?"50%":2,background:c,border:l==="You"?"2px solid #fff":"none"}}/><span style={{fontSize:9,color:"#9ca3af"}}>{l}</span></div>)}
                  </div>
                  {/* Weather bar */}
                  <div style={{position:"absolute",bottom:0,left:0,right:0,zIndex:200,background:"rgba(8,14,22,0.94)",backdropFilter:"blur(12px)",borderTop:"1px solid rgba(255,255,255,0.05)",padding:"7px 14px",display:"flex",gap:14,overflowX:"auto"}}>
                    <div style={{display:"flex",alignItems:"center",gap:5,flexShrink:0}}><Sun size={12} color="#fbbf24"/><div><div style={{fontSize:12,fontWeight:600,color:"#e5e7eb",lineHeight:1}}>{region.wx.temp}</div><div style={{fontSize:10,color:"#6b7280"}}>Feels 8°</div></div></div>
                    <div style={{display:"flex",alignItems:"center",gap:5,flexShrink:0}}><Wind size={12} color="#60a5fa"/><div><div style={{fontSize:12,fontWeight:600,color:"#e5e7eb",lineHeight:1}}>{region.wx.wind}</div><div style={{fontSize:10,color:"#6b7280"}}>Prevailing</div></div></div>
                    {region.tidePort&&<div style={{display:"flex",alignItems:"center",gap:5,flexShrink:0}}><Droplets size={12} color="#34d399"/><div><div style={{fontSize:12,fontWeight:600,color:"#e5e7eb",lineHeight:1}}>Tides</div><div style={{fontSize:10,color:"#6b7280"}}>{region.wx.tide}</div></div></div>}
                    <div style={{display:"flex",alignItems:"center",gap:5,flexShrink:0}}><Moon size={12} color="#a78bfa"/><div><div style={{fontSize:12,fontWeight:600,color:"#e5e7eb",lineHeight:1}}>Sunset</div><div style={{fontSize:10,color:"#6b7280"}}>{region.wx.sun}</div></div></div>
                    {region.tidePort&&<a href={ext.tides(region.tidePort)} target="_blank" rel="noopener noreferrer" style={{marginLeft:"auto",fontSize:10,color:"#3b82f6",flexShrink:0,display:"flex",alignItems:"center",gap:3,textDecoration:"none"}}>Tides <ExternalLink size={9}/></a>}
                  </div>
                  {/* Overlays on map */}
                  {guide&&<AskGuide region={region} onClose={()=>setGuide(false)}/>}
                  {spot&&!quest&&<SpotSheet spot={spot} region={region} onClose={()=>setSpot(null)} onQuest={q=>{setSpot(null);setQuest(q);}}/>}
                  {quest&&<QuestDetail quest={quest} onClose={()=>setQuest(null)}/>}
                  {folklore&&<FolkloreDetail f={folklore} onClose={()=>setFolklore(null)}/>}
                  {route&&<RouteDetail route={route} region={region} onClose={()=>setRoute(null)}/>}
                  {mood&&<MoodFinder region={region} onClose={()=>setMood(false)}/>}
                  {addFlow&&<AddSpotFlow onClose={()=>setAddFlow(false)}/>}
                  {community&&<CommunityOverlay onClose={()=>setCommunity(false)}/>}
                </>
            }
          </div>
        )}

        {/* OTHER TABS */}
        {tab!=="map"&&<div style={{position:"absolute",inset:0,overflowY:"auto",WebkitOverflowScrolling:"touch",touchAction:"pan-y"}}>
          {tab==="explore"&&(
            region
              ? <ExploreTab region={region} onSpot={s=>{onSpot(s);setTab("map");}} onFolklore={f=>{onFolklore(f);setTab("map");}} onContent={c=>{setContent(c);}} onMood={()=>setMood(true)}/>
              : <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",padding:24,textAlign:"center"}}><div style={{fontSize:48,marginBottom:16}} className="float">🗺️</div><h2 style={{fontFamily:"'Fredoka',sans-serif",fontSize:22,color:"#fff",marginBottom:8}}>Pick a Region</h2><p style={{color:"#6b7280",marginBottom:20}}>Head to the Map tab and choose a region to explore.</p><div style={{display:"flex",gap:10}}>{Object.values(REGIONS).map(r=><button key={r.id} onClick={()=>selectRegion(r.id)} style={{flex:1,background:"#1f2937",border:"1px solid rgba(34,197,94,0.25)",borderRadius:14,padding:"14px 10px",cursor:"pointer"}}><div style={{fontSize:24,marginBottom:4}}>{r.emoji}</div><div style={{fontFamily:"'Fredoka',sans-serif",fontSize:13,color:"#e5e7eb"}}>{r.name}</div></button>)}</div></div>
          )}
          {tab==="quests"&&<QuestsTab onQuestOpen={q=>{setQuest(q);}}/>}
          {quest&&tab==="quests"&&<div style={{position:"absolute",inset:0,zIndex:500}}><QuestDetail quest={quest} onClose={()=>setQuest(null)}/></div>}
          {tab==="content"&&(
            region
              ? <ContentTab region={region} onContent={setContent}/>
              : <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",padding:24,textAlign:"center"}}><div style={{fontSize:48,marginBottom:16}} className="float">📖</div><h2 style={{fontFamily:"'Fredoka',sans-serif",fontSize:22,color:"#fff",marginBottom:8}}>Pick a Region First</h2><div style={{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"center",marginTop:12}}>{Object.values(REGIONS).map(r=><button key={r.id} onClick={()=>selectRegion(r.id)} style={{background:"#1f2937",border:"1px solid rgba(34,197,94,0.25)",borderRadius:14,padding:"14px 10px",cursor:"pointer",minWidth:90}}><div style={{fontSize:24,marginBottom:4}}>{r.emoji}</div><div style={{fontFamily:"'Fredoka',sans-serif",fontSize:12,color:"#e5e7eb"}}>{r.name}</div></button>)}</div></div>
          )}
          {tab==="makers"&&(
            region
              ? <MakersTab region={region} onMaker={setMaker}/>
              : <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",padding:24,textAlign:"center"}}>
                  <div style={{fontSize:48,marginBottom:16}} className="float">🛍️</div>
                  <h2 style={{fontFamily:"'Fredoka',sans-serif",fontSize:22,color:"#fff",marginBottom:8}}>Choose a Region</h2>
                  <p style={{color:"#6b7280",marginBottom:20,fontSize:13,lineHeight:1.6}}>Pick a region on the Map to discover local workshops, craft suppliers and galleries nearby.</p>
                  <div style={{display:"flex",flexWrap:"wrap",gap:8,justifyContent:"center"}}>{Object.values(REGIONS).map(r=><button key={r.id} onClick={()=>selectRegion(r.id)} style={{background:"#1f2937",border:"1px solid rgba(124,58,237,0.25)",borderRadius:14,padding:"14px 12px",cursor:"pointer",minWidth:110}}><div style={{fontSize:24,marginBottom:4}}>{r.emoji}</div><div style={{fontFamily:"'Fredoka',sans-serif",fontSize:12,color:"#e5e7eb"}}>{r.name}</div><div style={{fontSize:10,color:"#7c3aed",marginTop:2}}>{r.makers?.length||0} makers</div></button>)}</div>
                </div>
          )}
          {maker&&<MakerSheet maker={maker} onClose={()=>setMaker(null)}/>}
          {tab==="profile"&&<ProfileTab/>}
          {content&&<ContentDetail content={content} onClose={()=>setContent(null)}/>}
          {mood&&region&&<MoodFinder region={region} onClose={()=>setMood(false)}/>}
        </div>}
      </div>

      {/* FAB */}
      {showFab&&<button onClick={()=>setAddFlow(true)} className="fab" style={{position:"absolute",bottom:72,right:14,zIndex:300,width:54,height:54,borderRadius:"50%",background:"linear-gradient(135deg,#fb923c,#ef4444)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Plus size={24} color="#fff" strokeWidth={2.5}/></button>}
      {addFlow&&<AddSpotFlow onClose={()=>setAddFlow(false)}/>}

      {/* Bottom Nav */}
      <div style={{background:"rgba(8,14,22,0.97)",backdropFilter:"blur(20px)",borderTop:"1px solid rgba(255,255,255,0.05)",display:"flex",padding:"6px 0",zIndex:250,flexShrink:0}}>
        {TABS.map(t=><button key={t.id} onClick={()=>{setTab(t.id);if(t.id!=="map")clearAll();}} style={{flex:1,background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"5px 0",color:tab===t.id?"#22c55e":"#4b5563"}}><div style={{transform:tab===t.id?"scale(1.12)":"scale(1)",transition:"transform .18s"}}>{t.icon}</div><span style={{fontSize:9,fontWeight:600}}>{t.label}</span></button>)}
      </div>
    </div>
  );
}
