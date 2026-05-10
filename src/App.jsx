import { useState, useMemo, useRef, useEffect, useCallback } from "react";

/* ══════════════════════════════════════════════════════════
   AIRIS v3 — Ultimate Small Business Inventory App
   Features: KPI Dashboard, Stock In/Out, Expenses, Customers,
   WhatsApp Invoice, Expiry Tracker, Daily P&L
   ══════════════════════════════════════════════════════════ */

const IMGS = {
  "Aice Chocolate": "https://images.tokopedia.net/img/cache/700/VqbcmM/2022/10/5/8b825fdd-9c5a-474b-a67f-1ebe94b0c068.jpg",
  "Aice Matcha": "https://images.tokopedia.net/img/cache/700/VqbcmM/2023/3/28/9056e0c4-eb08-44e5-a01f-f3d6c6a7e41a.jpg",
  "Aice Milk Melon": "https://images.tokopedia.net/img/cache/700/VqbcmM/2022/6/14/c96b72ef-3cff-4147-8ff7-7e4ed6073fb7.jpg",
  "Aice Red Bean": "https://images.tokopedia.net/img/cache/700/VqbcmM/2022/10/5/d08939cd-a2ce-4df4-bbb7-53c5c1d4e9fe.jpg",
  "Aice Mango": "https://images.tokopedia.net/img/cache/700/VqbcmM/2022/6/14/78f12ef5-d42e-4b70-8aa3-a28b9bb1c9e7.jpg",
};
const fallbackSvg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' fill='%230057D9' viewBox='0 0 24 24'%3E%3Cpath d='M12 3 4.5 7.1 12 11.2l7.5-4.1Z'/%3E%3Cpath d='M4.5 7.1v9.2L12 21l7.5-4.7V7.1' fill='none' stroke='%230057D9' stroke-width='1.5'/%3E%3C/svg%3E";

const users = [
  { id: 1, name: "Admin User", email: "admin@airis.local" },
  { id: 2, name: "Outlet Manager", email: "manager@airis.local" },
  { id: 3, name: "Storekeeper", email: "store@airis.local" },
];

const today = new Date();
const daysFromNow = d => { const dt = new Date(today); dt.setDate(dt.getDate() + d); return dt.toISOString().split("T")[0]; };

const defaultItems = [];

const defaultCustomers = [];

const defaultExpenses = [];

const defaultStockLog = [];

const defaultProjects = [];

// ─── Helpers ───
const fmt = v => "RM " + Number(v || 0).toLocaleString("en-MY");
const num = v => Number(v || 0).toLocaleString("en-MY");
function daysUntil(dateStr) { if (!dateStr) return 999; const d = new Date(dateStr); const now = new Date(); now.setHours(0,0,0,0); d.setHours(0,0,0,0); return Math.ceil((d - now) / 86400000); }
function expiryStatus(dateStr) { const d = daysUntil(dateStr); if (d < 0) return { label: "EXPIRED", color: "red", urgent: true }; if (d <= 3) return { label: `${d}d left`, color: "red", urgent: true }; if (d <= 7) return { label: `${d}d left`, color: "yellow", urgent: false }; return { label: `${d}d left`, color: "green", urgent: false }; }
function parseCoords(s) { const m = String(s||"").match(/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/); return m ? { lat: +m[1], lng: +m[2] } : null; }
function osmUrl(lat, lng) { return `https://www.google.com/maps?q=${lat},${lng}`; }
function MapCard({ lat, lng, name }) {
  return (
    <a href={`https://www.google.com/maps?q=${lat},${lng}`} target="_blank" rel="noreferrer" className="block rounded-2xl overflow-hidden" style={{ border: "1px solid var(--cb)", background: "var(--sub)" }}>
      <div className="p-3 flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl" style={{ background: "var(--bbg)", color: "var(--bt)" }}><Ic name="mapPin" size={24} /></div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold truncate" style={{ color: "var(--tx)" }}>{name || "View Location"}</div>
          <div className="text-[10px]" style={{ color: "var(--ac)" }}>{(+lat).toFixed(5)}, {(+lng).toFixed(5)}</div>
        </div>
        <div className="text-[10px] font-bold px-2.5 py-1.5 rounded-lg" style={{ background: "var(--bbg)", color: "var(--ac)" }}>Open Maps ↗</div>
      </div>
    </a>
  );
}
function waLink(phone, text) { return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`; }

// ─── Persistent Storage ───
function useP(key, fallback) {
  const [val, setVal] = useState(fallback);
  const [ok, setOk] = useState(false);
  useEffect(() => { 
    try { 
      const r = localStorage.getItem(key); 
      if (r) setVal(JSON.parse(r)); 
    } catch {} 
    setOk(true); 
  }, [key]);
  const save = useCallback(nv => { 
    const r = typeof nv === "function" ? nv(val) : nv; 
    setVal(r); 
    try { localStorage.setItem(key, JSON.stringify(r)); } catch {} 
    return r; 
  }, [key, val]);
  return [val, save, ok];
}

// ─── Icons ───
function Ic({ name, size = 20, className = "" }) {
  const s = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round", strokeLinejoin: "round", className };
  const f = { width: size, height: size, viewBox: "0 0 24 24", className };
  const m = {
    home: <svg {...f} fill="currentColor"><path d="M3 10.8 12 3l9 7.8v9.1a1.1 1.1 0 0 1-1.1 1.1h-5.2v-6.2H9.3V21H4.1A1.1 1.1 0 0 1 3 19.9v-9.1Z"/></svg>,
    package: <svg {...s}><path d="M12 3 4.5 7.1 12 11.2l7.5-4.1L12 3Z"/><path d="M4.5 7.1v9.2L12 21l7.5-4.7V7.1"/><path d="M12 11.2V21"/></svg>,
    chart: <svg {...s}><path d="M4 19h16"/><path d="M6 16v-5"/><path d="M12 16V7"/><path d="M18 16V4"/></svg>,
    clipboard: <svg {...s}><rect x="5" y="4" width="14" height="16" rx="2"/><path d="M9 4.5h6"/><path d="M8.5 10h7"/><path d="M8.5 14h5"/></svg>,
    mapPin: <svg {...f} fill="currentColor"><path d="M12 2.5c-4 0-7.2 3.1-7.2 7 0 5.2 7.2 12 7.2 12s7.2-6.8 7.2-12c0-3.9-3.2-7-7.2-7Zm0 9.8a2.8 2.8 0 1 1 0-5.6 2.8 2.8 0 0 1 0 5.6Z"/></svg>,
    scan: <svg {...s}><path d="M7 3H5a2 2 0 0 0-2 2v2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M7 9h10"/><path d="M7 12h10"/><path d="M7 15h10"/></svg>,
    bell: <svg {...f} fill="currentColor"><path d="M12 22a2.8 2.8 0 0 0 2.7-2H9.3A2.8 2.8 0 0 0 12 22ZM18 16.6V11a6 6 0 0 0-4.6-5.8V4a1.4 1.4 0 0 0-2.8 0v1.2A6 6 0 0 0 6 11v5.6L4.5 18v1h15v-1L18 16.6Z"/></svg>,
    share: <svg {...s}><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.7 10.7 15.3 6.3"/><path d="M8.7 13.3 15.3 17.7"/></svg>,
    reports: <svg {...f} fill="currentColor"><rect x="4" y="11" width="4" height="9" rx="1"/><rect x="10" y="6" width="4" height="14" rx="1"/><rect x="16" y="3" width="4" height="17" rx="1"/></svg>,
    cart: <svg {...s}><path d="M6 6h15l-1.5 8H8L6 3H3"/><circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/></svg>,
    user: <svg {...s}><circle cx="12" cy="8" r="4"/><path d="M4 21c1.8-4.2 5-6 8-6s6.2 1.8 8 6"/></svg>,
    users: <svg {...s}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    search: <svg {...s}><circle cx="10.5" cy="10.5" r="6"/><path d="m15.5 15.5 4 4"/></svg>,
    filter: <svg {...s}><path d="M4 6h16"/><path d="M7 12h10"/><path d="M10 18h4"/></svg>,
    plus: <svg {...s}><path d="M12 5v14"/><path d="M5 12h14"/></svg>,
    camera: <svg {...s}><path d="M6 8h2l1.5-2h5L16 8h2a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Z"/><circle cx="12" cy="13" r="3"/></svg>,
    check: <svg {...s}><path d="M20 6 9 17l-5-5"/></svg>,
    moon: <svg {...s}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
    sun: <svg {...f} fill="currentColor"><circle cx="12" cy="12" r="5"/><g stroke="currentColor" strokeWidth="2"><path d="M12 1v2"/><path d="M12 21v2"/><path d="M4.22 4.22l1.42 1.42"/><path d="M18.36 18.36l1.42 1.42"/><path d="M1 12h2"/><path d="M21 12h2"/><path d="M4.22 19.78l1.42-1.42"/><path d="M18.36 5.64l1.42-1.42"/></g></svg>,
    logout: <svg {...s}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
    refresh: <svg {...s}><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
    trending: <svg {...s}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
    whatsapp: <svg {...f} fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>,
    receipt: <svg {...s}><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M8 10h8"/><path d="M8 14h4"/></svg>,
    wallet: <svg {...s}><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M16 12h.01"/><path d="M2 10h20"/></svg>,
    clock: <svg {...s}><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>,
    alert: <svg {...s}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
    arrowIn: <svg {...s}><path d="M12 5v14"/><path d="M5 12l7 7 7-7"/></svg>,
    arrowOut: <svg {...s}><path d="M12 19V5"/><path d="M5 12l7-7 7 7"/></svg>,
    star: <svg {...f} fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>,
    phone: <svg {...s}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
    dollar: <svg {...s}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  };
  return m[name] || <span style={{ width: size, height: size }} />;
}

// ─── Components ───
const FadeIn = ({ children, delay = 0, className = "" }) => <div className={className} style={{ animation: `aiFU 0.4s ${delay}s both cubic-bezier(0.16,1,0.3,1)` }}>{children}</div>;
const Btn = ({ children, variant = "primary", className = "", ...p }) => {
  const base = "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold transition-all duration-200 active:scale-[0.96] disabled:opacity-40 select-none";
  const bg = variant === "primary" ? { background: "linear-gradient(135deg, var(--a2), var(--ac))" } : variant === "danger" ? { background: "#EF4444" } : {};
  const cls = variant === "primary" ? "text-white shadow-lg" : variant === "danger" ? "text-white shadow-lg" : variant === "outline" ? "border" : "text-white/80";
  return <button type="button" className={`${base} ${cls} ${className}`} style={{ ...bg, borderColor: "var(--ib)", color: variant === "outline" ? "var(--ac)" : variant === "secondary" ? "var(--ac)" : undefined, background: variant === "secondary" ? "var(--cd)" : variant === "outline" ? "var(--cd)" : bg.background }} {...p}>{children}</button>;
};
const Btn2 = ({ children, active, onClick, className = "" }) => <button type="button" onClick={onClick} className={`rounded-full px-3 py-1.5 text-xs font-bold transition-all ${className}`} style={{ background: active ? "var(--bbg)" : "var(--cd)", color: active ? "var(--bt)" : "var(--t3)" }}>{children}</button>;
const Inp = ({ className = "", ...p }) => <input className={`w-full rounded-2xl border px-4 py-3 text-sm font-medium outline-none transition-all placeholder:font-normal ${className}`} style={{ background: "var(--ib2)", borderColor: "var(--ib)", color: "var(--tx)" }} {...p} />;
const Sel = ({ className = "", children, ...p }) => <select className={`w-full rounded-2xl border px-4 py-3 text-sm font-medium outline-none ${className}`} style={{ background: "var(--ib2)", borderColor: "var(--ib)", color: "var(--tx)" }} {...p}>{children}</select>;
const Badge = ({ children, color = "blue" }) => {
  const c = { blue: { background: "var(--bbg)", color: "var(--bt)" }, green: { background: "rgba(22,163,74,0.12)", color: "#16A34A" }, red: { background: "rgba(239,68,68,0.12)", color: "#EF4444" }, yellow: { background: "rgba(234,179,8,0.12)", color: "#CA8A04" }, slate: { background: "rgba(100,116,139,0.1)", color: "var(--t2)" }, white: { background: "var(--cd)", color: "var(--t2)" } };
  return <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold" style={c[color] || c.blue}>{children}</span>;
};
const Card = ({ children, className = "", onDel }) => <div className={`rounded-3xl relative ${className}`} style={{ background: "var(--cd)", border: "1px solid var(--cb)", boxShadow: "0 6px 28px rgba(0,40,100,0.05)" }}>{children}{onDel && <button type="button" onClick={onDel} className="absolute right-2 top-2 z-20 flex h-5 w-5 items-center justify-center rounded-full" style={{background:"#EF4444",color:"white",boxShadow:"0 2px 8px rgba(239,68,68,0.4)"}} aria-label="Delete"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg></button>}</div>;
const SH = ({ title, action }) => <div className="flex items-center justify-between"><h2 className="text-sm font-extrabold" style={{ color: "var(--tx)" }}>{title}</h2>{action && <button type="button" className="text-xs font-bold" style={{ color: "var(--ac)" }}>{action}</button>}</div>;
const Shell = ({ title, subtitle, dark, children }) => <div><section className="rounded-b-[38px] px-5 pb-12 pt-8 text-white" style={{ background: dark ? "linear-gradient(135deg,#0C1222,#162240 50%,#0C1222)" : "linear-gradient(135deg,#0047B3,#0057D9 40%,#002E7A)" }}><h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>{subtitle && <p className="mt-1 text-sm opacity-60">{subtitle}</p>}</section><section className="-mt-5 space-y-4 px-5 pt-1 pb-6">{children}</section></div>;
const PImg = ({ name, size = "h-14 w-14", r = "rounded-xl" }) => <img src={IMGS[name] || fallbackSvg} alt={name} className={`${size} ${r} object-cover shrink-0`} style={{ background: "linear-gradient(135deg,#E8F0FE,#D4E4FC)" }} onError={e => { e.target.src = fallbackSvg; }} loading="lazy" />;

function DatePicker({ value, onChange, placeholder = "Select date" }) {
  const [open, setOpen] = useState(false);
  const parsed = value ? new Date(value + "T00:00:00") : null;
  const [viewYear, setViewYear] = useState(() => parsed ? parsed.getFullYear() : new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => parsed ? parsed.getMonth() : new Date().getMonth());
  const [showYM, setShowYM] = useState(false);

  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const WDAYS = ["Su","Mo","Tu","We","Th","Fr","Sa"];
  const daysIn = new Date(viewYear, viewMonth + 1, 0).getDate();
  const first = new Date(viewYear, viewMonth, 1).getDay();
  const cells = [...Array(first).fill(null), ...Array.from({length: daysIn}, (_, i) => i + 1)];
  const yrStart = Math.floor(viewYear / 12) * 12;

  const pick = (day) => {
    onChange(`${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
    setOpen(false);
  };
  const prev = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); } else setViewMonth(viewMonth - 1); };
  const next = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); } else setViewMonth(viewMonth + 1); };
  const isSel = d => parsed && parsed.getFullYear() === viewYear && parsed.getMonth() === viewMonth && parsed.getDate() === d;
  const isTod = d => { const t = new Date(); return t.getFullYear() === viewYear && t.getMonth() === viewMonth && t.getDate() === d; };
  const display = value ? new Date(value + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "";

  const toggle = () => {
    if (!open && value) { const d = new Date(value + "T00:00:00"); setViewYear(d.getFullYear()); setViewMonth(d.getMonth()); }
    setShowYM(false);
    setOpen(!open);
  };

  return (
    <div>
      {/* Trigger button */}
      <button type="button" onClick={toggle} className="w-full rounded-2xl border px-4 py-3 text-left text-sm font-medium" style={{ background: "var(--ib2)", borderColor: open ? "var(--ac)" : "var(--ib)", color: value ? "var(--tx)" : "var(--t3)" }}>
        <div className="flex items-center justify-between"><span>{display || placeholder}</span><Ic name="clock" size={16} className="opacity-40"/></div>
      </button>

      {/* Inline calendar - renders right below */}
      {open && (
        <div className="mt-2 rounded-2xl p-3" style={{ background: "var(--cd)", border: "1px solid var(--cb)", boxShadow: "0 8px 28px rgba(0,30,80,0.12)" }}>

          {/* Month/Year header */}
          <div className="flex items-center justify-between mb-2">
            <button type="button" onClick={prev} className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: "var(--sub)" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <button type="button" onClick={() => setShowYM(!showYM)} className="text-sm font-extrabold px-3 py-1.5 rounded-lg" style={{ color: "var(--tx)", background: showYM ? "var(--bbg)" : "transparent" }}>
              {MONTHS[viewMonth]} {viewYear}
            </button>
            <button type="button" onClick={next} className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: "var(--sub)" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          </div>

          {showYM ? <>
            {/* Year grid */}
            <div className="flex items-center justify-between mb-2">
              <button type="button" onClick={() => setViewYear(yrStart - 12)} className="text-[11px] font-bold" style={{ color: "var(--ac)" }}>←</button>
              <span className="text-[11px] font-bold" style={{ color: "var(--t3)" }}>{yrStart}–{yrStart + 11}</span>
              <button type="button" onClick={() => setViewYear(yrStart + 12)} className="text-[11px] font-bold" style={{ color: "var(--ac)" }}>→</button>
            </div>
            <div className="grid grid-cols-4 gap-1.5 mb-2">
              {Array.from({length:12},(_,i)=>yrStart+i).map(y => <button key={y} type="button" onClick={() => setViewYear(y)} className="rounded-lg py-2 text-xs font-bold" style={{ background: y === viewYear ? "var(--ac)" : "var(--sub)", color: y === viewYear ? "white" : "var(--tx)" }}>{y}</button>)}
            </div>
            {/* Month grid */}
            <div className="grid grid-cols-4 gap-1.5">
              {MONTHS.map((m, i) => <button key={m} type="button" onClick={() => { setViewMonth(i); setShowYM(false); }} className="rounded-lg py-2 text-xs font-bold" style={{ background: i === viewMonth ? "var(--ac)" : "var(--sub)", color: i === viewMonth ? "white" : "var(--tx)" }}>{m}</button>)}
            </div>
          </> : <>
            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-0.5 mb-1">
              {WDAYS.map(d => <div key={d} className="text-center text-[10px] font-bold py-1" style={{ color: "var(--t3)" }}>{d}</div>)}
            </div>
            {/* Day cells */}
            <div className="grid grid-cols-7 gap-0.5">
              {cells.map((day, i) => day ? (
                <button key={i} type="button" onClick={() => pick(day)} className="flex h-9 items-center justify-center rounded-lg text-xs font-bold" style={{
                  background: isSel(day) ? "var(--ac)" : isTod(day) ? "var(--bbg)" : "transparent",
                  color: isSel(day) ? "white" : isTod(day) ? "var(--ac)" : "var(--tx)",
                }}>{day}</button>
              ) : <div key={i} />)}
            </div>
          </>}

          {/* Footer */}
          <div className="flex gap-2 mt-2 pt-2" style={{ borderTop: "1px solid var(--cb)" }}>
            <button type="button" onClick={() => { const t = new Date(); setViewYear(t.getFullYear()); setViewMonth(t.getMonth()); pick(t.getDate()); }} className="flex-1 rounded-lg py-1.5 text-[11px] font-bold text-center" style={{ background: "var(--bbg)", color: "var(--ac)" }}>Today</button>
            <button type="button" onClick={() => { onChange(""); setOpen(false); }} className="flex-1 rounded-lg py-1.5 text-[11px] font-bold text-center" style={{ background: "var(--sub)", color: "var(--t3)" }}>Clear</button>
          </div>
        </div>
      )}
    </div>
  );
}

function PlaceSearch({ onSelect, locationName = "", coordinates = "" }) {
  const [query, setQuery] = useState(locationName);
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(coordinates ? { name: locationName, lat: coordinates.split(",")[0], lon: coordinates.split(",")[1] } : null);
  const [showManual, setShowManual] = useState(false);
  const [manualCoords, setManualCoords] = useState(coordinates);

  // Built-in places database (Malaysia focus + popular worldwide)
  const PLACES = [
    { name: "KLCC, Kuala Lumpur", lat: 3.1578, lon: 101.7117 },
    { name: "KL Tower, Kuala Lumpur", lat: 3.1529, lon: 101.7007 },
    { name: "KL Sentral, Kuala Lumpur", lat: 3.1343, lon: 101.6865 },
    { name: "Bukit Bintang, Kuala Lumpur", lat: 3.1466, lon: 101.7108 },
    { name: "Mid Valley, Kuala Lumpur", lat: 3.1182, lon: 101.6775 },
    { name: "Sunway Pyramid, Petaling Jaya", lat: 3.0733, lon: 101.6073 },
    { name: "IOI City Mall, Putrajaya", lat: 2.9694, lon: 101.7113 },
    { name: "Pavilion KL, Kuala Lumpur", lat: 3.1490, lon: 101.7133 },
    { name: "The Gardens Mall, KL", lat: 3.1178, lon: 101.6772 },
    { name: "1 Utama, Petaling Jaya", lat: 3.1504, lon: 101.6158 },
    { name: "Bangsar, Kuala Lumpur", lat: 3.1290, lon: 101.6710 },
    { name: "Mont Kiara, Kuala Lumpur", lat: 3.1730, lon: 101.6520 },
    { name: "Cheras, Kuala Lumpur", lat: 3.1073, lon: 101.7321 },
    { name: "Kepong, Kuala Lumpur", lat: 3.2087, lon: 101.6341 },
    { name: "Setapak, Kuala Lumpur", lat: 3.1892, lon: 101.7162 },
    { name: "Wangsa Maju, Kuala Lumpur", lat: 3.1965, lon: 101.7365 },
    { name: "Sri Petaling, Kuala Lumpur", lat: 3.0830, lon: 101.6920 },
    { name: "Puchong, Selangor", lat: 3.0443, lon: 101.6171 },
    { name: "Shah Alam, Selangor", lat: 3.0738, lon: 101.5183 },
    { name: "Klang, Selangor", lat: 3.0449, lon: 101.4455 },
    { name: "Subang Jaya, Selangor", lat: 3.0565, lon: 101.5851 },
    { name: "Cyberjaya, Selangor", lat: 2.9188, lon: 101.6538 },
    { name: "Putrajaya", lat: 2.9264, lon: 101.6964 },
    { name: "Petaling Jaya, Selangor", lat: 3.1073, lon: 101.6068 },
    { name: "Damansara, Selangor", lat: 3.1378, lon: 101.6154 },
    { name: "Kajang, Selangor", lat: 2.9927, lon: 101.7909 },
    { name: "Rawang, Selangor", lat: 3.3213, lon: 101.5767 },
    { name: "Ampang, Selangor", lat: 3.1500, lon: 101.7667 },
    { name: "Genting Highlands, Pahang", lat: 3.4236, lon: 101.7933 },
    { name: "Cameron Highlands, Pahang", lat: 4.4716, lon: 101.3794 },
    { name: "George Town, Penang", lat: 5.4141, lon: 100.3288 },
    { name: "Penang Hill, Penang", lat: 5.4233, lon: 100.2714 },
    { name: "Batu Ferringhi, Penang", lat: 5.4703, lon: 100.2427 },
    { name: "Gurney Plaza, Penang", lat: 5.4376, lon: 100.3109 },
    { name: "Queensbay Mall, Penang", lat: 5.3328, lon: 100.3066 },
    { name: "Johor Bahru, Johor", lat: 1.4927, lon: 103.7414 },
    { name: "Legoland, Johor", lat: 1.4312, lon: 103.6270 },
    { name: "Danga Bay, Johor", lat: 1.4617, lon: 103.7213 },
    { name: "Paradigm Mall JB, Johor", lat: 1.4637, lon: 103.7567 },
    { name: "Ipoh, Perak", lat: 4.5975, lon: 101.0901 },
    { name: "Melaka City, Melaka", lat: 2.1896, lon: 102.2501 },
    { name: "Kota Kinabalu, Sabah", lat: 5.9749, lon: 116.0724 },
    { name: "Kuching, Sarawak", lat: 1.5497, lon: 110.3592 },
    { name: "Kuala Terengganu, Terengganu", lat: 5.3117, lon: 103.1324 },
    { name: "Kota Bharu, Kelantan", lat: 6.1256, lon: 102.2385 },
    { name: "Alor Setar, Kedah", lat: 6.1210, lon: 100.3685 },
    { name: "Langkawi, Kedah", lat: 6.3500, lon: 99.8000 },
    { name: "Seremban, Negeri Sembilan", lat: 2.7258, lon: 101.9424 },
    { name: "Kuantan, Pahang", lat: 3.8077, lon: 103.3260 },
    { name: "Kangar, Perlis", lat: 6.4414, lon: 100.1986 },
    { name: "Taiping, Perak", lat: 4.8511, lon: 100.7364 },
    { name: "Miri, Sarawak", lat: 4.3995, lon: 114.0148 },
    { name: "Sandakan, Sabah", lat: 5.8402, lon: 118.1179 },
    { name: "Tawau, Sabah", lat: 4.2498, lon: 117.8871 },
    { name: "Labuan", lat: 5.2831, lon: 115.2308 },
    { name: "Artesa, Kuala Lumpur", lat: 3.1390, lon: 101.6869 },
    { name: "MITEC, Kuala Lumpur", lat: 3.1578, lon: 101.7330 },
    { name: "Dewan Seri Angkasa, KL", lat: 3.1529, lon: 101.7010 },
    { name: "PWTC, Kuala Lumpur", lat: 3.1683, lon: 101.6935 },
    { name: "Merdeka 118, Kuala Lumpur", lat: 3.1415, lon: 101.7005 },
    { name: "TRX Exchange, Kuala Lumpur", lat: 3.1425, lon: 101.7190 },
    { name: "Ara Damansara, Selangor", lat: 3.1109, lon: 101.5901 },
    { name: "Bandar Utama, Selangor", lat: 3.1340, lon: 101.6060 },
    { name: "Setia Alam, Selangor", lat: 3.1037, lon: 101.4620 },
    { name: "Bukit Jalil, Kuala Lumpur", lat: 3.0583, lon: 101.6910 },
    { name: "Singapore", lat: 1.3521, lon: 103.8198 },
    { name: "Bangkok, Thailand", lat: 13.7563, lon: 100.5018 },
    { name: "Jakarta, Indonesia", lat: -6.2088, lon: 106.8456 },
    { name: "Tokyo, Japan", lat: 35.6762, lon: 139.6503 },
    { name: "Dubai, UAE", lat: 25.2048, lon: 55.2708 },
    { name: "London, UK", lat: 51.5074, lon: -0.1278 },
    { name: "New York, USA", lat: 40.7128, lon: -74.0060 },
  ];

  const doSearch = (q) => {
    if (!q || q.length < 2) { setResults([]); return; }
    const lower = q.toLowerCase();
    const found = PLACES.filter(p => p.name.toLowerCase().includes(lower)).slice(0, 6);
    setResults(found);
  };

  const onType = (val) => {
    setQuery(val);
    setSelected(null);
    setShowManual(false);
    doSearch(val);
  };

  const pick = (place) => {
    setQuery(place.name);
    setSelected(place);
    setResults([]);
    onSelect({ locationName: place.name, coordinates: `${place.lat},${place.lon}`, lat: +place.lat, lng: +place.lon });
  };

  const submitManual = () => {
    const c = parseCoords(manualCoords);
    if (!c) return;
    onSelect({ locationName: query || "Custom Location", coordinates: manualCoords, lat: c.lat, lng: c.lng });
    setSelected({ name: query || "Custom", lat: c.lat, lon: c.lng });
    setShowManual(false);
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <span className="absolute left-3 top-3.5" style={{ color: "var(--t3)" }}><Ic name="search" size={16} /></span>
        <input className="w-full rounded-2xl border pl-9 pr-4 py-3 text-sm font-medium outline-none placeholder:font-normal" style={{ background: "var(--ib2)", borderColor: "var(--ib)", color: "var(--tx)" }} placeholder="Search location (KLCC, Penang, JB...)" value={query} onChange={e => onType(e.target.value)} />
      </div>

      {results.length > 0 && !selected && (
        <div className="rounded-2xl overflow-hidden" style={{ background: "var(--cd)", border: "1px solid var(--cb)", boxShadow: "0 8px 24px rgba(0,30,80,0.12)" }}>
          {results.map((place, i) => (
            <button key={i} type="button" onClick={() => pick(place)} className="w-full flex items-center gap-2.5 p-3 text-left" style={{ borderBottom: i < results.length - 1 ? "1px solid var(--cb)" : "none" }}>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: "var(--bbg)", color: "var(--bt)" }}><Ic name="mapPin" size={14} /></div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold truncate" style={{ color: "var(--tx)" }}>{place.name}</div>
                <div className="text-[10px]" style={{ color: "var(--ac)" }}>{place.lat.toFixed(4)}, {place.lon.toFixed(4)}</div>
              </div>
            </button>
          ))}
          <button type="button" onClick={() => { setResults([]); setShowManual(true); }} className="w-full p-2.5 text-center text-[11px] font-bold" style={{ color: "var(--t3)", borderTop: "1px solid var(--cb)" }}>Can't find? Enter coordinates manually</button>
        </div>
      )}

      {query.length >= 2 && results.length === 0 && !selected && !showManual && (
        <button type="button" onClick={() => setShowManual(true)} className="w-full rounded-2xl p-3 text-center text-[11px] font-bold" style={{ background: "var(--sub)", color: "var(--ac)", border: "1px dashed var(--ib)" }}>
          "{query}" not found — tap to enter coordinates manually
        </button>
      )}

      {showManual && !selected && (
        <div className="rounded-2xl p-3 space-y-2" style={{ background: "var(--sub)", border: "1px dashed var(--ib)" }}>
          <div className="text-[11px] font-bold" style={{ color: "var(--t3)" }}>Enter GPS coordinates:</div>
          <div className="flex gap-2">
            <input className="flex-1 rounded-xl border px-3 py-2.5 text-sm font-medium outline-none" style={{ background: "var(--ib2)", borderColor: "var(--ib)", color: "var(--tx)" }} placeholder="3.1390,101.6869" value={manualCoords} onChange={e => setManualCoords(e.target.value)} />
            <button type="button" onClick={submitManual} className="rounded-xl px-4 py-2.5 text-xs font-bold text-white" style={{ background: "var(--ac)" }}>Set</button>
          </div>
          <div className="text-[9px]" style={{ color: "var(--t3)" }}>Tip: Copy from Google Maps → Share → copy coordinates</div>
        </div>
      )}

      {selected && (
        <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--cb)" }}>
          <a href={`https://www.google.com/maps?q=${selected.lat},${selected.lon}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3" style={{ background: "rgba(22,163,74,0.06)" }}>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: "rgba(22,163,74,0.12)", color: "#16A34A" }}><Ic name="check" size={20} /></div>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-bold truncate" style={{ color: "var(--tx)" }}>{query}</div>
              <div className="text-[10px]" style={{ color: "var(--ac)" }}>{(+selected.lat).toFixed(5)}, {(+selected.lon).toFixed(5)}</div>
              <div className="text-[9px]" style={{ color: "var(--t3)" }}>Tap to view in Google Maps ↗</div>
            </div>
          </a>
          <button type="button" onClick={() => { setSelected(null); setQuery(""); setShowManual(false); onSelect({ locationName: "", coordinates: "", lat: 0, lng: 0 }); }} className="w-full text-center py-2 text-[10px] font-bold" style={{ background: "var(--cd)", color: "#EF4444", borderTop: "1px solid var(--cb)" }}>Change Location</button>
        </div>
      )}
    </div>
  );
}

function RingChart({ percent, size = 64, stroke = 7, color = "var(--ac)" }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (Math.min(percent, 100) / 100) * c;
  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--ib)" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round" style={{ transition: "stroke-dashoffset 1s ease" }} />
    </svg>
  );
}

function LineChart({ data, max, dark }) {
  const pts = data.map((r, i) => `${data.length === 1 ? 50 : (i / (data.length - 1)) * 100},${88 - (r.revenue / max) * 70}`).join(" ");
  return (
    <div className="rounded-2xl p-3" style={{ background: dark ? "rgba(59,130,246,0.05)" : "rgba(0,87,217,0.03)" }}>
      <svg viewBox="0 0 100 100" className="h-36 w-full overflow-visible">
        <defs><linearGradient id="rvF3" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="var(--ac)" stopOpacity="0.18" /><stop offset="100%" stopColor="var(--ac)" stopOpacity="0.01" /></linearGradient></defs>
        <polyline points={`0,92 ${pts} 100,92`} fill="url(#rvF3)" />
        <polyline points={pts} fill="none" stroke="var(--ac)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        {data.map((r, i) => { const x = data.length === 1 ? 50 : (i / (data.length - 1)) * 100; return <circle key={i} cx={x} cy={88 - (r.revenue / max) * 70} r="2.8" fill="var(--cd)" stroke="var(--ac)" strokeWidth="2" />; })}
      </svg>
    </div>
  );
}

// ─── Swipe ───
function useSwipe(onL, onR) {
  const ref = useRef(null); const st = useRef({ x: 0, y: 0 });
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const ts = e => { st.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; };
    const te = e => { const dx = e.changedTouches[0].clientX - st.current.x; if (Math.abs(dx) > 60 && Math.abs(e.changedTouches[0].clientY - st.current.y) < 80) dx < 0 ? onL?.() : onR?.(); };
    el.addEventListener("touchstart", ts, { passive: true }); el.addEventListener("touchend", te, { passive: true });
    return () => { el.removeEventListener("touchstart", ts); el.removeEventListener("touchend", te); };
  }, [onL, onR]);
  return ref;
}

function Styles({ dark }) {
  return <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
    @keyframes aiFU { from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)} }
    @keyframes aiSD { from{opacity:0;transform:translateY(-20px)}to{opacity:1;transform:translateY(0)} }
    @keyframes aiPulse { 0%,100%{transform:scale(1)}50%{transform:scale(1.05)} }
    @keyframes aiGlow { 0%,100%{box-shadow:0 0 20px rgba(0,87,217,0.15)}50%{box-shadow:0 0 32px rgba(0,87,217,0.3)} }
    @keyframes marquee { 0%{transform:translateX(0%)}100%{transform:translateX(-50%)} }
    .animate-marquee { animation: marquee 30s linear infinite; }
    .aiR { font-family:'Plus Jakarta Sans',system-ui,sans-serif; }
    .aiR *::-webkit-scrollbar{width:4px;height:4px} .aiR *::-webkit-scrollbar-thumb{background:rgba(0,0,0,0.15);border-radius:4px}
    ${dark ? `.aiR{--bg:#0C1222;--bg2:#111827;--cd:#1A2540;--cb:rgba(255,255,255,0.06);--tx:#E8EDF5;--t2:#8896B0;--t3:#5A6A84;--ac:#3B82F6;--a2:#2563EB;--bbg:rgba(59,130,246,0.15);--bt:#60A5FA;--ib:rgba(255,255,255,0.08);--ib2:#1A2540;--nav:rgba(12,18,34,0.96);--sub:rgba(59,130,246,0.06)}` : `.aiR{--bg:#EFF4FF;--bg2:#F7FAFF;--cd:#FFFFFF;--cb:rgba(0,70,180,0.05);--tx:#0F1D35;--t2:#5A6B85;--t3:#94A3B8;--ac:#0057D9;--a2:#0047B3;--bbg:rgba(0,87,217,0.08);--bt:#0057D9;--ib:#E2E8F0;--ib2:#FFFFFF;--nav:rgba(255,255,255,0.96);--sub:rgba(0,87,217,0.03)}`}
  `}</style>;
}

// ════════════════════════════
//  MAIN APP
// ════════════════════════════
export default function App() {
  const [dark, setDark] = useState(false);
  const [announcements, setAnnouncements] = useP("ai_announce4", [
    "🎉 Welcome to AIRIS - Your Smart Inventory System!",
    "📦 Free delivery for orders above RM500",
    "❄️ Keep Aice products frozen at -18°C for best quality"
  ]);
  const [announceSyncUrl, setAnnounceSyncUrl] = useP("ai_announce_url4", "");
  const [lastSync, setLastSync] = useP("ai_last_sync4", "");
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPassword] = useState("aice2024"); // Change this to your password
  const [adBanners, setAdBanners] = useP("ai_ads4", [
    {type:"text", content:"🛒 Shop now and get FREE delivery!"},
    {type:"text", content:"💰 Special discount this week only!"},
    {type:"text", content:"❄️ Fresh Aice Ice Cream Daily"}
  ]);
  const [outlets, setOutlets] = useP("ai_outlets4", [
    {id:1, name:"Aice Premium Store KL", image:"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200'%3E%3Cdefs%3E%3ClinearGradient id='g1' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%234F46E5'/%3E%3Cstop offset='100%25' style='stop-color:%237C3AED'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='300' height='200' fill='url(%23g1)'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' fill='white' font-size='24' font-weight='bold' dy='.3em'%3E🍦 KL Store%3C/text%3E%3C/svg%3E", distance:"2.5 km", discount:"30% off"},
    {id:2, name:"Aice Express Subang", image:"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200'%3E%3Cdefs%3E%3ClinearGradient id='g2' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%2310B981'/%3E%3Cstop offset='100%25' style='stop-color:%2314B8A6'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='300' height='200' fill='url(%23g2)'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' fill='white' font-size='24' font-weight='bold' dy='.3em'%3E🍨 Subang%3C/text%3E%3C/svg%3E", distance:"3.8 km", discount:"20% off"},
    {id:3, name:"Aice Bangsar Outlet", image:"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200'%3E%3Cdefs%3E%3ClinearGradient id='g3' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23EC4899'/%3E%3Cstop offset='100%25' style='stop-color:%23F43F5E'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='300' height='200' fill='url(%23g3)'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' fill='white' font-size='24' font-weight='bold' dy='.3em'%3E🍧 Bangsar%3C/text%3E%3C/svg%3E", distance:"1.2 km", discount:"15% off"},
    {id:4, name:"Aice Mont Kiara", image:"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200'%3E%3Cdefs%3E%3ClinearGradient id='g4' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23F59E0B'/%3E%3Cstop offset='100%25' style='stop-color:%23EF4444'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='300' height='200' fill='url(%23g4)'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' fill='white' font-size='24' font-weight='bold' dy='.3em'%3E🍦 Mont Kiara%3C/text%3E%3C/svg%3E", distance:"4.1 km", discount:"25% off"},
  ]);
  const [selectedOutlet, setSelectedOutlet] = useState(null);
  const [salesPeriod, setSalesPeriod] = useState("overall"); // monthly, yearly, overall
  const [selectedSale, setSelectedSale] = useState(null);

  // Migrate old ad format to new format
  useEffect(() => {
    if (adBanners.length > 0 && typeof adBanners[0] === 'string') {
      // Old format detected - convert to new format
      setAdBanners(adBanners.map(msg => ({type:"text", content:msg})));
    }
  }, []);

  // Auto-sync announcements from URL on app start
  useEffect(() => {
    if (announceSyncUrl) {
      const syncAnnouncements = async () => {
        try {
          const res = await fetch(announceSyncUrl);
          if (!res.ok) throw new Error();
          const data = await res.json();
          if (Array.isArray(data.announcements) && data.announcements.length > 0) {
            setAnnouncements(data.announcements);
            setLastSync(new Date().toLocaleString());
          }
        } catch (err) {
          console.error("Announcement sync failed:", err);
        }
      };
      syncAnnouncements();
    }
  }, []);
  const allTabs = ["home","inventory","scan","sales","more"];
  const [tab, setTab] = useState("home");
  const [subTab, setSubTab] = useState(null); // for "more" sub-pages
  const [user, setUser, uOk] = useP("ai_user4", null);
  const [items, setItems, iOk] = useP("ai_items4", defaultItems);
  const [sales, setSales] = useP("ai_sales4", []);
  const [customers, setCustomers] = useP("ai_cust4", defaultCustomers);
  const [expenses, setExpenses] = useP("ai_exp4", defaultExpenses);
  const [stockLog, setStockLog] = useP("ai_slog4", defaultStockLog);
  const [projects, setProjects] = useP("ai_proj4", defaultProjects);
  const [toast, setToast] = useState("");
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("All");
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  
  // User accounts - in production, this would be in a database
  const [userAccounts, setUserAccounts] = useP("ai_users4", [
    { username: "admin", password: "aice2024", name: "Admin", role: "Admin", email: "admin@airis.local", phone: "", bankName: "", accountNo: "", accountName: "" },
    { username: "staff", password: "staff123", name: "Staff User", role: "Staff", email: "staff@airis.local", phone: "", bankName: "", accountNo: "", accountName: "" },
    { username: "demo", password: "demo", name: "Demo User", role: "Viewer", email: "demo@airis.local", phone: "", bankName: "", accountNo: "", accountName: "" }
  ]);
  
  // Partner Payments Tracking
  const [partnerPayments, setPartnerPayments] = useP("ai_payments4", []);
  const [paymentModal, setPaymentModal] = useState(null);
  const [bankSetupModal, setBankSetupModal] = useState(false);
  const [qrPayment, setQrPayment] = useState(null);

  // Forms
  const [newItem, setNI] = useState({ code:"",name:"",category:"Aice",unit:"Cartons",qty:"",cost:"",sell:"",minStock:"",barcode:"",rfid:"",expiry:"" });
  const [saleForm, setSF] = useState({ productName: "", qty: "1", customerName: "", deliveryCost: "", notes: "" });
  const [stockForm, setSLF] = useState({ type:"IN", itemName: "", qty:"", note:"" });
  const [expForm, setEF] = useState({ category:"Rent", desc:"", amount:"" });
  const [custForm, setCF] = useState({ name:"", phone:"", location:"" });
  const [selProjId, setSelProjId] = useState(1);
  const [shareProject, setShareProject] = useState(null);
  const [invoices, setInvoices] = useP("ai_inv4", []);
  const [invForm, setIF] = useState({ buyerName:"", buyerPhone:"", eventLocation:"", eventDate:"", packages:[{ name:"", qty:"1", price:"" }], transportCost:"", notes:"" });
  const [previewInv, setPreviewInv] = useState(null);
  const [projForm, setPF] = useState({ code:"", name:"", locationName:"", coordinates:"", visibility:"Local", eventDate:"", notes:"", selectedItems:[], transportCost:"" });

  const swRef = useSwipe(
    () => { const i = allTabs.indexOf(tab); if (i < allTabs.length - 1) { setTab(allTabs[i + 1]); setSubTab(null); } },
    () => { const i = allTabs.indexOf(tab); if (i > 0) { setTab(allTabs[i - 1]); setSubTab(null); } }
  );

  const flash = m => { setToast(m); setTimeout(() => setToast(""), 2200); };
  
  const syncAnnouncementsNow = async () => {
    if (!announceSyncUrl) return flash("No sync URL configured");
    flash("Syncing...");
    try {
      // Try direct fetch first
      let url = announceSyncUrl;
      let res = await fetch(url, {
        method: 'GET',
        cache: 'no-cache',
      }).catch(() => null);
      
      // If direct fails, try with CORS proxy
      if (!res || !res.ok) {
        url = `https://api.allorigins.win/raw?url=${encodeURIComponent(announceSyncUrl)}`;
        res = await fetch(url, { method: 'GET', cache: 'no-cache' });
      }
      
      if (!res || !res.ok) {
        throw new Error(`Cannot reach URL (Status: ${res?.status || 'Network error'})`);
      }
      
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (parseErr) {
        throw new Error("Not valid JSON - check your file format");
      }
      
      if (!data.announcements || !Array.isArray(data.announcements)) {
        throw new Error("JSON must have 'announcements' array");
      }
      
      if (data.announcements.length === 0) {
        throw new Error("Announcements array is empty");
      }
      
      setAnnouncements(data.announcements);
      setLastSync(new Date().toLocaleString());
      flash(`✅ Synced ${data.announcements.length} messages!`);
    } catch (err) {
      console.error("Sync error:", err);
      flash(`❌ ${err.message}`);
    }
  };

  // ─── Computed ───
  const lowStock = useMemo(() => items.filter(i => i.qty <= i.minStock), [items]);
  const expiryAlerts = useMemo(() => items.filter(i => daysUntil(i.expiry) <= 7).sort((a,b) => daysUntil(a.expiry) - daysUntil(b.expiry)), [items]);
  const filtered = useMemo(() => { let l = items; if (activeCat !== "All") l = l.filter(i => i.category === activeCat); if (search) l = l.filter(i => i.name.toLowerCase().includes(search.toLowerCase())); return l; }, [items, activeCat, search]);

  const stats = useMemo(() => {
    const tStock = items.reduce((s, i) => s + (+i.qty || 0), 0);
    const tRev = sales.reduce((s, x) => s + (+x.revenue || +x.total || +x.grandTotal || 0), 0);
    const tCost = sales.reduce((s, x) => s + (+x.totalCost || +x.cost || 0), 0);
    const tExp = expenses.reduce((s, x) => s + (+x.amount || 0), 0);
    const grossProfit = tRev - tCost;
    const netProfit = grossProfit - tExp;
    const margin = tRev ? Math.round(grossProfit / tRev * 1000) / 10 : 0;
    const bestSeller = [...items].sort((a, b) => (b.qty * (b.sell || 0)) - (a.qty * (a.sell || 0)))[0];
    const deadStock = items.filter(i => i.qty > 0 && daysUntil(i.expiry) < 0);
    return { tStock, tRev, tCost, tExp, grossProfit, netProfit, margin, bestSeller, deadStock, totalCust: customers.length, totalOrders: sales.length };
  }, [items, sales, expenses, customers]);

  const revSeries = useMemo(() => {
    // Get last 7 days of sales
    const r = sales.slice(0, 7).map(s => +s.revenue || +s.total || +s.grandTotal || 0);
    // Pad with zeros if less than 7 sales
    const series = [...Array(Math.max(0, 7 - r.length)).fill(0), ...r].slice(-7);
    return series.map((v, i) => ({ label: i === 6 ? "Today" : `Day ${i + 1}`, revenue: v }));
  }, [sales]);
  const revMax = Math.max(...revSeries.map(r => r.revenue), 1);
  const topProducts = useMemo(() => items.map(i => ({ ...i, revenue: i.qty * i.cost })).sort((a, b) => b.revenue - a.revenue).slice(0, 5), [items]);

  // ─── Actions ───
  const login = () => { 
    if (!loginForm.username || !loginForm.password) return flash("Enter username and password");
    
    const account = userAccounts.find(acc => acc.username === loginForm.username && acc.password === loginForm.password);
    
    if (account) {
      setUser({ id: Date.now(), name: account.name, email: account.email, role: account.role, username: account.username });
      flash(`Welcome ${account.name}!`);
    } else {
      flash("Invalid username or password");
    }
  };

  const addItem = () => {
    if (!newItem.code || !newItem.name) return flash("Fill code & name");
    setItems(p => [{ id: Date.now(), ...newItem, qty: +newItem.qty||0, cost: +newItem.cost||0, sell: +newItem.sell||0, minStock: +newItem.minStock||0 }, ...p]);
    setNI({ code:"",name:"",category:"Aice",unit:"Cartons",qty:"",cost:"",sell:"",minStock:"",barcode:"",rfid:"",expiry:"" });
    flash("Item saved!");
  };

  const logSale = () => {
    const item = items.find(i => i.name === saleForm.productName);
    const qty = +saleForm.qty || 0;
    if (!item || qty <= 0) return;
    const revenue = (item.sell || item.cost) * qty;
    const cost = item.cost * qty;
    const delivery = +saleForm.deliveryCost || 0;
    const grandTotal = revenue + delivery;
    const cust = customers.find(c => c.name === saleForm.customerName);
    setSales(p => [{ id: Date.now(), productName: item.name, qty, revenue, cost, delivery, grandTotal, profit: revenue - cost, customerName: saleForm.customerName || "Walk-in", customerLocation: cust?.location || "", notes: saleForm.notes, at: new Date().toLocaleString() }, ...p]);
    setItems(p => p.map(i => i.name === item.name ? { ...i, qty: Math.max(0, i.qty - qty) } : i));
    if (saleForm.customerName) {
      setCustomers(p => {
        const existing = p.find(c => c.name === saleForm.customerName);
        if (existing) return p.map(c => c.name === saleForm.customerName ? { ...c, totalSpent: c.totalSpent + grandTotal, orders: c.orders + 1, lastOrder: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) } : c);
        return p;
      });
    }
    setSF(f => ({ ...f, qty: "1", deliveryCost: "", notes: "" }));
    flash("Sale recorded!");
  };

  const logStock = () => {
    const qty = +stockForm.qty || 0;
    if (!stockForm.itemName || qty <= 0) return;
    setStockLog(p => [{ id: Date.now(), ...stockForm, qty, date: new Date().toLocaleString() }, ...p]);
    if (stockForm.type === "IN") setItems(p => p.map(i => i.name === stockForm.itemName ? { ...i, qty: i.qty + qty } : i));
    else setItems(p => p.map(i => i.name === stockForm.itemName ? { ...i, qty: Math.max(0, i.qty - qty) } : i));
    setSLF(f => ({ ...f, qty: "", note: "" }));
    flash(`Stock ${stockForm.type} recorded!`);
  };

  const addExpense = () => {
    if (!expForm.desc || !expForm.amount) return;
    setExpenses(p => [{ id: Date.now(), ...expForm, amount: +expForm.amount, date: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) }, ...p]);
    setEF({ category: "Rent", desc: "", amount: "" });
    flash("Expense added!");
  };

  const addCustomer = () => {
    if (!custForm.name || !custForm.phone) return;
    setCustomers(p => [{ id: Date.now(), name: custForm.name, phone: custForm.phone.replace(/\D/g,""), location: custForm.location, totalSpent: 0, orders: 0, lastOrder: "-" }, ...p]);
    setCF({ name: "", phone: "", location: "" });
    flash("Customer added!");
  };

  // ─── Delete Functions ───
  const del = (setter, id, label) => {
    setter(p => p.filter(x => x.id !== id));
    flash(`${label} deleted`);
  };
  const delItem = id => del(setItems, id, "Item");
  const delSale = id => del(setSales, id, "Sale");
  const delCustomer = id => del(setCustomers, id, "Customer");
  const delExpense = id => del(setExpenses, id, "Expense");
  const delStockLog = id => del(setStockLog, id, "Log");
  const delProject = id => del(setProjects, id, "Project");
  const delInvoice = id => { del(setInvoices, id, "Invoice"); if (previewInv?.id === id) setPreviewInv(null); };
  const delScanLog = id => del(setScanLogs, id, "Scan");

  // ─── Project Management ───
  const addProject = () => {
    if (!projForm.code || !projForm.name) return flash("Fill code & name");
    const c = parseCoords(projForm.coordinates);
    if (!c) return flash("Invalid coordinates");
    if (!projForm.selectedItems.length) return flash("Add at least 1 item");
    
    // Calculate total cost and deduct inventory
    let totalCost = +projForm.transportCost || 0;
    const projectItems = [];
    for (const si of projForm.selectedItems) {
      const invItem = items.find(i => i.name === si.itemName);
      if (!invItem) continue;
      if (invItem.qty < si.qty) return flash(`Not enough ${invItem.name} in stock`);
      const itemCost = invItem.cost * si.qty;
      totalCost += itemCost;
      projectItems.push({ name: invItem.name, qty: si.qty, cost: invItem.cost, totalCost: itemCost, sellPrice: invItem.sell || invItem.cost });
    }
    
    // Deduct from inventory
    setItems(prev => prev.map(item => {
      const si = projForm.selectedItems.find(x => x.itemName === item.name);
      return si ? { ...item, qty: item.qty - si.qty } : item;
    }));
    
    const newProjectId = Date.now();
    
    // Create project
    setProjects(p => [{ id: newProjectId, code: projForm.code, name: projForm.name, locationName: projForm.locationName, latitude: c.lat, longitude: c.lng, visibility: projForm.visibility, sharedWith: [], items: projectItems, transportCost: +projForm.transportCost || 0, totalCost, revenue: 0, profit: 0, status: "Pending", eventDate: projForm.eventDate, notes: projForm.notes, cartons: projectItems.reduce((s,i)=>s+i.qty,0) }, ...p]);
    
    // Auto-create invoice for this project
    const invoiceNo = `INV-${String(invoices.length + 1).padStart(4, '0')}`;
    const invoicePackages = projectItems.map(item => ({
      name: item.name,
      qty: item.qty,
      price: item.sellPrice,
      total: item.qty * item.sellPrice
    }));
    const invoiceSubtotal = invoicePackages.reduce((s, p) => s + p.total, 0);
    const invoiceGrandTotal = invoiceSubtotal + (+projForm.transportCost || 0);
    
    const newInvoice = {
      id: newProjectId,
      invNo: invoiceNo,
      buyerName: projForm.name,
      eventLocation: projForm.locationName,
      eventDate: projForm.eventDate || "",
      packages: invoicePackages,
      transportCost: +projForm.transportCost || 0,
      subtotal: invoiceSubtotal,
      grandTotal: invoiceGrandTotal,
      status: "Pending",
      createdAt: new Date().toISOString(),
      projectCode: projForm.code,
      notes: projForm.notes || ""
    };
    
    setInvoices(prev => [newInvoice, ...prev]);
    
    setPF({ code:"", name:"", locationName:"", coordinates:"", visibility:"Local", eventDate:"", notes:"", selectedItems:[], transportCost:"" });
    flash(`✅ Project & Invoice created! ${invoiceNo}`);
  };
  
  const toggleProjectStatus = (id) => {
    const order = ["Pending", "In Progress", "Completed"];
    const proj = projects.find(p => p.id === id);
    if (!proj) return flash("Project not found");
    
    if (proj.status === "In Progress") {
      // Calculate based on business model
      const sharedMargins = (proj.sharedWith || []).reduce((sum, m) => sum + (m.margin || 0), 0);
      const totalCustomerPrice = (proj.sharedWith || []).reduce((sum, m) => sum + (m.customerPrice || 0), 0);
      const totalPartnerPayments = (proj.sharedWith || []).reduce((sum, m) => sum + (m.partnerPayment || 0), 0);
      const hasSharedMembers = (proj.sharedWith || []).length > 0;
      
      let revenue, profit, totalCostForSale;
      
      if (hasSharedMembers && totalCustomerPrice > 0) {
        // BROKER MODE - Partner handles everything
        revenue = totalCustomerPrice; // Customer paid YOU
        profit = sharedMargins; // Your commission only
        totalCostForSale = totalPartnerPayments; // What you pay partners
        
        const useShared = confirm(`🤝 BROKER MODE - Project shared with partner\n\n💰 Money Flow:\n• Customer pays you: ${fmt(totalCustomerPrice)}\n• You pay partner(s): ${fmt(totalPartnerPayments)}\n• Your Commission: ${fmt(sharedMargins)}\n\n(Partner handles everything, no inventory deducted)\n\nConfirm? (OK)\nEnter custom amounts? (Cancel)`);
        
        if (!useShared) {
          // User wants custom
          const customRev = prompt(`Enter actual amount customer paid:`);
          if (customRev === null) return;
          if (customRev === "" || isNaN(+customRev)) return flash("Invalid amount");
          revenue = +customRev;
          profit = revenue - totalPartnerPayments;
          totalCostForSale = totalPartnerPayments;
        }
        
        // BROKER MODE: Restore inventory if it was deducted
        if (proj.items && proj.items.length > 0) {
          setItems(prev => prev.map(item => {
            const projectItem = proj.items.find(pi => pi.name === item.name);
            if (projectItem) {
              return { ...item, qty: item.qty + projectItem.qty };
            }
            return item;
          }));
        }
      } else {
        // OWN PROJECT - You handle everything (inventory deducted as normal)
        const customRev = prompt(`Enter revenue received for ${proj.name}:`);
        if (customRev === null) return;
        if (customRev === "" || isNaN(+customRev)) return flash("Please enter a valid number");
        revenue = +customRev;
        profit = revenue - proj.totalCost;
        totalCostForSale = proj.totalCost;
      }
      
      // Update project status
      setProjects(p => p.map(x => x.id === id ? { ...x, status: "Completed", revenue, profit, completedAt: new Date().toISOString() } : x));
      
      // Update invoice to match actual revenue received
      setInvoices(p => p.map(inv => inv.id === id ? {...inv, grandTotal: revenue, status: "Paid"} : inv));
      
      // Auto-create partner payment records for shared members
      if (hasSharedMembers) {
        const newPayments = (proj.sharedWith || []).map(member => ({
          id: Date.now() + Math.random(),
          memberUsername: member.username,
          memberName: member.name,
          projectId: proj.id,
          projectCode: proj.code,
          projectName: proj.name,
          amount: member.partnerPayment || 0, // What you owe them
          customerPrice: member.customerPrice || 0, // What customer paid you
          yourMargin: member.margin || 0, // Your commission
          status: "Pending",
          createdAt: new Date().toISOString(),
          dueDate: new Date(Date.now() + 7*24*60*60*1000).toISOString(), // 7 days
          paidAt: null,
          paymentMethod: null,
          notes: ""
        }));
        setPartnerPayments(p => [...newPayments, ...p]);
      }
      
      // Auto-create comprehensive sale record from project data
      const saleRecord = {
        id: Date.now(),
        // Items info - empty for broker mode since partner handles items
        productName: hasSharedMembers ? `[BROKER] ${proj.name}` : (proj.items && proj.items.length > 0 ? proj.items.map(i => `${i.name} (${i.qty})`).join(", ") : proj.name),
        qty: hasSharedMembers ? 0 : (proj.items ? proj.items.reduce((s, i) => s + i.qty, 0) : proj.cartons || 0),
        items: hasSharedMembers ? [] : (proj.items || []), // No items for broker mode
        // Financial info
        revenue: revenue,
        delivery: hasSharedMembers ? 0 : (proj.transportCost || 0), // Partner handles delivery
        grandTotal: revenue,
        total: revenue,
        profit: profit,
        totalCost: totalCostForSale, // Partner payment if broker, else project cost
        // Sharing info
        sharedWith: proj.sharedWith || [],
        isShared: hasSharedMembers,
        isBrokerMode: hasSharedMembers, // Flag for broker mode
        sharedMargins: sharedMargins,
        // Customer/Location info
        customerName: proj.name,
        customerLocation: proj.locationName || "",
        coordinates: proj.coordinates || `${proj.latitude},${proj.longitude}`,
        // Project reference
        projectCode: proj.code,
        projectId: proj.id,
        notes: proj.notes || `Project: ${proj.code}`,
        // Date/Time info
        date: new Date().toISOString().split('T')[0],
        eventDate: proj.eventDate || "",
        at: new Date().toLocaleString("en-GB", {day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit"}),
        completedAt: new Date().toISOString(),
        // Metadata
        visibility: proj.visibility,
        tax: 0 // Can be calculated if needed
      };
      setSales(prev => [saleRecord, ...prev]);
      
      flash(`✅ Project completed! Profit: ${fmt(profit)} | Sale auto-recorded`);
    } else {
      // Regular toggle
      const idx = order.indexOf(proj.status);
      setProjects(p => p.map(x => x.id !== id ? x : { ...x, status: order[(idx + 1) % order.length] }));
      flash("Status updated!");
    }
  };

  const sendInvoice = (sale) => {
    const cust = customers.find(c => c.name === sale.customerName);
    const invoiceNo = sale.projectCode ? `INV-${sale.projectCode.replace('PRJ-','')}` : `INV-${String(sales.indexOf(sale) + 1).padStart(4, '0')}`;
    
    const lines = [
      `*AIRIS - ${user.name}*`,
      `INVOICE`,
      `━━━━━━━━━━━━━━━━━━━━`,
      ``,
      `*Invoice Number:* ${invoiceNo}`,
      `*Customer:* ${sale.customerName || 'Walk-in'}`,
      `*Package:* ${sale.customerName || sale.productName}`,
      `*Location:* ${sale.customerLocation || cust?.location || 'N/A'}`,
      `*Event Date:* ${sale.eventDate || 'TBD'}`,
      ``,
      `━━━━━━━━━━━━━━━━━━━━`,
      `*ITEMS BREAKDOWN*`
    ];
    
    // Add items if available
    if (sale.items && sale.items.length > 0) {
      sale.items.forEach(item => {
        lines.push(`• ${item.name} x ${item.qty}`);
        lines.push(`  ${fmt(item.cost)} x ${item.qty} = ${fmt(item.totalCost || item.cost * item.qty)}`);
      });
    } else {
      lines.push(`• ${sale.productName}`);
      lines.push(`  Quantity: ${sale.qty}`);
    }
    
    lines.push(``, `━━━━━━━━━━━━━━━━━━━━`);
    
    // Price breakdown
    const itemsTotal = sale.totalCost ? (sale.totalCost - (sale.delivery || 0)) : (sale.revenue - (sale.delivery || 0));
    lines.push(`Items Total: ${fmt(itemsTotal)}`);
    
    if (sale.delivery && sale.delivery > 0) {
      lines.push(`Transportation: ${fmt(sale.delivery)}`);
    }
    
    lines.push(``, `*TOTAL PRICE: ${fmt(sale.grandTotal || sale.revenue)}*`);
    lines.push(``, `━━━━━━━━━━━━━━━━━━━━`);
    
    // Payment terms
    lines.push(
      `*PAYMENT TERMS*`,
      `Sila kemukakan bayaran penuh sebelum 2 hari majlis. Sebarang kegagalan bayaran, order terbatal sertamerta.`,
      ``,
      `━━━━━━━━━━━━━━━━━━━━`,
      `Invoice Date: ${sale.at || new Date().toLocaleString("en-GB", {day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit"})}`,
      ``,
      `Terima kasih! 🙏`
    );
    
    window.open(waLink(cust?.phone || "", lines.join("\n")), "_blank");
  };

  // ─── Scan System ───
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const scanTimerRef = useRef(null);
  const rfidInputRef = useRef(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerMsg, setScannerMsg] = useState("Ready");
  const [scanLogs, setScanLogs] = useP("ai_scanlogs4", []);
  const [manualInput, setManualInput] = useState("");
  const [scanMode, setScanMode] = useState(null); // "barcode" | "rfid" | "nfc" | null
  const [nfcStatus, setNfcStatus] = useState(null); // "reading" | "success" | "error" | null

  const logScan = useCallback((code, method, itemsRef) => {
    const matched = itemsRef.find(i => i.barcode === code || i.rfid === code);
    const entry = { id: Date.now(), code, method, itemName: matched?.name || "Unknown", qty: matched?.qty || 0, status: matched ? "FOUND" : "NEW", at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
    setScanLogs(prev => [entry, ...prev]);
    return matched;
  }, [setScanLogs]);

  const stopCamera = useCallback(() => {
    if (scanTimerRef.current) { clearInterval(scanTimerRef.current); scanTimerRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (videoRef.current) videoRef.current.srcObject = null;
    setScannerOpen(false);
    setScannerMsg("Ready");
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const submitManualScan = () => {
    const v = manualInput.trim();
    if (!v) return;
    const matched = logScan(v, scanMode === "rfid" ? "RFID" : "MANUAL", items);
    flash(matched ? `Found: ${matched.name}` : "Not in inventory");
    setManualInput("");
  };

  const startCamera = async () => {
    const hasDetector = typeof window !== "undefined" && "BarcodeDetector" in window;
    const hasCam = typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia;
    if (!hasDetector || !hasCam) {
      setScanMode("barcode");
      flash("Camera not supported — use manual input");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
      streamRef.current = stream;
      setScannerOpen(true);
      setScannerMsg("Point camera at barcode...");
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
      const detector = new window.BarcodeDetector({ formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39", "qr_code"] });
      scanTimerRef.current = setInterval(async () => {
        if (!videoRef.current) return;
        try {
          const codes = await detector.detect(videoRef.current);
          if (codes.length > 0 && codes[0]?.rawValue) {
            const val = codes[0].rawValue;
            const matched = logScan(val, "CAMERA", items);
            flash(matched ? `Scanned: ${matched.name}` : `New barcode: ${val}`);
            stopCamera();
          }
        } catch { setScannerMsg("Scanning... hold steady"); }
      }, 600);
    } catch {
      setScanMode("barcode");
      flash("Camera failed — use manual input");
    }
  };

  // NFC Scanner (Web NFC API — Chrome Android only)
  const startNFC = async () => {
    if (typeof window === "undefined" || !("NDEFReader" in window)) {
      flash("NFC not supported on this device/browser");
      setScanMode("rfid");
      return;
    }
    try {
      setNfcStatus("reading");
      setScanMode("nfc");
      const ndef = new window.NDEFReader();
      await ndef.scan();
      flash("NFC ready — tap your tag");
      ndef.addEventListener("reading", ({ serialNumber, message }) => {
        let tagData = serialNumber || "";
        // Try to extract text from NFC message records
        if (message?.records) {
          for (const record of message.records) {
            if (record.recordType === "text") {
              const textDecoder = new TextDecoder(record.encoding || "utf-8");
              tagData = textDecoder.decode(record.data);
              break;
            }
          }
        }
        if (tagData) {
          const matched = logScan(tagData, "NFC", items);
          flash(matched ? `NFC: ${matched.name}` : `NFC tag: ${tagData}`);
          setNfcStatus("success");
          setTimeout(() => { setNfcStatus(null); setScanMode(null); }, 2000);
        }
      });
      ndef.addEventListener("readingerror", () => {
        flash("NFC read failed — try again");
        setNfcStatus("error");
        setTimeout(() => setNfcStatus(null), 2000);
      });
    } catch (err) {
      flash("NFC error: " + (err.message || "Permission denied"));
      setNfcStatus("error");
      setScanMode("rfid");
    }
  };

  const createInvoice = () => {
    if (!invForm.buyerName || !invForm.eventLocation || !invForm.eventDate) return flash("Fill buyer, location & date");
    const validPkgs = invForm.packages.filter(p => p.name && p.price);
    if (!validPkgs.length) return flash("Add at least 1 package");
    const pkgTotal = validPkgs.reduce((s, p) => s + (+p.qty || 1) * (+p.price || 0), 0);
    const transport = +invForm.transportCost || 0;
    const grandTotal = pkgTotal + transport;
    const invNo = `INV-${String(invoices.length + 1).padStart(4, "0")}`;
    const inv = {
      id: Date.now(), invNo, buyerName: invForm.buyerName, buyerPhone: invForm.buyerPhone.replace(/\D/g,""),
      eventLocation: invForm.eventLocation, eventDate: invForm.eventDate,
      packages: validPkgs.map(p => ({ name: p.name, qty: +p.qty || 1, price: +p.price || 0, subtotal: (+p.qty || 1) * (+p.price || 0) })),
      transportCost: transport, grandTotal, notes: invForm.notes,
      status: "Pending", createdAt: new Date().toLocaleString(),
    };
    setInvoices(p => [inv, ...p]);
    setPreviewInv(inv);
    setIF({ buyerName:"", buyerPhone:"", eventLocation:"", eventDate:"", packages:[{ name:"", qty:"1", price:"" }], transportCost:"", notes:"" });
    flash(`Invoice ${invNo} created!`);
  };

  const sendInvoiceWA = (inv) => {
    const lines = [
      `*━━━━━━━━━━━━━━━━━━*`,
      `*AIRIS INVOICE*`,
      `*${inv.invNo}*`,
      `*━━━━━━━━━━━━━━━━━━*`,
      ``,
      `*Buyer:* ${inv.buyerName}`,
      `*Event:* ${inv.eventLocation}`,
      `*Date:* ${inv.eventDate}`,
      ``,
      `*── Package Details ──*`,
    ];
    inv.packages.forEach((p, i) => {
      lines.push(`${i + 1}. ${p.name}`);
      lines.push(`   ${p.qty} × ${fmt(p.price)} = *${fmt(p.subtotal)}*`);
    });
    const pkgTotal = inv.packages.reduce((s, p) => s + p.subtotal, 0);
    lines.push(``);
    lines.push(`*── Pricing ──*`);
    lines.push(`Package Total: ${fmt(pkgTotal)}`);
    if (inv.transportCost) lines.push(`Transportation: ${fmt(inv.transportCost)}`);
    lines.push(`━━━━━━━━━━━━━━━━━━`);
    lines.push(`*GRAND TOTAL: ${fmt(inv.grandTotal)}*`);
    lines.push(`━━━━━━━━━━━━━━━━━━`);
    if (inv.notes) lines.push(`\n_Notes: ${inv.notes}_`);
    lines.push(`\nIssued: ${inv.createdAt}`);
    lines.push(`Status: ${inv.status}`);
    lines.push(`\n_Generated by AIRIS_`);
    window.open(waLink(inv.buyerPhone || "", lines.join("\n")), "_blank");
  };

  const markInvoicePaid = (invId) => {
    setInvoices(p => p.map(i => i.id === invId ? { ...i, status: i.status === "Paid" ? "Pending" : "Paid" } : i));
    flash("Status updated!");
  };

  // ─── Loading ───
  if (!uOk || !iOk) return <><Styles dark={dark}/><div className="aiR flex min-h-screen items-center justify-center" style={{background:"var(--bg)"}}><div className="text-center"><div className="mx-auto h-14 w-14 rounded-2xl" style={{background:"linear-gradient(135deg,#0047B3,#0057D9)",animation:"aiPulse 1.2s infinite"}}/><p className="mt-4 text-sm font-bold" style={{color:"var(--t2)"}}>Loading AIRIS...</p></div></div></>;

  // ─── Login ───
  if (!user) return <><Styles dark={dark}/><div className="aiR flex min-h-screen items-center justify-center p-5" style={{background:dark?"var(--bg)":"linear-gradient(135deg,#E0ECFF,#D0DFFC)"}}><FadeIn><Card className="w-full max-w-sm"><div className="space-y-6 p-7"><div className="text-center"><div className="mx-auto flex items-center justify-center rounded-3xl text-white shadow-xl" style={{width:72,height:72,background:"linear-gradient(135deg,#0047B3,#0057D9)",animation:"aiGlow 3s infinite"}}><Ic name="package" size={34}/></div><h1 className="mt-5 text-3xl font-extrabold" style={{color:"var(--a2)"}}>AIRIS</h1><p className="mt-1 text-sm" style={{color:"var(--t2)"}}>Inventory & Retail Intelligence</p></div><div className="space-y-3"><Inp placeholder="Username" value={loginForm.username} onChange={e=>setLoginForm({...loginForm,username:e.target.value})} onKeyDown={e=>{if(e.key==="Enter")login();}}/><Inp placeholder="Password" type="password" value={loginForm.password} onChange={e=>setLoginForm({...loginForm,password:e.target.value})} onKeyDown={e=>{if(e.key==="Enter")login();}}/><Btn className="w-full py-3.5" onClick={login}>Login</Btn></div><div className="mt-4 rounded-xl p-3" style={{background:"rgba(59,130,246,0.06)"}}><div className="text-[10px] font-bold mb-2" style={{color:"var(--ac)"}}>Demo Accounts:</div><div className="text-[10px] space-y-1" style={{color:"var(--t3)"}}><div>• admin / aice2024</div><div>• staff / staff123</div><div>• demo / demo</div></div></div></div></Card></FadeIn></div></>;

  const nav = [["home","Home","home"],["inventory","Inventory","package"],["scan","Scan","scan"],["sales","Sales","cart"],["more","More","clipboard"]];

  return (
    <><Styles dark={dark}/>
    <div className="aiR min-h-screen" style={{background:"var(--bg)"}} ref={swRef}>
      <div className="relative mx-auto min-h-screen max-w-md overflow-hidden shadow-2xl" style={{background:"var(--bg2)"}}>

        {toast && <div className="fixed left-1/2 top-5 z-[60] -translate-x-1/2" style={{animation:"aiSD 0.35s both"}}><div className="flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-bold text-white shadow-xl" style={{background:"linear-gradient(135deg,var(--a2),var(--ac))"}}><Ic name="check" size={14}/>{toast}</div></div>}

        <main className="pb-28">

          {/* ════════ HOME ════════ */}
          {tab === "home" && <div>
            <section className="rounded-b-[42px] px-5 pb-20 pt-8 text-white" style={{background:dark?"linear-gradient(135deg,#0C1222,#162240 50%,#0C1222)":"linear-gradient(135deg,#0047B3,#0057D9 40%,#002E7A)"}}>
              <div className="flex items-start justify-between">
                <div><div className="text-4xl font-extrabold tracking-tight" style={{animation:"aiFU 0.5s both"}}>AIRIS</div><div className="mt-3 text-sm text-blue-200">Good Morning,<br/><span className="text-lg font-bold text-white">{user.name}!</span></div></div>
                <div className="flex gap-2">
                  <button type="button" onClick={()=>setDark(!dark)} className="rounded-2xl p-3" style={{background:"rgba(255,255,255,0.1)"}}><Ic name={dark?"sun":"moon"} size={18}/></button>
                  <button type="button" className="relative rounded-2xl p-3" style={{background:"rgba(255,255,255,0.1)"}}><Ic name="bell" size={18}/>{(lowStock.length+expiryAlerts.length)>0&&<span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold ring-2 ring-blue-800">{lowStock.length+expiryAlerts.length}</span>}</button>
                </div>
              </div>
            </section>

            <section className="-mt-16 space-y-3 px-5">
              {/* Scrolling Announcement Banner */}
              {announcements.length > 0 && <FadeIn delay={0.02}>
                <div className="relative overflow-hidden rounded-xl p-2" style={{background:"rgba(0,0,0,0.4)", boxShadow:"0 2px 8px rgba(0,0,0,0.15)"}}>
                  <div className="flex items-center gap-2 text-white">
                    <Ic name="alert" size={14} className="shrink-0 opacity-80"/>
                    <div className="flex-1 overflow-hidden">
                      <div className="animate-marquee whitespace-nowrap text-xs font-bold">
                        {announcements.map((msg, i) => <span key={i} className="inline-block mx-6">📢 {msg}</span>)}
                        {announcements.map((msg, i) => <span key={`dup-${i}`} className="inline-block mx-6">📢 {msg}</span>)}
                      </div>
                    </div>
                    <button type="button" onClick={()=>{setTab("more");setSubTab("settings");}} className="shrink-0 rounded-lg p-1 hover:bg-white/20 transition-colors">
                      <Ic name="edit" size={12}/>
                    </button>
                  </div>
                </div>
              </FadeIn>}

              {/* Daily P&L Summary */}
              <FadeIn delay={0.05}><Card><div className="p-4"><div className="mb-3 flex items-center gap-2"><Ic name="trending" size={16} className="text-emerald-500"/><span className="text-xs font-extrabold" style={{color:"var(--tx)"}}>Daily P&L Summary</span><Badge color="green">Live</Badge></div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-2xl p-3 text-center" style={{background:"var(--sub)"}}><div className="text-[10px] font-bold" style={{color:"var(--t3)"}}>Revenue</div><div className="mt-1 text-base font-extrabold" style={{color:"var(--tx)"}}>{fmt(stats.tRev)}</div></div>
                  <div className="rounded-2xl p-3 text-center" style={{background:"var(--sub)"}}><div className="text-[10px] font-bold" style={{color:"var(--t3)"}}>Expenses</div><div className="mt-1 text-base font-extrabold" style={{color:"#EF4444"}}>{fmt(stats.tExp)}</div></div>
                  <div className="rounded-2xl p-3 text-center" style={{background:stats.netProfit>=0?"rgba(22,163,74,0.08)":"rgba(239,68,68,0.08)"}}><div className="text-[10px] font-bold" style={{color:"var(--t3)"}}>Net Profit</div><div className="mt-1 text-base font-extrabold" style={{color:stats.netProfit>=0?"#16A34A":"#EF4444"}}>{fmt(stats.netProfit)}</div></div>
                </div>
              </div></Card></FadeIn>

              {/* KPI Cards */}
              <FadeIn delay={0.1}><Card><div className="p-4"><SH title="KPI Dashboard"/><div className="mt-3 grid grid-cols-2 gap-2.5">
                <div className="flex items-center gap-3 rounded-2xl p-3" style={{background:"var(--sub)"}}>
                  <RingChart percent={stats.margin} size={48} stroke={5}/><div><div className="text-[10px] font-bold" style={{color:"var(--t3)"}}>Margin</div><div className="text-lg font-extrabold" style={{color:"var(--tx)"}}>{stats.margin}%</div></div>
                </div>
                <div className="rounded-2xl p-3" style={{background:"var(--sub)"}}>
                  <div className="text-[10px] font-bold" style={{color:"var(--t3)"}}>Best Seller</div>
                  {stats.bestSeller && <div className="mt-1 flex items-center gap-2"><PImg name={stats.bestSeller.name} size="h-8 w-8" r="rounded-lg"/><span className="text-xs font-bold truncate" style={{color:"var(--tx)"}}>{stats.bestSeller.name}</span></div>}
                </div>
                <div className="rounded-2xl p-3" style={{background:"var(--sub)"}}><div className="text-[10px] font-bold" style={{color:"var(--t3)"}}>Total Stock</div><div className="mt-1 text-lg font-extrabold" style={{color:"var(--tx)"}}>{num(stats.tStock)}</div><div className="text-[10px]" style={{color:"var(--t3)"}}>Cartons</div></div>
                <div className="rounded-2xl p-3" style={{background:stats.deadStock.length?"rgba(239,68,68,0.08)":"var(--sub)"}}><div className="flex items-center gap-1 text-[10px] font-bold" style={{color:stats.deadStock.length?"#EF4444":"var(--t3)"}}><Ic name="alert" size={10}/>Dead Stock</div><div className="mt-1 text-lg font-extrabold" style={{color:stats.deadStock.length?"#EF4444":"var(--tx)"}}>{stats.deadStock.length}</div><div className="text-[10px]" style={{color:"var(--t3)"}}>Expired items</div></div>
              </div></div></Card></FadeIn>

              {/* Ad Banner 1 - Before Quick Menu */}
              {adBanners.length > 0 && <FadeIn delay={0.18}>
                <div className="relative overflow-hidden rounded-lg" style={{background:"rgba(0,0,0,0.4)", height:"60px"}}>
                  <div className="animate-marquee whitespace-nowrap flex items-center gap-4 h-full">
                    {adBanners.map((ad, i) => (
                      ad.type === "image" ? 
                        <img key={i} src={ad.content} alt="ad" className="h-full object-contain inline-block mx-2" style={{maxWidth:"300px"}} /> :
                        <span key={i} className="inline-block mx-5 text-[11px] font-bold text-white">🎯 {ad.content}</span>
                    ))}
                    {adBanners.map((ad, i) => (
                      ad.type === "image" ? 
                        <img key={`dup-${i}`} src={ad.content} alt="ad" className="h-full object-contain inline-block mx-2" style={{maxWidth:"300px"}} /> :
                        <span key={`dup-${i}`} className="inline-block mx-5 text-[11px] font-bold text-white">🎯 {ad.content}</span>
                    ))}
                  </div>
                </div>
              </FadeIn>}

              {/* Quick Menu */}
              <FadeIn delay={0.2}><SH title="Quick Menu"/><div className="mt-3 grid grid-cols-4 gap-x-3 gap-y-3">
                {[["Inventory","package","inventory"],["Sales","chart","sales"],["Customers","users","more-cust"],["Invoice","receipt","more-inv"],["Scan","scan","scan"],["Projects","clipboard","more-proj"],["Expiry","clock","more-expiry"],["Expenses","wallet","more-exp"]].map(([l,ic,t],i) => (
                  <FadeIn key={l} delay={0.22+i*0.03}><button type="button" onClick={()=>{if(t.startsWith("more-")){setTab("more");setSubTab(t.replace("more-",""));}else{setTab(t);setSubTab(null);}}} className="flex flex-col items-center gap-1.5">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl shadow-md active:scale-90 transition-transform" style={{background:"var(--cd)",color:"var(--ac)"}}><Ic name={ic} size={24}/></div>
                    <span className="text-[11px] font-bold" style={{color:"var(--t2)"}}>{l}</span>
                  </button></FadeIn>
                ))}
              </div></FadeIn>

              {/* Expiry Alerts */}
              {expiryAlerts.length > 0 && <FadeIn delay={0.35}><SH title="Expiry Alerts" action={`${expiryAlerts.length} items`}/><div className="mt-2 space-y-2">{expiryAlerts.slice(0,3).map((item,i) => {
                const es = expiryStatus(item.expiry);
                return <FadeIn key={item.id} delay={0.37+i*0.04}><div className="flex items-center justify-between rounded-2xl p-3" style={{background:"var(--cd)"}}><div className="flex items-center gap-3"><PImg name={item.name} size="h-10 w-10" r="rounded-lg"/><div><div className="text-xs font-bold" style={{color:"var(--tx)"}}>{item.name}</div><div className="text-[11px]" style={{color:"var(--t3)"}}>{item.qty} {item.unit}</div></div></div><Badge color={es.color}>{es.label}</Badge></div></FadeIn>;
              })}</div></FadeIn>}

              {/* Low Stock */}
              <FadeIn delay={0.45}><SH title="Low Stock" action={`${lowStock.length} items`}/><div className="mt-2 space-y-2">{lowStock.length ? lowStock.slice(0,3).map(item => <div key={item.id} className="flex items-center justify-between rounded-2xl p-3" style={{background:"var(--cd)"}}><div className="flex items-center gap-3"><PImg name={item.name} size="h-10 w-10" r="rounded-lg"/><div><div className="text-xs font-bold" style={{color:"var(--tx)"}}>{item.name}</div><div className="text-[11px]" style={{color:"var(--t3)"}}>{item.qty} {item.unit}</div></div></div><Badge color="red">Low</Badge></div>) : <div className="rounded-2xl p-3 text-center text-xs font-bold" style={{background:"var(--cd)",color:"#16A34A"}}>All healthy</div>}</div></FadeIn>

              {/* Supplier / Nearby Stores */}
              {outlets.length > 0 && <FadeIn delay={0.5}>
                <SH title="Supplier" action={`${outlets.length} locations`}/>
                <div className="mt-2 flex gap-3 overflow-x-auto pb-2" style={{scrollbarWidth:"none", msOverflowStyle:"none"}}>
                  {outlets.map(outlet => (
                    <div key={outlet.id} className="flex-shrink-0 rounded-2xl overflow-hidden" style={{width:"160px", background:"var(--cd)", border:"1px solid var(--cb)"}}>
                      <div className="relative">
                        <img src={outlet.image} alt={outlet.name} className="w-full h-24 object-cover"/>
                        {outlet.discount && <div className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold text-white" style={{background:"#EF4444"}}>{outlet.discount}</div>}
                      </div>
                      <div className="p-2.5">
                        <div className="text-xs font-bold truncate" style={{color:"var(--tx)"}}>{outlet.name}</div>
                        <div className="text-[10px] mt-0.5" style={{color:"var(--t3)"}}>{outlet.distance}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </FadeIn>}
            </section>
          </div>}

          {/* ════════ INVENTORY ════════ */}
          {tab === "inventory" && <Shell title="Inventory" subtitle="Manage stock" dark={dark}>
            <FadeIn><div className="flex gap-2"><div className="relative flex-1"><span className="absolute left-3 top-3.5" style={{color:"var(--t3)"}}><Ic name="search" size={16}/></span><Inp className="pl-9" placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)}/></div><Btn variant="outline" className="px-3"><Ic name="filter" size={16}/></Btn></div></FadeIn>
            <div className="flex gap-1.5 overflow-x-auto">{["All","Aice","Paddle Pop","Other"].map(x=><Btn2 key={x} active={activeCat===x} onClick={()=>setActiveCat(x)}>{x}</Btn2>)}</div>
            <FadeIn delay={0.08}><Card><div className="space-y-2.5 p-4"><h3 className="text-sm font-extrabold" style={{color:"var(--tx)"}}>Add Item</h3><div className="grid grid-cols-2 gap-2"><Inp placeholder="Code" value={newItem.code} onChange={e=>setNI({...newItem,code:e.target.value})}/><Inp placeholder="Name" value={newItem.name} onChange={e=>setNI({...newItem,name:e.target.value})}/></div><div className="grid grid-cols-4 gap-2"><Inp placeholder="Qty" type="number" value={newItem.qty} onChange={e=>setNI({...newItem,qty:e.target.value})}/><Inp placeholder="Cost" type="number" value={newItem.cost} onChange={e=>setNI({...newItem,cost:e.target.value})}/><Inp placeholder="Sell" type="number" value={newItem.sell} onChange={e=>setNI({...newItem,sell:e.target.value})}/><Inp placeholder="Min" type="number" value={newItem.minStock} onChange={e=>setNI({...newItem,minStock:e.target.value})}/></div><DatePicker placeholder="Expiry date" value={newItem.expiry} onChange={v=>setNI({...newItem,expiry:v})}/><Btn className="w-full" onClick={addItem}><Ic name="plus" size={16}/>Save</Btn></div></Card></FadeIn>
            <div className="space-y-2.5">{filtered.map((item,idx) => {
              const low = item.qty <= item.minStock; const es = expiryStatus(item.expiry);
              return <FadeIn key={item.id} delay={0.12+idx*0.03}><Card onDel={()=>delItem(item.id)}><div className="flex gap-3 p-3.5"><PImg name={item.name}/><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-1"><div className="min-w-0"><div className="text-sm font-bold truncate" style={{color:"var(--tx)"}}>{item.name}</div><div className="text-[11px]" style={{color:"var(--t3)"}}>{item.code}</div></div><div className="flex items-center gap-1.5"><Badge color={low?"red":"green"}>{low?"Low":"OK"}</Badge><Badge color={es.color}>{es.label}</Badge></div></div><div className="mt-1.5 flex items-center justify-between text-xs" style={{color:"var(--t2)"}}><span>{item.qty} {item.unit}</span><span className="font-bold" style={{color:"var(--ac)"}}>{fmt(item.sell||item.cost)}</span></div></div></div></Card></FadeIn>;
            })}</div>
          </Shell>}

          {/* ════════ SCAN ════════ */}
          {tab === "scan" && <Shell title="Scan" subtitle="RFID / NFC / Barcode" dark={dark}>
            
            {/* Scanner Hero Card */}
            <FadeIn><Card className="overflow-hidden border-0">
              <div className="p-5 text-white" style={{background:dark?"linear-gradient(135deg,#0C1222,#162240)":"linear-gradient(135deg,#071A3D,#003FA3)"}}>
                
                {/* Camera View */}
                {scannerOpen ? <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div><div className="text-sm font-extrabold">Camera Scanner</div><div className="text-[11px] opacity-60">{scannerMsg}</div></div>
                    <Btn variant="secondary" onClick={stopCamera} className="text-xs py-2 px-3">Close</Btn>
                  </div>
                  <div className="relative overflow-hidden rounded-2xl bg-black">
                    <video ref={videoRef} className="h-56 w-full object-cover" muted playsInline />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-48 h-32 border-2 border-white/50 rounded-xl" style={{boxShadow:"0 0 0 9999px rgba(0,0,0,0.4)"}}/>
                    </div>
                    <div className="absolute bottom-3 left-0 right-0 text-center text-[11px] font-bold text-white/70">Align barcode within frame</div>
                  </div>
                
                {/* NFC Reading State */}
                </div> : nfcStatus === "reading" ? <div className="flex flex-col items-center py-6">
                  <div className="h-20 w-20 rounded-full flex items-center justify-center" style={{background:"rgba(255,255,255,0.1)",animation:"aiPulse 1.5s infinite"}}><Ic name="scan" size={40}/></div>
                  <div className="mt-4 text-base font-extrabold">Waiting for NFC Tag...</div>
                  <div className="text-xs opacity-60 mt-1">Hold your NFC tag/card near the phone</div>
                  <Btn variant="secondary" onClick={()=>{setNfcStatus(null);setScanMode(null);}} className="mt-4 text-xs">Cancel</Btn>
                
                {/* Manual Input Mode */}
                </div> : (scanMode === "barcode" || scanMode === "rfid") ? <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div><div className="text-sm font-extrabold">{scanMode === "rfid" ? "RFID Scanner" : "Manual Barcode"}</div><div className="text-[11px] opacity-60">{scanMode === "rfid" ? "Type RFID code or use external reader" : "Enter barcode number"}</div></div>
                    <Btn variant="secondary" onClick={()=>setScanMode(null)} className="text-xs py-2 px-3">Back</Btn>
                  </div>
                  {/* Input field — auto-focus, captures external RFID reader input */}
                  <div className="flex gap-2">
                    <input ref={rfidInputRef} autoFocus className="flex-1 rounded-2xl border-2 border-white/20 bg-white/10 px-4 py-3.5 text-sm font-bold text-white outline-none placeholder:text-white/40 focus:border-white/50" 
                      placeholder={scanMode === "rfid" ? "Scan or type RFID code..." : "Enter barcode number..."} 
                      value={manualInput} 
                      onChange={e => setManualInput(e.target.value)} 
                      onKeyDown={e => { if (e.key === "Enter") submitManualScan(); }}
                    />
                    <Btn variant="secondary" onClick={submitManualScan} className="px-4"><Ic name="search" size={18}/></Btn>
                  </div>
                  <div className="text-[11px] opacity-40 text-center">
                    {scanMode === "rfid" ? "External RFID readers send codes as keyboard input — just tap the tag" : "Press Enter or tap Search to lookup"}
                  </div>
                  {/* Test codes hint */}
                  <div className="rounded-xl p-3" style={{background:"rgba(255,255,255,0.06)"}}>
                    <div className="text-[10px] font-bold opacity-50 mb-1.5">Test codes:</div>
                    <div className="flex flex-wrap gap-1.5">
                      {items.slice(0,3).map(i => (
                        <button key={i.id} type="button" onClick={()=>{setManualInput(scanMode==="rfid"?i.rfid:i.barcode);}} className="rounded-full px-2.5 py-1 text-[10px] font-bold" style={{background:"rgba(255,255,255,0.1)"}}>
                          {scanMode==="rfid" ? i.rfid : i.barcode}
                        </button>
                      ))}
                    </div>
                  </div>
                
                {/* Default — scan method selection */}
                </div> : <div className="flex flex-col items-center text-center">
                  <div style={{animation:"aiPulse 2s infinite"}}><Ic name="scan" size={50}/></div>
                  <div className="mt-3 text-lg font-extrabold">Scan Inventory</div>
                  <div className="text-xs opacity-50 mt-1">Choose scanning method</div>
                  <div className="mt-5 grid grid-cols-2 gap-2.5 w-full">
                    <Btn variant="secondary" onClick={startCamera} className="flex-col gap-1 py-4"><Ic name="camera" size={22}/><span className="text-[11px]">Camera Barcode</span></Btn>
                    <Btn variant="secondary" onClick={()=>setScanMode("barcode")} className="flex-col gap-1 py-4"><Ic name="scan" size={22}/><span className="text-[11px]">Manual Barcode</span></Btn>
                    <Btn variant="secondary" onClick={()=>{setScanMode("rfid");setTimeout(()=>rfidInputRef.current?.focus(),100);}} className="flex-col gap-1 py-4"><Ic name="package" size={22}/><span className="text-[11px]">RFID Reader</span></Btn>
                    <Btn variant="secondary" onClick={startNFC} className="flex-col gap-1 py-4"><Ic name="share" size={22}/><span className="text-[11px]">NFC Tap</span></Btn>
                  </div>
                  <div className="mt-3 text-[10px] opacity-30">NFC requires Chrome on Android</div>
                </div>}
              </div>
            </Card></FadeIn>

            {/* Quick Scan Buttons */}
            <FadeIn delay={0.08}><SH title="Quick Scan"/>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {items.slice(0,3).map(item => (
                  <button key={item.id} type="button" onClick={() => {
                    logScan(item.barcode, "QUICK", items);
                    flash(`Quick: ${item.name}`);
                  }} className="rounded-2xl p-3 text-center active:scale-95 transition-transform" style={{background:"var(--cd)",border:"1px solid var(--cb)"}}>
                    <PImg name={item.name} size="h-10 w-10 mx-auto" r="rounded-lg"/>
                    <div className="mt-1.5 text-[10px] font-bold truncate" style={{color:"var(--tx)"}}>{item.name.replace("Aice ","")}</div>
                    <div className="text-[9px]" style={{color:"var(--t3)"}}>{item.qty} pcs</div>
                  </button>
                ))}
              </div>
            </FadeIn>

            {/* Scan Stats */}
            <FadeIn delay={0.12}>
              <div className="grid grid-cols-4 gap-2">
                <div className="rounded-2xl p-2.5 text-center" style={{background:"var(--sub)"}}><div className="text-base font-extrabold" style={{color:"var(--tx)"}}>{scanLogs.length}</div><div className="text-[9px] font-bold" style={{color:"var(--t3)"}}>Total</div></div>
                <div className="rounded-2xl p-2.5 text-center" style={{background:"rgba(22,163,74,0.06)"}}><div className="text-base font-extrabold" style={{color:"#16A34A"}}>{scanLogs.filter(l=>l.status==="FOUND").length}</div><div className="text-[9px] font-bold" style={{color:"var(--t3)"}}>Found</div></div>
                <div className="rounded-2xl p-2.5 text-center" style={{background:"rgba(234,179,8,0.06)"}}><div className="text-base font-extrabold" style={{color:"#CA8A04"}}>{scanLogs.filter(l=>l.status==="NEW").length}</div><div className="text-[9px] font-bold" style={{color:"var(--t3)"}}>New</div></div>
                <div className="rounded-2xl p-2.5 text-center" style={{background:"var(--sub)"}}><div className="text-base font-extrabold" style={{color:"var(--tx)"}}>{new Set(scanLogs.map(l=>l.method)).size}</div><div className="text-[9px] font-bold" style={{color:"var(--t3)"}}>Methods</div></div>
              </div>
            </FadeIn>

            {/* Scan History */}
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold" style={{color:"var(--tx)"}}>Scan History</h2>
              {scanLogs.length > 0 && <button type="button" onClick={()=>{setScanLogs([]);flash("History cleared");}} className="text-xs font-bold" style={{color:"#EF4444"}}>Clear All</button>}
            </div>
            <div className="space-y-2">
              {scanLogs.length ? scanLogs.slice(0,20).map((log, i) => {
                const item = items.find(it => it.barcode === log.code || it.rfid === log.code);
                return (
                <FadeIn key={log.id} delay={0.15+i*0.02}>
                  <Card onDel={()=>delScanLog(log.id)}><div className="p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{background:log.status==="FOUND"?"rgba(22,163,74,0.1)":"rgba(234,179,8,0.1)",color:log.status==="FOUND"?"#16A34A":"#CA8A04"}}>
                          <Ic name={log.method==="CAMERA"?"camera":log.method==="NFC"?"share":"scan"} size={18}/>
                        </div>
                        <div>
                          <div className="text-xs font-bold" style={{color:"var(--tx)"}}>{log.itemName}</div>
                          <div className="text-[10px]" style={{color:"var(--t3)"}}>{log.code}</div>
                          {item && <div className="text-[11px] font-bold mt-0.5" style={{color:"var(--ac)"}}>Stock: {item.qty} {item.unit}</div>}
                        </div>
                      </div>
                      <div className="text-right">
                          <div className="flex items-center gap-1.5">
                            <Badge color={log.status==="FOUND"?"green":"yellow"}>{log.status}</Badge>
                            <span className="rounded-full px-1.5 py-0.5 text-[9px] font-bold" style={{background:"var(--sub)",color:"var(--t3)"}}>{log.method}</span>
                          </div>
                          <div className="mt-1 text-[10px]" style={{color:"var(--t3)"}}>{log.at}</div>
                      </div>
                    </div>
                    
                    {/* Quick Stock Adjustment */}
                    {item && log.status === "FOUND" && (
                      <div className="rounded-xl p-2.5" style={{background:"var(--sub)"}}>
                        <div className="text-[10px] font-bold mb-2" style={{color:"var(--t3)"}}>QUICK ADJUST</div>
                        <div className="grid grid-cols-4 gap-2">
                          <button type="button" onClick={()=>{
                            setItems(p=>p.map(it=>it.id===item.id?{...it,qty:it.qty-10}:it));
                            flash("-10 stock");
                          }} className="rounded-lg py-2 text-xs font-bold" style={{background:"rgba(239,68,68,0.1)",color:"#EF4444"}}>-10</button>
                          <button type="button" onClick={()=>{
                            setItems(p=>p.map(it=>it.id===item.id?{...it,qty:it.qty-1}:it));
                            flash("-1 stock");
                          }} className="rounded-lg py-2 text-xs font-bold" style={{background:"rgba(239,68,68,0.1)",color:"#EF4444"}}>-1</button>
                          <button type="button" onClick={()=>{
                            setItems(p=>p.map(it=>it.id===item.id?{...it,qty:it.qty+1}:it));
                            flash("+1 stock");
                          }} className="rounded-lg py-2 text-xs font-bold" style={{background:"rgba(22,163,74,0.1)",color:"#16A34A"}}>+1</button>
                          <button type="button" onClick={()=>{
                            setItems(p=>p.map(it=>it.id===item.id?{...it,qty:it.qty+10}:it));
                            flash("+10 stock");
                          }} className="rounded-lg py-2 text-xs font-bold" style={{background:"rgba(22,163,74,0.1)",color:"#16A34A"}}>+10</button>
                        </div>
                      </div>
                    )}
                  </div></Card>
                </FadeIn>
              )}) : <div className="rounded-2xl p-8 text-center" style={{background:"var(--cd)"}}>
                <Ic name="scan" size={36} className="mx-auto opacity-15"/>
                <div className="mt-3 text-xs font-bold" style={{color:"var(--t3)"}}>No scans yet</div>
                <div className="mt-1 text-[11px]" style={{color:"var(--t3)"}}>Choose a scan method above to begin</div>
              </div>}
            </div>
          </Shell>}

          {/* ════════ SALES ════════ */}
          {tab === "sales" && <Shell title="Sales" subtitle="Revenue & Orders" dark={dark}>
            <FadeIn><Card><div className="space-y-3 p-4">
              <div className="flex items-center justify-between">
                <SH title="Revenue Trend"/>
                {/* Compact period tabs */}
                <div className="flex gap-1 rounded-lg p-0.5" style={{background:"var(--sub)"}}>
                  {[["Monthly","monthly"],["Yearly","yearly"],["All","overall"]].map(([label,val])=>(
                    <button key={val} type="button" onClick={()=>setSalesPeriod(val)} className="rounded-md px-2.5 py-1 text-[10px] font-bold transition-all" style={{background:salesPeriod===val?"var(--ac)":"transparent",color:salesPeriod===val?"white":"var(--t3)"}}>{label}</button>
                  ))}
                </div>
              </div>
              
              <div className="text-2xl font-extrabold" style={{color:"var(--tx)"}}>
                {(() => {
                  const now = new Date();
                  const currentMonth = now.getMonth() + 1;
                  const currentYear = now.getFullYear();
                  
                  const filtered = sales.filter(s => {
                    if (!s.date) return true;
                    const dateParts = s.date.split('-');
                    if (dateParts.length < 2) return true;
                    const saleYear = parseInt(dateParts[0]);
                    const saleMonth = parseInt(dateParts[1]);
                    
                    if (salesPeriod === "monthly") {
                      return saleMonth === currentMonth && saleYear === currentYear;
                    } else if (salesPeriod === "yearly") {
                      return saleYear === currentYear;
                    }
                    return true;
                  });
                  
                  const revenue = filtered.reduce((sum, s) => sum + (s.total || s.revenue || s.grandTotal || 0), 0);
                  return fmt(revenue);
                })()}
              </div>
              <div className="text-[11px]" style={{color:"var(--t3)"}}>
                {salesPeriod === "monthly" ? `${new Date().toLocaleDateString("en-US", {month:"long", year:"numeric"})}` : 
                 salesPeriod === "yearly" ? `Year ${new Date().getFullYear()}` : 
                 "All time"}
              </div>
              <LineChart data={revSeries} max={revMax} dark={dark}/>
            </div></Card></FadeIn>

            <SH title="Sales History" action={`${sales.length} orders`}/>
            {sales.length === 0 ? (
              <FadeIn><Card><div className="p-8 text-center space-y-3">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full" style={{background:"var(--bbg)",color:"var(--ac)"}}>
                  <Ic name="cart" size={28}/>
                </div>
                <div className="text-sm font-bold" style={{color:"var(--tx)"}}>No sales yet</div>
                <div className="text-xs" style={{color:"var(--t3)"}}>
                  Complete a project to auto-generate sales record.<br/>
                  Go to <span style={{color:"var(--ac)",fontWeight:"bold"}}>More → Projects</span> to start!
                </div>
              </div></Card></FadeIn>
            ) : (
            <div className="space-y-2">{sales.slice(0,6).map((s,i) => (
              <FadeIn key={s.id||i} delay={0.15+i*0.03}><Card onDel={()=>delSale(s.id)}>
                <button type="button" onClick={()=>setSelectedSale(s)} className="w-full text-left p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3"><PImg name={s.productName} size="h-10 w-10" r="rounded-lg"/><div><div className="text-xs font-bold" style={{color:"var(--tx)"}}>{s.productName}</div><div className="text-[11px]" style={{color:"var(--t3)"}}>Qty {s.qty} • {s.customerName||"Walk-in"}</div></div></div>
                    <div className="flex items-center gap-1.5"><span className="text-xs font-extrabold" style={{color:"var(--ac)"}}>{fmt(s.grandTotal||s.revenue)}</span><button type="button" onClick={(e)=>{e.stopPropagation();sendInvoice(s);}} className="rounded-lg p-1.5" style={{background:"#25D366",color:"white"}}><Ic name="whatsapp" size={14}/></button></div>
                  </div>
                  {/* Extra info row */}
                  <div className="flex flex-wrap gap-1.5">
                    {s.delivery > 0 && <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold" style={{background:"rgba(0,87,217,0.06)",color:"var(--ac)"}}><Ic name="cart" size={10}/>Delivery {fmt(s.delivery)}</span>}
                    {s.customerLocation && <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold" style={{background:"var(--sub)",color:"var(--t3)"}}><Ic name="mapPin" size={10}/>{s.customerLocation}</span>}
                    {s.notes && <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px]" style={{background:"var(--sub)",color:"var(--t3)"}}><Ic name="clipboard" size={10}/>{s.notes.length > 30 ? s.notes.slice(0,30)+"…" : s.notes}</span>}
                  </div>
                </button>
              </Card></FadeIn>
            ))}</div>
            )}

            {/* Sale Detail Modal */}
            {selectedSale && <FadeIn><div className="fixed inset-0 z-50 flex items-end justify-center" style={{background:"rgba(0,0,0,0.5)"}} onClick={()=>setSelectedSale(null)}>
              <div className="w-full max-w-md rounded-t-3xl p-5 space-y-4" style={{background:"var(--cd)", maxHeight:"85vh", overflowY:"auto"}} onClick={(e)=>e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-extrabold" style={{color:"var(--tx)"}}>Order Details</h3>
                    {selectedSale.projectCode && <div className="text-[11px] font-bold" style={{color:"var(--ac)"}}>{selectedSale.projectCode}</div>}
                  </div>
                  <button type="button" onClick={()=>setSelectedSale(null)} className="rounded-full p-2" style={{background:"var(--sub)"}}><Ic name="x" size={18}/></button>
                </div>

                {/* Customer Info */}
                <div className="rounded-2xl p-4 space-y-2" style={{background:"var(--sub)"}}>
                  <div className="text-[11px] font-bold" style={{color:"var(--t3)"}}>CUSTOMER / PROJECT</div>
                  <div className="text-sm font-bold" style={{color:"var(--tx)"}}>{selectedSale.customerName || "Walk-in Customer"}</div>
                  {selectedSale.customerLocation && <div className="flex items-center gap-1.5 text-xs" style={{color:"var(--t2)"}}><Ic name="mapPin" size={12}/>{selectedSale.customerLocation}</div>}
                </div>

                {/* Order Items - Individual breakdown if available */}
                <div className="rounded-2xl p-4 space-y-3" style={{background:"var(--sub)"}}>
                  <div className="text-[11px] font-bold" style={{color:"var(--t3)"}}>ORDER ITEMS ({selectedSale.qty} total)</div>
                  {selectedSale.items && selectedSale.items.length > 0 ? (
                    selectedSale.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between pb-2" style={{borderBottom: idx < selectedSale.items.length - 1 ? "1px solid var(--ib)" : "none"}}>
                        <div className="flex items-center gap-2">
                          <PImg name={item.name} size="h-10 w-10" r="rounded-lg"/>
                          <div>
                            <div className="text-xs font-bold" style={{color:"var(--tx)"}}>{item.name}</div>
                            <div className="text-[10px]" style={{color:"var(--t3)"}}>Qty: {item.qty} × {fmt(item.cost||0)}</div>
                          </div>
                        </div>
                        <div className="text-xs font-bold" style={{color:"var(--ac)"}}>{fmt(item.totalCost||0)}</div>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <PImg name={selectedSale.productName} size="h-12 w-12" r="rounded-xl"/>
                        <div>
                          <div className="text-sm font-bold" style={{color:"var(--tx)"}}>{selectedSale.productName}</div>
                          <div className="text-[11px]" style={{color:"var(--t3)"}}>Quantity: {selectedSale.qty}</div>
                        </div>
                      </div>
                      <div className="text-sm font-bold" style={{color:"var(--ac)"}}>{fmt(selectedSale.revenue||selectedSale.grandTotal)}</div>
                    </div>
                  )}
                </div>

                {/* Breakdown */}
                <div className="rounded-2xl p-4 space-y-2.5" style={{background:"var(--sub)"}}>
                  <div className="text-[11px] font-bold" style={{color:"var(--t3)"}}>PRICE BREAKDOWN</div>
                  
                  {selectedSale.totalCost && <div className="flex justify-between text-xs" style={{color:"var(--t2)"}}>
                    <span>Items Cost</span>
                    <span className="font-bold">{fmt(selectedSale.totalCost - (selectedSale.delivery||0))}</span>
                  </div>}
                  
                  {selectedSale.delivery > 0 && <div className="flex justify-between text-xs" style={{color:"var(--t2)"}}>
                    <span>Transportation</span>
                    <span className="font-bold">{fmt(selectedSale.delivery)}</span>
                  </div>}

                  {selectedSale.totalCost && <div className="flex justify-between text-xs" style={{color:"var(--t2)"}}>
                    <span>Total Cost</span>
                    <span className="font-bold">{fmt(selectedSale.totalCost)}</span>
                  </div>}

                  <div className="flex justify-between text-xs" style={{color:"var(--t2)"}}>
                    <span>Tax (0%)</span>
                    <span className="font-bold">RM 0</span>
                  </div>

                  <div className="pt-2 mt-2 flex justify-between" style={{borderTop:"1px solid var(--ib)"}}>
                    <span className="text-sm font-extrabold" style={{color:"var(--tx)"}}>Revenue</span>
                    <span className="text-lg font-extrabold" style={{color:"var(--ac)"}}>{fmt(selectedSale.grandTotal||selectedSale.revenue)}</span>
                  </div>

                  {selectedSale.profit !== undefined && <div className="pt-2 flex justify-between" style={{borderTop:"1px solid var(--ib)"}}>
                    <span className="text-sm font-extrabold" style={{color:"var(--tx)"}}>Profit</span>
                    <span className="text-lg font-extrabold" style={{color:selectedSale.profit>0?"#16A34A":"#EF4444"}}>{fmt(selectedSale.profit)}</span>
                  </div>}
                </div>

                {/* Date & Time */}
                <div className="rounded-2xl p-4 space-y-2" style={{background:"var(--sub)"}}>
                  <div className="text-[11px] font-bold" style={{color:"var(--t3)"}}>DATE & TIME</div>
                  <div className="flex items-center gap-2 text-sm font-bold" style={{color:"var(--tx)"}}><Ic name="clock" size={14}/>Completed: {selectedSale.at || selectedSale.date || "N/A"}</div>
                  {selectedSale.eventDate && <div className="flex items-center gap-2 text-xs" style={{color:"var(--t2)"}}><Ic name="calendar" size={12}/>Event: {selectedSale.eventDate}</div>}
                </div>

                {/* Notes */}
                {selectedSale.notes && <div className="rounded-2xl p-4" style={{background:"var(--sub)"}}>
                  <div className="text-[11px] font-bold mb-2" style={{color:"var(--t3)"}}>NOTES</div>
                  <div className="text-xs" style={{color:"var(--t2)"}}>{selectedSale.notes}</div>
                </div>}

                {/* Actions */}
                <div className="flex gap-2">
                  <Btn variant="outline" className="flex-1" onClick={()=>{sendInvoice(selectedSale);setSelectedSale(null);}}><Ic name="whatsapp" size={16}/>Send Invoice</Btn>
                  <Btn className="flex-1" onClick={()=>setSelectedSale(null)}>Close</Btn>
                </div>
              </div>
            </div></FadeIn>}
          </Shell>}

          {/* ════════ MORE ════════ */}
          {tab === "more" && <Shell title="More" subtitle="Tools & Settings" dark={dark}>
            {/* Sub-navigation */}
            {!subTab && <div className="space-y-2.5">
              {/* Profile Card - At Top */}
              <FadeIn delay={0}><Card><div className="space-y-3 p-5 text-center"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full" style={{background:"var(--bbg)",color:"var(--ac)"}}><Ic name="user" size={32}/></div><div className="text-base font-extrabold" style={{color:"var(--tx)"}}>{user.name}</div><div className="text-xs" style={{color:"var(--t3)"}}>{user.email}</div>
                
                {/* Edit Profile Button */}
                <Btn variant="outline" className="w-full text-xs" onClick={()=>{
                  const newName = prompt("Edit your display name:", user.name);
                  if(newName && newName.trim()) {
                    setUser({...user, name: newName.trim()});
                    flash("Name updated!");
                  }
                }}><Ic name="edit" size={14}/>Edit Profile</Btn>
                
                <div className="flex gap-2"><Btn variant="outline" className="flex-1 text-xs" onClick={()=>setDark(!dark)}><Ic name={dark?"sun":"moon"} size={14}/>{dark?"Light":"Dark"}</Btn><Btn variant="outline" className="flex-1 text-xs" onClick={async()=>{
                  if(!confirm("Clear ALL data? This cannot be undone!")) return;
                  // Clear all storage
                  const keys = ["ai_items4","ai_sales4","ai_cust4","ai_exp4","ai_slog4","ai_proj4","ai_inv4","ai_announce4","ai_ads4","ai_outlets4","ai_scanlogs4","ai_announce_url4","ai_last_sync4"];
                  for(const k of keys){try{localStorage.removeItem(k);}catch{}}
                  // Reset all state
                  setItems([]);setExpenses([]);setSales([]);setStockLog([]);setCustomers([]);setScanLogs([]);
                  setAnnouncements([]);setAdBanners([]);setOutlets([]);
                  flash("All data cleared!");
                  setTimeout(()=>window.location.reload(),500);
                }}><Ic name="refresh" size={14}/>Clear All</Btn></div><Btn variant="danger" className="w-full" onClick={async ()=>{localStorage.removeItem("ai_user4");setUser(null);flash("Logged out!");}}><Ic name="logout" size={16}/>Logout</Btn></div></Card></FadeIn>
              
              {/* Menu Items */}
              {[["Projects","clipboard","proj","Track & manage all projects"],["Invoice Generator","receipt","inv","Create & send project invoices"],["Partner Payments","wallet","payments","Pay team members for shared projects"],["Customers","users","cust","Customer database & history"],["Expenses","wallet","exp","Track rent, utilities, salary"],["Stock Log","receipt","slog","Stock in/out transactions"],["Expiry Tracker","clock","expiry","Monitor product freshness"],["Supplier","mapPin","outlets","Manage supplier locations"],["Settings","settings","settings","Manage announcements & preferences"]].map(([l,ic,key,desc],i) => (
                <FadeIn key={key} delay={0.05+(i*0.04)}><button type="button" onClick={()=>setSubTab(key)} className="w-full"><Card><div className="flex items-center gap-4 p-4"><div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{background:"var(--bbg)",color:"var(--bt)"}}><Ic name={ic} size={22}/></div><div className="flex-1 text-left"><div className="text-sm font-bold" style={{color:"var(--tx)"}}>{l}</div><div className="text-[11px]" style={{color:"var(--t3)"}}>{desc}</div></div><Ic name="chart" size={16} className="opacity-30"/></div></Card></button></FadeIn>
              ))}
            </div>}

            {/* ─── INVOICE GENERATOR ─── */}
            {subTab === "inv" && <div className="space-y-3">
              <button type="button" onClick={()=>{setSubTab(null);setPreviewInv(null);}} className="text-xs font-bold" style={{color:"var(--ac)"}}>← Back</button>

              {/* Invoice Preview Modal */}
              {previewInv && <FadeIn><Card className="overflow-hidden">
                <div className="p-1" style={{background:"linear-gradient(135deg,var(--a2),var(--ac))"}}>
                  <div className="rounded-[22px] p-5 space-y-4" style={{background:"var(--cd)"}}>
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div><div className="text-lg font-extrabold" style={{color:"var(--ac)"}}>AIRIS</div><div className="text-[10px] font-bold" style={{color:"var(--t3)"}}>INVOICE</div></div>
                      <div className="text-right"><div className="text-sm font-extrabold" style={{color:"var(--tx)"}}>{previewInv.invNo}</div><Badge color={previewInv.status==="Paid"?"green":"yellow"}>{previewInv.status}</Badge></div>
                    </div>
                    {/* Info */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl p-2.5" style={{background:"var(--sub)"}}><div className="text-[10px] font-bold" style={{color:"var(--t3)"}}>Buyer</div><div className="text-xs font-bold mt-0.5" style={{color:"var(--tx)"}}>{previewInv.buyerName}</div></div>
                      <div className="rounded-xl p-2.5" style={{background:"var(--sub)"}}><div className="text-[10px] font-bold" style={{color:"var(--t3)"}}>Event Date</div><div className="text-xs font-bold mt-0.5" style={{color:"var(--tx)"}}>{previewInv.eventDate}</div></div>
                    </div>
                    <div className="rounded-xl p-2.5" style={{background:"var(--sub)"}}><div className="text-[10px] font-bold" style={{color:"var(--t3)"}}>Event Location</div><div className="text-xs font-bold mt-0.5 flex items-center gap-1" style={{color:"var(--tx)"}}><Ic name="mapPin" size={12}/>{previewInv.eventLocation}</div></div>
                    {/* Packages */}
                    <div><div className="text-[10px] font-bold mb-2" style={{color:"var(--t3)"}}>PACKAGES</div>
                      {previewInv.packages.map((p,i) => <div key={i} className="flex items-center justify-between py-1.5" style={{borderBottom:"1px solid var(--cb)"}}><div><div className="text-xs font-bold" style={{color:"var(--tx)"}}>{p.name}</div><div className="text-[10px]" style={{color:"var(--t3)"}}>{p.qty} × {fmt(p.price)}</div></div><span className="text-xs font-extrabold" style={{color:"var(--tx)"}}>{fmt(p.subtotal)}</span></div>)}
                    </div>
                    {/* Totals */}
                    <div className="space-y-1.5 pt-2" style={{borderTop:"2px solid var(--cb)"}}>
                      <div className="flex justify-between text-xs" style={{color:"var(--t2)"}}><span>Package Total</span><span>{fmt(previewInv.packages.reduce((s,p)=>s+p.subtotal,0))}</span></div>
                      {previewInv.transportCost > 0 && <div className="flex justify-between text-xs" style={{color:"var(--t2)"}}><span>Transportation</span><span>{fmt(previewInv.transportCost)}</span></div>}
                      <div className="flex justify-between pt-1.5" style={{borderTop:"2px solid var(--cb)"}}><span className="text-sm font-extrabold" style={{color:"var(--tx)"}}>GRAND TOTAL</span><span className="text-lg font-extrabold" style={{color:"var(--ac)"}}>{fmt(previewInv.grandTotal)}</span></div>
                    </div>
                    {previewInv.notes && <div className="rounded-xl p-2.5 text-[11px]" style={{background:"var(--sub)",color:"var(--t2)"}}><span className="font-bold">Notes:</span> {previewInv.notes}</div>}
                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-2">
                      <Btn variant="outline" className="text-xs" onClick={()=>markInvoicePaid(previewInv.id)}><Ic name="check" size={14}/>{previewInv.status==="Paid"?"Mark Pending":"Mark Paid"}</Btn>
                      <button type="button" onClick={()=>sendInvoiceWA(previewInv)} className="inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold text-white active:scale-[0.96]" style={{background:"#25D366"}}><Ic name="whatsapp" size={16}/>Send</button>
                    </div>
                    <button type="button" onClick={()=>setPreviewInv(null)} className="w-full text-center text-xs font-bold py-2" style={{color:"var(--t3)"}}>Close Preview</button>
                  </div>
                </div>
              </Card></FadeIn>}

              {/* Create Invoice Form */}
              {!previewInv && <FadeIn><Card><div className="space-y-3 p-4">
                <div className="flex items-center gap-2"><div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{background:"var(--bbg)"}}><Ic name="receipt" size={16} style={{color:"var(--bt)"}}/></div><h3 className="text-sm font-extrabold" style={{color:"var(--tx)"}}>Create Invoice</h3></div>

                {/* Buyer Info */}
                <div className="rounded-2xl p-3 space-y-2.5" style={{background:"var(--sub)",border:"1px solid var(--cb)"}}>
                  <div className="text-[11px] font-bold flex items-center gap-1.5" style={{color:"var(--t2)"}}><Ic name="user" size={12}/>Buyer Information</div>
                  <Inp placeholder="Buyer name *" value={invForm.buyerName} onChange={e=>setIF({...invForm,buyerName:e.target.value})}/>
                  <Inp placeholder="Buyer phone (60123456789)" value={invForm.buyerPhone} onChange={e=>setIF({...invForm,buyerPhone:e.target.value})}/>
                </div>

                {/* Event Info */}
                <div className="rounded-2xl p-3 space-y-2.5" style={{background:"var(--sub)",border:"1px solid var(--cb)"}}>
                  <div className="text-[11px] font-bold flex items-center gap-1.5" style={{color:"var(--t2)"}}><Ic name="mapPin" size={12}/>Event Details</div>
                  <Inp placeholder="Event location *" value={invForm.eventLocation} onChange={e=>setIF({...invForm,eventLocation:e.target.value})}/>
                  <DatePicker placeholder="Event date *" value={invForm.eventDate} onChange={v=>setIF({...invForm,eventDate:v})}/>
                </div>

                {/* Packages — multiple */}
                <div className="rounded-2xl p-3 space-y-2.5" style={{background:"var(--sub)",border:"1px solid var(--cb)"}}>
                  <div className="flex items-center justify-between"><div className="text-[11px] font-bold flex items-center gap-1.5" style={{color:"var(--t2)"}}><Ic name="package" size={12}/>Packages</div><button type="button" onClick={()=>setIF({...invForm,packages:[...invForm.packages,{name:"",qty:"1",price:""}]})} className="text-[11px] font-bold flex items-center gap-1" style={{color:"var(--ac)"}}><Ic name="plus" size={12}/>Add</button></div>
                  {invForm.packages.map((pkg, idx) => (
                    <div key={idx} className="rounded-xl p-2.5 space-y-2" style={{background:"var(--ib2)",border:"1px dashed var(--ib)"}}>
                      <div className="flex items-center justify-between"><span className="text-[10px] font-bold" style={{color:"var(--t3)"}}>Package {idx+1}</span>{invForm.packages.length > 1 && <button type="button" onClick={()=>setIF({...invForm,packages:invForm.packages.filter((_,i)=>i!==idx)})} className="text-[10px] font-bold" style={{color:"#EF4444"}}>Remove</button>}</div>
                      <Inp placeholder="Package name (e.g. 500 pcs Aice Combo)" value={pkg.name} onChange={e=>{const p=[...invForm.packages];p[idx]={...p[idx],name:e.target.value};setIF({...invForm,packages:p});}}/>
                      <div className="grid grid-cols-2 gap-2">
                        <Inp placeholder="Qty" type="number" value={pkg.qty} onChange={e=>{const p=[...invForm.packages];p[idx]={...p[idx],qty:e.target.value};setIF({...invForm,packages:p});}}/>
                        <Inp placeholder="Price (RM)" type="number" value={pkg.price} onChange={e=>{const p=[...invForm.packages];p[idx]={...p[idx],price:e.target.value};setIF({...invForm,packages:p});}}/>
                      </div>
                      {pkg.name && pkg.price && <div className="text-right text-[11px] font-bold" style={{color:"var(--ac)"}}>= {fmt((+pkg.qty||1)*(+pkg.price||0))}</div>}
                    </div>
                  ))}
                </div>

                {/* Transportation */}
                <div className="rounded-2xl p-3 space-y-2.5" style={{background:"var(--sub)",border:"1px solid var(--cb)"}}>
                  <div className="text-[11px] font-bold flex items-center gap-1.5" style={{color:"var(--t2)"}}><Ic name="cart" size={12}/>Transportation Cost</div>
                  <Inp placeholder="Transportation / delivery (RM)" type="number" value={invForm.transportCost} onChange={e=>setIF({...invForm,transportCost:e.target.value})}/>
                </div>

                {/* Notes */}
                <textarea className="w-full rounded-2xl border px-4 py-3 text-sm font-medium outline-none resize-none placeholder:font-normal" rows={2} style={{background:"var(--ib2)",borderColor:"var(--ib)",color:"var(--tx)"}} placeholder="Additional notes..." value={invForm.notes} onChange={e=>setIF({...invForm,notes:e.target.value})}/>

                {/* Live total */}
                {(() => {
                  const pkgT = invForm.packages.reduce((s,p) => s + (+p.qty||1)*(+p.price||0), 0);
                  const trn = +invForm.transportCost || 0;
                  return (pkgT > 0 || trn > 0) ? (
                    <div className="rounded-2xl p-3 space-y-1" style={{background:dark?"rgba(59,130,246,0.08)":"rgba(0,87,217,0.05)"}}>
                      <div className="flex justify-between text-xs" style={{color:"var(--t2)"}}><span>Packages</span><span>{fmt(pkgT)}</span></div>
                      {trn > 0 && <div className="flex justify-between text-xs" style={{color:"var(--t2)"}}><span>Transport</span><span>{fmt(trn)}</span></div>}
                      <div className="flex justify-between pt-1" style={{borderTop:"1px solid var(--ib)"}}><span className="text-xs font-extrabold" style={{color:"var(--tx)"}}>Grand Total</span><span className="text-base font-extrabold" style={{color:"var(--ac)"}}>{fmt(pkgT+trn)}</span></div>
                    </div>
                  ) : null;
                })()}

                <Btn className="w-full" onClick={createInvoice}><Ic name="receipt" size={16}/>Generate Invoice</Btn>
              </div></Card></FadeIn>}

              {/* Invoice History */}
              {!previewInv && invoices.length > 0 && <>
                <SH title="Invoice History" action={`${invoices.length} total`}/>
                {invoices.map((inv, i) => (
                  <FadeIn key={inv.id} delay={i * 0.04}><Card onDel={()=>delInvoice(inv.id)}><div className="p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2"><span className="text-sm font-extrabold" style={{color:"var(--tx)"}}>{inv.invNo}</span><Badge color={inv.status==="Paid"?"green":"yellow"}>{inv.status}</Badge></div>
                        <div className="text-xs font-bold mt-0.5" style={{color:"var(--t2)"}}>{inv.buyerName}</div>
                      </div>
                      <span className="text-sm font-extrabold" style={{color:"var(--ac)"}}>{fmt(inv.grandTotal)}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold" style={{background:"var(--sub)",color:"var(--t3)"}}><Ic name="mapPin" size={10}/>{inv.eventLocation}</span>
                      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold" style={{background:"var(--sub)",color:"var(--t3)"}}><Ic name="clock" size={10}/>{inv.eventDate}</span>
                      {inv.packages.length > 0 && <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold" style={{background:"var(--sub)",color:"var(--t3)"}}><Ic name="package" size={10}/>{inv.packages.length} pkg</span>}
                    </div>
                    <div className="flex gap-2">
                      <Btn variant="outline" className="flex-1 text-xs py-2" onClick={()=>setPreviewInv(inv)}><Ic name="receipt" size={14}/>View</Btn>
                      <button type="button" onClick={()=>sendInvoiceWA(inv)} className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-2xl px-3 py-2 text-xs font-bold text-white active:scale-[0.96]" style={{background:"#25D366"}}><Ic name="whatsapp" size={14}/>Send</button>
                      <Btn variant="outline" className="text-xs py-2 px-3" onClick={()=>markInvoicePaid(inv.id)}><Ic name="check" size={14}/></Btn>
                    </div>
                  </div></Card></FadeIn>
                ))}
              </>}
            </div>}

            {/* ─── CUSTOMERS ─── */}
            {subTab === "cust" && <div className="space-y-3">
              <button type="button" onClick={()=>setSubTab(null)} className="text-xs font-bold" style={{color:"var(--ac)"}}>← Back</button>
              <Card><div className="space-y-2.5 p-4"><h3 className="text-sm font-extrabold" style={{color:"var(--tx)"}}>Add Customer</h3><Inp placeholder="Name" value={custForm.name} onChange={e=>setCF({...custForm,name:e.target.value})}/><Inp placeholder="Phone (60123456789)" value={custForm.phone} onChange={e=>setCF({...custForm,phone:e.target.value})}/><Inp placeholder="Location (e.g. Jalan Besar, Klang)" value={custForm.location} onChange={e=>setCF({...custForm,location:e.target.value})}/><Btn className="w-full" onClick={addCustomer}><Ic name="plus" size={16}/>Save</Btn></div></Card>
              {customers.map((c,i) => <FadeIn key={c.id} delay={i*0.04}><Card onDel={()=>delCustomer(c.id)}><div className="p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div><div className="text-sm font-bold" style={{color:"var(--tx)"}}>{c.name}</div><div className="text-[11px]" style={{color:"var(--t3)"}}>{c.orders} orders • Last: {c.lastOrder}</div></div>
                  <div className="flex items-center gap-1.5"><span className="text-xs font-extrabold" style={{color:"var(--ac)"}}>{fmt(c.totalSpent)}</span><a href={waLink(c.phone, `Hi ${c.name}! 👋`)} target="_blank" rel="noreferrer" className="rounded-lg p-1.5" style={{background:"#25D366",color:"white"}}><Ic name="whatsapp" size={14}/></a></div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {c.location && <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold" style={{background:"var(--sub)",color:"var(--t3)"}}><Ic name="mapPin" size={10}/>{c.location}</span>}
                  {c.phone && <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold" style={{background:"var(--sub)",color:"var(--t3)"}}><Ic name="phone" size={10}/>+{c.phone}</span>}
                </div>
              </div></Card></FadeIn>)}
            </div>}

            {/* ─── EXPENSES ─── */}
            {subTab === "exp" && <div className="space-y-3">
              <button type="button" onClick={()=>setSubTab(null)} className="text-xs font-bold" style={{color:"var(--ac)"}}>← Back</button>
              <Card><div className="grid grid-cols-2 gap-2 p-4">{Object.entries(expenses.reduce((a,e)=>{a[e.category]=(a[e.category]||0)+e.amount;return a;},{})).map(([cat,amt])=><div key={cat} className="rounded-2xl p-3" style={{background:"var(--sub)"}}><div className="text-[10px] font-bold" style={{color:"var(--t3)"}}>{cat}</div><div className="text-base font-extrabold" style={{color:"var(--tx)"}}>{fmt(amt)}</div></div>)}<div className="rounded-2xl p-3 col-span-2" style={{background:"rgba(239,68,68,0.06)"}}><div className="text-[10px] font-bold" style={{color:"#EF4444"}}>Total Expenses</div><div className="text-lg font-extrabold" style={{color:"#EF4444"}}>{fmt(stats.tExp)}</div></div></div></Card>
              <Card><div className="space-y-2.5 p-4"><h3 className="text-sm font-extrabold" style={{color:"var(--tx)"}}>Add Expense</h3><Sel value={expForm.category} onChange={e=>setEF({...expForm,category:e.target.value})}>{["Rent","Utilities","Staff","Transport","Supplies","Other"].map(c=><option key={c} value={c}>{c}</option>)}</Sel><Inp placeholder="Description" value={expForm.desc} onChange={e=>setEF({...expForm,desc:e.target.value})}/><Inp placeholder="Amount (RM)" type="number" value={expForm.amount} onChange={e=>setEF({...expForm,amount:e.target.value})}/><Btn className="w-full" onClick={addExpense}><Ic name="plus" size={16}/>Add</Btn></div></Card>
              {expenses.map((e,i)=><FadeIn key={e.id} delay={i*0.03}><Card onDel={()=>delExpense(e.id)}><div className="flex items-center justify-between p-3"><div><div className="text-xs font-bold" style={{color:"var(--tx)"}}>{e.desc}</div><div className="text-[11px]" style={{color:"var(--t3)"}}>{e.category} • {e.date}</div></div><span className="text-xs font-extrabold" style={{color:"#EF4444"}}>{fmt(e.amount)}</span></div></Card></FadeIn>)}
            </div>}

            {/* ─── STOCK LOG ─── */}
            {subTab === "slog" && <div className="space-y-3">
              <button type="button" onClick={()=>setSubTab(null)} className="text-xs font-bold" style={{color:"var(--ac)"}}>← Back</button>
              <Card><div className="space-y-2.5 p-4"><h3 className="text-sm font-extrabold" style={{color:"var(--tx)"}}>Stock In / Out</h3><div className="flex gap-2"><Btn2 active={stockForm.type==="IN"} onClick={()=>setSLF({...stockForm,type:"IN"})} className="flex-1">📥 Stock IN</Btn2><Btn2 active={stockForm.type==="OUT"} onClick={()=>setSLF({...stockForm,type:"OUT"})} className="flex-1">📤 Stock OUT</Btn2></div><Sel value={stockForm.itemName} onChange={e=>setSLF({...stockForm,itemName:e.target.value})}>{items.map(i=><option key={i.id} value={i.name}>{i.name} ({i.qty})</option>)}</Sel><Inp placeholder="Qty" type="number" value={stockForm.qty} onChange={e=>setSLF({...stockForm,qty:e.target.value})}/><Inp placeholder="Note (e.g. Restock from supplier)" value={stockForm.note} onChange={e=>setSLF({...stockForm,note:e.target.value})}/><Btn className="w-full" onClick={logStock}><Ic name={stockForm.type==="IN"?"arrowIn":"arrowOut"} size={16}/>Record</Btn></div></Card>
              {stockLog.map((l,i)=><FadeIn key={l.id} delay={i*0.03}><Card onDel={()=>delStockLog(l.id)}><div className="flex items-center gap-3 p-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{background:l.type==="IN"?"rgba(22,163,74,0.1)":"rgba(239,68,68,0.1)",color:l.type==="IN"?"#16A34A":"#EF4444"}}><Ic name={l.type==="IN"?"arrowIn":"arrowOut"} size={18}/></div><div className="flex-1"><div className="text-xs font-bold" style={{color:"var(--tx)"}}>{l.itemName} <Badge color={l.type==="IN"?"green":"red"}>{l.type} {l.qty}</Badge></div><div className="text-[11px]" style={{color:"var(--t3)"}}>{l.note} • {l.date}</div></div></div></Card></FadeIn>)}
            </div>}

            {/* ─── EXPIRY ─── */}
            {subTab === "expiry" && <div className="space-y-3">
              <button type="button" onClick={()=>setSubTab(null)} className="text-xs font-bold" style={{color:"var(--ac)"}}>← Back</button>
              <div className="grid grid-cols-3 gap-2">{[["Expired",items.filter(i=>daysUntil(i.expiry)<0).length,"red"],["< 3 days",items.filter(i=>{const d=daysUntil(i.expiry);return d>=0&&d<=3;}).length,"red"],["< 7 days",items.filter(i=>{const d=daysUntil(i.expiry);return d>3&&d<=7;}).length,"yellow"]].map(([l,n,c])=><Card key={l}><div className="p-3 text-center"><div className="text-[10px] font-bold" style={{color:c==="red"?"#EF4444":c==="yellow"?"#CA8A04":"var(--t3)"}}>{l}</div><div className="text-2xl font-extrabold" style={{color:c==="red"?"#EF4444":c==="yellow"?"#CA8A04":"var(--tx)"}}>{n}</div></div></Card>)}</div>
              {items.sort((a,b)=>daysUntil(a.expiry)-daysUntil(b.expiry)).map((item,i)=>{const es=expiryStatus(item.expiry);return <FadeIn key={item.id} delay={i*0.03}><Card><div className="flex items-center justify-between p-3"><div className="flex items-center gap-3"><PImg name={item.name} size="h-10 w-10" r="rounded-lg"/><div><div className="text-xs font-bold" style={{color:"var(--tx)"}}>{item.name}</div><div className="text-[11px]" style={{color:"var(--t3)"}}>{item.qty} {item.unit} • Exp: {item.expiry}</div></div></div><Badge color={es.color}>{es.label}</Badge></div></Card></FadeIn>;})}
            </div>}

            {/* ─── PROJECTS ─── */}
            {subTab === "proj" && <div className="space-y-3">
              <button type="button" onClick={()=>setSubTab(null)} className="text-xs font-bold" style={{color:"var(--ac)"}}>← Back</button>

              {/* Project Stats */}
              <div className="grid grid-cols-3 gap-2">
                {[["Pending", projects.filter(p=>p.status==="Pending").length, "yellow"], ["In Progress", projects.filter(p=>p.status==="In Progress").length, "blue"], ["Completed", projects.filter(p=>p.status==="Completed").length, "green"]].map(([l,n,c]) => (
                  <div key={l} className="rounded-2xl p-3 text-center" style={{background: c==="yellow"?"rgba(234,179,8,0.08)":c==="green"?"rgba(22,163,74,0.08)":"var(--bbg)"}}>
                    <div className="text-lg font-extrabold" style={{color: c==="yellow"?"#CA8A04":c==="green"?"#16A34A":"var(--ac)"}}>{n}</div>
                    <div className="text-[10px] font-bold" style={{color:"var(--t3)"}}>{l}</div>
                  </div>
                ))}
              </div>

              {/* Map View - All Projects */}
              {projects.length > 0 && <FadeIn delay={0.03}>
                <Card>
                  <div className="p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold" style={{color:"var(--tx)"}}>📍 All Project Locations</div>
                      <div className="text-[10px] font-bold" style={{color:"var(--t3)"}}>{projects.length} pin{projects.length>1?"s":""}</div>
                    </div>
                    {(() => {
                      // Build Google Maps URL with multiple markers
                      const markers = projects.map(p => `markers=color:${p.status==="Completed"?"green":p.status==="In Progress"?"blue":"red"}%7Clabel:${p.code.replace("PRJ-","")}%7C${p.latitude},${p.longitude}`).join("&");
                      const center = projects.length > 0 ? `${projects[0].latitude},${projects[0].longitude}` : "3.1390,101.6869";
                      const mapUrl = `https://maps.google.com/maps?q=${center}&z=10&output=embed&${markers}`;
                      
                      return (
                        <div className="relative rounded-xl overflow-hidden" style={{background:"var(--sub)"}}>
                          <iframe src={mapUrl} className="w-full h-64 border-0" loading="lazy" title="All Projects Map"/>
                          <div className="absolute bottom-2 left-2 right-2 rounded-lg p-2 flex gap-2 text-[9px] font-bold" style={{background:"rgba(255,255,255,0.95)"}}>
                            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{background:"#CA8A04"}}/>Pending</span>
                            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{background:"#3B82F6"}}/>In Progress</span>
                            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{background:"#16A34A"}}/>Completed</span>
                          </div>
                        </div>
                      );
                    })()}
                    <a href={`https://www.google.com/maps/dir/${projects.map(p=>`${p.latitude},${p.longitude}`).join("/")}`} target="_blank" rel="noreferrer" className="block text-center py-2 text-[11px] font-bold rounded-lg" style={{background:"var(--bbg)",color:"var(--ac)"}}>
                      Open Route in Google Maps ↗
                    </a>
                  </div>
                </Card>
              </FadeIn>}

              {/* Add Project Form */}
              <FadeIn delay={0.05}><Card><div className="space-y-3 p-4">
                <div className="flex items-center gap-2"><Ic name="clipboard" size={16} style={{color:"var(--ac)"}}/><h3 className="text-sm font-extrabold" style={{color:"var(--tx)"}}>New Project</h3></div>
                
                <div className="grid grid-cols-2 gap-2"><Inp placeholder="Code (e.g. PRJ-003)" value={projForm.code} onChange={e=>setPF({...projForm,code:e.target.value})}/><Inp placeholder="Project name *" value={projForm.name} onChange={e=>setPF({...projForm,name:e.target.value})}/></div>
                
                <PlaceSearch locationName={projForm.locationName} coordinates={projForm.coordinates} onSelect={({ locationName, coordinates }) => setPF({...projForm, locationName, coordinates })}/>
                
                <DatePicker placeholder="Event / deadline date" value={projForm.eventDate} onChange={v=>setPF({...projForm,eventDate:v})}/>
                
                {/* Item Selection */}
                <div className="rounded-2xl p-3 space-y-2" style={{background:"var(--sub)",border:"1px solid var(--cb)"}}>
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] font-bold flex items-center gap-1.5" style={{color:"var(--t2)"}}><Ic name="package" size={12}/>Items to Send</div>
                    <button type="button" onClick={()=>setPF({...projForm,selectedItems:[...projForm.selectedItems,{itemName:"",qty:1}]})} className="text-[11px] font-bold flex items-center gap-1" style={{color:"var(--ac)"}}><Ic name="plus" size={12}/>Add</button>
                  </div>
                  {projForm.selectedItems.length === 0 && <div className="text-[10px] text-center py-2" style={{color:"var(--t3)"}}>Tap "Add" to select items from inventory</div>}
                  {projForm.selectedItems.map((si, idx) => {
                    const invItem = items.find(i=>i.name===si.itemName);
                    return (
                      <div key={idx} className="rounded-xl p-2.5 space-y-2" style={{background:"var(--ib2)",border:"1px dashed var(--ib)"}}>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold" style={{color:"var(--t3)"}}>Item {idx+1}</span>
                          <button type="button" onClick={()=>setPF({...projForm,selectedItems:projForm.selectedItems.filter((_,i)=>i!==idx)})} className="text-[10px] font-bold" style={{color:"#EF4444"}}>Remove</button>
                        </div>
                        <Sel value={si.itemName} onChange={e=>{const s=[...projForm.selectedItems];s[idx]={...s[idx],itemName:e.target.value};setPF({...projForm,selectedItems:s});}}>
                          <option value="">Select item...</option>
                          {items.map(item => <option key={item.id} value={item.name}>{item.name} (Stock: {item.qty})</option>)}
                        </Sel>
                        {invItem && <div className="grid grid-cols-2 gap-2">
                          <Inp placeholder="Qty" type="number" value={si.qty} onChange={e=>{const s=[...projForm.selectedItems];s[idx]={...s[idx],qty:+e.target.value};setPF({...projForm,selectedItems:s});}}/>
                          <div className="rounded-xl px-3 py-2.5 text-xs font-bold flex items-center justify-between" style={{background:"var(--cd)",border:"1px solid var(--cb)"}}><span style={{color:"var(--t3)"}}> Cost:</span><span style={{color:"var(--ac)"}}>{fmt(invItem.cost * (si.qty||0))}</span></div>
                        </div>}
                      </div>
                    );
                  })}
                  {projForm.selectedItems.length > 0 && (() => {
                    const itemsTotal = projForm.selectedItems.reduce((s,si)=>{const inv=items.find(i=>i.name===si.itemName);return s+(inv?inv.cost*si.qty:0);},0);
                    return <div className="pt-2 text-xs font-bold flex justify-between" style={{borderTop:"1px solid var(--ib)",color:"var(--tx)"}}><span>Items Total:</span><span style={{color:"var(--ac)"}}>{fmt(itemsTotal)}</span></div>;
                  })()}
                </div>
                
                <Inp placeholder="Transportation cost (RM)" type="number" value={projForm.transportCost} onChange={e=>setPF({...projForm,transportCost:e.target.value})}/>
                
                <Sel value={projForm.visibility} onChange={e=>setPF({...projForm,visibility:e.target.value})}><option value="Local">Local</option><option value="Global">Global</option></Sel>
                
                <textarea className="w-full rounded-2xl border px-4 py-3 text-sm font-medium outline-none resize-none placeholder:font-normal" rows={2} style={{background:"var(--ib2)",borderColor:"var(--ib)",color:"var(--tx)"}} placeholder="Project notes..." value={projForm.notes} onChange={e=>setPF({...projForm,notes:e.target.value})}/>
                
                <Btn className="w-full" onClick={addProject}><Ic name="plus" size={16}/>Create Project</Btn>
              </div></Card></FadeIn>

              {/* Project List */}
              <SH title="All Projects" action={`${projects.length} total`}/>
              {projects.map((p,i) => {
                const statusColor = p.status === "Completed" ? "green" : p.status === "In Progress" ? "blue" : "yellow";
                const daysLeft = p.eventDate ? daysUntil(p.eventDate) : null;
                const totalQty = (p.items||[]).reduce((s,x)=>s+x.qty,0);
                return (
                  <FadeIn key={p.id} delay={0.1+i*0.04}><Card onDel={()=>delProject(p.id)}><div className="space-y-3 p-4">
                    {/* Header */}
                    <div className="flex gap-3 items-start">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl" style={{background: p.status==="Completed"?"rgba(22,163,74,0.1)":"var(--bbg)", color: p.status==="Completed"?"#16A34A":"var(--bt)"}}>
                        <Ic name={p.status==="Completed"?"check":"mapPin"} size={24}/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold truncate" style={{color:"var(--tx)"}}>{p.name}</div>
                        <div className="text-[11px]" style={{color:"var(--t3)"}}>{p.code} • {p.locationName}</div>
                      </div>
                    </div>

                    {/* Status & badges */}
                    <div className="flex flex-wrap gap-1.5">
                      <Badge color={statusColor}>{p.status}</Badge>
                      <Badge color="slate">{p.visibility}</Badge>
                      {p.eventDate && <Badge color={daysLeft !== null && daysLeft < 0 ? "red" : daysLeft <= 3 ? "yellow" : "slate"}>{p.eventDate}{daysLeft !== null ? ` (${daysLeft < 0 ? "overdue" : daysLeft + "d left"})` : ""}</Badge>}
                      {totalQty > 0 && <Badge color="slate">{totalQty} items</Badge>}
                    </div>

                    {/* Progress bar */}
                    <div>
                      <div className="flex justify-between text-[10px] font-bold mb-1" style={{color:"var(--t3)"}}><span>Progress</span><span>{p.status==="Completed"?"100":p.status==="In Progress"?"50":"0"}%</span></div>
                      <div className="h-2 rounded-full" style={{background:"var(--ib)"}}>
                        <div className="h-2 rounded-full transition-all duration-500" style={{width: p.status==="Completed"?"100%":p.status==="In Progress"?"50%":"0%", background: p.status==="Completed"?"#16A34A":p.status==="In Progress"?"var(--ac)":"#CA8A04"}}/>
                      </div>
                    </div>

                    {/* Items list */}
                    {(p.items||[]).length > 0 && <div className="rounded-xl p-2.5 space-y-1.5" style={{background:"var(--sub)"}}>
                      <div className="text-[10px] font-bold" style={{color:"var(--t3)"}}>ITEMS</div>
                      {p.items.map((item,idx)=><div key={idx} className="flex items-center justify-between text-[11px]"><span style={{color:"var(--tx)"}}>{item.name} × {item.qty}</span><span className="font-bold" style={{color:"var(--t2)"}}>{fmt(item.totalCost||0)}</span></div>)}
                    </div>}

                    {/* Cost breakdown + Profit */}
                    <div className="rounded-xl p-2.5 space-y-1" style={{background:p.status==="Completed"&&p.profit>0?"rgba(22,163,74,0.06)":"var(--sub)"}}>
                      <div className="flex justify-between text-[11px]" style={{color:"var(--t2)"}}><span>Items Cost</span><span>{fmt((p.items||[]).reduce((s,x)=>s+(x.totalCost||0),0))}</span></div>
                      {p.transportCost>0 && <div className="flex justify-between text-[11px]" style={{color:"var(--t2)"}}><span>Transport</span><span>{fmt(p.transportCost)}</span></div>}
                      <div className="flex justify-between pt-1 text-xs font-bold" style={{borderTop:"1px solid var(--ib)",color:"var(--tx)"}}><span>Total Cost</span><span>{fmt(p.totalCost)}</span></div>
                      {p.status==="Completed" && p.revenue > 0 && <>
                        <div className="flex justify-between text-[11px]" style={{color:"var(--t2)",paddingTop:"4px",borderTop:"1px solid var(--ib)"}}><span>Revenue</span><span>{fmt(p.revenue)}</span></div>
                        <div className="flex justify-between text-sm font-extrabold" style={{color:p.profit>0?"#16A34A":"#EF4444"}}><span>Profit</span><span>{fmt(p.profit)}</span></div>
                      </>}
                    </div>

                    {p.notes && <div className="text-[11px] rounded-xl p-2" style={{background:"var(--sub)",color:"var(--t3)"}}>{p.notes}</div>}
                    
                    {/* Shared With Badge */}
                    {p.sharedWith && p.sharedWith.length > 0 && <div className="rounded-xl p-2.5 space-y-1.5" style={{background:"rgba(0,87,217,0.06)"}}>
                      <div className="flex items-center gap-1.5">
                        <Ic name="users" size={12} style={{color:"var(--ac)"}}/>
                        <span className="text-[10px] font-bold" style={{color:"var(--ac)"}}>SHARED WITH {p.sharedWith.length} MEMBER{p.sharedWith.length>1?"S":""}</span>
                      </div>
                      {p.sharedWith.map(m => (
                        <div key={m.username} className="text-[10px] space-y-0.5">
                          <div className="flex items-center justify-between">
                            <span style={{color:"var(--t2)",fontWeight:"bold"}}>👤 {m.name}</span>
                          </div>
                          {m.customerPrice && <>
                            <div className="flex items-center justify-between pl-3">
                              <span style={{color:"var(--t3)"}}>Customer pays:</span>
                              <span style={{color:"#16A34A",fontWeight:"bold"}}>{fmt(m.customerPrice)}</span>
                            </div>
                            <div className="flex items-center justify-between pl-3">
                              <span style={{color:"var(--t3)"}}>Pay {m.name.split(" ")[0]}:</span>
                              <span style={{color:"#EF4444",fontWeight:"bold"}}>-{fmt(m.partnerPayment)}</span>
                            </div>
                            <div className="flex items-center justify-between pl-3 font-bold">
                              <span style={{color:"var(--ac)"}}>Your Cut:</span>
                              <span style={{color:m.margin>=0?"#16A34A":"#EF4444"}}>{fmt(m.margin)}</span>
                            </div>
                          </>}
                        </div>
                      ))}
                      {p.sharedWith.some(m => m.margin) && (
                        <div className="border-t pt-1.5 flex items-center justify-between text-[11px]" style={{borderColor:"rgba(0,87,217,0.2)"}}>
                          <span style={{color:"var(--ac)",fontWeight:"bold"}}>Total Commission:</span>
                          <span style={{color:"#16A34A",fontWeight:"bold"}}>{fmt(p.sharedWith.reduce((s,m)=>s+(m.margin||0),0))}</span>
                        </div>
                      )}
                    </div>}

                    {/* Action buttons */}
                    <div className="grid grid-cols-3 gap-2">
                      <button 
                        type="button" 
                        onClick={() => toggleProjectStatus(p.id)}
                        className="inline-flex items-center justify-center gap-1.5 rounded-2xl px-3 py-3 text-xs font-bold transition-all active:scale-95 cursor-pointer"
                        style={{
                          background: "var(--cd)",
                          color: "var(--ac)",
                          border: "1px solid var(--ib)"
                        }}
                      >
                        <Ic name={p.status==="Completed"?"refresh":p.status==="In Progress"?"check":"trending"} size={14}/>
                        {p.status==="Pending"?"Start":p.status==="In Progress"?"Complete":"Reopen"}
                      </button>
                      <Btn variant="outline" className="text-xs" onClick={()=>setSelProjId(p.id)}><Ic name="mapPin" size={14}/>Map</Btn>
                      <Btn variant="outline" className="text-xs" onClick={()=>setShareProject(p)}><Ic name="share" size={14}/>Share</Btn>
                    </div>
                  </div></Card></FadeIn>
                );
              })}

              {/* Map */}
              {projects.find(p=>p.id===selProjId) && (() => { const sp = projects.find(p=>p.id===selProjId); return <MapCard lat={sp.latitude} lng={sp.longitude} name={sp.locationName}/>; })()}
              
              {/* Share Project Modal */}
              {shareProject && <FadeIn><div className="fixed inset-0 z-50 flex items-end justify-center" style={{background:"rgba(0,0,0,0.5)"}} onClick={()=>setShareProject(null)}>
                <div className="w-full max-w-md rounded-t-3xl p-5 space-y-4" style={{background:"var(--cd)", maxHeight:"85vh", overflowY:"auto"}} onClick={(e)=>e.stopPropagation()}>
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-extrabold" style={{color:"var(--tx)"}}>Share Project</h3>
                      <div className="text-xs" style={{color:"var(--t3)"}}>{shareProject.name} • {shareProject.code}</div>
                    </div>
                    <button type="button" onClick={()=>setShareProject(null)} className="rounded-full p-1.5" style={{background:"var(--sub)"}}><Ic name="x" size={18}/></button>
                  </div>
                  
                  {/* Project Info */}
                  <div className="rounded-2xl p-3" style={{background:"var(--sub)"}}>
                    <div className="text-[10px] font-bold mb-2" style={{color:"var(--t3)"}}>PROJECT DETAILS</div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div><span style={{color:"var(--t3)"}}>Location:</span> <span style={{color:"var(--tx)",fontWeight:"bold"}}>{shareProject.locationName}</span></div>
                      <div><span style={{color:"var(--t3)"}}>Status:</span> <span style={{color:"var(--ac)",fontWeight:"bold"}}>{shareProject.status}</span></div>
                      <div><span style={{color:"var(--t3)"}}>Items:</span> <span style={{color:"var(--tx)",fontWeight:"bold"}}>{shareProject.items?.length || 0}</span></div>
                      <div><span style={{color:"var(--t3)"}}>Total Cost:</span> <span style={{color:"var(--tx)",fontWeight:"bold"}}>{fmt(shareProject.totalCost)}</span></div>
                    </div>
                  </div>
                  
                  {/* Team Members List */}
                  <div>
                    <div className="text-[10px] font-bold mb-2" style={{color:"var(--t3)"}}>SHARE WITH TEAM MEMBERS</div>
                    <div className="space-y-2">
                      {userAccounts.filter(acc => acc.username !== user.username).map(acc => {
                        const sharedMember = (shareProject.sharedWith || []).find(m => m.username === acc.username);
                        const isShared = !!sharedMember;
                        return (
                          <div key={acc.username} className="rounded-2xl p-3 space-y-2" style={{background:"var(--sub)"}}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{background:"var(--bbg)",color:"var(--ac)"}}>
                                  <Ic name="user" size={18}/>
                                </div>
                                <div>
                                  <div className="text-xs font-bold" style={{color:"var(--tx)"}}>{acc.name}</div>
                                  <div className="text-[10px]" style={{color:"var(--t3)"}}>@{acc.username} • {acc.role}</div>
                                </div>
                              </div>
                              <button type="button" onClick={()=>{
                                if(isShared){
                                  // Remove
                                  const newShared = (shareProject.sharedWith || []).filter(m => m.username !== acc.username);
                                  setProjects(p => p.map(pr => pr.id === shareProject.id ? {...pr, sharedWith: newShared} : pr));
                                  setShareProject({...shareProject, sharedWith: newShared});
                                  flash(`Removed ${acc.name}`);
                                } else {
                                  // Ask for customer price first
                                  const customerPrice = prompt(`Step 1/2: Customer Total Price\n\nProject: ${shareProject.name}\nYour Cost: ${fmt(shareProject.totalCost)}\n\nHow much will customer pay YOU? (RM)`);
                                  if(customerPrice === null) return;
                                  if(customerPrice === "" || isNaN(+customerPrice)) return flash("Please enter valid price");
                                  
                                  // Ask for partner payment
                                  const partnerPay = prompt(`Step 2/2: Pay ${acc.name}\n\nCustomer pays you: ${fmt(+customerPrice)}\nYour Cost: ${fmt(shareProject.totalCost)}\n\nHow much will you pay ${acc.name}? (RM)\n\n(They handle the project, you take commission)`);
                                  if(partnerPay === null) return;
                                  if(partnerPay === "" || isNaN(+partnerPay)) return flash("Please enter valid amount");
                                  
                                  const yourMargin = +customerPrice - +partnerPay;
                                  
                                  const newMember = {
                                    username: acc.username, 
                                    name: acc.name, 
                                    role: acc.role, 
                                    sharedAt: new Date().toISOString(),
                                    customerPrice: +customerPrice, // What customer pays YOU
                                    partnerPayment: +partnerPay, // What you pay PARTNER
                                    margin: yourMargin // Your commission
                                  };
                                  const newShared = [...(shareProject.sharedWith || []), newMember];
                                  setProjects(p => p.map(pr => pr.id === shareProject.id ? {...pr, sharedWith: newShared} : pr));
                                  setShareProject({...shareProject, sharedWith: newShared});
                                  flash(`Shared! Your commission: ${fmt(yourMargin)}`);
                                }
                              }} className="rounded-xl px-3 py-1.5 text-[10px] font-bold transition-all" style={{
                                background: isShared ? "rgba(239,68,68,0.1)" : "var(--ac)",
                                color: isShared ? "#EF4444" : "white"
                              }}>
                                {isShared ? "Remove" : "Share"}
                              </button>
                            </div>
                            
                            {/* Show pricing if shared */}
                            {isShared && sharedMember.customerPrice && (
                              <div className="rounded-xl p-2.5 space-y-1.5" style={{background:"var(--cd)"}}>
                                <div className="flex items-center justify-between text-[10px]">
                                  <span style={{color:"var(--t3)"}}>Customer pays you:</span>
                                  <span style={{color:"#16A34A",fontWeight:"bold"}}>{fmt(sharedMember.customerPrice)}</span>
                                </div>
                                <div className="flex items-center justify-between text-[10px]">
                                  <span style={{color:"var(--t3)"}}>You pay {acc.name}:</span>
                                  <span style={{color:"#EF4444",fontWeight:"bold"}}>-{fmt(sharedMember.partnerPayment)}</span>
                                </div>
                                <div className="border-t pt-1.5 flex items-center justify-between text-xs" style={{borderColor:"var(--sub)"}}>
                                  <span style={{color:"var(--t2)",fontWeight:"bold"}}>Your Commission:</span>
                                  <span style={{color:sharedMember.margin >= 0 ? "#16A34A" : "#EF4444",fontWeight:"bold"}}>{fmt(sharedMember.margin)}</span>
                                </div>
                                <button type="button" onClick={()=>{
                                  const newCustPrice = prompt(`Edit customer price:`, sharedMember.customerPrice);
                                  if(newCustPrice === null) return;
                                  if(newCustPrice === "" || isNaN(+newCustPrice)) return flash("Invalid price");
                                  const newPartnerPay = prompt(`Edit payment to ${acc.name}:`, sharedMember.partnerPayment);
                                  if(newPartnerPay === null) return;
                                  if(newPartnerPay === "" || isNaN(+newPartnerPay)) return flash("Invalid amount");
                                  
                                  const newShared = (shareProject.sharedWith || []).map(m => 
                                    m.username === acc.username 
                                      ? {...m, customerPrice: +newCustPrice, partnerPayment: +newPartnerPay, margin: +newCustPrice - +newPartnerPay}
                                      : m
                                  );
                                  setProjects(p => p.map(pr => pr.id === shareProject.id ? {...pr, sharedWith: newShared} : pr));
                                  setShareProject({...shareProject, sharedWith: newShared});
                                  flash("Updated!");
                                }} className="w-full rounded-lg py-1 text-[10px] font-bold" style={{background:"var(--bbg)",color:"var(--ac)"}}>
                                  Edit Amounts
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Currently Shared With */}
                  {(shareProject.sharedWith || []).length > 0 && <div className="rounded-2xl p-3" style={{background:"rgba(0,87,217,0.06)"}}>
                    <div className="text-[10px] font-bold mb-1.5" style={{color:"var(--ac)"}}>✓ CURRENTLY SHARED WITH</div>
                    <div className="flex flex-wrap gap-1.5">
                      {shareProject.sharedWith.map(m => (
                        <span key={m.username} className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold" style={{background:"var(--ac)",color:"white"}}>
                          <Ic name="check" size={10}/>{m.name}
                        </span>
                      ))}
                    </div>
                  </div>}
                  
                  {/* Share via WhatsApp */}
                  <Btn className="w-full" onClick={()=>{
                    const shareText = `*PROJECT SHARED*\n\n*Project:* ${shareProject.name}\n*Code:* ${shareProject.code}\n*Location:* ${shareProject.locationName}\n*Status:* ${shareProject.status}\n*Total Cost:* ${fmt(shareProject.totalCost)}\n*Items:* ${shareProject.items?.length || 0}\n${shareProject.eventDate ? `*Event Date:* ${shareProject.eventDate}\n` : ''}${shareProject.notes ? `*Notes:* ${shareProject.notes}\n` : ''}\n_Shared via AIRIS_`;
                    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
                  }}><Ic name="whatsapp" size={16}/>Share via WhatsApp</Btn>
                  
                  <Btn variant="outline" className="w-full" onClick={()=>setShareProject(null)}>Done</Btn>
                </div>
              </div></FadeIn>}
            </div>}

            {/* ─── PARTNER PAYMENTS ─── */}
            {subTab === "payments" && <div className="space-y-3">
              <button type="button" onClick={()=>setSubTab(null)} className="text-xs font-bold" style={{color:"var(--ac)"}}>← Back</button>
              
              {/* Bank Setup Button */}
              <Btn variant="outline" className="w-full" onClick={()=>setBankSetupModal(true)}>
                <Ic name="settings" size={14}/>Setup Team Bank Details
              </Btn>
              
              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-2">
                <Card><div className="p-3 text-center">
                  <div className="text-[10px] font-bold" style={{color:"var(--t3)"}}>TOTAL OWED</div>
                  <div className="text-base font-extrabold mt-1" style={{color:"#EF4444"}}>{fmt(partnerPayments.filter(p=>p.status==="Pending").reduce((s,p)=>s+p.amount,0))}</div>
                </div></Card>
                <Card><div className="p-3 text-center">
                  <div className="text-[10px] font-bold" style={{color:"var(--t3)"}}>PAID</div>
                  <div className="text-base font-extrabold mt-1" style={{color:"#16A34A"}}>{fmt(partnerPayments.filter(p=>p.status==="Paid").reduce((s,p)=>s+p.amount,0))}</div>
                </div></Card>
                <Card><div className="p-3 text-center">
                  <div className="text-[10px] font-bold" style={{color:"var(--t3)"}}>PENDING</div>
                  <div className="text-base font-extrabold mt-1" style={{color:"var(--ac)"}}>{partnerPayments.filter(p=>p.status==="Pending").length}</div>
                </div></Card>
              </div>
              
              {/* Pending Payments */}
              <SH title="Pending Payments" action={`${partnerPayments.filter(p=>p.status==="Pending").length} pending`}/>
              {partnerPayments.filter(p=>p.status==="Pending").length === 0 ? (
                <FadeIn><Card><div className="p-6 text-center">
                  <Ic name="check" size={32} style={{color:"#16A34A"}} className="mx-auto mb-2"/>
                  <div className="text-sm font-bold" style={{color:"var(--tx)"}}>All paid up!</div>
                  <div className="text-xs" style={{color:"var(--t3)"}}>No pending payments to partners</div>
                </div></Card></FadeIn>
              ) : (
                <div className="space-y-2">
                  {partnerPayments.filter(p=>p.status==="Pending").map((payment, i) => {
                    const member = userAccounts.find(u => u.username === payment.memberUsername);
                    const dueDate = new Date(payment.dueDate);
                    const daysLeft = Math.ceil((dueDate - new Date()) / (1000*60*60*24));
                    return (
                      <FadeIn key={payment.id} delay={i*0.05}><Card onDel={()=>setPartnerPayments(p=>p.filter(x=>x.id!==payment.id))}>
                        <div className="p-3 space-y-3">
                          {/* Header */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{background:"var(--bbg)",color:"var(--ac)"}}>
                                <Ic name="user" size={18}/>
                              </div>
                              <div>
                                <div className="text-xs font-bold" style={{color:"var(--tx)"}}>{payment.memberName}</div>
                                <div className="text-[10px]" style={{color:"var(--t3)"}}>{payment.projectCode} • {payment.projectName}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-base font-extrabold" style={{color:"#EF4444"}}>{fmt(payment.amount)}</div>
                              <div className="text-[10px]" style={{color:daysLeft<0?"#EF4444":daysLeft<3?"#F59E0B":"var(--t3)"}}>
                                {daysLeft<0?`${Math.abs(daysLeft)} days overdue`:daysLeft===0?"Due today":`${daysLeft} days left`}
                              </div>
                            </div>
                          </div>
                          
                          {/* Bank Details */}
                          {member && member.bankName ? (
                            <div className="rounded-xl p-2.5 space-y-1" style={{background:"var(--sub)"}}>
                              <div className="flex justify-between text-[10px]"><span style={{color:"var(--t3)"}}>Bank:</span><span style={{color:"var(--tx)",fontWeight:"bold"}}>{member.bankName}</span></div>
                              <div className="flex justify-between text-[10px]"><span style={{color:"var(--t3)"}}>Account:</span><span style={{color:"var(--tx)",fontWeight:"bold"}}>{member.accountNo}</span></div>
                              <div className="flex justify-between text-[10px]"><span style={{color:"var(--t3)"}}>Name:</span><span style={{color:"var(--tx)",fontWeight:"bold"}}>{member.accountName}</span></div>
                              {member.phone && <div className="flex justify-between text-[10px]"><span style={{color:"var(--t3)"}}>Phone:</span><span style={{color:"var(--tx)",fontWeight:"bold"}}>{member.phone}</span></div>}
                            </div>
                          ) : (
                            <div className="rounded-xl p-2.5 text-center" style={{background:"rgba(234,179,8,0.1)"}}>
                              <div className="text-[10px] font-bold" style={{color:"#CA8A04"}}>⚠️ No bank details for {payment.memberName}</div>
                              <div className="text-[10px] mt-0.5" style={{color:"var(--t3)"}}>Setup bank details first</div>
                            </div>
                          )}
                          
                          {/* Action Buttons */}
                          <div className="grid grid-cols-2 gap-2">
                            <Btn variant="outline" className="text-xs" onClick={()=>{
                              if(!member || !member.accountNo) return flash("Setup bank details first");
                              setQrPayment({...payment, member});
                            }}><Ic name="scan" size={12}/>QR Code</Btn>
                            <Btn variant="outline" className="text-xs" onClick={()=>{
                              if(!member || !member.accountNo) return flash("Setup bank details first");
                              const details = `${member.bankName}\n${member.accountNo}\n${member.accountName}\n${fmt(payment.amount)}`;
                              navigator.clipboard.writeText(details);
                              flash("Copied!");
                            }}><Ic name="clipboard" size={12}/>Copy</Btn>
                            <Btn variant="outline" className="text-xs" onClick={()=>{
                              if(!member || !member.phone) return flash("Add phone number first");
                              const msg = `Pembayaran untuk projek *${payment.projectName}*\n\nJumlah: *${fmt(payment.amount)}*\nBank: ${member.bankName}\nAkaun: ${member.accountNo}\n\nTerima kasih!`;
                              window.open(`https://wa.me/${member.phone.replace(/[^0-9]/g,'')}?text=${encodeURIComponent(msg)}`, '_blank');
                            }}><Ic name="whatsapp" size={12}/>WhatsApp</Btn>
                            <Btn className="text-xs" onClick={()=>{
                              const method = prompt("Payment method (Cash/Bank/E-wallet):", "Bank Transfer");
                              if(!method) return;
                              setPartnerPayments(p=>p.map(x=>x.id===payment.id?{...x,status:"Paid",paidAt:new Date().toISOString(),paymentMethod:method}:x));
                              flash(`✅ Paid ${payment.memberName} ${fmt(payment.amount)}`);
                            }}><Ic name="check" size={12}/>Mark Paid</Btn>
                          </div>
                        </div>
                      </Card></FadeIn>
                    );
                  })}
                </div>
              )}
              
              {/* Paid History */}
              {partnerPayments.filter(p=>p.status==="Paid").length > 0 && <>
                <SH title="Payment History" action={`${partnerPayments.filter(p=>p.status==="Paid").length} paid`}/>
                <div className="space-y-2">
                  {partnerPayments.filter(p=>p.status==="Paid").slice(0,10).map((payment, i) => (
                    <FadeIn key={payment.id} delay={i*0.05}><Card>
                      <div className="p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full" style={{background:"rgba(22,163,74,0.1)",color:"#16A34A"}}>
                            <Ic name="check" size={16}/>
                          </div>
                          <div>
                            <div className="text-xs font-bold" style={{color:"var(--tx)"}}>{payment.memberName}</div>
                            <div className="text-[10px]" style={{color:"var(--t3)"}}>{payment.projectCode} • {payment.paymentMethod || "Paid"}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-extrabold" style={{color:"#16A34A"}}>{fmt(payment.amount)}</div>
                          <div className="text-[10px]" style={{color:"var(--t3)"}}>{new Date(payment.paidAt).toLocaleDateString("en-GB",{day:"2-digit",month:"short"})}</div>
                        </div>
                      </div>
                    </Card></FadeIn>
                  ))}
                </div>
              </>}
              
              {/* QR Code Payment Modal */}
              {qrPayment && <FadeIn><div className="fixed inset-0 z-50 flex items-end justify-center" style={{background:"rgba(0,0,0,0.5)"}} onClick={()=>setQrPayment(null)}>
                <div className="w-full max-w-md rounded-t-3xl p-5 space-y-4" style={{background:"var(--cd)", maxHeight:"90vh", overflowY:"auto"}} onClick={(e)=>e.stopPropagation()}>
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-extrabold" style={{color:"var(--tx)"}}>Payment QR Code</h3>
                      <div className="text-[10px]" style={{color:"var(--t3)"}}>Show or share this QR to receive payment</div>
                    </div>
                    <button type="button" onClick={()=>setQrPayment(null)} className="rounded-full p-1.5" style={{background:"var(--sub)"}}><Ic name="x" size={16}/></button>
                  </div>
                  
                  {/* Payee Info */}
                  <div className="rounded-2xl p-3 text-center" style={{background:"linear-gradient(135deg,#0047B3,#0057D9)"}}>
                    <div className="text-[10px] font-bold opacity-80" style={{color:"white"}}>PAY TO</div>
                    <div className="text-sm font-extrabold mt-1" style={{color:"white"}}>{qrPayment.memberName}</div>
                    <div className="text-2xl font-extrabold mt-2" style={{color:"white"}}>{fmt(qrPayment.amount)}</div>
                    <div className="text-[10px] mt-1 opacity-80" style={{color:"white"}}>{qrPayment.projectCode} • {qrPayment.projectName}</div>
                  </div>
                  
                  {/* QR Code - using free API */}
                  <div className="rounded-2xl p-5 flex flex-col items-center" style={{background:"white"}}>
                    {(() => {
                      const qrData = `Bank: ${qrPayment.member.bankName}\nAccount: ${qrPayment.member.accountNo}\nName: ${qrPayment.member.accountName}\nAmount: RM${qrPayment.amount}\nRef: ${qrPayment.projectCode}`;
                      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}&margin=10`;
                      return <img src={qrUrl} alt="Payment QR" style={{width:"240px",height:"240px"}} onError={(e)=>{e.target.style.display='none';e.target.nextSibling.style.display='block';}}/>;
                    })()}
                    <div style={{display:"none",textAlign:"center",padding:"20px"}}>
                      <Ic name="scan" size={64} style={{color:"#999"}}/>
                      <div style={{fontSize:"11px",color:"#666",marginTop:"8px"}}>QR Code will load when online</div>
                    </div>
                    <div className="text-[10px] font-bold mt-3" style={{color:"#000"}}>Scan to view payment details</div>
                  </div>
                  
                  {/* Bank Details */}
                  <div className="rounded-2xl p-3 space-y-1.5" style={{background:"var(--sub)"}}>
                    <div className="text-[10px] font-bold mb-1" style={{color:"var(--t3)"}}>BANK DETAILS</div>
                    <div className="flex justify-between text-xs"><span style={{color:"var(--t3)"}}>Bank:</span><span style={{color:"var(--tx)",fontWeight:"bold"}}>{qrPayment.member.bankName}</span></div>
                    <div className="flex justify-between text-xs"><span style={{color:"var(--t3)"}}>Account:</span><span style={{color:"var(--tx)",fontWeight:"bold"}}>{qrPayment.member.accountNo}</span></div>
                    <div className="flex justify-between text-xs"><span style={{color:"var(--t3)"}}>Name:</span><span style={{color:"var(--tx)",fontWeight:"bold"}}>{qrPayment.member.accountName}</span></div>
                    <div className="flex justify-between text-xs"><span style={{color:"var(--t3)"}}>Amount:</span><span style={{color:"var(--ac)",fontWeight:"bold"}}>{fmt(qrPayment.amount)}</span></div>
                    <div className="flex justify-between text-xs"><span style={{color:"var(--t3)"}}>Reference:</span><span style={{color:"var(--tx)",fontWeight:"bold"}}>{qrPayment.projectCode}</span></div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <Btn variant="outline" className="text-xs" onClick={()=>{
                      const details = `Bank: ${qrPayment.member.bankName}\nAccount: ${qrPayment.member.accountNo}\nName: ${qrPayment.member.accountName}\nAmount: ${fmt(qrPayment.amount)}\nReference: ${qrPayment.projectCode}`;
                      navigator.clipboard.writeText(details);
                      flash("Copied!");
                    }}><Ic name="clipboard" size={14}/>Copy Details</Btn>
                    <Btn className="text-xs" onClick={()=>{
                      const qrData = `Bank: ${qrPayment.member.bankName}\nAccount: ${qrPayment.member.accountNo}\nName: ${qrPayment.member.accountName}\nAmount: RM${qrPayment.amount}\nRef: ${qrPayment.projectCode}`;
                      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qrData)}&margin=10`;
                      window.open(qrUrl, '_blank');
                    }}><Ic name="trending" size={14}/>Download QR</Btn>
                  </div>
                  
                  <Btn variant="outline" className="w-full" onClick={()=>setQrPayment(null)}>Close</Btn>
                </div>
              </div></FadeIn>}
              
              {/* Bank Setup Modal */}
              {bankSetupModal && <FadeIn><div className="fixed inset-0 z-50 flex items-end justify-center" style={{background:"rgba(0,0,0,0.5)"}} onClick={()=>setBankSetupModal(false)}>
                <div className="w-full max-w-md rounded-t-3xl space-y-3" style={{background:"var(--cd)", maxHeight:"85vh", display:"flex", flexDirection:"column"}} onClick={(e)=>e.stopPropagation()}>
                  {/* Header - Sticky */}
                  <div className="px-5 pt-5 pb-3 border-b" style={{borderColor:"var(--ib)"}}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-extrabold" style={{color:"var(--tx)"}}>Team Bank Details</h3>
                        <div className="text-[10px]" style={{color:"var(--t3)"}}>Setup once for quick payments</div>
                      </div>
                      <button type="button" onClick={()=>setBankSetupModal(false)} className="rounded-full p-1.5" style={{background:"var(--sub)"}}><Ic name="x" size={16}/></button>
                    </div>
                  </div>
                  
                  {/* Scrollable Content */}
                  <div className="px-5 space-y-2.5" style={{overflowY:"auto", flex:"1", paddingBottom:"12px"}}>
                    {userAccounts.filter(acc=>acc.username !== user.username).map(acc => {
                      const hasDetails = acc.bankName && acc.accountNo;
                      return (
                        <div key={acc.username} className="rounded-2xl overflow-hidden" style={{background:"var(--sub)"}}>
                          {/* Member Header */}
                          <div className="p-3 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-9 w-9 items-center justify-center rounded-full" style={{background:hasDetails?"rgba(22,163,74,0.15)":"var(--bbg)",color:hasDetails?"#16A34A":"var(--ac)"}}>
                                <Ic name={hasDetails?"check":"user"} size={15}/>
                              </div>
                              <div>
                                <div className="text-xs font-bold" style={{color:"var(--tx)"}}>{acc.name}</div>
                                <div className="text-[10px]" style={{color:"var(--t3)"}}>@{acc.username} {hasDetails && "• ✓ Setup complete"}</div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Form Fields - Compact */}
                          <div className="px-3 pb-3 space-y-1.5">
                            <div className="grid grid-cols-2 gap-1.5">
                              <input 
                                type="text" 
                                placeholder="Bank Name" 
                                value={acc.bankName||""} 
                                onChange={e=>setUserAccounts(p=>p.map(u=>u.username===acc.username?{...u,bankName:e.target.value}:u))}
                                className="rounded-lg px-2.5 py-2 text-[11px]"
                                style={{background:"var(--cd)",color:"var(--tx)",border:"1px solid var(--ib)"}}
                              />
                              <input 
                                type="text" 
                                placeholder="Phone (60xxx)" 
                                value={acc.phone||""} 
                                onChange={e=>setUserAccounts(p=>p.map(u=>u.username===acc.username?{...u,phone:e.target.value}:u))}
                                className="rounded-lg px-2.5 py-2 text-[11px]"
                                style={{background:"var(--cd)",color:"var(--tx)",border:"1px solid var(--ib)"}}
                              />
                            </div>
                            <input 
                              type="text" 
                              placeholder="Account Number" 
                              value={acc.accountNo||""} 
                              onChange={e=>setUserAccounts(p=>p.map(u=>u.username===acc.username?{...u,accountNo:e.target.value}:u))}
                              className="w-full rounded-lg px-2.5 py-2 text-[11px]"
                              style={{background:"var(--cd)",color:"var(--tx)",border:"1px solid var(--ib)"}}
                            />
                            <input 
                              type="text" 
                              placeholder="Account Holder Name" 
                              value={acc.accountName||""} 
                              onChange={e=>setUserAccounts(p=>p.map(u=>u.username===acc.username?{...u,accountName:e.target.value}:u))}
                              className="w-full rounded-lg px-2.5 py-2 text-[11px]"
                              style={{background:"var(--cd)",color:"var(--tx)",border:"1px solid var(--ib)"}}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Footer - Sticky */}
                  <div className="px-5 pb-5 pt-3 border-t" style={{borderColor:"var(--ib)"}}>
                    <Btn className="w-full" onClick={()=>{setBankSetupModal(false);flash("Saved!");}}><Ic name="check" size={16}/>Save & Close</Btn>
                  </div>
                </div>
              </div></FadeIn>}
            </div>}

            {/* ─── SUPPLIER ─── */}
            {subTab === "outlets" && <div className="space-y-3">
              <button type="button" onClick={()=>{setSubTab(null);setSelectedOutlet(null);}} className="text-xs font-bold" style={{color:"var(--ac)"}}>← Back</button>

              {/* Add Supplier Form */}
              <FadeIn><Card><div className="space-y-3 p-4">
                <div className="flex items-center gap-2"><Ic name="plus" size={16} style={{color:"var(--ac)"}}/><h3 className="text-sm font-extrabold" style={{color:"var(--tx)"}}>Add New Supplier</h3></div>
                
                <Inp placeholder="Supplier name (e.g. Aice KL Central)" id="newOutletName"/>
                <Inp placeholder="Image URL (from Imgur, etc)" id="newOutletImage"/>
                
                <div className="grid grid-cols-2 gap-2">
                  <Inp placeholder="Distance (e.g. 2.5 km)" id="newOutletDistance"/>
                  <Inp placeholder="Discount (e.g. 30% off)" id="newOutletDiscount"/>
                </div>
                
                <Btn className="w-full" onClick={()=>{
                  const name = document.getElementById("newOutletName").value.trim();
                  const image = document.getElementById("newOutletImage").value.trim();
                  const distance = document.getElementById("newOutletDistance").value.trim();
                  const discount = document.getElementById("newOutletDiscount").value.trim();
                  if(!name || !image) return flash("Name and image required");
                  setOutlets(p=>[...p, {id:Date.now(), name, image, distance:distance||"", discount:discount||""}]);
                  document.getElementById("newOutletName").value="";
                  document.getElementById("newOutletImage").value="";
                  document.getElementById("newOutletDistance").value="";
                  document.getElementById("newOutletDiscount").value="";
                  flash("Supplier added!");
                }}><Ic name="plus" size={16}/>Add Supplier</Btn>
                
                <details className="rounded-lg p-2" style={{background:"var(--sub)"}}>
                  <summary className="text-[10px] font-bold cursor-pointer" style={{color:"var(--t2)"}}>💡 How to get image URL</summary>
                  <div className="mt-2 text-[10px] space-y-1" style={{color:"var(--t3)"}}>
                    <p>1. Upload to <a href="https://imgur.com/upload" target="_blank" rel="noreferrer" className="underline" style={{color:"var(--ac)"}}>Imgur</a></p>
                    <p>2. Right-click image → Copy image address</p>
                    <p>3. Paste URL above</p>
                  </div>
                </details>
              </div></Card></FadeIn>

              {/* All Suppliers List */}
              <SH title="All Suppliers" action={`${outlets.length} total`}/>
              {outlets.map((outlet,i) => (
                <FadeIn key={outlet.id} delay={0.05+i*0.03}><Card>
                  <div className="p-4 space-y-3">
                    <div className="flex gap-3">
                      <img src={outlet.image} alt={outlet.name} className="w-24 h-20 object-cover rounded-xl"/>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold" style={{color:"var(--tx)"}}>{outlet.name}</div>
                        <div className="text-[11px] mt-1" style={{color:"var(--t3)"}}>📍 {outlet.distance || "No distance set"}</div>
                        {outlet.discount && <div className="text-[11px] font-bold mt-1" style={{color:"#EF4444"}}>🏷️ {outlet.discount}</div>}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Btn variant="outline" className="flex-1 text-xs" onClick={()=>{
                        const newName = prompt("Edit supplier name:", outlet.name);
                        if(newName && newName.trim()) {
                          setOutlets(p=>p.map(o=>o.id===outlet.id?{...o,name:newName.trim()}:o));
                          flash("Updated!");
                        }
                      }}><Ic name="edit" size={14}/>Edit</Btn>
                      <button type="button" onClick={()=>{
                        if(confirm(`Delete ${outlet.name}?`)){
                          setOutlets(p=>p.filter(o=>o.id!==outlet.id));
                          flash("Deleted!");
                        }
                      }} className="flex-1 flex items-center justify-center gap-1.5 rounded-2xl px-3 py-2.5 text-xs font-bold" style={{background:"rgba(239,68,68,0.1)",color:"#EF4444"}}>
                        <Ic name="trash" size={14}/>Delete
                      </button>
                    </div>
                  </div>
                </Card></FadeIn>
              ))}
            </div>}

            {/* ─── SETTINGS ─── */}
            {subTab === "settings" && <div className="space-y-3">
              <button type="button" onClick={()=>setSubTab(null)} className="text-xs font-bold" style={{color:"var(--ac)"}}>← Back</button>

              {/* Announcement Manager */}
              <FadeIn><Card><div className="space-y-3 p-4">
                <div className="flex items-center gap-2"><Ic name="alert" size={16} style={{color:"var(--ac)"}}/><h3 className="text-sm font-extrabold" style={{color:"var(--tx)"}}>Announcement Banner</h3></div>
                <div className="text-[11px]" style={{color:"var(--t3)"}}>Manage scrolling messages shown on Home screen</div>
                
                {/* ADMIN: Manual JSON Update (Password Protected) */}
                {!isAdmin ? (
                  <div className="rounded-2xl p-4 space-y-3" style={{background:"rgba(239,68,68,0.06)",border:"1px solid #EF4444"}}>
                    <div className="flex items-center gap-2">
                      <Ic name="lock" size={16} style={{color:"#EF4444"}}/>
                      <div className="text-sm font-bold" style={{color:"#EF4444"}}>Admin Access Required</div>
                    </div>
                    <div className="text-[11px]" style={{color:"var(--t3)"}}>Enter admin password to manage announcements</div>
                    <div className="flex gap-2">
                      <input 
                        id="adminPwdInput"
                        type="password"
                        className="flex-1 rounded-xl border px-3 py-2.5 text-sm font-medium outline-none" 
                        style={{background:"var(--ib2)",borderColor:"var(--ib)",color:"var(--tx)"}} 
                        placeholder="Enter password"
                        onKeyDown={e=>{
                          if(e.key==="Enter"){
                            const pwd = e.target.value;
                            if(pwd === adminPassword){
                              setIsAdmin(true);
                              flash("✅ Admin access granted!");
                            } else {
                              flash("❌ Wrong password!");
                              e.target.value="";
                            }
                          }
                        }}
                      />
                      <Btn onClick={()=>{
                        const pwd = document.getElementById("adminPwdInput").value;
                        if(pwd === adminPassword){
                          setIsAdmin(true);
                          flash("✅ Admin access granted!");
                        } else {
                          flash("❌ Wrong password!");
                          document.getElementById("adminPwdInput").value="";
                        }
                      }}><Ic name="check" size={14}/>Login</Btn>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl p-3 space-y-2.5" style={{background:"rgba(59,130,246,0.06)",border:"1px solid var(--ac)"}}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Ic name="cloud" size={14} style={{color:"var(--ac)"}}/>
                        <div className="text-[11px] font-bold" style={{color:"var(--ac)"}}>ADMIN: Update Announcements</div>
                      </div>
                      <button type="button" onClick={()=>{setIsAdmin(false);flash("Logged out");}} className="text-[10px] font-bold px-2 py-1 rounded-lg" style={{background:"rgba(239,68,68,0.1)",color:"#EF4444"}}>Logout</button>
                    </div>
                    <div className="text-[10px]" style={{color:"var(--t3)"}}>Paste your JSON here to update announcements</div>
                    
                    <textarea 
                      id="jsonInput"
                      className="w-full rounded-xl border px-3 py-2.5 text-xs font-mono outline-none resize-none" 
                      style={{background:"#000",borderColor:"var(--ib)",color:"#0f0"}} 
                      rows={6}
                      placeholder={`{\n  "announcements": [\n    "🎉 Your message here",\n    "📦 Another message"\n  ]\n}`}
                    />
                    
                    <Btn className="w-full" onClick={()=>{
                      const textarea = document.getElementById("jsonInput");
                      const json = textarea.value.trim();
                      if (!json) return flash("Paste JSON first");
                      try {
                        const data = JSON.parse(json);
                        if (!data.announcements || !Array.isArray(data.announcements)) {
                          throw new Error("Must have 'announcements' array");
                        }
                        if (data.announcements.length === 0) {
                          throw new Error("Announcements array is empty");
                        }
                        setAnnouncements(data.announcements);
                        setLastSync(new Date().toLocaleString());
                        textarea.value = "";
                        flash(`✅ Updated ${data.announcements.length} announcements!`);
                      } catch (err) {
                        flash(`❌ ${err.message}`);
                      }
                    }}><Ic name="check" size={14}/>Apply Updates</Btn>
                    
                    {lastSync && <div className="text-[10px] text-center" style={{color:"var(--t3)"}}>Last updated: {lastSync}</div>}
                    
                    {/* Instructions */}
                    <details className="rounded-xl p-2.5" style={{background:"var(--sub)"}}>
                      <summary className="text-[10px] font-bold cursor-pointer" style={{color:"var(--t2)"}}>📖 How to use (click to expand)</summary>
                      <div className="mt-2 space-y-1.5 text-[10px]" style={{color:"var(--t3)"}}>
                        <p><strong>Step 1:</strong> Create your JSON:</p>
                        <pre className="rounded p-1.5 overflow-x-auto text-[9px]" style={{background:"#000",color:"#0f0"}}>{`{
  "announcements": [
    "🎉 New promo - Buy 2 Free 1!",
    "📦 Free delivery above RM500",
    "❄️ Keep frozen at -18°C"
  ]
}`}</pre>
                        <p><strong>Step 2:</strong> Copy the JSON above</p>
                        <p><strong>Step 3:</strong> Paste in the black box</p>
                        <p><strong>Step 4:</strong> Tap "Apply Updates"</p>
                        <p className="text-yellow-600">⚠️ <strong>Note:</strong> Updates are local only. For multi-user sync, deploy with Firebase.</p>
                      </div>
                    </details>
                  </div>
                )}

                <div className="h-px" style={{background:"var(--cb)"}}/>

                {/* Local announcements (fallback) */}
                <div className="text-[11px] font-bold" style={{color:"var(--t2)"}}>Local Announcements (offline fallback)</div>
                
                {/* Add announcement form */}
                <div className="rounded-2xl p-3 space-y-2" style={{background:"var(--sub)",border:"1px solid var(--cb)"}}>
                  <div className="text-[11px] font-bold" style={{color:"var(--t2)"}}>Add New Announcement</div>
                  <div className="flex gap-2">
                    <input id="newAnnounce" className="flex-1 rounded-xl border px-3 py-2.5 text-sm font-medium outline-none" style={{background:"var(--ib2)",borderColor:"var(--ib)",color:"var(--tx)"}} placeholder="e.g. 🎉 Special discount this week!" onKeyDown={e=>{if(e.key==="Enter"){const v=e.target.value.trim();if(v){setAnnouncements(p=>[...p,v]);e.target.value="";flash("Announcement added!");}}}}/>
                    <Btn onClick={()=>{const inp=document.getElementById("newAnnounce");const v=inp.value.trim();if(v){setAnnouncements(p=>[...p,v]);inp.value="";flash("Announcement added!");}}}><Ic name="plus" size={14}/>Add</Btn>
                  </div>
                </div>

                {/* Announcement list */}
                <div className="space-y-2">
                  <div className="text-[11px] font-bold" style={{color:"var(--t2)"}}>Current Announcements ({announcements.length})</div>
                  {announcements.length === 0 && <div className="rounded-xl p-4 text-center text-[11px]" style={{background:"var(--sub)",color:"var(--t3)"}}>No announcements yet. Add one above!</div>}
                  {announcements.map((msg, idx) => (
                    <div key={idx} className="flex items-center gap-2 rounded-xl p-3" style={{background:"var(--cd)",border:"1px solid var(--cb)"}}>
                      <span className="flex-1 text-xs" style={{color:"var(--tx)"}}>{msg}</span>
                      <button type="button" onClick={()=>{setAnnouncements(p=>p.filter((_,i)=>i!==idx));flash("Deleted!");}} className="rounded-lg p-1.5 text-xs font-bold" style={{background:"rgba(239,68,68,0.1)",color:"#EF4444"}}>
                        <Ic name="trash" size={14}/>
                      </button>
                    </div>
                  ))}
                </div>

                {/* Preview */}
                {announcements.length > 0 && <>
                  <div className="text-[11px] font-bold" style={{color:"var(--t2)"}}>Preview</div>
                  <div className="relative overflow-hidden rounded-xl p-2.5" style={{background:"linear-gradient(135deg, var(--ac), var(--a2))"}}>
                    <div className="animate-marquee whitespace-nowrap text-xs font-bold text-white">
                      {announcements.map((msg, i) => <span key={i} className="inline-block mx-6">📢 {msg}</span>)}
                      {announcements.map((msg, i) => <span key={`dup-${i}`} className="inline-block mx-6">📢 {msg}</span>)}
                    </div>
                  </div>
                </>}
              </div></Card></FadeIn>

              {/* Ad Banners Management */}
              <FadeIn delay={0.1}><Card><div className="space-y-3 p-4">
                <div className="flex items-center gap-2"><Ic name="tag" size={16} style={{color:"#10B981"}}/><h3 className="text-sm font-extrabold" style={{color:"var(--tx)"}}>Advertising Banner</h3></div>
                <div className="text-[11px]" style={{color:"var(--t3)"}}>Shown before Quick Menu on Home screen</div>
                
                {/* Add ad form */}
                <div className="rounded-2xl p-3 space-y-2.5" style={{background:"var(--sub)",border:"1px solid var(--cb)"}}>
                  <div className="text-[11px] font-bold" style={{color:"var(--t2)"}}>Add New Ad</div>
                  
                  {/* Type selector */}
                  <div>
                    <div className="text-[10px] mb-1.5" style={{color:"var(--t3)"}}>Choose type:</div>
                    <div className="grid grid-cols-2 gap-2">
                      <button type="button" onClick={(e)=>{
                        document.getElementById("adType").value="text";
                        document.getElementById("newAd").placeholder="e.g. 🛒 Buy 2 Free 1 today!";
                        e.currentTarget.parentElement.querySelectorAll("button").forEach(b=>b.style.background="var(--sub)");
                        e.currentTarget.style.background="var(--ac)";
                      }} className="rounded-lg py-2.5 text-xs font-bold text-white transition-all" style={{background:"var(--ac)"}}>📝 Text Message</button>
                      
                      <button type="button" onClick={(e)=>{
                        document.getElementById("adType").value="image";
                        document.getElementById("newAd").placeholder="Paste image URL here";
                        e.currentTarget.parentElement.querySelectorAll("button").forEach(b=>b.style.background="var(--sub)");
                        e.currentTarget.style.background="var(--ac)";
                      }} className="rounded-lg py-2.5 text-xs font-bold" style={{background:"var(--sub)",color:"var(--tx)"}}>🖼️ Image Banner</button>
                    </div>
                  </div>
                  
                  <input type="hidden" id="adType" value="text"/>
                  
                  <div className="flex gap-2">
                    <input id="newAd" className="flex-1 rounded-xl border px-3 py-2.5 text-sm font-medium outline-none" style={{background:"var(--ib2)",borderColor:"var(--ib)",color:"var(--tx)"}} placeholder="e.g. 🛒 Buy 2 Free 1 today!" onKeyDown={e=>{if(e.key==="Enter"){const v=e.target.value.trim();const t=document.getElementById("adType").value;if(v){setAdBanners(p=>[...p,{type:t,content:v}]);e.target.value="";flash("Ad added!");}}}}/>
                    <Btn onClick={()=>{const inp=document.getElementById("newAd");const v=inp.value.trim();const t=document.getElementById("adType").value;if(v){setAdBanners(p=>[...p,{type:t,content:v}]);inp.value="";flash("Ad added!");}}}><Ic name="plus" size={14}/>Add</Btn>
                  </div>
                  
                  <details className="rounded-lg p-2" style={{background:"rgba(59,130,246,0.06)"}}>
                    <summary className="text-[10px] font-bold cursor-pointer" style={{color:"var(--ac)"}}>💡 How to get image URL</summary>
                    <div className="mt-2 text-[10px] space-y-1" style={{color:"var(--t3)"}}>
                      <p><strong>1. Upload to Imgur:</strong></p>
                      <p>• Go to <a href="https://imgur.com/upload" target="_blank" rel="noreferrer" className="underline" style={{color:"var(--ac)"}}>imgur.com/upload</a></p>
                      <p>• Upload your image</p>
                      <p>• Right-click image → Copy image address</p>
                      <p>• Paste here!</p>
                      <p className="pt-1"><strong>OR use Google Drive, Dropbox, etc.</strong></p>
                    </div>
                  </details>
                </div>

                {/* Ad list */}
                <div className="space-y-2">
                  <div className="text-[11px] font-bold" style={{color:"var(--t2)"}}>Current Ads ({adBanners.length})</div>
                  {adBanners.length === 0 && <div className="rounded-xl p-4 text-center text-[11px]" style={{background:"var(--sub)",color:"var(--t3)"}}>No ads yet. Add one above!</div>}
                  {adBanners.map((ad, idx) => (
                    <div key={idx} className="rounded-xl p-3 space-y-2" style={{background:"var(--cd)",border:"1px solid var(--cb)"}}>
                      <div className="flex items-center justify-between">
                        <div className="text-[10px] font-bold px-2 py-1 rounded" style={{background:ad.type==="image"?"rgba(16,185,129,0.1)":"var(--bbg)",color:ad.type==="image"?"#10B981":"var(--ac)"}}>{ad.type==="image"?"🖼️ Image":"📝 Text"}</div>
                        <button type="button" onClick={()=>{setAdBanners(p=>p.filter((_,i)=>i!==idx));flash("Deleted!");}} className="rounded-lg p-1.5 text-xs font-bold" style={{background:"rgba(239,68,68,0.1)",color:"#EF4444"}}>
                          <Ic name="trash" size={14}/>
                        </button>
                      </div>
                      {ad.type === "image" ? 
                        <img src={ad.content} alt="ad" className="w-full h-12 object-contain rounded" style={{background:"#000"}}/> :
                        <span className="text-xs block" style={{color:"var(--tx)"}}>{ad.content}</span>
                      }
                    </div>
                  ))}
                </div>

                {/* Preview */}
                {adBanners.length > 0 && <>
                  <div className="text-[11px] font-bold" style={{color:"var(--t2)"}}>Preview (scrolling)</div>
                  <div className="relative overflow-hidden rounded-lg" style={{background:"rgba(0,0,0,0.4)", height:"60px"}}>
                    <div className="animate-marquee whitespace-nowrap flex items-center gap-4 h-full">
                      {adBanners.map((ad, i) => (
                        ad.type === "image" ? 
                          <img key={i} src={ad.content} alt="ad" className="h-full object-contain inline-block mx-2" style={{maxWidth:"300px"}} /> :
                          <span key={i} className="inline-block mx-5 text-[11px] font-bold text-white">🎯 {ad.content}</span>
                      ))}
                      {adBanners.map((ad, i) => (
                        ad.type === "image" ? 
                          <img key={`dup-${i}`} src={ad.content} alt="ad" className="h-full object-contain inline-block mx-2" style={{maxWidth:"300px"}} /> :
                          <span key={`dup-${i}`} className="inline-block mx-5 text-[11px] font-bold text-white">🎯 {ad.content}</span>
                      ))}
                    </div>
                  </div>
                </>}
              </div></Card></FadeIn>

            </div>}
          </Shell>}
        </main>

        {/* ─── Nav ─── */}
        <div className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md px-2 pb-5 pt-2.5 backdrop-blur-2xl" style={{background:"var(--nav)",borderTop:"1px solid var(--cb)"}}>
          <div className="grid grid-cols-5">{nav.map(([val,label,icon])=>{
            const active = tab===val; const isScan = val==="scan";
            return <button key={val} type="button" onClick={()=>{setTab(val);setSubTab(null);}} className="relative flex flex-col items-center gap-1 text-[11px] font-bold" style={{color:active?"var(--ac)":"var(--t3)"}}>
              {isScan ? <div className="-mt-8 flex h-16 w-16 items-center justify-center rounded-full text-white shadow-xl ring-4" style={{background:"linear-gradient(135deg,var(--a2),var(--ac))",boxShadow:"0 8px 24px rgba(0,87,217,0.3)",ringColor:"var(--nav)"}}><Ic name="scan" size={26}/></div> : <div className="flex h-10 w-10 items-center justify-center rounded-xl transition-all" style={active?{background:"var(--bbg)"}:{}}><Ic name={icon} size={22}/></div>}
              <span>{label}</span>
            </button>
          })}</div>
        </div>
      </div>
    </div></>
  );
}
