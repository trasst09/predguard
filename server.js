const http = require("http");
const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const crypto = require("crypto");

const HOST = process.env.HOST || "127.0.0.1";
const PORT = Number(process.env.PORT || 3000);
const ROOT_DIR = __dirname;
const DATA_DIR = path.join(ROOT_DIR, "data");
const USERS_PATH = path.join(DATA_DIR, "users.json");
const SESSION_COOKIE = "pg_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 12;
const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const useSupabase = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_SERVICE_ROLE_KEY);

const publicRoutes = new Set(["/index.html"]);
const protectedRoutes = new Set([
  "/dashboard.html",
  "/onboarding.html",
  "/missions.html",
  "/training.html",
  "/reporting.html",
  "/leaderboard.html",
  "/roadmap.html",
  "/account.html",
  "/admin.html"
]);
const adminRoutes = new Set(["/admin.html"]);

const aliasMap = new Map([
  ["/", "/index.html"],
  ["/dashboard", "/dashboard.html"],
  ["/onboarding", "/onboarding.html"],
  ["/missions", "/missions.html"],
  ["/training", "/training.html"],
  ["/reporting", "/reporting.html"],
  ["/leaderboard", "/leaderboard.html"],
  ["/roadmap", "/roadmap.html"],
  ["/account", "/account.html"],
  ["/admin", "/admin.html"]
]);

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".png": "image/png",
  ".sql": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml"
};

const sessions = new Map();
let userStore = null;
let writeQueue = Promise.resolve();

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function getNextRole(role) {
  const roles = [
    "Spotter / Tipster",
    "Decoy / Support",
    "Verifier / Moderator",
    "Officer / LE Partner"
  ];
  const index = roles.indexOf(role);
  if (index === -1 || index === roles.length - 1) {
    return roles[roles.length - 1];
  }

  return roles[index + 1];
}

function sanitizeUser(user) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    region: user.region,
    verificationStatus: user.verificationStatus,
    points: user.points,
    readinessScore: user.readinessScore,
    nextRole: user.nextRole || getNextRole(user.role),
    isAdmin: Boolean(user.isAdmin),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    lastLoginAt: user.lastLoginAt || null
  };
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(JSON.stringify(payload));
}

function sendRedirect(response, location) {
  response.writeHead(302, { Location: location });
  response.end();
}

function setSecurityHeaders(response) {
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("X-Frame-Options", "DENY");
  response.setHeader("Referrer-Policy", "same-origin");
}

async function parseBody(request) {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  if (!chunks.length) {
    return {};
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new Error("Invalid JSON body.");
  }
}

function parseCookies(header) {
  return String(header || "")
    .split(";")
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .reduce((all, entry) => {
      const [key, ...rest] = entry.split("=");
      all[key] = decodeURIComponent(rest.join("="));
      return all;
    }, {});
}

function createSession(response, userId) {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = Date.now() + SESSION_TTL_MS;
  sessions.set(token, { userId, expiresAt });
  response.setHeader(
    "Set-Cookie",
    `${SESSION_COOKIE}=${token}; HttpOnly; Path=/; Max-Age=${Math.floor(
      SESSION_TTL_MS / 1000
    )}; SameSite=Strict`
  );
}

function clearSession(response, request) {
  const cookies = parseCookies(request.headers.cookie);
  if (cookies[SESSION_COOKIE]) {
    sessions.delete(cookies[SESSION_COOKIE]);
  }

  response.setHeader(
    "Set-Cookie",
    `${SESSION_COOKIE}=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict`
  );
}

function resolvePath(urlPath) {
  const canonical = aliasMap.get(urlPath) || urlPath;
  if (canonical === "/") {
    return "/index.html";
  }

  return canonical;
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const digest = crypto.pbkdf2Sync(password, salt, 310000, 32, "sha256").toString("hex");
  return { salt, digest };
}

function verifyPassword(password, user) {
  const { digest } = hashPassword(password, user.passwordSalt);
  const left = Buffer.from(digest, "hex");
  const right = Buffer.from(user.passwordHash, "hex");

  if (left.length !== right.length) {
    return false;
  }

  return crypto.timingSafeEqual(left, right);
}

function makeSeedUser(overrides) {
  const password = overrides.password;
  const { salt, digest } = hashPassword(password);
  const now = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    email: normalizeEmail(overrides.email),
    displayName: overrides.displayName,
    region: overrides.region,
    role: overrides.role,
    verificationStatus: overrides.verificationStatus,
    points: overrides.points,
    readinessScore: overrides.readinessScore,
    nextRole: getNextRole(overrides.role),
    isAdmin: Boolean(overrides.isAdmin),
    passwordSalt: salt,
    passwordHash: digest,
    createdAt: now,
    updatedAt: now,
    lastLoginAt: null
  };
}

async function ensureLocalStore() {
  await fsp.mkdir(DATA_DIR, { recursive: true });

  if (!fs.existsSync(USERS_PATH)) {
    const seed = {
      users: [
        makeSeedUser({
          email: "admin@predguard.local",
          password: "ChangeMe!123",
          displayName: "Control Admin",
          region: "United States / West",
          role: "Verifier / Moderator",
          verificationStatus: "Officer path approved",
          points: 2500,
          readinessScore: 98,
          isAdmin: true
        }),
        makeSeedUser({
          email: "guardian@predguard.local",
          password: "Guardian123!",
          displayName: "Maya",
          region: "Bay Area, CA",
          role: "Spotter / Tipster",
          verificationStatus: "Phone + ID complete",
          points: 1420,
          readinessScore: 74,
          isAdmin: false
        })
      ]
    };

    await fsp.writeFile(USERS_PATH, JSON.stringify(seed, null, 2));
  }
}

async function readLocalUsers() {
  if (userStore) {
    return userStore;
  }

  await ensureLocalStore();
  const raw = await fsp.readFile(USERS_PATH, "utf8");
  const parsed = JSON.parse(raw);
  userStore = parsed.users || [];
  return userStore;
}

async function saveLocalUsers(users) {
  userStore = users;
  writeQueue = writeQueue.then(() =>
    fsp.writeFile(USERS_PATH, JSON.stringify({ users }, null, 2), "utf8")
  );
  return writeQueue;
}

function buildDefaultProfile({ id, email, displayName, region, isAdmin }) {
  const now = new Date().toISOString();
  return {
    id,
    email,
    displayName,
    region,
    role: isAdmin ? "Verifier / Moderator" : "Spotter / Tipster",
    verificationStatus: isAdmin ? "Officer path approved" : "Email verified / ID pending",
    points: isAdmin ? 2000 : 100,
    readinessScore: isAdmin ? 98 : 35,
    nextRole: isAdmin ? "Officer / LE Partner" : "Decoy / Support",
    isAdmin,
    createdAt: now,
    updatedAt: now,
    lastLoginAt: null
  };
}

function mapSupabaseProfile(record) {
  if (!record) {
    return null;
  }

  return {
    id: record.id,
    email: record.email,
    displayName: record.display_name,
    role: record.role,
    region: record.region,
    verificationStatus: record.verification_status,
    points: record.points,
    readinessScore: record.readiness_score,
    nextRole: getNextRole(record.role),
    isAdmin: Boolean(record.is_admin),
    createdAt: record.created_at,
    updatedAt: record.updated_at,
    lastLoginAt: record.last_login_at
  };
}

function profileToSupabaseRecord(user) {
  return {
    id: user.id,
    email: user.email,
    display_name: user.displayName,
    role: user.role,
    region: user.region,
    verification_status: user.verificationStatus,
    points: user.points,
    readiness_score: user.readinessScore,
    is_admin: user.isAdmin,
    last_login_at: user.lastLoginAt
  };
}

function normalizeUpstreamError(payload, fallbackMessage) {
  if (!payload) {
    return fallbackMessage;
  }

  return (
    payload.msg ||
    payload.message ||
    payload.error_description ||
    payload.error ||
    fallbackMessage
  );
}

async function supabaseRequest(endpoint, options = {}) {
  const key = options.serviceRole ? SUPABASE_SERVICE_ROLE_KEY : SUPABASE_ANON_KEY;
  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(options.headers || {})
  };
  const response = await fetch(`${SUPABASE_URL}${endpoint}`, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : null;

  if (!response.ok) {
    throw new Error(
      normalizeUpstreamError(payload, `Supabase request failed with status ${response.status}.`)
    );
  }

  return payload;
}

async function supabaseUpdateAuthUser(userId, attributes) {
  try {
    return await supabaseRequest(`/auth/v1/admin/users/${userId}`, {
      method: "PUT",
      serviceRole: true,
      body: attributes
    });
  } catch (error) {
    const message = String(error.message || "");
    if (!message.includes("405")) {
      throw error;
    }

    return supabaseRequest(`/auth/v1/admin/users/${userId}`, {
      method: "PATCH",
      serviceRole: true,
      body: attributes
    });
  }
}

async function supabaseGetProfileById(userId) {
  const rows = await supabaseRequest(
    `/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=*`,
    {
      serviceRole: true
    }
  );

  return mapSupabaseProfile(rows[0]);
}

async function supabaseHasAdminProfile() {
  const rows = await supabaseRequest("/rest/v1/profiles?is_admin=is.true&select=id&limit=1", {
    serviceRole: true
  });

  return rows.length > 0;
}

async function supabaseUpsertProfile(user) {
  const rows = await supabaseRequest("/rest/v1/profiles", {
    method: "POST",
    serviceRole: true,
    headers: {
      Prefer: "resolution=merge-duplicates,return=representation"
    },
    body: profileToSupabaseRecord(user)
  });

  return mapSupabaseProfile(Array.isArray(rows) ? rows[0] : rows);
}

async function supabasePatchProfile(userId, updates) {
  const rows = await supabaseRequest(`/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}`, {
    method: "PATCH",
    serviceRole: true,
    headers: {
      Prefer: "return=representation"
    },
    body: updates
  });

  return mapSupabaseProfile(Array.isArray(rows) ? rows[0] : rows);
}

async function supabaseAuthenticateUser(email, password) {
  const payload = await supabaseRequest("/auth/v1/token?grant_type=password", {
    method: "POST",
    body: {
      email,
      password
    }
  });
  const authUser = payload.user;

  if (!authUser?.id) {
    throw new Error("Supabase did not return a user record.");
  }

  let profile = await supabaseGetProfileById(authUser.id);

  if (!profile) {
    const defaultProfile = buildDefaultProfile({
      id: authUser.id,
      email: normalizeEmail(authUser.email),
      displayName: authUser.user_metadata?.displayName || authUser.user_metadata?.name || "Guardian",
      region: authUser.user_metadata?.region || "United States",
      isAdmin: Boolean(authUser.app_metadata?.is_admin)
    });
    profile = await supabaseUpsertProfile({
      ...defaultProfile,
      lastLoginAt: new Date().toISOString()
    });
  } else {
    profile = await supabasePatchProfile(authUser.id, {
      last_login_at: new Date().toISOString()
    });
  }

  return profile;
}

async function registerSupabaseUser({ displayName, email, region, password }) {
  const shouldPromoteToAdmin = !(await supabaseHasAdminProfile());
  const created = await supabaseRequest("/auth/v1/admin/users", {
    method: "POST",
    serviceRole: true,
    body: {
      email,
      password,
      email_confirm: true,
      user_metadata: {
        displayName,
        region
      },
      app_metadata: {
        is_admin: shouldPromoteToAdmin
      }
    }
  });
  const authUser = created.user || created;

  if (!authUser?.id) {
    throw new Error("Supabase did not return a user id.");
  }

  await supabaseUpsertProfile({
    ...buildDefaultProfile({
      id: authUser.id,
      email,
      displayName,
      region,
      isAdmin: shouldPromoteToAdmin
    }),
    lastLoginAt: new Date().toISOString()
  });

  return supabaseAuthenticateUser(email, password);
}

async function listSupabaseUsers() {
  const rows = await supabaseRequest("/rest/v1/profiles?select=*&order=display_name.asc", {
    serviceRole: true
  });

  return rows.map(mapSupabaseProfile);
}

async function updateSupabaseUserProfile(userId, updates) {
  return supabasePatchProfile(userId, {
    display_name: updates.displayName,
    region: updates.region
  });
}

async function updateSupabasePassword(userId, email, currentPassword, newPassword) {
  await supabaseAuthenticateUser(email, currentPassword);
  await supabaseUpdateAuthUser(userId, {
    password: newPassword
  });
}

async function updateSupabaseAdminUser(userId, updates) {
  await supabaseUpdateAuthUser(userId, {
    app_metadata: {
      is_admin: updates.isAdmin
    }
  });

  return supabasePatchProfile(userId, {
    role: updates.role,
    verification_status: updates.verificationStatus,
    points: updates.points,
    is_admin: updates.isAdmin
  });
}

async function getLocalUserById(userId) {
  const users = await readLocalUsers();
  const user = users.find((entry) => entry.id === userId);
  return user ? sanitizeUser(user) : null;
}

async function authenticateLocalUser(email, password) {
  const users = await readLocalUsers();
  const user = users.find((entry) => entry.email === email);

  if (!user || !verifyPassword(password, user)) {
    throw new Error("Invalid email or password.");
  }

  user.lastLoginAt = new Date().toISOString();
  user.updatedAt = user.lastLoginAt;
  await saveLocalUsers(users);
  return sanitizeUser(user);
}

async function registerLocalUser({ displayName, email, region, password }) {
  const users = await readLocalUsers();
  if (users.some((entry) => entry.email === email)) {
    throw new Error("An account with that email already exists.");
  }

  const { salt, digest } = hashPassword(password);
  const now = new Date().toISOString();
  const user = {
    id: crypto.randomUUID(),
    email,
    displayName,
    region,
    role: "Spotter / Tipster",
    verificationStatus: "Email verified / ID pending",
    points: 100,
    readinessScore: 35,
    nextRole: "Decoy / Support",
    isAdmin: false,
    passwordSalt: salt,
    passwordHash: digest,
    createdAt: now,
    updatedAt: now,
    lastLoginAt: now
  };

  users.push(user);
  await saveLocalUsers(users);
  return sanitizeUser(user);
}

async function updateLocalUserProfile(userId, updates) {
  const users = await readLocalUsers();
  const user = users.find((entry) => entry.id === userId);

  if (!user) {
    throw new Error("Account not found.");
  }

  user.displayName = updates.displayName;
  user.region = updates.region;
  user.updatedAt = new Date().toISOString();
  await saveLocalUsers(users);
  return sanitizeUser(user);
}

async function updateLocalPassword(userId, currentPassword, newPassword) {
  const users = await readLocalUsers();
  const user = users.find((entry) => entry.id === userId);

  if (!user || !verifyPassword(currentPassword, user)) {
    throw new Error("Current password is incorrect.");
  }

  const { salt, digest } = hashPassword(newPassword);
  user.passwordSalt = salt;
  user.passwordHash = digest;
  user.updatedAt = new Date().toISOString();
  await saveLocalUsers(users);
}

async function listLocalUsers() {
  const users = await readLocalUsers();
  return users.map(sanitizeUser);
}

async function updateLocalAdminUser(userId, updates) {
  const users = await readLocalUsers();
  const user = users.find((entry) => entry.id === userId);

  if (!user) {
    throw new Error("User not found.");
  }

  user.role = updates.role;
  user.verificationStatus = updates.verificationStatus;
  user.points = updates.points;
  user.isAdmin = updates.isAdmin;
  user.nextRole = getNextRole(user.role);
  user.updatedAt = new Date().toISOString();
  await saveLocalUsers(users);
  return sanitizeUser(user);
}

async function ensureDataProvider() {
  if (useSupabase) {
    return;
  }

  await ensureLocalStore();
}

async function registerUser(payload) {
  return useSupabase ? registerSupabaseUser(payload) : registerLocalUser(payload);
}

async function authenticateUser(email, password) {
  return useSupabase
    ? supabaseAuthenticateUser(email, password)
    : authenticateLocalUser(email, password);
}

async function getUserById(userId) {
  return useSupabase ? supabaseGetProfileById(userId) : getLocalUserById(userId);
}

async function updateUserProfile(userId, updates) {
  return useSupabase
    ? updateSupabaseUserProfile(userId, updates)
    : updateLocalUserProfile(userId, updates);
}

async function updateUserPassword(user, currentPassword, newPassword) {
  if (useSupabase) {
    return updateSupabasePassword(user.id, user.email, currentPassword, newPassword);
  }

  return updateLocalPassword(user.id, currentPassword, newPassword);
}

async function listUsers() {
  return useSupabase ? listSupabaseUsers() : listLocalUsers();
}

async function updateAdminUser(userId, updates) {
  return useSupabase ? updateSupabaseAdminUser(userId, updates) : updateLocalAdminUser(userId, updates);
}

async function getSessionUser(request) {
  const cookies = parseCookies(request.headers.cookie);
  const token = cookies[SESSION_COOKIE];

  if (!token) {
    return null;
  }

  const session = sessions.get(token);
  if (!session) {
    return null;
  }

  if (session.expiresAt <= Date.now()) {
    sessions.delete(token);
    return null;
  }

  const user = await getUserById(session.userId);

  if (!user) {
    sessions.delete(token);
    return null;
  }

  return user;
}

async function requireUser(request, response) {
  const user = await getSessionUser(request);
  if (!user) {
    sendJson(response, 401, { error: "Authentication required." });
    return null;
  }

  return user;
}

async function requireAdmin(request, response) {
  const user = await requireUser(request, response);
  if (!user) {
    return null;
  }

  if (!user.isAdmin) {
    sendJson(response, 403, { error: "Administrator access required." });
    return null;
  }

  return user;
}

async function handleAuthRegister(request, response) {
  const body = await parseBody(request);
  const displayName = String(body.displayName || "").trim();
  const email = normalizeEmail(body.email);
  const region = String(body.region || "").trim();
  const password = String(body.password || "");

  if (!displayName || !email || !region || password.length < 8) {
    sendJson(response, 400, {
      error: "Display name, email, region, and a password with at least 8 characters are required."
    });
    return;
  }

  const user = await registerUser({ displayName, email, region, password });
  createSession(response, user.id);
  sendJson(response, 201, { user });
}

async function handleAuthLogin(request, response) {
  const body = await parseBody(request);
  const email = normalizeEmail(body.email);
  const password = String(body.password || "");

  if (!email || !password) {
    sendJson(response, 400, { error: "Email and password are required." });
    return;
  }

  const user = await authenticateUser(email, password);
  createSession(response, user.id);
  sendJson(response, 200, { user });
}

async function handleAccountUpdate(request, response, currentUser) {
  const body = await parseBody(request);
  const displayName = String(body.displayName || "").trim();
  const region = String(body.region || "").trim();

  if (!displayName || !region) {
    sendJson(response, 400, { error: "Display name and region are required." });
    return;
  }

  const user = await updateUserProfile(currentUser.id, { displayName, region });
  sendJson(response, 200, { user });
}

async function handlePasswordUpdate(request, response, currentUser) {
  const body = await parseBody(request);
  const currentPassword = String(body.currentPassword || "");
  const newPassword = String(body.newPassword || "");

  if (newPassword.length < 8) {
    sendJson(response, 400, { error: "New password must be at least 8 characters." });
    return;
  }

  await updateUserPassword(currentUser, currentPassword, newPassword);
  sendJson(response, 200, { ok: true });
}

async function handleAdminUserUpdate(request, response, userId) {
  const body = await parseBody(request);
  const points = Number(body.points);

  if (!Number.isFinite(points) || points < 0) {
    sendJson(response, 400, { error: "Points must be a non-negative number." });
    return;
  }

  const user = await updateAdminUser(userId, {
    role: String(body.role || ""),
    verificationStatus: String(body.verificationStatus || ""),
    points: Math.round(points),
    isAdmin: Boolean(body.isAdmin)
  });
  sendJson(response, 200, { user });
}

async function handleApi(request, response, urlPath) {
  if (urlPath === "/api/auth/session" && request.method === "GET") {
    const user = await getSessionUser(request);
    if (!user) {
      sendJson(response, 200, {
        authenticated: false,
        provider: useSupabase ? "supabase" : "local"
      });
      return;
    }

    sendJson(response, 200, {
      authenticated: true,
      provider: useSupabase ? "supabase" : "local",
      user
    });
    return;
  }

  if (urlPath === "/api/auth/register" && request.method === "POST") {
    await handleAuthRegister(request, response);
    return;
  }

  if (urlPath === "/api/auth/login" && request.method === "POST") {
    await handleAuthLogin(request, response);
    return;
  }

  if (urlPath === "/api/auth/logout" && request.method === "POST") {
    clearSession(response, request);
    sendJson(response, 200, { ok: true });
    return;
  }

  if (urlPath === "/api/account" && request.method === "GET") {
    const user = await requireUser(request, response);
    if (!user) {
      return;
    }

    sendJson(response, 200, { user });
    return;
  }

  if (urlPath === "/api/account" && request.method === "PATCH") {
    const user = await requireUser(request, response);
    if (!user) {
      return;
    }

    await handleAccountUpdate(request, response, user);
    return;
  }

  if (urlPath === "/api/account/password" && request.method === "PATCH") {
    const user = await requireUser(request, response);
    if (!user) {
      return;
    }

    await handlePasswordUpdate(request, response, user);
    return;
  }

  if (urlPath === "/api/admin/users" && request.method === "GET") {
    const user = await requireAdmin(request, response);
    if (!user) {
      return;
    }

    const users = await listUsers();
    sendJson(response, 200, { users });
    return;
  }

  if (urlPath.startsWith("/api/admin/users/") && request.method === "PATCH") {
    const user = await requireAdmin(request, response);
    if (!user) {
      return;
    }

    const userId = urlPath.split("/").pop();
    await handleAdminUserUpdate(request, response, userId);
    return;
  }

  sendJson(response, 404, { error: "Route not found." });
}

async function serveFile(response, filePath) {
  const extension = path.extname(filePath);
  const contentType = contentTypes[extension] || "application/octet-stream";
  const file = await fsp.readFile(filePath);
  response.writeHead(200, { "Content-Type": contentType });
  response.end(file);
}

async function handlePage(request, response, urlPath) {
  const routePath = resolvePath(urlPath);
  const user = await getSessionUser(request);

  if (routePath === "/index.html" && user) {
    sendRedirect(response, user.isAdmin ? "/admin.html" : "/dashboard.html");
    return;
  }

  if (protectedRoutes.has(routePath) && !user) {
    sendRedirect(response, "/index.html");
    return;
  }

  if (adminRoutes.has(routePath) && user && !user.isAdmin) {
    sendRedirect(response, "/dashboard.html");
    return;
  }

  if (!publicRoutes.has(routePath) && !protectedRoutes.has(routePath)) {
    const safePath = path.normalize(routePath).replace(/^(\.\.[/\\])+/, "");
    const absolute = path.join(ROOT_DIR, safePath);

    if (!absolute.startsWith(ROOT_DIR)) {
      sendJson(response, 403, { error: "Forbidden." });
      return;
    }

    await serveFile(response, absolute);
    return;
  }

  await serveFile(response, path.join(ROOT_DIR, routePath));
}

const server = http.createServer(async (request, response) => {
  setSecurityHeaders(response);

  try {
    const url = new URL(request.url, `http://${request.headers.host || `${HOST}:${PORT}`}`);
    const pathname = url.pathname;

    if (pathname.startsWith("/api/")) {
      await handleApi(request, response, pathname);
      return;
    }

    await handlePage(request, response, pathname);
  } catch (error) {
    console.error(error);
    if (!response.headersSent) {
      sendJson(response, 500, { error: error.message || "Internal server error." });
      return;
    }

    response.end();
  }
});

ensureDataProvider()
  .then(() => {
    server.listen(PORT, HOST, () => {
      console.log(`PredatorGuard server running at http://${HOST}:${PORT}`);
      console.log(`Auth provider: ${useSupabase ? "Supabase" : "Local fallback"}`);
      if (!useSupabase) {
        console.log("Seed admin: admin@predguard.local / ChangeMe!123");
        console.log("Seed user: guardian@predguard.local / Guardian123!");
      }
    });
  })
  .catch((error) => {
    console.error("Failed to initialize auth provider.", error);
    process.exitCode = 1;
  });
