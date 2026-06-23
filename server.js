const http = require("http");
const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
const { createClient: createSupabaseClient } = require("@supabase/supabase-js");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const source = fs.readFileSync(filePath, "utf8");
  for (const rawLine of source.split(/\r?\n/u)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    if (!key || process.env[key] !== undefined) {
      continue;
    }

    let value = line.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

const ROOT_DIR = __dirname;
loadEnvFile(path.join(ROOT_DIR, ".env"));
loadEnvFile(path.join(ROOT_DIR, ".env.local"));
const HOST = process.env.HOST || "127.0.0.1";
const PORT = Number(process.env.PORT || 3000);
const SESSION_COOKIE = "pg_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 12;
const LEGAL_VERSION = "2026-06-22";
const LOCATION_PREFERENCES = new Set(["unset", "device", "manual", "declined"]);
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";
const SUPABASE_SECRET_KEY =
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const hasSupabaseConfig = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_SECRET_KEY);
const supabaseAdmin = hasSupabaseConfig
  ? createSupabaseClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;
const supabaseAuth = hasSupabaseConfig
  ? createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      }
    })
  : null;

const publicRoutes = new Set(["/index.html"]);
const protectedRoutes = new Set([
  "/dashboard.html",
  "/onboarding.html",
  "/missions.html",
  "/map.html",
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
  ["/map", "/map.html"],
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
    legalVersion: LEGAL_VERSION,
    termsAcceptedAt: null,
    privacyAcceptedAt: null,
    locationTrackingPreference: "unset",
    locationTrackingUpdatedAt: null,
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
    legalVersion: record.legal_version || LEGAL_VERSION,
    termsAcceptedAt: record.terms_accepted_at,
    privacyAcceptedAt: record.privacy_accepted_at,
    locationTrackingPreference: record.location_tracking_preference || "unset",
    locationTrackingUpdatedAt: record.location_tracking_updated_at,
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
    legal_version: user.legalVersion || LEGAL_VERSION,
    terms_accepted_at: user.termsAcceptedAt,
    privacy_accepted_at: user.privacyAcceptedAt,
    location_tracking_preference: user.locationTrackingPreference || "unset",
    location_tracking_updated_at: user.locationTrackingUpdatedAt,
    last_login_at: user.lastLoginAt
  };
}

function normalizeLocationPreference(value, fallback = "unset") {
  const normalized = String(value || "").trim().toLowerCase();
  return LOCATION_PREFERENCES.has(normalized) ? normalized : fallback;
}

function buildLegalAcceptance({ acceptedTerms, acceptedPrivacy, locationTrackingPreference }) {
  const termsAccepted = Boolean(acceptedTerms);
  const privacyAccepted = Boolean(acceptedPrivacy);
  const locationPreference = normalizeLocationPreference(locationTrackingPreference);

  return {
    acceptedTerms: termsAccepted,
    acceptedPrivacy: privacyAccepted,
    legalVersion: LEGAL_VERSION,
    termsAcceptedAt: termsAccepted ? new Date().toISOString() : null,
    privacyAcceptedAt: privacyAccepted ? new Date().toISOString() : null,
    locationTrackingPreference: locationPreference,
    locationTrackingUpdatedAt: locationPreference === "unset" ? null : new Date().toISOString()
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

function throwIfSupabaseError(error, fallbackMessage) {
  if (!error) {
    return;
  }

  throw new Error(normalizeUpstreamError(error, fallbackMessage));
}

async function supabaseUpdateAuthUser(userId, attributes) {
  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, attributes);
  throwIfSupabaseError(error, "Unable to update the Supabase auth user.");
  return data;
}

async function supabaseGetProfileById(userId) {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  throwIfSupabaseError(error, "Unable to load the Supabase profile.");
  return mapSupabaseProfile(data);
}

async function supabaseHasAdminProfile() {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("is_admin", true)
    .limit(1);

  throwIfSupabaseError(error, "Unable to check for an existing admin profile.");
  return data.length > 0;
}

async function supabaseUpsertProfile(user) {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .upsert(profileToSupabaseRecord(user))
    .select()
    .single();

  throwIfSupabaseError(error, "Unable to save the Supabase profile.");
  return mapSupabaseProfile(data);
}

async function supabasePatchProfile(userId, updates) {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select()
    .single();

  throwIfSupabaseError(error, "Unable to update the Supabase profile.");
  return mapSupabaseProfile(data);
}

async function supabaseAuthenticateUser(email, password) {
  const { data, error } = await supabaseAuth.auth.signInWithPassword({
    email,
    password
  });
  throwIfSupabaseError(error, "Invalid email or password.");
  const authUser = data.user;

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

async function registerSupabaseUser({ displayName, email, region, password, legalAcceptance }) {
  const shouldPromoteToAdmin = !(await supabaseHasAdminProfile());
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
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
  });
  throwIfSupabaseError(error, "Unable to create the Supabase auth user.");
  const authUser = data.user;

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
    legalVersion: legalAcceptance.legalVersion,
    termsAcceptedAt: legalAcceptance.termsAcceptedAt,
    privacyAcceptedAt: legalAcceptance.privacyAcceptedAt,
    locationTrackingPreference: legalAcceptance.locationTrackingPreference,
    locationTrackingUpdatedAt: legalAcceptance.locationTrackingUpdatedAt,
    lastLoginAt: new Date().toISOString()
  });

  return supabaseAuthenticateUser(email, password);
}

async function listSupabaseUsers() {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .order("display_name", { ascending: true });

  throwIfSupabaseError(error, "Unable to list Supabase users.");
  return data.map(mapSupabaseProfile);
}

async function updateSupabaseUserProfile(userId, updates) {
  const patch = {};

  if (updates.displayName !== undefined) {
    patch.display_name = updates.displayName;
  }

  if (updates.region !== undefined) {
    patch.region = updates.region;
  }

  if (updates.locationTrackingPreference !== undefined) {
    patch.location_tracking_preference = normalizeLocationPreference(updates.locationTrackingPreference);
    patch.location_tracking_updated_at =
      patch.location_tracking_preference === "unset" ? null : new Date().toISOString();
  }

  if (updates.acceptedTerms) {
    patch.terms_accepted_at = updates.termsAcceptedAt || new Date().toISOString();
  }

  if (updates.acceptedPrivacy) {
    patch.privacy_accepted_at = updates.privacyAcceptedAt || new Date().toISOString();
  }

  if (updates.acceptedTerms || updates.acceptedPrivacy) {
    patch.legal_version = LEGAL_VERSION;
  }

  return supabasePatchProfile(userId, patch);
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

async function ensureDataProvider() {
  if (hasSupabaseConfig) {
    return;
  }

  const missing = [];
  if (!SUPABASE_URL) {
    missing.push("SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL");
  }
  if (!SUPABASE_ANON_KEY) {
    missing.push("SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  }
  if (!SUPABASE_SECRET_KEY) {
    missing.push("SUPABASE_SECRET_KEY");
  }

  throw new Error(`Supabase configuration is required. Missing: ${missing.join(", ")}`);
}

async function registerUser(payload) {
  return registerSupabaseUser(payload);
}

async function authenticateUser(email, password) {
  return supabaseAuthenticateUser(email, password);
}

async function getUserById(userId) {
  return supabaseGetProfileById(userId);
}

async function updateUserProfile(userId, updates) {
  return updateSupabaseUserProfile(userId, updates);
}

async function updateUserPassword(user, currentPassword, newPassword) {
  return updateSupabasePassword(user.id, user.email, currentPassword, newPassword);
}

async function listUsers() {
  return listSupabaseUsers();
}

async function updateAdminUser(userId, updates) {
  return updateSupabaseAdminUser(userId, updates);
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
  const legalAcceptance = buildLegalAcceptance({
    acceptedTerms: body.acceptedTerms,
    acceptedPrivacy: body.acceptedPrivacy,
    locationTrackingPreference: body.locationTrackingPreference
  });

  if (!displayName || !email || !region || password.length < 8) {
    sendJson(response, 400, {
      error: "Display name, email, region, and a password with at least 8 characters are required."
    });
    return;
  }

  if (!legalAcceptance.acceptedTerms || !legalAcceptance.acceptedPrivacy) {
    sendJson(response, 400, {
      error: "You must accept the Terms of Service and Privacy Notice before creating an account."
    });
    return;
  }

  const user = await registerUser({ displayName, email, region, password, legalAcceptance });
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
  const patch = {};

  if (body.displayName !== undefined || body.region !== undefined) {
    const displayName = String(body.displayName || "").trim();
    const region = String(body.region || "").trim();

    if (!displayName || !region) {
      sendJson(response, 400, { error: "Display name and region are required." });
      return;
    }

    patch.displayName = displayName;
    patch.region = region;
  }

  if (body.acceptedTerms !== undefined || body.acceptedPrivacy !== undefined) {
    const acceptedTerms = Boolean(body.acceptedTerms);
    const acceptedPrivacy = Boolean(body.acceptedPrivacy);

    if (!acceptedTerms || !acceptedPrivacy) {
      sendJson(response, 400, {
        error: "Both Terms of Service and Privacy Notice consent checkboxes must be accepted."
      });
      return;
    }

    patch.acceptedTerms = acceptedTerms;
    patch.acceptedPrivacy = acceptedPrivacy;
  }

  if (body.locationTrackingPreference !== undefined) {
    patch.locationTrackingPreference = normalizeLocationPreference(body.locationTrackingPreference);
  }

  if (!Object.keys(patch).length) {
    sendJson(response, 400, { error: "No valid account updates were provided." });
    return;
  }

  const user = await updateUserProfile(currentUser.id, patch);
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
        provider: "supabase"
      });
      return;
    }

    sendJson(response, 200, {
      authenticated: true,
      provider: "supabase",
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
      console.log("Auth provider: Supabase");
    });
  })
  .catch((error) => {
    console.error("Failed to initialize auth provider.", error);
    process.exitCode = 1;
  });
