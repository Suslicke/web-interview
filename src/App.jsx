import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import {
  ChevronDown, ChevronRight, Check, X, Zap, AlertTriangle, Flame,
  Eye, EyeOff, RotateCcw, Filter, Target, Terminal, Download, Upload,
  Search, Sun, Moon, User, Cookie, Play,
} from "lucide-react";
import { LEVELS, TOPICS, QUESTIONS } from "./data.js";
import { trackEvent, setAnalyticsConsent, setAnalyticsUser } from "./analytics.js";

// ============== PERSISTENCE ==============
const STORAGE_KEY = "web-interview-prep:v1";

const defaultState = {
  completed: [],      // array of ids (serializable)
  bookmarked: [],
  revealed: [],
  confidence: {},     // { [id]: 'easy' | 'medium' | 'hard' }
  levelFilter: "all",
  topicFilter: "all",
  hideCompleted: false,
  blindMode: false,
  showIntro: true,
  lastSaved: null,
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw);
    // merge with defaults in case new fields appear in future versions
    return { ...defaultState, ...parsed };
  } catch (e) {
    console.warn("Failed to load saved state, starting fresh:", e);
    return defaultState;
  }
}

function saveState(state) {
  try {
    const payload = { ...state, lastSaved: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    return true;
  } catch (e) {
    console.error("Failed to save state:", e);
    return false;
  }
}

// ============== APP ==============
export default function App() {
  // init once from localStorage
  const [initial] = useState(() => loadState());

  const [expandedId, setExpandedId] = useState(null);
  const [quiz, setQuiz] = useState(null); // { ids, idx, results: {easy,medium,hard} }
  const [ratingFilter, setRatingFilter] = useState("all"); // all|bookmarked|easy|medium|hard|unrated
  const [tagFilter, setTagFilter] = useState(null); // single keyword string
  const [collapsedLevels, setCollapsedLevels] = useState(() => new Set()); // Set of level keys that are collapsed
  const [suggestFocused, setSuggestFocused] = useState(false);
  const [suggestIdx, setSuggestIdx] = useState(-1);
  const [completed, setCompleted] = useState(new Set(initial.completed));
  const [bookmarked, setBookmarked] = useState(new Set(initial.bookmarked));
  const [revealed, setRevealed] = useState(new Set(initial.revealed));
  const [confidence, setConfidence] = useState(initial.confidence || {});
  const [levelFilter, setLevelFilter] = useState(initial.levelFilter);
  const [topicFilter, setTopicFilter] = useState(initial.topicFilter);
  const [hideCompleted, setHideCompleted] = useState(initial.hideCompleted);
  const [blindMode, setBlindMode] = useState(initial.blindMode);
  const [showIntro, setShowIntro] = useState(initial.showIntro);
  const [lastSaved, setLastSaved] = useState(initial.lastSaved);
  const [saveFlash, setSaveFlash] = useState(false);

  // ============== NEW FEATURES ==============
  const [query, setQuery] = useState("");
  const [username, setUsername] = useState("");
  const [consent, setConsent] = useState(() =>
    import.meta.env.VITE_GA_ID ? "pending" : "denied"
  );
  const [theme, setTheme] = useState(() => {
    if (typeof document === "undefined") return "dark";
    return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
  });
  const searchRef = useRef(null);

  // Load username + consent on mount
  useEffect(() => {
    try {
      const n = localStorage.getItem("web-username");
      if (n) { setUsername(n); setAnalyticsUser(n); }
      const c = localStorage.getItem("web-ga-consent");
      if (c === "granted" || c === "denied") {
        setConsent(c);
        setAnalyticsConsent(c);
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Global "/" and Cmd/Ctrl+K shortcuts for search, Esc clears
  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target?.tagName;
      const typing = tag === "INPUT" || tag === "TEXTAREA" || e.target?.isContentEditable;
      const isModK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k";
      const isSlash = e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey;
      if (isModK) {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      } else if (isSlash && !typing) {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key === "Escape" && document.activeElement === searchRef.current) {
        if (searchRef.current?.value) setQuery(""); else searchRef.current?.blur();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Debounced search event (fires 800ms after last keystroke)
  useEffect(() => {
    if (!query.trim()) return;
    const t = setTimeout(() => trackEvent("search", { search_term: query.trim() }), 800);
    return () => clearTimeout(t);
  }, [query]);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem("web-theme", next); } catch { /* ignore */ }
    trackEvent("theme_toggle", { theme: next });
  };

  const updateConsent = (value) => {
    setConsent(value);
    try { localStorage.setItem("web-ga-consent", value); } catch { /* ignore */ }
    setAnalyticsConsent(value);
    trackEvent(value === "granted" ? "consent_granted" : "consent_denied");
    if (value === "granted" && username) setAnalyticsUser(username);
  };

  const commitUsername = (value) => {
    const clean = value.trim().slice(0, 64);
    setUsername(clean);
    try {
      if (clean) localStorage.setItem("web-username", clean);
      else localStorage.removeItem("web-username");
    } catch { /* ignore */ }
    setAnalyticsUser(clean);
    if (clean) trackEvent("username_set");
  };

  // Persist on any change (debounced via microtask)
  useEffect(() => {
    const ok = saveState({
      completed: [...completed],
      bookmarked: [...bookmarked],
      revealed: [...revealed],
      confidence,
      levelFilter,
      topicFilter,
      hideCompleted,
      blindMode,
      showIntro,
    });
    if (ok) {
      setLastSaved(new Date().toISOString());
      setSaveFlash(true);
      const t = setTimeout(() => setSaveFlash(false), 600);
      return () => clearTimeout(t);
    }
  }, [completed, bookmarked, revealed, confidence, levelFilter, topicFilter, hideCompleted, blindMode, showIntro]);

  // ============== DERIVED ==============
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const passRating = (id) => {
      if (ratingFilter === "all") return true;
      if (ratingFilter === "bookmarked") return bookmarked.has(id);
      if (ratingFilter === "unrated") return !confidence[id];
      return confidence[id] === ratingFilter;
    };
    return QUESTIONS.filter((q) => {
      if (levelFilter !== "all" && q.level !== levelFilter) return false;
      if (topicFilter !== "all" && q.topic !== topicFilter) return false;
      if (hideCompleted && completed.has(q.id)) return false;
      if (!passRating(q.id)) return false;
      if (tagFilter) {
        const kws = (q.keywords || []).map((k) => k.toLowerCase());
        if (!kws.includes(tagFilter.toLowerCase())) return false;
      }
      if (needle) {
        const hay = `${q.q} ${q.a} ${(q.keywords || []).join(" ")}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    }).sort((a, b) => LEVELS[a.level].order - LEVELS[b.level].order || a.id - b.id);
  }, [levelFilter, topicFilter, hideCompleted, completed, query, ratingFilter, bookmarked, confidence, tagFilter]);

  const stats = useMemo(() => {
    const total = QUESTIONS.length;
    const done = completed.size;
    const byLevel = {};
    Object.keys(LEVELS).forEach((l) => {
      const lvlQs = QUESTIONS.filter((q) => q.level === l);
      byLevel[l] = {
        total: lvlQs.length,
        done: lvlQs.filter((q) => completed.has(q.id)).length,
      };
    });
    const confCount = { easy: 0, medium: 0, hard: 0 };
    Object.values(confidence).forEach((c) => (confCount[c] = (confCount[c] || 0) + 1));
    return { total, done, byLevel, confCount };
  }, [completed, confidence]);

  // ============== ACTIONS ==============
  const [lastCheckedId, setLastCheckedId] = useState(null);

  const toggleComplete = useCallback((id, shiftKey = false) => {
    if (shiftKey && lastCheckedId !== null && lastCheckedId !== id) {
      // Range toggle over the CURRENTLY VISIBLE (filtered) list
      const orderedIds = filtered.map((q) => q.id);
      const a = orderedIds.indexOf(lastCheckedId);
      const b = orderedIds.indexOf(id);
      if (a !== -1 && b !== -1) {
        const [from, to] = a < b ? [a, b] : [b, a];
        const rangeIds = orderedIds.slice(from, to + 1);
        const target = !completed.has(id); // new state of the clicked item
        setCompleted((prev) => {
          const next = new Set(prev);
          for (const rid of rangeIds) {
            if (target) next.add(rid);
            else next.delete(rid);
          }
          return next;
        });
        setLastCheckedId(id);
        trackEvent(target ? "questions_checked" : "questions_unchecked", {
          method: "shift_range",
          count: rangeIds.length,
        });
        return;
      }
    }
    setCompleted((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    setLastCheckedId(id);
  }, [lastCheckedId, completed, filtered]);

  const toggleBookmark = useCallback((id) => {
    setBookmarked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const toggleReveal = useCallback((id) => {
    setRevealed((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const setConf = useCallback((id, level) => {
    setConfidence((prev) => ({ ...prev, [id]: level }));
  }, []);

  // Quiz mode — pick 10 items, prioritizing hard + bookmarked
  const startQuiz = (size = 10) => {
    const all = QUESTIONS.map((q) => q.id);
    const hard = all.filter((id) => confidence[id] === "hard");
    const booked = all.filter((id) => bookmarked.has(id) && confidence[id] !== "hard");
    const rest = all.filter((id) => !hard.includes(id) && !booked.includes(id));
    const shuffle = (a) => {
      const arr = [...a];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    };
    const pool = [...shuffle(hard), ...shuffle(booked), ...shuffle(rest)].slice(0, size);
    if (pool.length === 0) return;
    setQuiz({ ids: pool, idx: 0, results: { easy: 0, medium: 0, hard: 0 } });
    trackEvent("quiz_started", { size: pool.length });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const quizAnswer = (rating) => {
    if (!quiz) return;
    const currentId = quiz.ids[quiz.idx];
    setConf(currentId, rating);
    setQuiz({
      ...quiz,
      idx: quiz.idx + 1,
      results: { ...quiz.results, [rating]: quiz.results[rating] + 1 },
    });
    trackEvent("quiz_answer", { rating });
  };

  const exitQuiz = () => {
    if (quiz) trackEvent("quiz_exited", { idx: quiz.idx, total: quiz.ids.length });
    setQuiz(null);
  };

  const questionById = (id) => QUESTIONS.find((q) => q.id === id);

  const resetAll = () => {
    if (window.confirm("Reset all progress? This will clear checks, bookmarks, and ratings.")) {
      setCompleted(new Set());
      setBookmarked(new Set());
      setRevealed(new Set());
      setConfidence({});
    }
  };

  // EXPORT
  const exportProgress = () => {
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      completed: [...completed],
      bookmarked: [...bookmarked],
      revealed: [...revealed],
      confidence,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `interview-prep-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // IMPORT
  const importProgress = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!window.confirm("Import this progress? Your current progress will be replaced.")) return;
        setCompleted(new Set(data.completed || []));
        setBookmarked(new Set(data.bookmarked || []));
        setRevealed(new Set(data.revealed || []));
        setConfidence(data.confidence || {});
      } catch (err) {
        alert("Failed to import: " + err.message);
      }
    };
    reader.readAsText(file);
    // reset input so same file can be re-imported
    e.target.value = "";
  };

  const progressPct = Math.round((stats.done / stats.total) * 100);

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* HEADER */}
        <header style={{ borderBottom: "1px solid var(--border-default)", paddingBottom: "20px", marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px", flexWrap: "wrap" }}>
            <Terminal size={20} color="var(--accent-blue)" />
            <span style={{ color: "var(--text-muted)", fontSize: "13px" }}>~/interview-prep/web $</span>
            <span className="cursor" style={{ color: "var(--accent-blue)" }}>▊</span>
            <div style={{
              marginLeft: "auto",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}>
              <div style={{
                fontSize: "11px",
                color: saveFlash ? "var(--accent-green)" : "var(--text-faint)",
                transition: "color 0.3s",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}>
                <span style={{
                  width: "6px", height: "6px",
                  borderRadius: "50%",
                  background: saveFlash ? "var(--accent-green)" : "var(--text-faint)",
                  transition: "background 0.3s",
                }} />
                {lastSaved ? `saved · ${new Date(lastSaved).toLocaleTimeString()}` : "unsaved"}
              </div>
              <button
                onClick={() => startQuiz(10)}
                style={{
                  background: "transparent",
                  border: "1px solid var(--accent-blue)",
                  color: "var(--accent-blue)",
                  padding: "5px 10px",
                  borderRadius: "4px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  fontSize: "11px",
                  fontWeight: 600,
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}
                aria-label="Start quiz"
                title="Quiz yourself on 10 random items (weak + bookmarked first)"
              >
                <Play size={12} /> Quiz
              </button>
              <button
                onClick={toggleTheme}
                style={{
                  background: "transparent",
                  border: "1px solid var(--border-default)",
                  color: "var(--text-muted)",
                  padding: "5px 7px",
                  borderRadius: "4px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                }}
                aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
                title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
              >
                {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
              </button>
            </div>
          </div>
          <h1 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: "clamp(28px, 5vw, 44px)",
            fontWeight: 700,
            margin: "0 0 8px 0",
            letterSpacing: "-0.02em",
            background: "linear-gradient(135deg, var(--accent-blue) 0%, var(--accent-red) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            WEB // INTERVIEW DRILL
          </h1>
          <div style={{ color: "var(--text-muted)", fontSize: "14px", lineHeight: 1.6 }}>
            HTTP · Django · FastAPI · Auth · CORS · Security · JS/DOM · React/Vue — trainee to lead, plus the tricky traps.
            <br />
            <span style={{ color: "var(--accent-red)" }}>target:</span> full-stack / senior ·{" "}
            <span style={{ color: "var(--accent-red)" }}>progress:</span> auto-saved in your browser ·{" "}
            <span style={{ color: "var(--accent-green)" }}>good luck.</span>
          </div>
        </header>

        {/* QUIZ MODE — replaces everything below when active */}
        {quiz && (() => {
          const finished = quiz.idx >= quiz.ids.length;
          if (finished) {
            const { easy, medium, hard } = quiz.results;
            const total = quiz.ids.length;
            return (
              <div style={{
                background: "linear-gradient(135deg, var(--bg-surface) 0%, var(--bg-surface-2) 100%)",
                border: "1px solid var(--accent-blue)",
                borderLeft: "3px solid var(--accent-blue)",
                borderRadius: "8px",
                padding: "28px",
                marginBottom: "20px",
              }}>
                <div style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: "22px",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  marginBottom: "8px",
                }}>
                  Quiz complete
                </div>
                <div style={{ color: "var(--text-muted)", fontSize: "13px", marginBottom: "20px" }}>
                  You rated {total} question{total === 1 ? "" : "s"}. Ratings are saved. Hit Quiz again to drill on the weak ones.
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "20px" }}>
                  {[
                    { k: "easy", v: easy, color: "var(--accent-green)" },
                    { k: "medium", v: medium, color: "var(--accent-amber)" },
                    { k: "hard", v: hard, color: "var(--accent-red)" },
                  ].map((r) => (
                    <div key={r.k} style={{
                      background: `color-mix(in srgb, ${r.color} 10%, transparent)`,
                      border: `1px solid color-mix(in srgb, ${r.color} 30%, transparent)`,
                      borderRadius: "6px",
                      padding: "14px",
                      textAlign: "center",
                    }}>
                      <div style={{
                        fontFamily: "'Space Grotesk', sans-serif",
                        fontSize: "32px", fontWeight: 700,
                        color: r.color, lineHeight: 1,
                      }}>{r.v}</div>
                      <div style={{
                        fontSize: "10px", textTransform: "uppercase",
                        letterSpacing: "0.1em", color: r.color, marginTop: "6px",
                      }}>{r.k}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <button
                    onClick={() => startQuiz(10)}
                    style={{
                      background: "var(--accent-blue)",
                      color: "var(--bg-app)",
                      border: "1px solid var(--accent-blue)",
                      padding: "7px 14px",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      fontSize: "12px",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <Play size={12} /> Another round
                  </button>
                  <button
                    onClick={exitQuiz}
                    style={{ ...btnStyle, padding: "7px 14px" }}
                  >
                    Back to guide
                  </button>
                </div>
              </div>
            );
          }
          const currentId = quiz.ids[quiz.idx];
          const q = questionById(currentId);
          if (!q) {
            return <div>Question {currentId} not found. <button onClick={exitQuiz}>Exit</button></div>;
          }
          const lvl = LEVELS[q.level];
          const isRev = revealed.has(currentId);
          return (
            <div style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-default)",
              borderLeft: `3px solid ${lvl.color}`,
              borderRadius: "6px",
              overflow: "hidden",
              marginBottom: "20px",
            }}>
              {/* Header */}
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 16px",
                borderBottom: "1px solid var(--border-default)",
                flexWrap: "wrap",
              }}>
                <span style={{
                  fontSize: "11px",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "var(--text-muted)",
                }}>
                  Quiz · {quiz.idx + 1} / {quiz.ids.length}
                </span>
                <span style={{
                  fontSize: "10px",
                  color: lvl.color,
                  padding: "2px 6px",
                  border: `1px solid ${lvl.color}55`,
                  borderRadius: "3px",
                }}>{lvl.label}</span>
                <span style={{
                  fontSize: "10px",
                  color: "var(--text-muted)",
                  padding: "2px 6px",
                  border: "1px solid var(--border-default)",
                  borderRadius: "3px",
                }}>{TOPICS[q.topic]}</span>
                <div style={{ marginLeft: "auto", display: "flex", gap: "8px", fontSize: "11px", fontVariantNumeric: "tabular-nums" }}>
                  <span style={{ color: "var(--accent-green)" }}>{quiz.results.easy}↑</span>
                  <span style={{ color: "var(--accent-amber)" }}>{quiz.results.medium}~</span>
                  <span style={{ color: "var(--accent-red)" }}>{quiz.results.hard}↓</span>
                  <button onClick={exitQuiz} style={{ ...btnStyle, padding: "2px 8px" }}>
                    <X size={11} /> exit
                  </button>
                </div>
              </div>
              {/* Progress */}
              <div style={{ height: "3px", background: "var(--bg-inset)" }}>
                <div style={{
                  width: `${(quiz.idx / quiz.ids.length) * 100}%`,
                  height: "100%",
                  background: lvl.color,
                  transition: "width 0.2s",
                }} />
              </div>
              {/* Body */}
              <div style={{ padding: "24px" }}>
                <h2 style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: "18px",
                  fontWeight: 500,
                  color: "var(--text-primary)",
                  lineHeight: 1.5,
                  margin: "0 0 20px 0",
                }}>
                  {q.q}
                </h2>
                {!isRev ? (
                  <div style={{ padding: "20px 0", textAlign: "center" }}>
                    <button
                      onClick={() => toggleReveal(currentId)}
                      style={{
                        background: "transparent",
                        border: `1px solid ${lvl.color}`,
                        color: lvl.color,
                        padding: "10px 28px",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontFamily: "inherit",
                        fontSize: "12px",
                        fontWeight: 600,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <Eye size={14} /> Reveal answer
                    </button>
                    <div style={{ color: "var(--text-muted)", fontSize: "12px", marginTop: "12px" }}>
                      Think it through first. Then rate how well you knew it.
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{
                      whiteSpace: "pre-wrap",
                      fontSize: "13.5px",
                      lineHeight: 1.75,
                      color: "var(--text-secondary)",
                      marginBottom: "20px",
                    }}>
                      {q.a}
                    </div>
                    <div style={{
                      display: "flex",
                      gap: "8px",
                      paddingTop: "16px",
                      borderTop: "1px solid var(--border-subtle)",
                      flexWrap: "wrap",
                    }}>
                      {["easy", "medium", "hard"].map((c) => {
                        const cColor = c === "easy" ? "var(--accent-green)" : c === "medium" ? "var(--accent-amber)" : "var(--accent-red)";
                        return (
                          <button
                            key={c}
                            onClick={() => quizAnswer(c)}
                            style={{
                              flex: 1,
                              minWidth: "100px",
                              background: `color-mix(in srgb, ${cColor} 15%, transparent)`,
                              border: `1px solid color-mix(in srgb, ${cColor} 55%, transparent)`,
                              color: cColor,
                              padding: "10px 16px",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontFamily: "inherit",
                              fontSize: "12px",
                              fontWeight: 600,
                              textTransform: "uppercase",
                              letterSpacing: "0.1em",
                            }}
                          >
                            {c}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* INTRO */}
        {!quiz && showIntro && (
          <div style={{
            background: "linear-gradient(135deg, var(--bg-surface) 0%, var(--bg-surface-2) 100%)",
            border: "1px solid var(--border-default)",
            borderLeft: "3px solid var(--accent-blue)",
            padding: "16px 20px",
            borderRadius: "6px",
            marginBottom: "20px",
            fontSize: "13px",
            position: "relative",
          }}>
            <button
              onClick={() => setShowIntro(false)}
              style={{
                position: "absolute", top: "12px", right: "12px",
                background: "none", border: "none", color: "var(--text-muted)",
                cursor: "pointer", padding: "4px",
              }}
              aria-label="Close intro"
            ><X size={16} /></button>
            <div style={{ color: "var(--accent-blue)", fontWeight: 600, marginBottom: "8px" }}>HOW TO USE THIS</div>
            <div style={{ color: "var(--text-secondary)", lineHeight: 1.7 }}>
              <strong style={{ color: "var(--accent-green)" }}>1.</strong> Toggle <strong>BLIND MODE</strong> to hide answers — force yourself to think first.<br />
              <strong style={{ color: "var(--accent-green)" }}>2.</strong> After each question, rate your confidence (easy / medium / hard) — focus on <span style={{ color: "var(--accent-red)" }}>hard</span> on the last review pass.<br />
              <strong style={{ color: "var(--accent-green)" }}>3.</strong> Bookmark <span style={{ color: "var(--accent-amber)" }}>⚑</span> the ones you want to revisit 1 hour before the interview.<br />
              <strong style={{ color: "var(--accent-green)" }}>4.</strong> <span style={{ color: "var(--accent-red)" }}>Tricky</span> section is last — these are the gotchas seniors are actually tested on.<br />
              <strong style={{ color: "var(--accent-green)" }}>5.</strong> Your progress is saved automatically. Export it as JSON for backup / syncing across devices.
            </div>
          </div>
        )}

        {!quiz && <>
        {/* STATS */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "12px",
          marginBottom: "20px",
        }}>
          <StatCard label="TOTAL PROGRESS" value={`${stats.done}/${stats.total}`} accent="var(--accent-blue)" sub={`${progressPct}% complete`} />
          <StatCard label="BOOKMARKED" value={bookmarked.size} accent="var(--accent-amber)" sub="for quick review" icon={<Flame size={14} />} />
          <StatCard label="CONFIDENT" value={stats.confCount.easy || 0} accent="var(--accent-green)" sub="got this cold" icon={<Check size={14} />} />
          <StatCard label="NEEDS WORK" value={stats.confCount.hard || 0} accent="var(--accent-red)" sub="revisit!" icon={<AlertTriangle size={14} />} />
        </div>

        {/* PROGRESS BY LEVEL */}
        <div style={{ marginBottom: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text-muted)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            <span>by level</span>
            <span>done / total</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {Object.entries(LEVELS).map(([key, lvl]) => {
              const s = stats.byLevel[key];
              const pct = s.total ? (s.done / s.total) * 100 : 0;
              return (
                <div key={key} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "12px" }}>
                  <div style={{ width: "70px", color: lvl.color, fontWeight: 600, letterSpacing: "0.05em" }}>{lvl.label}</div>
                  <div style={{ flex: 1, height: "8px", background: "var(--bg-surface)", borderRadius: "4px", overflow: "hidden", border: "1px solid var(--border-default)" }}>
                    <div style={{
                      width: `${pct}%`, height: "100%",
                      background: `linear-gradient(90deg, ${lvl.color}aa, ${lvl.color})`,
                      transition: "width 0.3s",
                    }} />
                  </div>
                  <div style={{ width: "50px", textAlign: "right", color: "var(--text-secondary)", fontVariantNumeric: "tabular-nums" }}>{s.done}/{s.total}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SEARCH */}
        <div style={{ marginBottom: "12px", position: "relative" }}>
          <Search
            size={14}
            style={{
              position: "absolute", left: "12px", top: "50%",
              transform: "translateY(-50%)", color: "var(--text-muted)",
            }}
          />
          <input
            ref={searchRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSuggestIdx(-1); }}
            onFocus={() => setSuggestFocused(true)}
            onBlur={() => setTimeout(() => setSuggestFocused(false), 150)}
            onKeyDown={(e) => {
              const suggestions = query.trim() ? filtered.slice(0, 8) : [];
              if (suggestions.length === 0) return;
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setSuggestIdx((i) => Math.min(suggestions.length - 1, i + 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setSuggestIdx((i) => Math.max(-1, i - 1));
              } else if (e.key === "Enter") {
                e.preventDefault();
                const pick = suggestions[Math.max(0, suggestIdx)];
                if (pick) {
                  setExpandedId(pick.id);
                  setSuggestFocused(false);
                  searchRef.current?.blur();
                  setTimeout(() => {
                    document.getElementById(`q-${pick.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }, 50);
                  trackEvent("suggestion_picked", { id: pick.id });
                }
              }
            }}
            placeholder="Search questions, answers, keywords…"
            aria-label="Search"
            aria-autocomplete="list"
            style={{
              width: "100%",
              background: "var(--bg-surface)",
              border: "1px solid var(--border-default)",
              borderRadius: "6px",
              padding: "10px 12px 10px 34px",
              color: "var(--text-primary)",
              fontFamily: "inherit",
              fontSize: "13px",
            }}
          />
          <div style={{
            position: "absolute", right: "10px", top: "50%",
            transform: "translateY(-50%)", display: "flex", gap: "6px",
            alignItems: "center",
          }}>
            {query ? (
              <>
                <span style={{
                  fontSize: "11px", color: "var(--accent-blue)",
                  fontVariantNumeric: "tabular-nums",
                }}>
                  {filtered.length} {filtered.length === 1 ? "match" : "matches"}
                </span>
                <button
                  onClick={() => { setQuery(""); searchRef.current?.focus(); }}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    color: "var(--text-muted)", padding: "2px", display: "flex",
                  }}
                  aria-label="Clear search"
                  title="Clear"
                >
                  <X size={14} />
                </button>
              </>
            ) : (
              <span style={{
                fontSize: "10px", color: "var(--text-faint)",
                border: "1px solid var(--border-default)", borderRadius: "3px",
                padding: "1px 5px", letterSpacing: "0.05em",
              }}>
                /
              </span>
            )}
          </div>
          {/* SUGGESTIONS DROPDOWN */}
          {suggestFocused && query.trim() && filtered.length > 0 && (() => {
            const suggestions = filtered.slice(0, 8);
            return (
              <div
                role="listbox"
                style={{
                  position: "absolute",
                  top: "calc(100% + 4px)",
                  left: 0,
                  right: 0,
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-default)",
                  borderRadius: "6px",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
                  overflow: "hidden",
                  zIndex: 30,
                  maxHeight: "360px",
                  overflowY: "auto",
                }}
              >
                <div style={{
                  padding: "6px 12px",
                  fontSize: "10px",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "var(--text-muted)",
                  borderBottom: "1px solid var(--border-subtle)",
                  background: "var(--bg-inset)",
                }}>
                  {filtered.length} match{filtered.length === 1 ? "" : "es"} · ↑↓ to navigate · Enter to open
                </div>
                {suggestions.map((sq, i) => {
                  const lvl = LEVELS[sq.level];
                  const active = suggestIdx === i;
                  return (
                    <button
                      key={sq.id}
                      role="option"
                      aria-selected={active}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setExpandedId(sq.id);
                        setSuggestFocused(false);
                        searchRef.current?.blur();
                        setTimeout(() => {
                          document.getElementById(`q-${sq.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
                        }, 50);
                        trackEvent("suggestion_picked", { id: sq.id });
                      }}
                      onMouseEnter={() => setSuggestIdx(i)}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "10px",
                        padding: "10px 12px",
                        background: active ? "color-mix(in srgb, var(--accent-blue) 12%, transparent)" : "transparent",
                        border: "none",
                        borderLeft: `2px solid ${active ? lvl.color : "transparent"}`,
                        cursor: "pointer",
                        width: "100%",
                        textAlign: "left",
                        fontFamily: "inherit",
                        borderBottom: "1px solid var(--border-subtle)",
                      }}
                    >
                      <span style={{
                        fontSize: "9px",
                        fontWeight: 700,
                        letterSpacing: "0.1em",
                        color: lvl.color,
                        padding: "2px 5px",
                        border: `1px solid color-mix(in srgb, ${lvl.color} 40%, transparent)`,
                        borderRadius: "3px",
                        background: `color-mix(in srgb, ${lvl.color} 10%, transparent)`,
                        flexShrink: 0,
                        marginTop: "1px",
                      }}>{lvl.label}</span>
                      <span style={{
                        color: "var(--text-primary)",
                        fontSize: "13px",
                        lineHeight: 1.4,
                        flex: 1,
                        minWidth: 0,
                      }}>
                        {highlight(sq.q, query)}
                      </span>
                      <span style={{
                        color: "var(--text-faint)",
                        fontSize: "10px",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        flexShrink: 0,
                      }}>
                        {TOPICS[sq.topic]}
                      </span>
                    </button>
                  );
                })}
              </div>
            );
          })()}
        </div>

        {/* CONTROLS */}
        <div style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
          borderRadius: "6px",
          padding: "12px 16px",
          marginBottom: "20px",
          display: "flex",
          flexWrap: "wrap",
          gap: "12px",
          alignItems: "center",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-muted)", fontSize: "12px" }}>
            <Filter size={14} />
            <span style={{ textTransform: "uppercase", letterSpacing: "0.1em" }}>filter</span>
          </div>

          <select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)} style={selectStyle}>
            <option value="all">all levels</option>
            {Object.entries(LEVELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>

          <select value={topicFilter} onChange={(e) => setTopicFilter(e.target.value)} style={selectStyle}>
            <option value="all">all topics</option>
            {Object.entries(TOPICS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>

          <label style={toggleLabelStyle}>
            <input type="checkbox" checked={hideCompleted} onChange={(e) => setHideCompleted(e.target.checked)} />
            hide done
          </label>

          <label style={{ ...toggleLabelStyle, color: blindMode ? "var(--accent-red)" : "var(--text-muted)" }}>
            <input type="checkbox" checked={blindMode} onChange={(e) => setBlindMode(e.target.checked)} />
            {blindMode ? <EyeOff size={14} /> : <Eye size={14} />} blind mode
          </label>

          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <User size={12} style={{ position: "absolute", left: "8px", color: "var(--text-muted)" }} />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onBlur={(e) => commitUsername(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
              maxLength={64}
              placeholder="your name (optional)"
              aria-label="Your name"
              style={{
                ...selectStyle,
                paddingLeft: "24px",
                width: "170px",
              }}
            />
          </div>

          <div style={{ marginLeft: "auto", display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button onClick={exportProgress} style={btnStyle} title="Export progress as JSON">
              <Download size={12} /> export
            </button>
            <label style={{ ...btnStyle, cursor: "pointer" }} title="Import progress from JSON file">
              <Upload size={12} /> import
              <input type="file" accept="application/json" onChange={importProgress} style={{ display: "none" }} />
            </label>
            <button onClick={resetAll} style={{ ...btnStyle, color: "var(--accent-red)", borderColor: "color-mix(in srgb, var(--accent-red) 27%, transparent)" }}>
              <RotateCcw size={12} /> reset
            </button>
          </div>
        </div>

        {/* ACTIVE TAG CHIP — dismissable */}
        {!quiz && tagFilter && (
          <div style={{
            display: "flex", alignItems: "center", gap: "8px",
            marginBottom: "12px", flexWrap: "wrap",
          }}>
            <span style={{
              fontSize: "10px", textTransform: "uppercase",
              letterSpacing: "0.1em", color: "var(--text-muted)",
            }}>
              tag filter:
            </span>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: "6px",
              fontSize: "11px", color: "var(--bg-app)",
              background: "var(--accent-blue)",
              padding: "3px 10px", borderRadius: "12px",
              fontWeight: 500,
            }}>
              #{tagFilter}
              <button
                onClick={() => setTagFilter(null)}
                style={{
                  background: "none", border: "none",
                  color: "var(--bg-app)", cursor: "pointer",
                  display: "flex", alignItems: "center",
                  padding: 0, opacity: 0.8,
                }}
                aria-label="Clear tag filter"
                title="Clear"
              >
                <X size={12} />
              </button>
            </span>
            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
              {filtered.length} match{filtered.length === 1 ? "" : "es"}
            </span>
          </div>
        )}

        {/* RATING / BOOKMARK FILTER CHIPS */}
        {!quiz && (() => {
          const allIds = QUESTIONS.map((x) => x.id);
          const counts = {
            all: allIds.length,
            bookmarked: allIds.filter((id) => bookmarked.has(id)).length,
            hard: allIds.filter((id) => confidence[id] === "hard").length,
            medium: allIds.filter((id) => confidence[id] === "medium").length,
            easy: allIds.filter((id) => confidence[id] === "easy").length,
            unrated: allIds.filter((id) => !confidence[id]).length,
          };
          const chipColor = {
            all: "var(--text-muted)",
            bookmarked: "var(--accent-amber)",
            hard: "var(--accent-red)",
            medium: "var(--accent-amber)",
            easy: "var(--accent-green)",
            unrated: "var(--text-muted)",
          };
          const chips = [
            { k: "all", label: "all" },
            { k: "bookmarked", label: "⚑ bookmarked" },
            { k: "hard", label: "hard" },
            { k: "medium", label: "medium" },
            { k: "easy", label: "easy" },
            { k: "unrated", label: "unrated" },
          ];
          return (
            <div style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "6px",
              alignItems: "center",
              marginBottom: "16px",
            }}>
              <span style={{
                fontSize: "10px",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "var(--text-muted)",
                marginRight: "4px",
              }}>
                rating:
              </span>
              {chips.map((c) => {
                const n = counts[c.k];
                const active = ratingFilter === c.k;
                const col = chipColor[c.k];
                const disabled = c.k !== "all" && n === 0;
                return (
                  <button
                    key={c.k}
                    disabled={disabled}
                    onClick={() => {
                      setRatingFilter(c.k);
                      trackEvent("rating_filter", { value: c.k });
                    }}
                    style={{
                      background: active ? `color-mix(in srgb, ${col} 15%, transparent)` : "transparent",
                      border: active
                        ? `1px solid color-mix(in srgb, ${col} 60%, transparent)`
                        : "1px solid var(--border-default)",
                      color: active ? col : disabled ? "var(--text-faint)" : "var(--text-muted)",
                      padding: "4px 10px",
                      borderRadius: "3px",
                      cursor: disabled ? "not-allowed" : "pointer",
                      opacity: disabled ? 0.5 : 1,
                      fontFamily: "inherit",
                      fontSize: "11px",
                      fontWeight: 500,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      textTransform: "lowercase",
                    }}
                  >
                    {c.label}
                    <span style={{ fontSize: "10px", fontVariantNumeric: "tabular-nums", opacity: 0.7 }}>
                      {n}
                    </span>
                  </button>
                );
              })}
            </div>
          );
        })()}

        {/* QUESTIONS */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {filtered.length === 0 && (
            <div style={{
              padding: "60px 20px",
              textAlign: "center",
              color: "var(--text-muted)",
              background: "var(--bg-surface)",
              border: "1px dashed var(--border-default)",
              borderRadius: "6px",
            }}>
              <div style={{ fontSize: "32px", marginBottom: "8px" }}>∅</div>
              No questions match these filters.
            </div>
          )}

          {filtered.map((q, idx) => {
            const prevLevel = idx > 0 ? filtered[idx - 1].level : null;
            const isNewLevelGroup = q.level !== prevLevel;
            const lvl = LEVELS[q.level];
            const isCollapsed = collapsedLevels.has(q.level);
            // Count items in this level group
            const levelItems = filtered.filter((x) => x.level === q.level);
            const levelDone = levelItems.filter((x) => completed.has(x.id)).length;
            const toggleLevelCollapse = () => {
              setCollapsedLevels((prev) => {
                const next = new Set(prev);
                if (next.has(q.level)) next.delete(q.level);
                else next.add(q.level);
                return next;
              });
            };
            return (
              <div key={q.id} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {isNewLevelGroup && (
                  <button
                    onClick={toggleLevelCollapse}
                    style={{
                      marginTop: idx === 0 ? 0 : "16px",
                      padding: "10px 14px",
                      background: `color-mix(in srgb, ${lvl.color} 8%, transparent)`,
                      border: `1px solid color-mix(in srgb, ${lvl.color} 30%, transparent)`,
                      borderLeft: `3px solid ${lvl.color}`,
                      borderRadius: "6px",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      flexWrap: "wrap",
                      cursor: "pointer",
                      width: "100%",
                      textAlign: "left",
                      fontFamily: "inherit",
                    }}
                    aria-expanded={!isCollapsed}
                    title={isCollapsed ? `Expand ${lvl.label}` : `Collapse ${lvl.label}`}
                  >
                    <span style={{
                      display: "flex",
                      alignItems: "center",
                      color: lvl.color,
                      flexShrink: 0,
                    }}>
                      {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                    </span>
                    <span style={{
                      color: lvl.color,
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: "15px",
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                    }}>
                      {lvl.label}
                    </span>
                    <span style={{
                      color: "var(--text-muted)",
                      fontSize: "11px",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                    }}>
                      {levelItems.length} questions · {levelDone}/{levelItems.length} done
                      {isCollapsed && " · hidden"}
                    </span>
                    <div style={{
                      flex: 1,
                      minWidth: "80px",
                      height: "4px",
                      background: "var(--bg-inset)",
                      borderRadius: "2px",
                      overflow: "hidden",
                      marginLeft: "auto",
                    }}>
                      <div style={{
                        width: `${levelItems.length ? (levelDone / levelItems.length) * 100 : 0}%`,
                        height: "100%",
                        background: lvl.color,
                        transition: "width 0.2s",
                      }} />
                    </div>
                  </button>
                )}
                {!isCollapsed && (
                  <QuestionCard
                    q={q}
                    idx={idx}
                    isDone={completed.has(q.id)}
                    isBookmarked={bookmarked.has(q.id)}
                    isExpanded={expandedId === q.id}
                    isRevealed={revealed.has(q.id)}
                    conf={confidence[q.id]}
                    blindMode={blindMode}
                    searchQuery={query}
                    activeTag={tagFilter}
                    onPickTag={(kw) => {
                      setTagFilter((cur) => (cur && cur.toLowerCase() === kw.toLowerCase() ? null : kw));
                      trackEvent("tag_picked", { tag: kw });
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    onToggleExpand={() => setExpandedId(expandedId === q.id ? null : q.id)}
                    onToggleComplete={(e) => toggleComplete(q.id, e?.shiftKey)}
                    onToggleBookmark={() => toggleBookmark(q.id)}
                    onToggleReveal={() => toggleReveal(q.id)}
                    onSetConf={(c) => setConf(q.id, c)}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* FINAL TIPS */}
        <div style={{
          marginTop: "32px",
          padding: "20px",
          background: "linear-gradient(135deg, var(--bg-surface) 0%, var(--bg-surface-2) 100%)",
          border: "1px solid var(--border-default)",
          borderLeft: "3px solid var(--accent-red)",
          borderRadius: "6px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <Target size={16} color="var(--accent-red)" />
            <span style={{ color: "var(--accent-red)", fontWeight: 700, letterSpacing: "0.1em", fontSize: "13px" }}>
              FINAL PRE-INTERVIEW CHECKLIST
            </span>
          </div>
          <ul style={{ color: "var(--text-secondary)", fontSize: "13px", lineHeight: 1.8, margin: 0, paddingLeft: "20px" }}>
            <li>Be ready to draw the request path on a whiteboard — browser → DNS → CDN → LB → app → DB, with where caches/auth/CORS fit in.</li>
            <li>For any answer, end with <strong style={{ color: "var(--accent-green)" }}>trade-offs</strong>. "It depends" is fine if you explain what it depends on.</li>
            <li>Security: know the OWASP top hits cold — XSS, CSRF, SQLi, IDOR, SSRF, broken auth. One real example for each.</li>
            <li>Auth: be able to compare sessions vs JWT vs OAuth in 60 seconds, and name one failure mode of each in production.</li>
            <li>Front-end: know the render pipeline (parse → DOM → layout → paint → composite) and where Virtual DOM fits. Explain event delegation and the event loop.</li>
            <li>If you don't know — say "I don't know, but I'd start by…" and reason out loud. Interviewers love that.</li>
            <li>Questions for them: what's your auth story? how do you handle migrations? SSR or SPA? how do you ship to prod?</li>
            <li style={{ color: "var(--accent-red)" }}>Sleep. Don't cram for 12 hours. 7h of sleep &gt; 2 more questions memorized.</li>
          </ul>
        </div>
        </>}

        <footer style={{
          marginTop: "24px",
          padding: "16px 0",
          borderTop: "1px solid var(--border-subtle)",
          color: "var(--text-faint)",
          fontSize: "11px",
          textAlign: "center",
        }}>
          {QUESTIONS.length} questions · {Object.keys(LEVELS).length} levels · {Object.keys(TOPICS).length} topics
          <br />
          <span className="cursor">▊</span> Created by{" "}
          <span style={{ color: "var(--text-secondary)" }}>Andrei</span> ·{" "}
          <a
            href="https://t.me/Suslicke"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--accent-blue)", textDecoration: "none" }}
          >
            @Suslicke
          </a>
        </footer>
      </div>

      {/* ============== CONSENT BANNER ============== */}
      {consent === "pending" && (
        <div
          role="dialog"
          aria-label="Cookie consent"
          aria-live="polite"
          style={{
            position: "fixed",
            bottom: "16px",
            left: "16px",
            right: "16px",
            maxWidth: "560px",
            margin: "0 auto",
            background: "var(--bg-surface)",
            border: "1px solid var(--border-default)",
            borderLeft: "3px solid var(--accent-blue)",
            borderRadius: "6px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
            padding: "14px 16px",
            zIndex: 50,
            display: "flex",
            gap: "12px",
            alignItems: "flex-start",
          }}
        >
          <div style={{
            flexShrink: 0,
            width: "32px",
            height: "32px",
            borderRadius: "4px",
            background: "color-mix(in srgb, var(--accent-blue) 12%, transparent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--accent-blue)",
          }}>
            <Cookie size={16} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "4px" }}>
              We use cookies
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.6, marginBottom: "10px" }}>
              Google Analytics tracks how this guide is used — searches, progress, and general device info. If you set a name, it's attached so you can see your own stats. No ads. You can change your mind later.
            </div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button
                onClick={() => updateConsent("granted")}
                style={{
                  background: "var(--accent-blue)",
                  color: "var(--bg-app)",
                  border: "1px solid var(--accent-blue)",
                  padding: "5px 12px",
                  borderRadius: "3px",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontSize: "11px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Accept
              </button>
              <button
                onClick={() => updateConsent("denied")}
                style={{
                  background: "transparent",
                  color: "var(--text-muted)",
                  border: "1px solid var(--border-default)",
                  padding: "5px 12px",
                  borderRadius: "3px",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontSize: "11px",
                  fontWeight: 500,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============== HIGHLIGHT HELPER ==============
// Case-insensitive substring highlight. Uses indexOf (no regex) so user
// input never needs escaping. Preserves original casing.
function highlight(text, needle) {
  const n = (needle || "").trim();
  if (!n) return text;
  const lower = text.toLowerCase();
  const low = n.toLowerCase();
  const parts = [];
  let i = 0;
  let key = 0;
  while (i < text.length) {
    const hit = lower.indexOf(low, i);
    if (hit === -1) { parts.push(text.slice(i)); break; }
    if (hit > i) parts.push(text.slice(i, hit));
    parts.push(
      <mark
        key={key++}
        className="search-hit"
        style={{ background: "color-mix(in srgb, var(--accent-blue) 28%, transparent)", color: "inherit", padding: "0 2px", borderRadius: "2px" }}
      >
        {text.slice(hit, hit + n.length)}
      </mark>
    );
    i = hit + n.length;
  }
  return parts;
}

// ============== QUESTION CARD ==============
function QuestionCard({
  q, idx, isDone, isBookmarked, isExpanded, isRevealed, conf, blindMode,
  onToggleExpand, onToggleComplete, onToggleBookmark, onToggleReveal, onSetConf,
  searchQuery, activeTag, onPickTag,
}) {
  const lvl = LEVELS[q.level];
  const showAnswer = !blindMode || isRevealed;

  return (
    <div
      id={`q-${q.id}`}
      className="card-enter"
      style={{
        background: "var(--bg-surface)",
        border: `1px solid ${isExpanded ? lvl.color + "66" : "var(--border-default)"}`,
        borderLeft: `3px solid ${lvl.color}`,
        borderRadius: "6px",
        scrollMarginTop: "80px",
        overflow: "hidden",
        opacity: isDone ? 0.6 : 1,
        transition: "all 0.2s",
      }}
    >
      <div
        onClick={onToggleExpand}
        style={{
          padding: "14px 16px",
          cursor: "pointer",
          display: "flex",
          alignItems: "flex-start",
          gap: "12px",
          userSelect: "none",
        }}
      >
        <div style={{ color: "var(--text-muted)", fontSize: "11px", paddingTop: "3px", fontVariantNumeric: "tabular-nums", minWidth: "32px" }}>
          #{String(idx + 1).padStart(3, "0")}
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); onToggleComplete(e); }}
          title={isDone ? "Mark as not done (Shift+click for range)" : "Mark as done (Shift+click for range)"}
          style={{
            background: isDone ? lvl.color : "transparent",
            border: `1.5px solid ${isDone ? lvl.color : "var(--text-faint)"}`,
            borderRadius: "3px",
            width: "18px", height: "18px",
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 0,
            marginTop: "2px",
            flexShrink: 0,
          }}
          aria-label={isDone ? "Mark as not done" : "Mark as done"}
        >
          {isDone && <Check size={12} color="var(--bg-app)" strokeWidth={3} />}
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center", marginBottom: "6px" }}>
            <span style={{
              fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em",
              color: lvl.color, padding: "2px 6px",
              border: `1px solid ${lvl.color}55`,
              borderRadius: "3px",
              background: `${lvl.color}15`,
            }}>{lvl.label}</span>
            <span style={{
              fontSize: "10px", color: "var(--text-muted)",
              padding: "2px 6px",
              border: "1px solid var(--border-default)",
              borderRadius: "3px",
            }}>{TOPICS[q.topic]}</span>
            {q.level === "tricky" && (
              <span style={{ fontSize: "10px", color: "var(--accent-red)", display: "flex", alignItems: "center", gap: "3px" }}>
                <Zap size={10} /> gotcha
              </span>
            )}
            {conf && (
              <span style={{
                fontSize: "10px",
                color: conf === "easy" ? "var(--accent-green)" : conf === "medium" ? "var(--accent-amber)" : "var(--accent-red)",
                padding: "2px 6px",
                borderRadius: "3px",
                background: "var(--bg-app)",
              }}>{conf}</span>
            )}
          </div>
          <div style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: "15px",
            fontWeight: 500,
            color: "var(--text-primary)",
            lineHeight: 1.45,
            textDecoration: isDone ? "line-through" : "none",
            textDecorationColor: "var(--text-faint)",
          }}>
            {highlight(q.q, searchQuery)}
          </div>
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); onToggleBookmark(); }}
          style={{
            background: "none", border: "none",
            color: isBookmarked ? "var(--accent-amber)" : "var(--text-faint)",
            cursor: "pointer", padding: "2px",
            fontSize: "18px",
            lineHeight: 1,
          }}
          title="bookmark"
          aria-label={isBookmarked ? "Remove bookmark" : "Bookmark"}
        >
          ⚑
        </button>

        <div style={{ color: "var(--text-muted)", paddingTop: "4px" }}>
          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </div>
      </div>

      {isExpanded && (
        <div style={{ padding: "0 16px 16px 62px", borderTop: "1px solid var(--border-subtle)" }}>
          {!showAnswer ? (
            <div style={{ padding: "24px 0", textAlign: "center" }}>
              <div style={{ color: "var(--text-muted)", fontSize: "13px", marginBottom: "12px" }}>
                💭 Think about your answer first, then reveal.
              </div>
              <button
                onClick={onToggleReveal}
                style={{
                  background: "transparent",
                  border: `1px solid ${lvl.color}`,
                  color: lvl.color,
                  padding: "8px 20px",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontSize: "12px",
                  fontWeight: 600,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                reveal answer
              </button>
            </div>
          ) : (
            <>
              <div style={{
                whiteSpace: "pre-wrap",
                fontSize: "13.5px",
                lineHeight: 1.75,
                color: "var(--text-secondary)",
                padding: "12px 0",
              }}>
                {highlight(q.a, searchQuery)}
              </div>

              {q.keywords && (
                <div style={{
                  display: "flex", flexWrap: "wrap", gap: "6px",
                  marginTop: "10px", paddingTop: "10px",
                  borderTop: "1px dashed var(--border-default)",
                }}>
                  {q.keywords.map((kw) => {
                    const isActive = activeTag && activeTag.toLowerCase() === kw.toLowerCase();
                    return (
                      <button
                        key={kw}
                        onClick={(e) => { e.stopPropagation(); onPickTag(kw); }}
                        title={isActive ? `Filtering by #${kw} — click to clear` : `Filter by #${kw}`}
                        style={{
                          fontSize: "10px",
                          color: isActive ? "var(--bg-app)" : "var(--accent-blue)",
                          background: isActive ? "var(--accent-blue)" : "var(--bg-app)",
                          border: "1px solid color-mix(in srgb, var(--accent-blue) 40%, transparent)",
                          borderRadius: "10px",
                          padding: "2px 8px",
                          cursor: "pointer",
                          fontFamily: "inherit",
                          fontWeight: 500,
                        }}
                      >
                        #{kw}
                      </button>
                    );
                  })}
                </div>
              )}

              <div style={{
                marginTop: "14px",
                paddingTop: "14px",
                borderTop: "1px solid var(--border-subtle)",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                flexWrap: "wrap",
              }}>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  how did it go?
                </span>
                {["easy", "medium", "hard"].map((c) => {
                  const cColor = c === "easy" ? "var(--accent-green)" : c === "medium" ? "var(--accent-amber)" : "var(--accent-red)";
                  const active = conf === c;
                  return (
                    <button
                      key={c}
                      onClick={() => onSetConf(c)}
                      style={{
                        background: active ? cColor + "20" : "transparent",
                        border: `1px solid ${active ? cColor : "var(--border-default)"}`,
                        color: active ? cColor : "var(--text-muted)",
                        padding: "4px 12px",
                        borderRadius: "3px",
                        cursor: "pointer",
                        fontFamily: "inherit",
                        fontSize: "11px",
                        fontWeight: 500,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {c}
                    </button>
                  );
                })}
                {blindMode && (
                  <button
                    onClick={onToggleReveal}
                    style={{
                      marginLeft: "auto",
                      background: "transparent",
                      border: "none",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      fontSize: "11px",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <EyeOff size={12} /> hide again
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ============== HELPERS ==============
const selectStyle = {
  background: "var(--bg-app)",
  color: "var(--text-secondary)",
  border: "1px solid var(--border-default)",
  borderRadius: "4px",
  padding: "5px 8px",
  fontFamily: "inherit",
  fontSize: "12px",
  cursor: "pointer",
};

const toggleLabelStyle = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  color: "var(--text-muted)",
  fontSize: "12px",
  cursor: "pointer",
  userSelect: "none",
};

const btnStyle = {
  background: "transparent",
  border: "1px solid var(--border-default)",
  color: "var(--text-muted)",
  padding: "5px 10px",
  borderRadius: "4px",
  cursor: "pointer",
  fontFamily: "inherit",
  fontSize: "11px",
  display: "flex",
  alignItems: "center",
  gap: "4px",
};

function StatCard({ label, value, accent, sub, icon }) {
  return (
    <div style={{
      background: "var(--bg-surface)",
      border: "1px solid var(--border-default)",
      borderTop: `2px solid ${accent}`,
      borderRadius: "4px",
      padding: "12px 14px",
    }}>
      <div style={{
        fontSize: "10px",
        color: "var(--text-muted)",
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        marginBottom: "6px",
        display: "flex",
        alignItems: "center",
        gap: "4px",
      }}>
        {icon}{label}
      </div>
      <div style={{
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: "28px",
        fontWeight: 700,
        color: accent,
        lineHeight: 1,
        fontVariantNumeric: "tabular-nums",
      }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>{sub}</div>}
    </div>
  );
}
