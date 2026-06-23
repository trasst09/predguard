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
const IDENTITY_STATUSES = new Set([
  "draft",
  "submitted",
  "in_review",
  "changes_requested",
  "approved",
  "rejected"
]);
const ID_DOCUMENT_TYPES = new Set(["unset", "drivers_license", "state_id", "passport", "other"]);
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

const publicRoutes = new Set(["/index.html", "/reset-password.html"]);
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
  ["/reset-password", "/reset-password.html"],
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

const ROLE_OPTIONS = [
  "Spotter / Tipster",
  "Decoy / Support",
  "Verifier / Moderator",
  "Officer / LE Partner"
];

const MISSION_CATALOG = [
  {
    id: "quest-shadow",
    type: "online",
    risk: "Moderate oversight",
    title: "Patrol the Shadows",
    description:
      "Monitor flagged Discord communities, document suspicious grooming patterns, and prepare moderator-ready notes.",
    location: "Remote / Pacific time",
    schedule: "Tonight, 7:00 PM",
    roles: ["Spotter", "Verifier"],
    protocol: "Evidence template required",
    minimumRole: "Spotter / Tipster",
    minReadiness: 30,
    xpReward: 120,
    readinessReward: 4,
    steps: [
      "Review the flagged channel list and confirm observation coverage.",
      "Capture timestamps, usernames, and grooming indicators in the evidence template.",
      "Submit a moderator-ready summary with links and escalation notes."
    ]
  },
  {
    id: "quest-hidden-meet",
    type: "hybrid",
    risk: "Supervisor approval",
    title: "Chapter: The Hidden Meet",
    description:
      "Coordinate remote observers, decoy support, and a law-enforcement liaison around a time-boxed meetup window.",
    location: "San Jose, CA",
    schedule: "Wednesday, 5:30 PM",
    roles: ["Decoy", "Support", "Officer"],
    protocol: "Safety briefing + live check-ins",
    minimumRole: "Decoy / Support",
    minReadiness: 55,
    xpReward: 220,
    readinessReward: 8,
    steps: [
      "Complete the supervisor briefing and confirm assigned support roles.",
      "Run the live safety check-in cadence during the meetup window.",
      "Close the mission with a debrief, evidence handoff, and incident summary."
    ]
  },
  {
    id: "quest-vigil",
    type: "realworld",
    risk: "High restriction",
    title: "Meetup Vigil",
    description:
      "A tightly controlled support operation with role-gated access, location sharing, and post-event debrief requirements.",
    location: "Oakland, CA",
    schedule: "Saturday, 2:00 PM",
    roles: ["Officer", "Safety monitor", "Video recorder"],
    protocol: "Location consent expires automatically",
    minimumRole: "Officer / LE Partner",
    minReadiness: 80,
    xpReward: 320,
    readinessReward: 10,
    steps: [
      "Verify all participants, equipment, and consent-based location sharing before deployment.",
      "Maintain field safety oversight and document every checkpoint during the support window.",
      "Finish the post-event debrief with reviewed media, notes, and chain-of-custody records."
    ]
  },
  {
    id: "quest-lantern",
    type: "online",
    risk: "Open to trained users",
    title: "Signal Lantern",
    description:
      "Review tip submissions for completeness, normalize timestamps, and route validated reports to moderators.",
    location: "Remote / Nationwide",
    schedule: "Rolling window",
    roles: ["Spotter", "Verifier"],
    protocol: "Structured report handoff",
    minimumRole: "Spotter / Tipster",
    minReadiness: 20,
    xpReward: 90,
    readinessReward: 3,
    steps: [
      "Open the intake queue and identify submissions missing key evidence fields.",
      "Normalize timestamps, platform handles, and supporting attachments.",
      "Forward validated tips into the reporting queue with a clean summary."
    ]
  }
];

const sessions = new Map();

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function getNextRole(role) {
  const index = ROLE_OPTIONS.indexOf(role);
  if (index === -1 || index === ROLE_OPTIONS.length - 1) {
    return ROLE_OPTIONS[ROLE_OPTIONS.length - 1];
  }

  return ROLE_OPTIONS[index + 1];
}

function getRoleRank(role) {
  const index = ROLE_OPTIONS.indexOf(role);
  return index === -1 ? 0 : index;
}

function findMissionById(missionId) {
  return MISSION_CATALOG.find((mission) => mission.id === missionId) || null;
}

function mapUserQuest(record) {
  if (!record) {
    return null;
  }

  return {
    id: record.id,
    userId: record.user_id,
    missionId: record.mission_id,
    status: record.status,
    progressPercent: record.progress_percent,
    notes: record.notes || "",
    xpReward: record.xp_reward,
    readinessReward: record.readiness_reward,
    startedAt: record.started_at,
    completedAt: record.completed_at,
    createdAt: record.created_at,
    updatedAt: record.updated_at
  };
}

function describeMissionAccess(user, mission, assignments) {
  const assignment = assignments.find((entry) => entry.missionId === mission.id) || null;
  if (assignment) {
    return {
      claimable: false,
      state: assignment.status,
      reason:
        assignment.status === "completed" ? "Completed and rewards already granted." : "Already claimed.",
      assignmentId: assignment.id
    };
  }

  if (getRoleRank(user.role) < getRoleRank(mission.minimumRole)) {
    return {
      claimable: false,
      state: "locked",
      reason: `Requires ${mission.minimumRole}.`,
      assignmentId: null
    };
  }

  if ((user.readinessScore || 0) < (mission.minReadiness || 0)) {
    return {
      claimable: false,
      state: "locked",
      reason: `Requires ${mission.minReadiness}% readiness.`,
      assignmentId: null
    };
  }

  return {
    claimable: true,
    state: "available",
    reason: `Earn ${mission.xpReward} XP and ${mission.readinessReward}% readiness.`,
    assignmentId: null
  };
}

function buildQuestBoardPayload(user, assignments) {
  const detailedAssignments = assignments
    .map((assignment) => {
      const mission = findMissionById(assignment.missionId);
      if (!mission) {
        return null;
      }

      return {
        ...assignment,
        mission
      };
    })
    .filter(Boolean)
    .sort((left, right) => {
      if (left.status !== right.status) {
        return left.status === "active" ? -1 : 1;
      }

      return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
    });

  const availableQuests = MISSION_CATALOG.map((mission) => ({
    ...mission,
    access: describeMissionAccess(user, mission, assignments)
  }));

  return {
    availableQuests,
    assignments: detailedAssignments,
    summary: {
      activeCount: detailedAssignments.filter((assignment) => assignment.status === "active").length,
      completedCount: detailedAssignments.filter((assignment) => assignment.status === "completed")
        .length,
      totalXpEarned: detailedAssignments
        .filter((assignment) => assignment.status === "completed")
        .reduce((sum, assignment) => sum + (assignment.xpReward || 0), 0),
      claimableCount: availableQuests.filter((mission) => mission.access.claimable).length
    }
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

function normalizeIdentityStatus(value, fallback = "draft") {
  const normalized = String(value || "").trim().toLowerCase();
  return IDENTITY_STATUSES.has(normalized) ? normalized : fallback;
}

function normalizeIdDocumentType(value, fallback = "unset") {
  const normalized = String(value || "").trim().toLowerCase();
  return ID_DOCUMENT_TYPES.has(normalized) ? normalized : fallback;
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

function mapSupabaseIdentityVerification(record) {
  if (!record) {
    return null;
  }

  return {
    userId: record.user_id,
    legalName: record.legal_name || "",
    phoneNumber: record.phone_number || "",
    city: record.city || "",
    state: record.state || "",
    birthDate: record.birth_date || "",
    idDocumentType: record.id_document_type || "unset",
    idDocumentLast4: record.id_document_last4 || "",
    officerPathRequested: Boolean(record.officer_path_requested),
    officerDepartment: record.officer_department || "",
    officerWorkEmail: record.officer_work_email || "",
    backgroundConsentAt: record.background_consent_at,
    trainingAcknowledgedAt: record.training_acknowledged_at,
    codeOfConductAcceptedAt: record.code_of_conduct_accepted_at,
    status: record.status || "draft",
    reviewNotes: record.review_notes || "",
    submittedAt: record.submitted_at,
    reviewedAt: record.reviewed_at,
    createdAt: record.created_at,
    updatedAt: record.updated_at
  };
}

function buildDefaultIdentityVerification(user) {
  const now = new Date().toISOString();
  return {
    userId: user.id,
    legalName: user.displayName || "",
    phoneNumber: "",
    city: "",
    state: user.region || "",
    birthDate: "",
    idDocumentType: "unset",
    idDocumentLast4: "",
    officerPathRequested: false,
    officerDepartment: "",
    officerWorkEmail: "",
    backgroundConsentAt: null,
    trainingAcknowledgedAt: null,
    codeOfConductAcceptedAt: null,
    status: "draft",
    reviewNotes: "",
    submittedAt: null,
    reviewedAt: null,
    createdAt: now,
    updatedAt: now
  };
}

function identityVerificationToSupabaseRecord(record) {
  return {
    user_id: record.userId,
    legal_name: record.legalName || null,
    phone_number: record.phoneNumber || null,
    city: record.city || null,
    state: record.state || null,
    birth_date: record.birthDate || null,
    id_document_type: normalizeIdDocumentType(record.idDocumentType),
    id_document_last4: record.idDocumentLast4 || null,
    officer_path_requested: Boolean(record.officerPathRequested),
    officer_department: record.officerDepartment || null,
    officer_work_email: record.officerWorkEmail || null,
    background_consent_at: record.backgroundConsentAt || null,
    training_acknowledged_at: record.trainingAcknowledgedAt || null,
    code_of_conduct_accepted_at: record.codeOfConductAcceptedAt || null,
    status: normalizeIdentityStatus(record.status),
    review_notes: record.reviewNotes || "",
    submitted_at: record.submittedAt || null,
    reviewed_at: record.reviewedAt || null
  };
}

function buildIdentityVerificationPatch(body, existingRecord, currentUser) {
  const patch = {};
  const draft = existingRecord || buildDefaultIdentityVerification(currentUser);
  const now = new Date().toISOString();

  if (body.legalName !== undefined) {
    patch.legal_name = String(body.legalName || "").trim().slice(0, 120);
  }

  if (body.phoneNumber !== undefined) {
    patch.phone_number = String(body.phoneNumber || "").trim().slice(0, 32);
  }

  if (body.city !== undefined) {
    patch.city = String(body.city || "").trim().slice(0, 80);
  }

  if (body.state !== undefined) {
    patch.state = String(body.state || "").trim().slice(0, 80);
  }

  if (body.birthDate !== undefined) {
    patch.birth_date = String(body.birthDate || "").trim();
  }

  if (body.idDocumentType !== undefined) {
    patch.id_document_type = normalizeIdDocumentType(body.idDocumentType);
  }

  if (body.idDocumentLast4 !== undefined) {
    patch.id_document_last4 = String(body.idDocumentLast4 || "")
      .replace(/\D+/gu, "")
      .slice(-4);
  }

  if (body.officerPathRequested !== undefined) {
    patch.officer_path_requested = Boolean(body.officerPathRequested);
  }

  if (body.officerDepartment !== undefined) {
    patch.officer_department = String(body.officerDepartment || "").trim().slice(0, 120);
  }

  if (body.officerWorkEmail !== undefined) {
    patch.officer_work_email = normalizeEmail(body.officerWorkEmail);
  }

  if (body.backgroundConsent !== undefined) {
    patch.background_consent_at = body.backgroundConsent ? now : null;
  }

  if (body.trainingAcknowledged !== undefined) {
    patch.training_acknowledged_at = body.trainingAcknowledged ? now : null;
  }

  if (body.codeOfConductAccepted !== undefined) {
    patch.code_of_conduct_accepted_at = body.codeOfConductAccepted ? now : null;
  }

  if (draft.status === "changes_requested" || draft.status === "rejected") {
    patch.status = "draft";
    patch.review_notes = existingRecord?.reviewNotes || "";
  }

  return patch;
}

function validateIdentityVerificationSubmission(record) {
  if (!record.legalName) {
    return "Enter your legal name before submitting identity verification.";
  }
  if (!record.phoneNumber) {
    return "A phone number is required before submitting identity verification.";
  }
  if (!record.city || !record.state) {
    return "City and state are required before submitting identity verification.";
  }
  if (!record.birthDate) {
    return "Your date of birth is required before submitting identity verification.";
  }
  if (record.idDocumentType === "unset") {
    return "Choose an ID document type before submitting identity verification.";
  }
  if (!/^\d{4}$/u.test(record.idDocumentLast4 || "")) {
    return "Enter the last 4 digits of your ID document before submitting.";
  }
  if (!record.backgroundConsentAt || !record.trainingAcknowledgedAt || !record.codeOfConductAcceptedAt) {
    return "Background-check consent, training acknowledgment, and code of conduct acceptance are required.";
  }
  if (record.officerPathRequested && (!record.officerDepartment || !record.officerWorkEmail)) {
    return "Officer-path requests require a department and work email.";
  }

  return "";
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

async function supabaseGetIdentityVerificationByUserId(userId) {
  const { data, error } = await supabaseAdmin
    .from("identity_verifications")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  throwIfSupabaseError(error, "Unable to load identity verification.");
  return mapSupabaseIdentityVerification(data);
}

async function supabaseUpsertIdentityVerification(record) {
  const { data, error } = await supabaseAdmin
    .from("identity_verifications")
    .upsert(identityVerificationToSupabaseRecord(record))
    .select()
    .single();

  throwIfSupabaseError(error, "Unable to save identity verification.");
  return mapSupabaseIdentityVerification(data);
}

async function supabasePatchIdentityVerification(userId, updates) {
  const { data, error } = await supabaseAdmin
    .from("identity_verifications")
    .update(updates)
    .eq("user_id", userId)
    .select()
    .single();

  throwIfSupabaseError(error, "Unable to update identity verification.");
  return mapSupabaseIdentityVerification(data);
}

async function supabaseListIdentityVerifications() {
  const { data, error } = await supabaseAdmin
    .from("identity_verifications")
    .select("*")
    .order("updated_at", { ascending: false });

  throwIfSupabaseError(error, "Unable to list identity verifications.");
  return data.map(mapSupabaseIdentityVerification);
}

async function supabaseListUserQuests(userId) {
  const { data, error } = await supabaseAdmin
    .from("user_quests")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  throwIfSupabaseError(error, "Unable to load quests.");
  return data.map(mapUserQuest);
}

async function supabaseGetUserQuestById(questId) {
  const { data, error } = await supabaseAdmin
    .from("user_quests")
    .select("*")
    .eq("id", questId)
    .maybeSingle();

  throwIfSupabaseError(error, "Unable to load the quest.");
  return mapUserQuest(data);
}

async function supabaseCreateUserQuest(userId, mission) {
  const { data, error } = await supabaseAdmin
    .from("user_quests")
    .insert({
      user_id: userId,
      mission_id: mission.id,
      status: "active",
      progress_percent: 0,
      notes: "",
      xp_reward: mission.xpReward,
      readiness_reward: mission.readinessReward
    })
    .select()
    .single();

  throwIfSupabaseError(error, "Unable to assign the quest.");
  return mapUserQuest(data);
}

async function supabasePatchUserQuest(questId, updates) {
  const { data, error } = await supabaseAdmin
    .from("user_quests")
    .update(updates)
    .eq("id", questId)
    .select()
    .single();

  throwIfSupabaseError(error, "Unable to update the quest.");
  return mapUserQuest(data);
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

async function requestSupabasePasswordReset(email, redirectTo) {
  const { error } = await supabaseAuth.auth.resetPasswordForEmail(email, {
    redirectTo
  });

  throwIfSupabaseError(error, "Unable to send a password reset email.");
  return { ok: true };
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

async function requestPasswordReset(email, redirectTo) {
  return requestSupabasePasswordReset(email, redirectTo);
}

async function getIdentityVerification(user) {
  const existing = await supabaseGetIdentityVerificationByUserId(user.id);
  if (existing) {
    return existing;
  }

  return supabaseUpsertIdentityVerification(buildDefaultIdentityVerification(user));
}

async function updateIdentityVerification(user, body) {
  const existing = await getIdentityVerification(user);
  const patch = buildIdentityVerificationPatch(body, existing, user);
  if (!Object.keys(patch).length) {
    return existing;
  }

  return supabasePatchIdentityVerification(user.id, patch);
}

async function submitIdentityVerification(user) {
  const existing = await getIdentityVerification(user);
  const errorMessage = validateIdentityVerificationSubmission(existing);
  if (errorMessage) {
    throw new Error(errorMessage);
  }

  const now = new Date().toISOString();
  const status = existing.officerPathRequested ? "Officer verification pending" : "Moderator review required";
  const verification = await supabasePatchIdentityVerification(user.id, {
    status: "in_review",
    submitted_at: now,
    reviewed_at: null
  });
  const profile = await supabasePatchProfile(user.id, {
    verification_status: status
  });

  return {
    user: profile,
    verification
  };
}

async function listIdentityVerifications() {
  return supabaseListIdentityVerifications();
}

async function reviewIdentityVerification(userId, updates) {
  const existing = await supabaseGetIdentityVerificationByUserId(userId);
  if (!existing) {
    throw new Error("Identity verification record not found.");
  }

  const nextStatus = normalizeIdentityStatus(updates.status, existing.status);
  const reviewNotes = String(updates.reviewNotes || "").trim().slice(0, 2000);
  const now = new Date().toISOString();
  const verification = await supabasePatchIdentityVerification(userId, {
    status: nextStatus,
    review_notes: reviewNotes,
    reviewed_at: nextStatus === "draft" ? null : now
  });

  const profilePatch = {};
  if (nextStatus === "approved") {
    if (verification.officerPathRequested) {
      profilePatch.verification_status = "Officer path approved";
      profilePatch.role = "Officer / LE Partner";
      profilePatch.readiness_score = 98;
      profilePatch.points = 2000;
    } else {
      profilePatch.verification_status = "Phone + ID complete";
      profilePatch.readiness_score = 55;
    }
  } else if (nextStatus === "changes_requested") {
    profilePatch.verification_status = verification.officerPathRequested
      ? "Officer verification pending"
      : "Moderator review required";
  } else if (nextStatus === "rejected") {
    profilePatch.verification_status = "Email verified / ID pending";
  } else if (nextStatus === "submitted" || nextStatus === "in_review") {
    profilePatch.verification_status = verification.officerPathRequested
      ? "Officer verification pending"
      : "Moderator review required";
  }

  const user = Object.keys(profilePatch).length
    ? await supabasePatchProfile(userId, profilePatch)
    : await supabaseGetProfileById(userId);

  return {
    user,
    verification
  };
}

async function getQuestBoard(user) {
  const assignments = await supabaseListUserQuests(user.id);
  return buildQuestBoardPayload(user, assignments);
}

async function claimQuest(user, missionId) {
  const mission = findMissionById(missionId);
  if (!mission) {
    throw new Error("Quest not found.");
  }

  const assignments = await supabaseListUserQuests(user.id);
  const access = describeMissionAccess(user, mission, assignments);
  if (!access.claimable) {
    throw new Error(access.reason);
  }

  await supabaseCreateUserQuest(user.id, mission);
  return getQuestBoard(user);
}

async function updateQuest(user, questId, updates) {
  const existingQuest = await supabaseGetUserQuestById(questId);
  if (!existingQuest || existingQuest.userId !== user.id) {
    throw new Error("Quest not found.");
  }

  if (existingQuest.status === "completed") {
    throw new Error("Completed quests are read-only.");
  }

  const patch = {};
  if (updates.notes !== undefined) {
    patch.notes = String(updates.notes || "").trim().slice(0, 2000);
  }

  if (updates.progressPercent !== undefined) {
    const progress = Number(updates.progressPercent);
    if (!Number.isFinite(progress)) {
      throw new Error("Progress must be a number.");
    }

    patch.progress_percent = Math.max(0, Math.min(100, Math.round(progress)));
  }

  if (updates.status !== undefined) {
    if (updates.status !== "active" && updates.status !== "completed") {
      throw new Error("Quest status must be active or completed.");
    }

    patch.status = updates.status;
  }

  const isCompleting = patch.status === "completed";
  if (isCompleting) {
    patch.progress_percent = 100;
    patch.completed_at = new Date().toISOString();
  }

  await supabasePatchUserQuest(questId, patch);

  let nextUser = user;
  if (isCompleting) {
    nextUser = await supabasePatchProfile(user.id, {
      points: (user.points || 0) + existingQuest.xpReward,
      readiness_score: Math.min(100, (user.readinessScore || 0) + existingQuest.readinessReward)
    });
  }

  return {
    user: nextUser,
    questBoard: await getQuestBoard(nextUser)
  };
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

async function handleForgotPassword(request, response) {
  const body = await parseBody(request);
  const email = normalizeEmail(body.email);

  if (!email) {
    sendJson(response, 400, { error: "An email address is required." });
    return;
  }

  const origin = `${request.headers["x-forwarded-proto"] || "http"}://${request.headers.host || `${HOST}:${PORT}`}`;
  const redirectTo = new URL("/reset-password.html", origin).toString();
  await requestPasswordReset(email, redirectTo);
  sendJson(response, 200, {
    ok: true,
    message: "If an account exists for that email, a reset link has been sent."
  });
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

async function handleIdentityGet(response, currentUser) {
  const verification = await getIdentityVerification(currentUser);
  sendJson(response, 200, { verification });
}

async function handleIdentityUpdate(request, response, currentUser) {
  const body = await parseBody(request);
  const verification = await updateIdentityVerification(currentUser, body);
  sendJson(response, 200, { verification });
}

async function handleIdentitySubmit(response, currentUser) {
  const payload = await submitIdentityVerification(currentUser);
  sendJson(response, 200, payload);
}

async function handleAdminIdentityList(response) {
  const [users, verifications] = await Promise.all([listUsers(), listIdentityVerifications()]);
  const usersById = new Map(users.map((user) => [user.id, user]));
  const records = verifications.map((verification) => ({
    ...verification,
    user: usersById.get(verification.userId) || null
  }));
  sendJson(response, 200, { records });
}

async function handleAdminIdentityReview(request, response, userId) {
  const body = await parseBody(request);
  const payload = await reviewIdentityVerification(userId, {
    status: body.status,
    reviewNotes: body.reviewNotes
  });
  sendJson(response, 200, payload);
}

async function handleQuestClaim(request, response, currentUser) {
  const body = await parseBody(request);
  const missionId = String(body.missionId || "").trim();

  if (!missionId) {
    sendJson(response, 400, { error: "A mission id is required." });
    return;
  }

  const questBoard = await claimQuest(currentUser, missionId);
  sendJson(response, 201, { user: currentUser, questBoard });
}

async function handleQuestUpdate(request, response, currentUser, questId) {
  const body = await parseBody(request);
  const payload = await updateQuest(currentUser, questId, {
    notes: body.notes,
    progressPercent: body.progressPercent,
    status: body.status
  });
  sendJson(response, 200, payload);
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

  if (urlPath === "/api/auth/forgot-password" && request.method === "POST") {
    await handleForgotPassword(request, response);
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

  if (urlPath === "/api/identity" && request.method === "GET") {
    const user = await requireUser(request, response);
    if (!user) {
      return;
    }

    await handleIdentityGet(response, user);
    return;
  }

  if (urlPath === "/api/identity" && request.method === "PATCH") {
    const user = await requireUser(request, response);
    if (!user) {
      return;
    }

    await handleIdentityUpdate(request, response, user);
    return;
  }

  if (urlPath === "/api/identity/submit" && request.method === "POST") {
    const user = await requireUser(request, response);
    if (!user) {
      return;
    }

    await handleIdentitySubmit(response, user);
    return;
  }

  if (urlPath === "/api/quests" && request.method === "GET") {
    const user = await requireUser(request, response);
    if (!user) {
      return;
    }

    const questBoard = await getQuestBoard(user);
    sendJson(response, 200, questBoard);
    return;
  }

  if (urlPath === "/api/quests" && request.method === "POST") {
    const user = await requireUser(request, response);
    if (!user) {
      return;
    }

    await handleQuestClaim(request, response, user);
    return;
  }

  if (urlPath.startsWith("/api/quests/") && request.method === "PATCH") {
    const user = await requireUser(request, response);
    if (!user) {
      return;
    }

    const questId = urlPath.split("/").pop();
    await handleQuestUpdate(request, response, user, questId);
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

  if (urlPath === "/api/admin/identity" && request.method === "GET") {
    const user = await requireAdmin(request, response);
    if (!user) {
      return;
    }

    await handleAdminIdentityList(response);
    return;
  }

  if (urlPath.startsWith("/api/admin/identity/") && request.method === "PATCH") {
    const user = await requireAdmin(request, response);
    if (!user) {
      return;
    }

    const userId = urlPath.split("/").pop();
    await handleAdminIdentityReview(request, response, userId);
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
