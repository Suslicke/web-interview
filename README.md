# Web // Interview Drill

Interactive interview prep for full-stack web developers — **trainee → lead**, plus the tricky gotchas. Companion to my [Python](../../Python/PythonGuide) and [Message-Broker](../Message-Broker-interview-prep) guides.

## What's inside

A single-page React app that drills you on:

- **HTTP & Protocol** — request/response cycle, methods, status codes, HTTP/1.1 vs 2 vs 3, caching (ETag, Cache-Control)
- **REST & API Design** — idempotency, status code choice, versioning, evolution
- **Authentication** — sessions vs JWT, OAuth 2.0 + PKCE, refresh-token rotation, where to store tokens
- **Authorization** — RBAC vs ABAC, OPA, object-level checks, IDOR
- **CORS & Same-Origin** — preflight, `Vary: Origin`, credentials, common debugging traps
- **Web Security (OWASP)** — XSS (3 types), CSRF, SQL injection, CSP, password storage (argon2id/bcrypt), Top 10
- **Cookies & Sessions** — `HttpOnly`, `Secure`, `SameSite`
- **Django** — MTV, middleware, `select_related` vs `prefetch_related`, signals, `atomic()` + `on_commit()`, lazy QuerySets
- **FastAPI** — Pydantic, `Depends`, `async def` vs `def`, BackgroundTasks, project structure
- **Middleware** — Express, Django, FastAPI patterns
- **JavaScript** — `var`/`let`/`const`, event loop (micro/macrotasks), Promises vs async/await, `this` rules, floating-point traps
- **DOM & Browser** — render tree, reflow vs paint vs composite, critical rendering path
- **React** — hooks rules, `useEffect` pitfalls, controlled vs uncontrolled, `memo`/`useMemo`/`useCallback`, SPA vs SSR vs RSC vs SSG
- **Vue** — Vue 3 reactivity (Proxy), Composition API vs Options API
- **CSS & Layout** — Flexbox vs Grid
- **Performance** — code splitting, Core Web Vitals, slow-page debugging strategy
- **WebSockets & SSE** — when to pick which
- **Testing** — pyramid: unit / integration / e2e
- **Deployment & Ops** — Django + React production stack, zero-downtime DB migrations

## How it works

Each question card carries:

- **Level** (TRAINEE → JUNIOR → MIDDLE → SENIOR → LEAD → TRICKY)
- **Topic** tag
- **Reveal-answer** flow — *think first*, then peek
- **Confidence rating** — easy / medium / hard, used to bias the next quiz round
- **Bookmarks** — flag for last-minute review
- **Search** with `/` shortcut, with hit highlighting and a suggestions dropdown
- **Filters** by level, topic, rating
- **Quiz mode** — picks 10 questions, prioritizing your `hard` + bookmarked items

State is auto-saved to `localStorage` and exportable as JSON. Theme: dark/light, persisted.

## Quick start

```bash
npm install
npm run dev      # http://localhost:5174
npm run build    # static dist/ ready to host anywhere
npm run preview  # preview the production build
npm run deploy   # build + wrangler deploy to Cloudflare Workers
```

## Deploy to Cloudflare Workers

The repo is wired up for Cloudflare Workers via `wrangler.jsonc`:

```jsonc
{
  "name": "web-interview",
  "compatibility_date": "2025-04-01",
  "assets": {
    "directory": "./dist",
    "not_found_handling": "single-page-application"
  }
}
```

`single-page-application` makes Workers serve `index.html` for any unknown route — required for client-side routing.

First time:

```bash
npx wrangler login          # one-time browser auth
npm run deploy              # build + push to Workers
```

The Worker name (`web-interview`) becomes the subdomain: `https://web-interview.<your-account>.workers.dev`. Add a custom domain via the Cloudflare dashboard.

### Other hosts

It's a static SPA — `dist/` works on Netlify, Vercel, Cloudflare Pages, GitHub Pages, or any nginx/Caddy. The Workers config is just the one used here.

### Analytics (optional)

Set `VITE_GA_ID=G-XXXXX` in `.env.production` (or as a build-time env var) to enable Google Analytics with Consent Mode v2. Without it, the analytics module is a no-op (no network calls, no consent banner).

## File map

```
src/
  App.jsx        # the UI shell — quiz mode, filters, search, persistence
  data.js        # the question bank (LEVELS, TOPICS, QUESTIONS)
  main.jsx       # React entry, theme bootstrap, GA init
  analytics.js   # gtag loader (no-op without VITE_GA_ID)
  index.css      # theme variables, fonts, scrollbar
index.html
vite.config.js
package.json
```

To add a question, append to `QUESTIONS` in `src/data.js`. Use a fresh ID (don't renumber — that breaks anyone's saved progress). Pick a `level`, `topic` from the maps at the top, write `q` and `a`, and add 3–6 `keywords` for tags + search.

## Companion guides

- **PythonGuide** — Python language deep-dive (async, GIL, descriptors, etc.)
- **Message-Broker-interview-prep** — RabbitMQ, Kafka, Celery, queue patterns

All three share the same UI shell and quiz flow; each focuses on its own topic.

---

Built by [Andrei](https://t.me/Suslicke). Pull requests with new questions or topic ideas welcome.
