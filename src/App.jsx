import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import {
  Globe, Code2, Lock, ShieldCheck, Shuffle, ShieldAlert, Cookie,
  Server, Zap, Layers, Braces, FileCode, Atom, Triangle, Palette,
  Gauge, Radio, TestTube, Rocket,
  ChevronLeft, X, ArrowRight, Star, Search, Sun, Moon,
  Flame, Trophy, BookOpen, BarChart3, Settings as SettingsIcon,
  Check, RotateCcw, Sparkles, Eye,
} from "lucide-react";
import { LEVELS, TOPICS, QUESTIONS } from "./data.js";
import { trackEvent, setAnalyticsConsent, setAnalyticsUser } from "./analytics.js";

// ============== ICONS PER TOPIC ==============
const TOPIC_ICONS = {
  http: Globe,
  rest: Code2,
  auth: Lock,
  authz: ShieldCheck,
  cors: Shuffle,
  security: ShieldAlert,
  cookies: Cookie,
  django: Server,
  fastapi: Zap,
  middleware: Layers,
  js: Braces,
  dom: FileCode,
  react: Atom,
  vue: Triangle,
  css: Palette,
  perf: Gauge,
  realtime: Radio,
  testing: TestTube,
  deploy: Rocket,
};

// Each topic gets a hue so the home grid feels colorful and scannable.
const TOPIC_HUES = {
  http:       "#5765f2",
  rest:       "#4dbfff",
  auth:       "#f86464",
  authz:      "#34c77b",
  cors:       "#8b5cf6",
  security:   "#ef4444",
  cookies:    "#f7b955",
  django:     "#0c4b33",
  fastapi:    "#009688",
  middleware: "#6366f1",
  js:         "#facc15",
  dom:        "#fb7185",
  react:      "#61dafb",
  vue:        "#42b883",
  css:        "#3b82f6",
  perf:       "#10b981",
  realtime:   "#a855f7",
  testing:    "#f97316",
  deploy:     "#0ea5e9",
};

// ============== STATE PERSISTENCE ==============
const STORAGE_KEY = "web-drill:v2";

const defaultState = {
  completed: [],
  bookmarked: [],
  confidence: {},   // { id: 'easy'|'medium'|'hard' }
  xp: 0,
  streak: 0,
  lastStudiedDate: null,
  theme: "light",
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    return { ...defaultState, ...JSON.parse(raw) };
  } catch {
    return defaultState;
  }
}

function saveState(s) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    return true;
  } catch {
    return false;
  }
}

// XP awarded per confidence level
const XP_FOR = { easy: 10, medium: 7, hard: 4 };

// ============== APP ==============

export default function App() {
  const [initial] = useState(() => loadState());
  const [completed, setCompleted] = useState(new Set(initial.completed));
  const [bookmarked, setBookmarked] = useState(new Set(initial.bookmarked));
  const [confidence, setConfidence] = useState(initial.confidence);
  const [xp, setXp] = useState(initial.xp);
  const [streak, setStreak] = useState(initial.streak);
  const [lastStudiedDate, setLastStudiedDate] = useState(initial.lastStudiedDate);

  const [theme, setTheme] = useState(initial.theme || "light");
  const [tab, setTab] = useState("learn");           // learn | stats | settings
  const [study, setStudy] = useState(null);          // { topicKey | "all" | "review" | "bookmarked", ids, idx }
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  // Apply theme + persist
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try { localStorage.setItem("web-theme", theme); } catch { /* ignore */ }
  }, [theme]);

  useEffect(() => {
    saveState({
      completed: [...completed],
      bookmarked: [...bookmarked],
      confidence,
      xp, streak, lastStudiedDate, theme,
    });
  }, [completed, bookmarked, confidence, xp, streak, lastStudiedDate, theme]);

  // ============== STREAK BOOKKEEPING ==============
  const bumpStreak = useCallback(() => {
    const today = new Date().toISOString().slice(0, 10);
    if (lastStudiedDate === today) return;
    const yest = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
    setStreak(s => (lastStudiedDate === yest ? s + 1 : 1));
    setLastStudiedDate(today);
  }, [lastStudiedDate]);

  // ============== STUDY SESSION CONTROL ==============
  const startSession = useCallback((kind, key) => {
    let pool = [];
    if (kind === "topic")       pool = QUESTIONS.filter(q => q.topic === key);
    else if (kind === "level")  pool = QUESTIONS.filter(q => q.level === key);
    else if (kind === "review") pool = QUESTIONS.filter(q => confidence[q.id] === "hard");
    else if (kind === "bookmarks") pool = QUESTIONS.filter(q => bookmarked.has(q.id));
    else if (kind === "all")    pool = [...QUESTIONS];
    if (pool.length === 0) return;
    // shuffle
    const shuf = [...pool];
    for (let i = shuf.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuf[i], shuf[j]] = [shuf[j], shuf[i]];
    }
    setStudy({ kind, key, ids: shuf.map(q => q.id), idx: 0, sessionXp: 0, results: { easy: 0, medium: 0, hard: 0 } });
    trackEvent("session_start", { kind, key, count: shuf.length });
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [confidence, bookmarked]);

  const endSession = () => setStudy(null);

  const recordAnswer = useCallback((rating) => {
    if (!study) return;
    const id = study.ids[study.idx];
    setConfidence(c => ({ ...c, [id]: rating }));
    setCompleted(s => new Set(s).add(id));
    const earned = XP_FOR[rating];
    setXp(x => x + earned);
    bumpStreak();
    setStudy(s => ({
      ...s,
      idx: s.idx + 1,
      sessionXp: s.sessionXp + earned,
      results: { ...s.results, [rating]: s.results[rating] + 1 },
    }));
    trackEvent("answer", { rating });
  }, [study, bumpStreak]);

  const toggleBookmark = useCallback((id) => {
    setBookmarked(s => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  // ============== STATS ==============
  const stats = useMemo(() => {
    const total = QUESTIONS.length;
    const done = completed.size;
    const byTopic = {};
    Object.keys(TOPICS).forEach(t => {
      const all = QUESTIONS.filter(q => q.topic === t);
      byTopic[t] = { total: all.length, done: all.filter(q => completed.has(q.id)).length };
    });
    const byLevel = {};
    Object.keys(LEVELS).forEach(l => {
      const all = QUESTIONS.filter(q => q.level === l);
      byLevel[l] = { total: all.length, done: all.filter(q => completed.has(q.id)).length };
    });
    const conf = { easy: 0, medium: 0, hard: 0 };
    Object.values(confidence).forEach(c => { if (conf[c] != null) conf[c]++; });
    return { total, done, byTopic, byLevel, conf };
  }, [completed, confidence]);

  // ============== RENDER ==============
  if (study) {
    return (
      <StudyScreen
        study={study}
        bookmarked={bookmarked}
        onAnswer={recordAnswer}
        onToggleBookmark={toggleBookmark}
        onExit={endSession}
      />
    );
  }

  return (
    <AppShell
      tab={tab}
      onTabChange={setTab}
      streak={streak}
      xp={xp}
      onSearchOpen={() => setSearchOpen(true)}
    >
      {tab === "learn" && (
        <HomeScreen
          stats={stats}
          bookmarked={bookmarked}
          confidence={confidence}
          onStart={startSession}
        />
      )}
      {tab === "stats" && (
        <StatsScreen stats={stats} xp={xp} streak={streak} bookmarked={bookmarked} />
      )}
      {tab === "settings" && (
        <SettingsScreen
          theme={theme}
          onThemeChange={setTheme}
          onResetProgress={() => {
            if (window.confirm("Reset all progress? This wipes XP, streak, ratings, bookmarks.")) {
              setCompleted(new Set());
              setBookmarked(new Set());
              setConfidence({});
              setXp(0);
              setStreak(0);
              setLastStudiedDate(null);
            }
          }}
        />
      )}

      {searchOpen && (
        <SearchOverlay
          query={query}
          onQueryChange={setQuery}
          onClose={() => { setSearchOpen(false); setQuery(""); }}
          onPick={(q) => {
            setSearchOpen(false);
            setQuery("");
            // Open a single-question study session for the picked item
            setStudy({ kind: "single", key: null, ids: [q.id], idx: 0, sessionXp: 0, results: { easy: 0, medium: 0, hard: 0 } });
          }}
        />
      )}
    </AppShell>
  );
}

// ============== APP SHELL (header + bottom nav) ==============

function AppShell({ tab, onTabChange, streak, xp, onSearchOpen, children }) {
  return (
    <div style={{
      minHeight: "100vh",
      paddingBottom: "92px",
      background: "var(--bg-app)",
    }}>
      {/* TOP BAR */}
      <header style={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        background: "var(--bg-app)",
        padding: "16px 20px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        maxWidth: "720px",
        margin: "0 auto",
      }}>
        <div style={{
          fontSize: "20px",
          fontWeight: 800,
          letterSpacing: "-0.02em",
          color: "var(--text-primary)",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}>
          <span style={{
            width: "32px", height: "32px",
            background: "var(--brand)",
            borderRadius: "10px",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            color: "#fff",
            fontSize: "14px", fontWeight: 900,
          }}>W</span>
          web.drill
        </div>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "6px" }}>
          <PillStat icon={<Flame size={16} className="animate-flame" color="#ff7a4d" fill="#ff7a4d" />} value={streak} label="streak" />
          <PillStat icon={<Sparkles size={16} color="#f7b955" fill="#f7b955" />} value={xp} label="xp" />
          <button
            onClick={onSearchOpen}
            style={iconBtnStyle}
            aria-label="Search questions"
            title="Search (⌘K)"
          >
            <Search size={18} />
          </button>
        </div>
      </header>

      {/* CONTENT */}
      <main style={{
        maxWidth: "720px",
        margin: "0 auto",
        padding: "8px 20px 20px",
      }}>
        {children}
      </main>

      {/* BOTTOM NAV */}
      <nav style={{
        position: "fixed",
        left: "50%",
        bottom: "16px",
        transform: "translateX(-50%)",
        display: "flex",
        gap: "4px",
        background: "var(--bg-card)",
        borderRadius: "var(--radius-pill)",
        padding: "6px",
        boxShadow: "var(--shadow-lg)",
        zIndex: 30,
      }}>
        {[
          { k: "learn",    label: "Learn",    Icon: BookOpen },
          { k: "stats",    label: "Progress", Icon: BarChart3 },
          { k: "settings", label: "Settings", Icon: SettingsIcon },
        ].map(({ k, label, Icon }) => {
          const active = tab === k;
          return (
            <button
              key={k}
              onClick={() => onTabChange(k)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 18px",
                borderRadius: "var(--radius-pill)",
                background: active ? "var(--brand)" : "transparent",
                color: active ? "#fff" : "var(--text-secondary)",
                fontSize: "13px",
                fontWeight: 600,
                transition: "background 160ms, color 160ms",
              }}
              aria-current={active ? "page" : undefined}
            >
              <Icon size={16} />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

function PillStat({ icon, value, label }) {
  return (
    <div
      title={`${value} ${label}`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "5px",
        padding: "6px 12px",
        borderRadius: "var(--radius-pill)",
        background: "var(--bg-card)",
        boxShadow: "var(--shadow-sm)",
        fontSize: "13px",
        fontWeight: 700,
        color: "var(--text-primary)",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {icon}
      {value}
    </div>
  );
}

const iconBtnStyle = {
  width: "36px",
  height: "36px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "var(--radius-pill)",
  background: "var(--bg-card)",
  boxShadow: "var(--shadow-sm)",
  color: "var(--text-secondary)",
};

// ============== HOME SCREEN ==============

function HomeScreen({ stats, bookmarked, confidence, onStart }) {
  const overallPct = stats.total ? Math.round((stats.done / stats.total) * 100) : 0;
  const hardCount = Object.values(confidence).filter(c => c === "hard").length;

  return (
    <div className="animate-fade">
      {/* HERO BANNER */}
      <div style={{
        background: "linear-gradient(135deg, #5765f2 0%, #8b5cf6 100%)",
        borderRadius: "var(--radius-xl)",
        padding: "24px",
        color: "#fff",
        boxShadow: "var(--shadow-brand)",
        marginBottom: "20px",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{
          position: "absolute",
          right: "-30px", top: "-30px",
          width: "180px", height: "180px",
          background: "rgba(255,255,255,0.1)",
          borderRadius: "50%",
        }} />
        <div style={{ fontSize: "13px", opacity: 0.9, fontWeight: 600, marginBottom: "8px", letterSpacing: "0.04em", textTransform: "uppercase" }}>
          {stats.done === 0 ? "Welcome 👋" : "Keep going"}
        </div>
        <div style={{ fontSize: "26px", fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.2, marginBottom: "16px" }}>
          {stats.done === 0
            ? "Start your web interview journey"
            : `${overallPct}% complete · nice work`}
        </div>

        <ProgressBar value={overallPct} />

        <div style={{ display: "flex", gap: "10px", marginTop: "20px", flexWrap: "wrap" }}>
          <button
            onClick={() => onStart("all")}
            style={{
              background: "#fff",
              color: "var(--brand)",
              padding: "12px 22px",
              borderRadius: "var(--radius-pill)",
              fontSize: "14px",
              fontWeight: 700,
              display: "inline-flex", alignItems: "center", gap: "8px",
              boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
            }}
          >
            <ArrowRight size={16} /> Quick start (random)
          </button>
          {hardCount > 0 && (
            <button
              onClick={() => onStart("review")}
              style={{
                background: "rgba(255,255,255,0.18)",
                color: "#fff",
                padding: "12px 18px",
                borderRadius: "var(--radius-pill)",
                fontSize: "14px",
                fontWeight: 700,
                display: "inline-flex", alignItems: "center", gap: "8px",
                backdropFilter: "blur(10px)",
              }}
            >
              <RotateCcw size={16} /> Review {hardCount} hard
            </button>
          )}
        </div>
      </div>

      {/* PATH BY LEVEL */}
      <SectionTitle>Your path</SectionTitle>
      <div style={{ display: "grid", gap: "10px", marginBottom: "28px" }}>
        {Object.entries(LEVELS).map(([k, lvl]) => {
          const s = stats.byLevel[k];
          const pct = s.total ? (s.done / s.total) * 100 : 0;
          const colorVar = `var(--level-${k})`;
          return (
            <button
              key={k}
              onClick={() => onStart("level", k)}
              disabled={s.total === 0}
              style={{
                background: "var(--bg-card)",
                borderRadius: "var(--radius-lg)",
                padding: "16px 18px",
                boxShadow: "var(--shadow-sm)",
                display: "flex",
                alignItems: "center",
                gap: "16px",
                textAlign: "left",
                opacity: s.total === 0 ? 0.45 : 1,
                transition: "transform 120ms, box-shadow 120ms",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "var(--shadow-md)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "";
                e.currentTarget.style.boxShadow = "var(--shadow-sm)";
              }}
            >
              <LevelMedal lvl={k} done={s.done} total={s.total} colorVar={colorVar} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "2px" }}>
                  {lvl.label.charAt(0) + lvl.label.slice(1).toLowerCase()}
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "8px", fontWeight: 500 }}>
                  {s.done} of {s.total} mastered
                </div>
                <div style={{ height: "6px", background: "var(--bg-inset)", borderRadius: "var(--radius-pill)", overflow: "hidden" }}>
                  <div style={{
                    width: `${pct}%`,
                    height: "100%",
                    background: colorVar,
                    borderRadius: "var(--radius-pill)",
                    transition: "width 320ms",
                  }} />
                </div>
              </div>
              <ChevronLeft size={18} style={{ color: "var(--text-faint)", transform: "rotate(180deg)" }} />
            </button>
          );
        })}
      </div>

      {/* TOPICS GRID */}
      <SectionTitle
        right={
          bookmarked.size > 0 ? (
            <button
              onClick={() => onStart("bookmarks")}
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: "var(--brand)",
                display: "inline-flex", alignItems: "center", gap: "4px",
              }}
            >
              <Star size={13} fill="currentColor" /> {bookmarked.size} bookmarked
            </button>
          ) : null
        }
      >
        Topics
      </SectionTitle>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
        gap: "10px",
      }}>
        {Object.entries(TOPICS).map(([k, label]) => {
          const Icon = TOPIC_ICONS[k] || Globe;
          const hue = TOPIC_HUES[k] || "#5765f2";
          const s = stats.byTopic[k];
          const pct = s.total ? (s.done / s.total) * 100 : 0;
          return (
            <button
              key={k}
              onClick={() => onStart("topic", k)}
              disabled={s.total === 0}
              style={{
                background: "var(--bg-card)",
                borderRadius: "var(--radius-lg)",
                padding: "16px 14px",
                boxShadow: "var(--shadow-sm)",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: "10px",
                textAlign: "left",
                position: "relative",
                opacity: s.total === 0 ? 0.4 : 1,
                transition: "transform 120ms, box-shadow 120ms",
                cursor: s.total === 0 ? "not-allowed" : "pointer",
                minHeight: "120px",
              }}
              onMouseEnter={(e) => {
                if (s.total === 0) return;
                e.currentTarget.style.transform = "translateY(-3px)";
                e.currentTarget.style.boxShadow = "var(--shadow-md)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "";
                e.currentTarget.style.boxShadow = "var(--shadow-sm)";
              }}
            >
              <div style={{
                width: "40px", height: "40px",
                borderRadius: "12px",
                background: `${hue}22`,
                color: hue,
                display: "inline-flex", alignItems: "center", justifyContent: "center",
              }}>
                <Icon size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.25 }}>
                  {label}
                </div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px", fontWeight: 600 }}>
                  {s.done} / {s.total}
                </div>
              </div>
              <div style={{
                position: "absolute",
                left: "14px", right: "14px", bottom: "12px",
                height: "4px",
                background: "var(--bg-inset)",
                borderRadius: "var(--radius-pill)",
                overflow: "hidden",
              }}>
                <div style={{ width: `${pct}%`, height: "100%", background: hue, transition: "width 320ms" }} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SectionTitle({ children, right }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      margin: "8px 4px 12px",
    }}>
      <h2 style={{
        fontSize: "16px",
        fontWeight: 800,
        color: "var(--text-primary)",
        margin: 0,
        letterSpacing: "-0.01em",
      }}>{children}</h2>
      {right}
    </div>
  );
}

function ProgressBar({ value }) {
  return (
    <div style={{ height: "10px", background: "rgba(255,255,255,0.18)", borderRadius: "var(--radius-pill)", overflow: "hidden" }}>
      <div style={{
        width: `${value}%`,
        height: "100%",
        background: "#fff",
        borderRadius: "var(--radius-pill)",
        transition: "width 320ms",
      }} />
    </div>
  );
}

function LevelMedal({ lvl, done, total, colorVar }) {
  const pct = total ? (done / total) * 100 : 0;
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: "60px", height: "60px", flexShrink: 0 }}>
      <svg width="60" height="60" viewBox="0 0 60 60" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="30" cy="30" r={r} fill="none" stroke="var(--bg-inset)" strokeWidth="5" />
        <circle
          cx="30" cy="30" r={r}
          fill="none"
          stroke={colorVar}
          strokeWidth="5"
          strokeDasharray={c}
          strokeDashoffset={c - (pct / 100) * c}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 320ms" }}
        />
      </svg>
      <div style={{
        position: "absolute",
        inset: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "13px",
        fontWeight: 800,
        color: colorVar,
      }}>
        {Math.round(pct)}%
      </div>
    </div>
  );
}

// ============== STUDY SCREEN ==============

function StudyScreen({ study, bookmarked, onAnswer, onToggleBookmark, onExit }) {
  const finished = study.idx >= study.ids.length;
  if (finished) return <DoneScreen study={study} onExit={onExit} />;

  const id = study.ids[study.idx];
  const q = QUESTIONS.find(x => x.id === id);
  const lvl = LEVELS[q.level];
  const Icon = TOPIC_ICONS[q.topic] || Globe;
  const hue = TOPIC_HUES[q.topic] || "#5765f2";

  const [revealed, setRevealed] = useState(false);
  const cardRef = useRef(null);

  // Reset reveal when question changes
  useEffect(() => {
    setRevealed(false);
    cardRef.current?.scrollTo({ top: 0, behavior: "instant" });
  }, [id]);

  // Keyboard: Space = reveal, 1/2/3 = rate, Esc = exit
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") { onExit(); return; }
      if (!revealed && (e.key === " " || e.key === "Enter")) {
        e.preventDefault();
        setRevealed(true);
        return;
      }
      if (revealed) {
        if (e.key === "1") onAnswer("hard");
        else if (e.key === "2") onAnswer("medium");
        else if (e.key === "3") onAnswer("easy");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [revealed, onAnswer, onExit]);

  const pct = ((study.idx) / study.ids.length) * 100;
  const isBookmarked = bookmarked.has(id);

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg-app)",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* TOP BAR */}
      <header style={{
        position: "sticky", top: 0, zIndex: 10,
        padding: "16px 20px",
        background: "var(--bg-app)",
        display: "flex",
        alignItems: "center",
        gap: "14px",
        maxWidth: "720px",
        margin: "0 auto",
        width: "100%",
      }}>
        <button onClick={onExit} style={iconBtnStyle} aria-label="Exit study">
          <X size={18} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ height: "8px", background: "var(--bg-inset)", borderRadius: "var(--radius-pill)", overflow: "hidden" }}>
            <div style={{
              width: `${pct}%`,
              height: "100%",
              background: hue,
              transition: "width 280ms",
              borderRadius: "var(--radius-pill)",
            }} />
          </div>
        </div>
        <div style={{
          fontSize: "13px",
          color: "var(--text-secondary)",
          fontWeight: 700,
          fontVariantNumeric: "tabular-nums",
          minWidth: "44px",
          textAlign: "right",
        }}>
          {study.idx + 1}/{study.ids.length}
        </div>
        <button
          onClick={() => onToggleBookmark(id)}
          style={iconBtnStyle}
          aria-label={isBookmarked ? "Remove bookmark" : "Bookmark"}
          title={isBookmarked ? "Remove bookmark" : "Bookmark"}
        >
          <Star
            size={18}
            color={isBookmarked ? "#f7b955" : "var(--text-muted)"}
            fill={isBookmarked ? "#f7b955" : "transparent"}
          />
        </button>
      </header>

      {/* CARD */}
      <main
        ref={cardRef}
        key={id}
        className="animate-slide-right"
        style={{
          flex: 1,
          maxWidth: "720px",
          width: "100%",
          margin: "0 auto",
          padding: "8px 20px 200px",
        }}
      >
        {/* meta chips */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
          <Chip color={`var(--level-${q.level})`}>{lvl.label}</Chip>
          <Chip color={hue}>
            <Icon size={12} style={{ marginRight: "4px", verticalAlign: "-2px" }} />
            {TOPICS[q.topic]}
          </Chip>
        </div>

        {/* question */}
        <h1 style={{
          fontSize: "clamp(22px, 4.2vw, 30px)",
          fontWeight: 800,
          color: "var(--text-primary)",
          letterSpacing: "-0.02em",
          lineHeight: 1.25,
          margin: "0 0 24px 0",
        }}>
          {q.q}
        </h1>

        {!revealed ? (
          <div style={{
            background: "var(--bg-card)",
            borderRadius: "var(--radius-xl)",
            padding: "40px 24px",
            boxShadow: "var(--shadow-md)",
            textAlign: "center",
          }}>
            <div style={{
              width: "64px", height: "64px",
              margin: "0 auto 16px",
              borderRadius: "50%",
              background: "var(--brand-soft)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--brand)",
            }} className="animate-pulse-ring">
              <Eye size={28} />
            </div>
            <div style={{
              color: "var(--text-secondary)",
              fontSize: "15px",
              fontWeight: 600,
              marginBottom: "20px",
            }}>
              Think about your answer first.
            </div>
            <button
              onClick={() => setRevealed(true)}
              style={primaryBtnStyle}
            >
              Reveal answer
              <span style={{ opacity: 0.65, fontSize: "11px", marginLeft: "8px" }}>SPACE</span>
            </button>
          </div>
        ) : (
          <div className="animate-pop">
            <div style={{
              background: "var(--bg-card)",
              borderRadius: "var(--radius-xl)",
              padding: "24px",
              boxShadow: "var(--shadow-md)",
              fontSize: "14.5px",
              lineHeight: 1.7,
              color: "var(--text-secondary)",
              whiteSpace: "pre-wrap",
              fontFamily: "'Inter', sans-serif",
            }}>
              {q.a}
            </div>

            {q.keywords?.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "16px" }}>
                {q.keywords.map(kw => (
                  <span key={kw} style={tagStyle}>#{kw}</span>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* FOOTER ACTION BAR */}
      {revealed && (
        <div style={{
          position: "fixed",
          bottom: 0, left: 0, right: 0,
          background: "var(--bg-card)",
          borderTop: "1px solid var(--bg-inset)",
          padding: "16px 20px calc(16px + env(safe-area-inset-bottom))",
          boxShadow: "0 -8px 24px rgba(40,50,90,0.06)",
          zIndex: 20,
        }} className="animate-slide-up">
          <div style={{ maxWidth: "720px", margin: "0 auto" }}>
            <div style={{
              fontSize: "12px",
              fontWeight: 700,
              color: "var(--text-muted)",
              textAlign: "center",
              marginBottom: "10px",
              letterSpacing: "0.02em",
            }}>
              How well did you know it?
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
              <RatingButton rating="hard"   label="Hard"   shortcut="1" emoji="😴" onClick={() => onAnswer("hard")} />
              <RatingButton rating="medium" label="Medium" shortcut="2" emoji="🤔" onClick={() => onAnswer("medium")} />
              <RatingButton rating="easy"   label="Easy"   shortcut="3" emoji="😎" onClick={() => onAnswer("easy")} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Chip({ children, color }) {
  return (
    <span style={{
      fontSize: "11px",
      fontWeight: 700,
      letterSpacing: "0.04em",
      textTransform: "uppercase",
      padding: "5px 10px",
      borderRadius: "var(--radius-pill)",
      background: `${color}22`,
      color: color,
    }}>
      {children}
    </span>
  );
}

const tagStyle = {
  fontSize: "11px",
  fontWeight: 600,
  color: "var(--text-muted)",
  background: "var(--bg-soft)",
  padding: "4px 10px",
  borderRadius: "var(--radius-pill)",
};

const primaryBtnStyle = {
  background: "var(--brand)",
  color: "#fff",
  padding: "14px 28px",
  borderRadius: "var(--radius-pill)",
  fontSize: "15px",
  fontWeight: 700,
  boxShadow: "var(--shadow-brand)",
  display: "inline-flex",
  alignItems: "center",
};

function RatingButton({ rating, label, shortcut, emoji, onClick }) {
  const colorMap = {
    hard:   { bg: "var(--danger-soft)",   fg: "var(--danger)" },
    medium: { bg: "var(--warning-soft)", fg: "var(--warning)" },
    easy:   { bg: "var(--success-soft)", fg: "var(--success)" },
  };
  const { bg, fg } = colorMap[rating];
  return (
    <button
      onClick={onClick}
      style={{
        background: bg,
        color: fg,
        padding: "16px 8px",
        borderRadius: "var(--radius-lg)",
        fontSize: "14px",
        fontWeight: 700,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "4px",
        transition: "transform 100ms",
      }}
      onMouseDown={(e) => e.currentTarget.style.transform = "scale(0.96)"}
      onMouseUp={(e) => e.currentTarget.style.transform = ""}
      onMouseLeave={(e) => e.currentTarget.style.transform = ""}
    >
      <span style={{ fontSize: "22px", lineHeight: 1 }}>{emoji}</span>
      <span>{label}</span>
      <span style={{
        fontSize: "10px", opacity: 0.65, fontWeight: 600,
        background: "rgba(0,0,0,0.06)", padding: "1px 6px", borderRadius: "4px",
      }}>{shortcut}</span>
    </button>
  );
}

// ============== DONE SCREEN ==============

function DoneScreen({ study, onExit }) {
  const total = study.ids.length;
  const { easy, medium, hard } = study.results;

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg-app)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      position: "relative",
      overflow: "hidden",
    }}>
      <ConfettiBurst />

      <div className="animate-pop" style={{
        background: "var(--bg-card)",
        borderRadius: "var(--radius-xl)",
        padding: "40px 32px",
        boxShadow: "var(--shadow-lg)",
        maxWidth: "440px",
        width: "100%",
        textAlign: "center",
        position: "relative",
        zIndex: 2,
      }}>
        <div style={{
          width: "84px", height: "84px",
          background: "linear-gradient(135deg, #ffd142, #ff9442)",
          borderRadius: "50%",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          marginBottom: "20px",
          boxShadow: "0 12px 32px rgba(255, 148, 66, 0.45)",
        }}>
          <Trophy size={42} color="#fff" />
        </div>

        <h1 style={{
          fontSize: "28px",
          fontWeight: 800,
          letterSpacing: "-0.02em",
          margin: "0 0 6px",
          color: "var(--text-primary)",
        }}>
          Session complete!
        </h1>
        <div style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "28px" }}>
          You went through {total} question{total === 1 ? "" : "s"}.
        </div>

        <div style={{
          background: "linear-gradient(135deg, #5765f2 0%, #8b5cf6 100%)",
          borderRadius: "var(--radius-lg)",
          padding: "20px",
          color: "#fff",
          marginBottom: "20px",
          boxShadow: "var(--shadow-brand)",
        }}>
          <div style={{ fontSize: "12px", opacity: 0.85, fontWeight: 600, marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>XP earned</div>
          <div style={{ fontSize: "44px", fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1 }}>
            +{study.sessionXp}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "28px" }}>
          <ResultCell value={easy}   label="Easy"   color="var(--success)" bg="var(--success-soft)" />
          <ResultCell value={medium} label="Medium" color="var(--warning)" bg="var(--warning-soft)" />
          <ResultCell value={hard}   label="Hard"   color="var(--danger)"  bg="var(--danger-soft)" />
        </div>

        <button
          onClick={onExit}
          style={{
            ...primaryBtnStyle,
            width: "100%",
            justifyContent: "center",
          }}
        >
          <Check size={18} style={{ marginRight: "8px" }} /> Back to home
        </button>
      </div>
    </div>
  );
}

function ResultCell({ value, label, color, bg }) {
  return (
    <div style={{
      background: bg,
      borderRadius: "var(--radius-md)",
      padding: "12px 8px",
    }}>
      <div style={{ fontSize: "24px", fontWeight: 800, color, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: "11px", color, fontWeight: 600, marginTop: "4px", opacity: 0.85 }}>
        {label}
      </div>
    </div>
  );
}

function ConfettiBurst() {
  // Render 32 lightweight confetti dots that fall.
  const colors = ["#5765f2", "#34c77b", "#f7b955", "#f86464", "#8b5cf6", "#4dbfff"];
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }} aria-hidden="true">
      {Array.from({ length: 32 }).map((_, i) => {
        const left = (i * 3.125) + Math.random() * 3;
        const delay = Math.random() * 0.6;
        const dur = 2.4 + Math.random() * 1.6;
        const color = colors[i % colors.length];
        const size = 6 + Math.random() * 6;
        return (
          <span key={i} style={{
            position: "absolute",
            top: "-20px",
            left: `${left}%`,
            width: `${size}px`,
            height: `${size}px`,
            background: color,
            borderRadius: i % 2 ? "2px" : "50%",
            animation: `confetti ${dur}s ${delay}s ease-in forwards`,
          }} />
        );
      })}
    </div>
  );
}

// ============== STATS SCREEN ==============

function StatsScreen({ stats, xp, streak, bookmarked }) {
  return (
    <div className="animate-fade">
      {/* HEADER STATS */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "20px" }}>
        <BigStatCard
          icon={<Sparkles size={20} color="#f7b955" fill="#f7b955" />}
          value={xp}
          label="Total XP"
          gradient="linear-gradient(135deg, #ffd142 0%, #ff9442 100%)"
        />
        <BigStatCard
          icon={<Flame size={20} color="#fff" fill="#fff" />}
          value={streak}
          label="Day streak"
          gradient="linear-gradient(135deg, #ff7a4d 0%, #f86464 100%)"
        />
      </div>

      {/* PROGRESS RING */}
      <div style={{
        background: "var(--bg-card)",
        borderRadius: "var(--radius-xl)",
        padding: "28px 20px",
        boxShadow: "var(--shadow-sm)",
        marginBottom: "20px",
        textAlign: "center",
      }}>
        <ProgressRing value={stats.done} max={stats.total} />
        <div style={{ fontSize: "14px", color: "var(--text-muted)", marginTop: "12px", fontWeight: 600 }}>
          {stats.done} of {stats.total} questions reviewed
        </div>
      </div>

      {/* LEVEL BREAKDOWN */}
      <SectionTitle>By level</SectionTitle>
      <div style={{ display: "grid", gap: "8px", marginBottom: "20px" }}>
        {Object.entries(LEVELS).map(([k, lvl]) => {
          const s = stats.byLevel[k];
          const pct = s.total ? (s.done / s.total) * 100 : 0;
          return (
            <div key={k} style={{
              background: "var(--bg-card)",
              borderRadius: "var(--radius-md)",
              padding: "12px 16px",
              boxShadow: "var(--shadow-sm)",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}>
              <div style={{
                width: "10px", height: "10px",
                borderRadius: "50%",
                background: `var(--level-${k})`,
              }} />
              <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", flex: 1 }}>
                {lvl.label}
              </div>
              <div style={{ flex: 2, height: "6px", background: "var(--bg-inset)", borderRadius: "var(--radius-pill)", overflow: "hidden" }}>
                <div style={{ width: `${pct}%`, height: "100%", background: `var(--level-${k})`, borderRadius: "var(--radius-pill)", transition: "width 320ms" }} />
              </div>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", minWidth: "44px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                {s.done}/{s.total}
              </div>
            </div>
          );
        })}
      </div>

      {/* CONFIDENCE BREAKDOWN */}
      <SectionTitle>Mastery</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
        <MasteryCard count={stats.conf.easy}   label="Easy"   icon="😎" color="var(--success)" bg="var(--success-soft)" />
        <MasteryCard count={stats.conf.medium} label="Medium" icon="🤔" color="var(--warning)" bg="var(--warning-soft)" />
        <MasteryCard count={stats.conf.hard}   label="Hard"   icon="😴" color="var(--danger)"  bg="var(--danger-soft)" />
      </div>

      {bookmarked.size > 0 && (
        <>
          <SectionTitle>Bookmarks</SectionTitle>
          <div style={{
            background: "var(--bg-card)",
            borderRadius: "var(--radius-md)",
            padding: "16px 18px",
            boxShadow: "var(--shadow-sm)",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}>
            <Star size={20} color="#f7b955" fill="#f7b955" />
            <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
              {bookmarked.size} questions saved for later
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function BigStatCard({ icon, value, label, gradient }) {
  return (
    <div style={{
      background: gradient,
      color: "#fff",
      borderRadius: "var(--radius-lg)",
      padding: "18px",
      boxShadow: "var(--shadow-md)",
    }}>
      <div style={{ marginBottom: "10px" }}>{icon}</div>
      <div style={{ fontSize: "32px", fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: "12px", marginTop: "4px", opacity: 0.9, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
        {label}
      </div>
    </div>
  );
}

function MasteryCard({ count, label, icon, color, bg }) {
  return (
    <div style={{
      background: bg,
      borderRadius: "var(--radius-lg)",
      padding: "16px 12px",
      textAlign: "center",
    }}>
      <div style={{ fontSize: "26px", marginBottom: "6px" }}>{icon}</div>
      <div style={{ fontSize: "22px", fontWeight: 800, color, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{count}</div>
      <div style={{ fontSize: "11px", fontWeight: 600, color, marginTop: "4px", opacity: 0.85 }}>{label}</div>
    </div>
  );
}

function ProgressRing({ value, max }) {
  const pct = max ? (value / max) * 100 : 0;
  const r = 56;
  const c = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: "140px", height: "140px", margin: "0 auto" }}>
      <svg width="140" height="140" viewBox="0 0 140 140" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="70" cy="70" r={r} fill="none" stroke="var(--bg-inset)" strokeWidth="10" />
        <circle
          cx="70" cy="70" r={r}
          fill="none"
          stroke="url(#ringGradient)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (pct / 100) * c}
          style={{ transition: "stroke-dashoffset 480ms" }}
        />
        <defs>
          <linearGradient id="ringGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#5765f2" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
      </svg>
      <div style={{
        position: "absolute",
        inset: 0,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{ fontSize: "32px", fontWeight: 900, color: "var(--text-primary)", letterSpacing: "-0.03em", lineHeight: 1 }}>
          {Math.round(pct)}%
        </div>
        <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Overall
        </div>
      </div>
    </div>
  );
}

// ============== SETTINGS SCREEN ==============

function SettingsScreen({ theme, onThemeChange, onResetProgress }) {
  return (
    <div className="animate-fade">
      <SectionTitle>Appearance</SectionTitle>
      <div style={{
        background: "var(--bg-card)",
        borderRadius: "var(--radius-lg)",
        padding: "6px",
        boxShadow: "var(--shadow-sm)",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "4px",
        marginBottom: "20px",
      }}>
        {[
          { k: "light", label: "Light", Icon: Sun },
          { k: "dark",  label: "Dark",  Icon: Moon },
        ].map(({ k, label, Icon }) => {
          const active = theme === k;
          return (
            <button
              key={k}
              onClick={() => onThemeChange(k)}
              style={{
                padding: "12px",
                borderRadius: "var(--radius-md)",
                background: active ? "var(--brand)" : "transparent",
                color: active ? "#fff" : "var(--text-secondary)",
                fontWeight: 700,
                fontSize: "13px",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                transition: "background 160ms, color 160ms",
              }}
            >
              <Icon size={16} /> {label}
            </button>
          );
        })}
      </div>

      <SectionTitle>About</SectionTitle>
      <div style={{
        background: "var(--bg-card)",
        borderRadius: "var(--radius-lg)",
        padding: "20px",
        boxShadow: "var(--shadow-sm)",
        marginBottom: "20px",
        fontSize: "13px",
        color: "var(--text-secondary)",
        lineHeight: 1.65,
      }}>
        <strong style={{ color: "var(--text-primary)" }}>web.drill</strong> is an interview prep app for full-stack web developers. It covers HTTP, REST, auth, CORS, security (OWASP), Django, FastAPI, JS, DOM, React, Vue, performance, and deployment — from trainee to lead.
        <div style={{ marginTop: "10px", color: "var(--text-muted)", fontSize: "12px" }}>
          Built by <a href="https://t.me/Suslicke" target="_blank" rel="noopener noreferrer" style={{ color: "var(--brand)", fontWeight: 700, textDecoration: "none" }}>@Suslicke</a> · v2.0
        </div>
      </div>

      <SectionTitle>Danger zone</SectionTitle>
      <button
        onClick={onResetProgress}
        style={{
          background: "var(--danger-soft)",
          color: "var(--danger)",
          padding: "14px 20px",
          borderRadius: "var(--radius-lg)",
          fontWeight: 700,
          fontSize: "13px",
          width: "100%",
          display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
        }}
      >
        <RotateCcw size={16} /> Reset all progress
      </button>
    </div>
  );
}

// ============== SEARCH OVERLAY ==============

function SearchOverlay({ query, onQueryChange, onClose, onPick }) {
  const inputRef = useRef(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const results = useMemo(() => {
    const n = query.trim().toLowerCase();
    if (!n) return [];
    return QUESTIONS
      .filter(q => `${q.q} ${q.a} ${(q.keywords || []).join(" ")}`.toLowerCase().includes(n))
      .slice(0, 20);
  }, [query]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(15, 18, 32, 0.55)",
        backdropFilter: "blur(8px)",
        zIndex: 50,
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-slide-up"
        style={{
          background: "var(--bg-card)",
          borderRadius: "var(--radius-lg)",
          width: "100%",
          maxWidth: "560px",
          marginTop: "60px",
          overflow: "hidden",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid var(--bg-inset)" }}>
          <Search size={18} color="var(--text-muted)" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search questions, answers, keywords..."
            style={{
              flex: 1,
              fontSize: "15px",
              fontWeight: 500,
              color: "var(--text-primary)",
              padding: "8px 0",
            }}
          />
          <button onClick={onClose} style={{ ...iconBtnStyle, width: "30px", height: "30px" }} aria-label="Close">
            <X size={16} />
          </button>
        </div>
        <div className="hide-scrollbar" style={{ maxHeight: "60vh", overflowY: "auto" }}>
          {query.trim() && results.length === 0 && (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)", fontSize: "14px" }}>
              No matches for "{query}"
            </div>
          )}
          {!query.trim() && (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)", fontSize: "14px" }}>
              Start typing to search {QUESTIONS.length} questions
            </div>
          )}
          {results.map(q => {
            const lvl = LEVELS[q.level];
            const Icon = TOPIC_ICONS[q.topic] || Globe;
            const hue = TOPIC_HUES[q.topic] || "#5765f2";
            return (
              <button
                key={q.id}
                onClick={() => onPick(q)}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  textAlign: "left",
                  borderBottom: "1px solid var(--bg-inset)",
                  background: "transparent",
                  transition: "background 120ms",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-soft)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              >
                <div style={{
                  width: "32px", height: "32px",
                  borderRadius: "10px",
                  background: `${hue}22`,
                  color: hue,
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <Icon size={16} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "13px", color: "var(--text-primary)", fontWeight: 600, lineHeight: 1.3, marginBottom: "2px" }}>
                    {q.q}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 500 }}>
                    {lvl.label} · {TOPICS[q.topic]}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
