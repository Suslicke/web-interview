// Dynamically load Google Analytics when VITE_GA_ID is set at build time.
// Consent default reads from localStorage("web-analytics") — granted unless
// the user has explicitly opted out via Settings.
export function initAnalytics() {
  const id = import.meta.env.VITE_GA_ID;
  if (!id) return false;

  let savedConsent = "granted";
  try {
    if (localStorage.getItem("web-analytics") === "denied") savedConsent = "denied";
  } catch { /* ignore */ }

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };

  window.gtag("consent", "default", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: savedConsent,
    wait_for_update: 0,
  });
  window.gtag("js", new Date());
  window.gtag("config", id, { anonymize_ip: true });

  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  document.head.appendChild(s);
  return true;
}

export function trackEvent(name, params = {}) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", name, params);
}

export function setAnalyticsConsent(value) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("consent", "update", { analytics_storage: value });
}

export function setAnalyticsUser(username) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  const clean = (username || "").trim().slice(0, 64);
  if (clean) {
    window.gtag("set", "user_properties", { username: clean });
    window.gtag("set", { user_id: clean });
  } else {
    window.gtag("set", "user_properties", { username: null });
    window.gtag("set", { user_id: null });
  }
}
