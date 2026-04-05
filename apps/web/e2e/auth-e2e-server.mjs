import { randomUUID } from "node:crypto";
import { createServer } from "node:http";

const host = "127.0.0.1";
const port = Number(process.env.PORT ?? "4173");
const baseTime = new Date("2026-04-05T15:00:00.000Z");
const ownerCredentials = {
  email: "owner@example.com",
  password: "StrongPassword!123",
};
const cookieName = "pfs_session";

let currentTime = new Date(baseTime);
let sessions = new Map();

function resetState() {
  currentTime = new Date(baseTime);
  sessions = new Map();
}

function parseCookies(headerValue) {
  if (!headerValue) {
    return {};
  }

  return headerValue.split(";").reduce((cookies, entry) => {
    const [name, ...valueParts] = entry.trim().split("=");
    cookies[name] = decodeURIComponent(valueParts.join("="));
    return cookies;
  }, {});
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    request.on("data", (chunk) => chunks.push(chunk));
    request.on("end", () => {
      if (chunks.length === 0) {
        resolve(undefined);
        return;
      }

      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch (error) {
        reject(error);
      }
    });
    request.on("error", reject);
  });
}

function sessionCookie(value, maxAgeSeconds) {
  const parts = [
    `${cookieName}=${encodeURIComponent(value)}`,
    "Path=/",
    "SameSite=Strict",
    "HttpOnly",
  ];

  if (typeof maxAgeSeconds === "number") {
    parts.push(`Max-Age=${maxAgeSeconds}`);
  }

  return parts.join("; ");
}

function sendJson(response, statusCode, body, cookies = []) {
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
  };
  if (cookies.length > 0) {
    headers["Set-Cookie"] = cookies;
  }

  response.writeHead(statusCode, headers);
  response.end(JSON.stringify(body));
}

function sendHtml(response, html) {
  response.writeHead(200, {
    "Content-Type": "text/html; charset=utf-8",
  });
  response.end(html);
}

function createSession() {
  const id = randomUUID();
  const createdAt = new Date(currentTime);
  const idleExpiresAt = new Date(createdAt.getTime() + 120 * 60 * 1000);
  const expiresAt = new Date(createdAt.getTime() + 168 * 60 * 60 * 1000);
  sessions.set(id, {
    id,
    user: {
      id: "owner-1",
      email: ownerCredentials.email,
      role: "owner",
    },
    createdAt,
    idleExpiresAt,
    expiresAt,
    revoked: false,
  });
  return sessions.get(id);
}

function getValidSession(sessionId) {
  if (!sessionId) {
    return null;
  }

  const session = sessions.get(sessionId);
  if (!session || session.revoked) {
    return null;
  }

  if (session.expiresAt.getTime() <= currentTime.getTime() || session.idleExpiresAt.getTime() <= currentTime.getTime()) {
    session.revoked = true;
    return null;
  }

  return session;
}

function loginPageHtml() {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Sign In</title>
    <style>
      body { font-family: Georgia, serif; background: linear-gradient(135deg, #f5ead7, #d9e6f2); color: #1f2933; margin: 0; min-height: 100vh; display: grid; place-items: center; }
      main { width: min(420px, calc(100vw - 32px)); background: rgba(255,255,255,0.92); border: 1px solid #d7c7b0; box-shadow: 0 16px 40px rgba(31,41,51,0.12); padding: 28px; }
      h1 { margin-top: 0; font-size: 2rem; }
      label { display: block; margin: 12px 0 6px; font-weight: 700; }
      input, button { width: 100%; box-sizing: border-box; padding: 10px 12px; font: inherit; }
      button { margin-top: 16px; background: #1f4d6b; color: #fff; border: 0; cursor: pointer; }
      [data-testid="login-message"] { min-height: 1.4em; color: #7b2d26; margin: 8px 0; }
    </style>
  </head>
  <body>
    <main>
      <h1>Sign in</h1>
      <p data-testid="login-message"></p>
      <form data-testid="login-form">
        <label for="email">Email</label>
        <input id="email" data-testid="email-input" name="email" type="email" autocomplete="username" />
        <label for="password">Password</label>
        <input id="password" data-testid="password-input" name="password" type="password" autocomplete="current-password" />
        <button type="submit" data-testid="submit-button">Continue</button>
      </form>
    </main>
    <script>
      const params = new URLSearchParams(window.location.search);
      const nextPath = params.get("next") || "/dashboard";
      const reason = params.get("reason");
      const message = document.querySelector('[data-testid="login-message"]');
      const messages = {
        unauthenticated: "Please sign in to continue.",
        expired: "Your session has expired. Please sign in again.",
        logged_out: "You have been signed out."
      };
      if (reason && messages[reason]) {
        message.textContent = messages[reason];
      }

      document.querySelector('[data-testid="login-form"]').addEventListener("submit", async (event) => {
        event.preventDefault();
        message.textContent = "";
        const email = document.querySelector('[data-testid="email-input"]').value;
        const password = document.querySelector('[data-testid="password-input"]').value;
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const body = await response.json();
        if (!response.ok || !body.authenticated) {
          message.textContent = "Invalid email or password.";
          return;
        }

        window.location.assign(nextPath);
      });
    </script>
  </body>
</html>`;
}

function dashboardPageHtml({ hadSessionCookie }) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Dashboard</title>
    <style>
      body { font-family: Georgia, serif; background: #f4efe4; color: #1f2933; margin: 0; min-height: 100vh; padding: 32px; }
      main { max-width: 720px; margin: 0 auto; background: #fffdf8; border: 1px solid #d5cab8; box-shadow: 0 16px 32px rgba(31,41,51,0.1); padding: 24px; }
      button { padding: 10px 14px; font: inherit; background: #8a3b12; color: #fff; border: 0; cursor: pointer; }
      [hidden] { display: none !important; }
    </style>
  </head>
  <body>
    <main>
      <p data-testid="loading-state">Checking your session...</p>
      <section data-testid="protected-content" hidden>
        <h1>Finance Dashboard</h1>
        <p data-testid="session-user"></p>
        <button type="button" data-testid="logout-button">Sign out</button>
      </section>
    </main>
    <script>
      const hadSessionCookie = ${JSON.stringify(hadSessionCookie)};
      const protectedContent = document.querySelector('[data-testid="protected-content"]');
      const loadingState = document.querySelector('[data-testid="loading-state"]');
      const sessionUser = document.querySelector('[data-testid="session-user"]');

      async function bootstrap() {
        const response = await fetch("/api/auth/session");
        const body = await response.json();
        if (!body.authenticated) {
          const reason = hadSessionCookie ? "expired" : "unauthenticated";
          window.location.replace("/login?next=%2Fdashboard&reason=" + encodeURIComponent(reason));
          return;
        }

        sessionUser.textContent = "Signed in as " + body.user.email;
        loadingState.hidden = true;
        protectedContent.hidden = false;
      }

      document.querySelector('[data-testid="logout-button"]').addEventListener("click", async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        window.location.assign("/login?next=%2Fdashboard&reason=logged_out");
      });

      bootstrap();
    </script>
  </body>
</html>`;
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url, `http://${host}:${port}`);
  const cookies = parseCookies(request.headers.cookie);

  if (url.pathname === "/__test__/reset" && request.method === "POST") {
    resetState();
    sendJson(response, 200, { reset: true });
    return;
  }

  if (url.pathname === "/__test__/time" && request.method === "POST") {
    const body = await readBody(request);
    currentTime = new Date(body.iso);
    sendJson(response, 200, { ok: true, now: currentTime.toISOString() });
    return;
  }

  if (url.pathname === "/__test__/owner-credentials" && request.method === "GET") {
    sendJson(response, 200, ownerCredentials);
    return;
  }

  if (url.pathname === "/api/auth/login" && request.method === "POST") {
    const body = await readBody(request);
    if (!body || body.email !== ownerCredentials.email || body.password !== ownerCredentials.password) {
      sendJson(response, 401, { error: "Invalid credentials." });
      return;
    }

    const session = createSession();
    sendJson(
      response,
      200,
      {
        authenticated: true,
        user: session.user,
        session: {
          expiresAt: session.expiresAt.toISOString(),
          idleExpiresAt: session.idleExpiresAt.toISOString(),
        },
      },
      [sessionCookie(session.id)],
    );
    return;
  }

  if (url.pathname === "/api/auth/logout" && request.method === "POST") {
    const sessionId = cookies[cookieName];
    if (sessionId && sessions.has(sessionId)) {
      sessions.get(sessionId).revoked = true;
    }

    sendJson(response, 200, { loggedOut: true }, [sessionCookie("", 0)]);
    return;
  }

  if (url.pathname === "/api/auth/session" && request.method === "GET") {
    const session = getValidSession(cookies[cookieName]);
    if (!session) {
      sendJson(response, 200, { authenticated: false }, [sessionCookie("", 0)]);
      return;
    }

    sendJson(response, 200, {
      authenticated: true,
      user: session.user,
      session: {
        expiresAt: session.expiresAt.toISOString(),
        idleExpiresAt: session.idleExpiresAt.toISOString(),
      },
    });
    return;
  }

  if (url.pathname === "/" || url.pathname === "/login") {
    sendHtml(response, loginPageHtml());
    return;
  }

  if (url.pathname === "/dashboard") {
    sendHtml(response, dashboardPageHtml({ hadSessionCookie: Boolean(cookies[cookieName]) }));
    return;
  }

  response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  response.end("Not found.");
});

resetState();

server.listen(port, host, () => {
  console.log(`Auth E2E server listening on http://${host}:${port}`);
});
