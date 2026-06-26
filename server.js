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
const MISSION_TYPES = new Set(["online", "hybrid", "realworld"]);
const IDENTITY_STATUSES = new Set([
  "draft",
  "submitted",
  "in_review",
  "changes_requested",
  "approved",
  "rejected"
]);
const QUEST_USER_STATUSES = new Set(["accepted", "submitted"]);
const QUEST_ADMIN_STATUSES = new Set(["submitted", "needs_revision", "confirmed"]);
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
const canonicalRouteMap = new Map([
  ["/index.html", "/"],
  ["/reset-password.html", "/reset-password"],
  ["/dashboard.html", "/dashboard"],
  ["/onboarding.html", "/onboarding"],
  ["/missions.html", "/missions"],
  ["/map.html", "/map"],
  ["/training.html", "/training"],
  ["/reporting.html", "/reporting"],
  ["/leaderboard.html", "/leaderboard"],
  ["/roadmap.html", "/roadmap"],
  ["/account.html", "/account"],
  ["/admin.html", "/admin"]
]);

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

const SEEDED_MISSION_CATALOG = [
  {
    id: "quest-shadow",
    type: "online",
    risk: "Moderate oversight",
    title: "Patrol the Shadows",
    questGiver: "Dispatcher Nyra",
    questConfirmer: "Moderator Sable",
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
    rewardLabel: "Intel packet + patrol credit",
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
    questGiver: "Supervisor Vale",
    questConfirmer: "Commander Imani",
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
    rewardLabel: "Meetup ops clearance + response credit",
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
    questGiver: "Captain Roan",
    questConfirmer: "Field Marshal Eden",
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
    rewardLabel: "Field command commendation",
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
    questGiver: "Archivist Lux",
    questConfirmer: "Verifier Quinn",
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
    rewardLabel: "Validated tip routing credit",
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
  return SEEDED_MISSION_CATALOG.find((mission) => mission.id === missionId) || null;
}

function sanitizeMissionText(value, maxLength = 200, fallback = "") {
  return String(value ?? fallback)
    .trim()
    .slice(0, maxLength);
}

function sanitizeMissionList(value, maxItems = 12, itemMaxLength = 120) {
  const rawItems = Array.isArray(value)
    ? value
    : String(value || "")
        .split(/\r?\n|,/u)
        .map((item) => item.trim())
        .filter(Boolean);

  return rawItems
    .map((item) => sanitizeMissionText(item, itemMaxLength))
    .filter(Boolean)
    .slice(0, maxItems);
}

function slugifyMissionId(value) {
  const base = sanitizeMissionText(value, 80)
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-+|-+$/gu, "");

  return base || `mission-${Date.now().toString(36)}`;
}

function mapMissionRecord(record) {
  if (!record) {
    return null;
  }

  return {
    id: record.id,
    type: record.type,
    risk: record.risk || "",
    title: record.title,
    questGiver: record.quest_giver || "",
    questConfirmer: record.quest_confirmer || "",
    description: record.description || "",
    location: record.location || "",
    schedule: record.schedule || "",
    roles: Array.isArray(record.roles) ? record.roles : [],
    protocol: record.protocol || "",
    minimumRole: record.minimum_role,
    minReadiness: record.min_readiness,
    xpReward: record.xp_reward,
    readinessReward: record.readiness_reward,
    rewardLabel: record.reward_label || "",
    steps: Array.isArray(record.steps) ? record.steps : [],
    isActive: record.is_active !== false,
    createdBy: record.created_by || null,
    updatedBy: record.updated_by || null,
    createdAt: record.created_at,
    updatedAt: record.updated_at
  };
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
    submittedAt: record.submitted_at,
    rewardGrantedAt: record.reward_granted_at,
    confirmedAt: record.confirmed_at,
    confirmedBy: record.confirmed_by,
    confirmationNotes: record.confirmation_notes || "",
    completedAt: record.completed_at,
    createdAt: record.created_at,
    updatedAt: record.updated_at
  };
}

function getQuestStatusMeta(status) {
  switch (status) {
    case "accepted":
      return {
        label: "Accepted",
        adminReviewable: false,
        rewardState: "pending",
        userLocked: false
      };
    case "submitted":
      return {
        label: "Submitted for confirmation",
        adminReviewable: true,
        rewardState: "pending",
        userLocked: true
      };
    case "needs_revision":
      return {
        label: "Needs revision",
        adminReviewable: true,
        rewardState: "pending",
        userLocked: false
      };
    case "confirmed":
      return {
        label: "Confirmed",
        adminReviewable: true,
        rewardState: "granted",
        userLocked: true
      };
    default:
      return {
        label: status,
        adminReviewable: false,
        rewardState: "pending",
        userLocked: false
      };
  }
}

async function listMissionCatalog({ includeInactive = true } = {}) {
  if (hasSupabaseConfig) {
    return supabaseListMissions(includeInactive);
  }

  return SEEDED_MISSION_CATALOG.filter((mission) => includeInactive || mission.isActive !== false).map(
    (mission) => ({
      ...mission,
      isActive: mission.isActive !== false
    })
  );
}

async function getMissionCatalogEntryById(missionId) {
  if (hasSupabaseConfig) {
    return supabaseGetMissionById(missionId);
  }

  const mission = findMissionById(missionId);
  return mission ? { ...mission, isActive: mission.isActive !== false } : null;
}

function describeMissionAccess(user, mission, assignments) {
  const assignment = assignments.find((entry) => entry.missionId === mission.id) || null;
  if (assignment) {
    const statusMeta = getQuestStatusMeta(assignment.status);
    return {
      claimable: false,
      state: assignment.status,
      reason:
        assignment.status === "confirmed"
          ? "Confirmed and rewards granted."
          : `${statusMeta.label}.`,
      assignmentId: assignment.id
    };
  }

  if (mission.isActive === false) {
    return {
      claimable: false,
      state: "inactive",
      reason: "Mission is inactive and not accepting new assignments.",
      assignmentId: null
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

function buildQuestBoardPayload(user, assignments, missionCatalog) {
  const detailedAssignments = assignments
    .map((assignment) => {
      const mission = missionCatalog.find((entry) => entry.id === assignment.missionId) || null;
      if (!mission) {
        return null;
      }

      return {
        ...assignment,
        statusMeta: getQuestStatusMeta(assignment.status),
        mission
      };
    })
    .filter(Boolean)
    .sort((left, right) => {
      const leftPriority = left.status === "submitted" ? 0 : left.status === "needs_revision" ? 1 : left.status === "accepted" ? 2 : 3;
      const rightPriority =
        right.status === "submitted" ? 0 : right.status === "needs_revision" ? 1 : right.status === "accepted" ? 2 : 3;

      if (leftPriority !== rightPriority) {
        return leftPriority - rightPriority;
      }

      return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
    });

  const availableQuests = missionCatalog
    .filter((mission) => mission.isActive !== false)
    .map((mission) => ({
      ...mission,
      access: describeMissionAccess(user, mission, assignments)
    }));

  return {
    availableQuests,
    assignments: detailedAssignments,
    summary: {
      activeCount: detailedAssignments.filter((assignment) =>
        ["accepted", "needs_revision"].includes(assignment.status)
      ).length,
      submittedCount: detailedAssignments.filter((assignment) => assignment.status === "submitted").length,
      completedCount: detailedAssignments.filter((assignment) => assignment.status === "confirmed")
        .length,
      totalXpEarned: detailedAssignments
        .filter((assignment) => assignment.status === "confirmed")
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

async function supabaseListMissions(includeInactive = true) {
  let query = supabaseAdmin.from("missions").select("*").order("title", { ascending: true });
  if (!includeInactive) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;
  if (error) {
    if (error.code === "42P01") {
      return SEEDED_MISSION_CATALOG.map((mission) => ({ ...mission, isActive: true }));
    }

    throwIfSupabaseError(error, "Unable to load missions.");
  }

  return data.map(mapMissionRecord);
}

async function supabaseGetMissionById(missionId) {
  const { data, error } = await supabaseAdmin
    .from("missions")
    .select("*")
    .eq("id", missionId)
    .maybeSingle();

  if (error) {
    if (error.code === "42P01") {
      return findMissionById(missionId);
    }

    throwIfSupabaseError(error, "Unable to load the mission.");
  }

  return mapMissionRecord(data);
}

async function supabaseCreateMission(mission) {
  const { data, error } = await supabaseAdmin.from("missions").insert(mission).select("*").single();
  throwIfSupabaseError(error, "Unable to create the mission.");
  return mapMissionRecord(data);
}

async function supabasePatchMission(missionId, updates) {
  const { data, error } = await supabaseAdmin
    .from("missions")
    .update(updates)
    .eq("id", missionId)
    .select("*")
    .single();

  throwIfSupabaseError(error, "Unable to update the mission.");
  return mapMissionRecord(data);
}

async function supabaseDeleteMission(missionId) {
  const { error } = await supabaseAdmin.from("missions").delete().eq("id", missionId);
  throwIfSupabaseError(error, "Unable to delete the mission.");
}

async function supabaseCountMissionAssignments(missionId) {
  const { count, error } = await supabaseAdmin
    .from("user_quests")
    .select("*", { count: "exact", head: true })
    .eq("mission_id", missionId);

  throwIfSupabaseError(error, "Unable to inspect mission assignments.");
  return count || 0;
}

async function supabaseListAllUserQuests() {
  const { data, error } = await supabaseAdmin.from("user_quests").select("*").order("updated_at", {
    ascending: false
  });

  throwIfSupabaseError(error, "Unable to load the quest queue.");
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
      status: "accepted",
      progress_percent: 0,
      notes: "",
      xp_reward: mission.xpReward,
      readiness_reward: mission.readinessReward,
      confirmation_notes: ""
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

function buildMissionMutation(body, { partial = false, existingMission = null } = {}) {
  const patch = {};

  if (!partial || body.id !== undefined) {
    const nextId = slugifyMissionId(body.id || body.title || existingMission?.id);
    if (!nextId) {
      throw new Error("Mission id is required.");
    }
    patch.id = nextId;
  }

  if (!partial || body.type !== undefined) {
    const nextType = sanitizeMissionText(body.type, 40);
    if (!MISSION_TYPES.has(nextType)) {
      throw new Error("Mission type must be online, hybrid, or realworld.");
    }
    patch.type = nextType;
  }

  if (!partial || body.title !== undefined) {
    const title = sanitizeMissionText(body.title, 120);
    if (!title) {
      throw new Error("Mission title is required.");
    }
    patch.title = title;
  }

  if (!partial || body.minimumRole !== undefined) {
    const minimumRole = sanitizeMissionText(body.minimumRole, 80);
    if (!ROLE_OPTIONS.includes(minimumRole)) {
      throw new Error("Mission minimum role is invalid.");
    }
    patch.minimum_role = minimumRole;
  }

  if (!partial || body.description !== undefined) {
    patch.description = sanitizeMissionText(body.description, 1200);
  }
  if (!partial || body.risk !== undefined) {
    patch.risk = sanitizeMissionText(body.risk, 120);
  }
  if (!partial || body.questGiver !== undefined) {
    patch.quest_giver = sanitizeMissionText(body.questGiver, 120);
  }
  if (!partial || body.questConfirmer !== undefined) {
    patch.quest_confirmer = sanitizeMissionText(body.questConfirmer, 120);
  }
  if (!partial || body.location !== undefined) {
    patch.location = sanitizeMissionText(body.location, 160);
  }
  if (!partial || body.schedule !== undefined) {
    patch.schedule = sanitizeMissionText(body.schedule, 160);
  }
  if (!partial || body.protocol !== undefined) {
    patch.protocol = sanitizeMissionText(body.protocol, 240);
  }
  if (!partial || body.rewardLabel !== undefined) {
    patch.reward_label = sanitizeMissionText(body.rewardLabel, 160);
  }
  if (!partial || body.roles !== undefined) {
    patch.roles = sanitizeMissionList(body.roles, 12, 80);
  }
  if (!partial || body.steps !== undefined) {
    patch.steps = sanitizeMissionList(body.steps, 12, 200);
  }
  if (!partial || body.isActive !== undefined) {
    patch.is_active = Boolean(body.isActive);
  }

  if (!partial || body.minReadiness !== undefined) {
    const minReadiness = Number(body.minReadiness);
    if (!Number.isFinite(minReadiness) || minReadiness < 0 || minReadiness > 100) {
      throw new Error("Mission readiness must be between 0 and 100.");
    }
    patch.min_readiness = Math.round(minReadiness);
  }

  if (!partial || body.xpReward !== undefined) {
    const xpReward = Number(body.xpReward);
    if (!Number.isFinite(xpReward) || xpReward < 0) {
      throw new Error("Mission XP reward must be a non-negative number.");
    }
    patch.xp_reward = Math.round(xpReward);
  }

  if (!partial || body.readinessReward !== undefined) {
    const readinessReward = Number(body.readinessReward);
    if (!Number.isFinite(readinessReward) || readinessReward < 0 || readinessReward > 100) {
      throw new Error("Mission readiness reward must be between 0 and 100.");
    }
    patch.readiness_reward = Math.round(readinessReward);
  }

  return patch;
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
  const [assignments, missionCatalog] = await Promise.all([
    supabaseListUserQuests(user.id),
    listMissionCatalog({ includeInactive: true })
  ]);
  return buildQuestBoardPayload(user, assignments, missionCatalog);
}

async function listQuestQueue() {
  const [quests, users, missionCatalog] = await Promise.all([
    supabaseListAllUserQuests(),
    listUsers(),
    listMissionCatalog({ includeInactive: true })
  ]);
  const usersById = new Map(users.map((user) => [user.id, user]));
  const missionsById = new Map(missionCatalog.map((mission) => [mission.id, mission]));

  return quests
    .map((quest) => {
      const mission = missionsById.get(quest.missionId) || null;
      if (!mission) {
        return null;
      }

      return {
        ...quest,
        mission,
        user: usersById.get(quest.userId) || null,
        statusMeta: getQuestStatusMeta(quest.status)
      };
    })
    .filter((quest) => quest && quest.status !== "accepted");
}

async function listAdminMissions() {
  return listMissionCatalog({ includeInactive: true });
}

async function createMission(adminUser, body) {
  if (!hasSupabaseConfig) {
    throw new Error("Mission management requires the Node/Supabase deployment.");
  }

  const patch = buildMissionMutation(body, { partial: false });
  const existing = await getMissionCatalogEntryById(patch.id);
  if (existing) {
    throw new Error("A mission with that id already exists.");
  }

  return supabaseCreateMission({
    ...patch,
    created_by: adminUser.id,
    updated_by: adminUser.id
  });
}

async function updateMission(adminUser, missionId, body) {
  if (!hasSupabaseConfig) {
    throw new Error("Mission management requires the Node/Supabase deployment.");
  }

  const existingMission = await getMissionCatalogEntryById(missionId);
  if (!existingMission) {
    throw new Error("Mission not found.");
  }

  if (body.id !== undefined && slugifyMissionId(body.id) !== missionId) {
    throw new Error("Mission ids cannot be changed after creation.");
  }

  const patch = buildMissionMutation(body, { partial: true, existingMission });
  if (!Object.keys(patch).length) {
    throw new Error("No valid mission updates were provided.");
  }

  patch.updated_by = adminUser.id;
  return supabasePatchMission(missionId, patch);
}

async function deleteMission(missionId) {
  if (!hasSupabaseConfig) {
    throw new Error("Mission management requires the Node/Supabase deployment.");
  }

  const existingMission = await getMissionCatalogEntryById(missionId);
  if (!existingMission) {
    throw new Error("Mission not found.");
  }

  const assignmentCount = await supabaseCountMissionAssignments(missionId);
  if (assignmentCount > 0) {
    throw new Error("This mission already has assignments. Set it inactive instead of deleting it.");
  }

  await supabaseDeleteMission(missionId);
  return { ok: true };
}

async function claimQuest(user, missionId) {
  const mission = await getMissionCatalogEntryById(missionId);
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

  if (existingQuest.status === "confirmed") {
    throw new Error("Confirmed quests are read-only.");
  }

  if (existingQuest.status === "submitted") {
    throw new Error("This quest is waiting for confirmer review.");
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
    if (!QUEST_USER_STATUSES.has(updates.status)) {
      throw new Error("Quest status must stay accepted or move to submitted.");
    }

    patch.status = updates.status;
  }

  const isSubmitting = patch.status === "submitted";
  if (isSubmitting) {
    const progress = patch.progress_percent ?? existingQuest.progressPercent;
    if (progress < 100) {
      throw new Error("Quests must reach 100% progress before confirmation can be requested.");
    }

    patch.submitted_at = new Date().toISOString();
  }

  await supabasePatchUserQuest(questId, patch);

  return {
    user,
    questBoard: await getQuestBoard(user)
  };
}

async function reviewQuest(adminUser, questId, updates) {
  const existingQuest = await supabaseGetUserQuestById(questId);
  if (!existingQuest) {
    throw new Error("Quest not found.");
  }

  if (!QUEST_ADMIN_STATUSES.has(updates.status)) {
    throw new Error("Quest review status must be submitted, needs_revision, or confirmed.");
  }

  const patch = {
    status: updates.status,
    confirmation_notes: String(updates.confirmationNotes || "").trim().slice(0, 2000)
  };

  if (existingQuest.status === "confirmed" && updates.status !== "confirmed") {
    throw new Error("Confirmed quests can no longer be changed.");
  }

  if (
    ["submitted", "needs_revision", "confirmed"].includes(updates.status) &&
    !["submitted", "needs_revision", "confirmed"].includes(existingQuest.status)
  ) {
    throw new Error("Only submitted quests can enter the confirmer review flow.");
  }

  if (updates.status === "confirmed" && existingQuest.status !== "submitted") {
    throw new Error("Only submitted quests can be confirmed.");
  }

  if (updates.status === "submitted") {
    patch.confirmed_at = null;
    patch.confirmed_by = null;
    patch.reward_granted_at = null;
    patch.completed_at = null;
  }

  if (updates.status === "needs_revision") {
    patch.confirmed_at = null;
    patch.confirmed_by = null;
    patch.reward_granted_at = null;
    patch.completed_at = null;
  }

  let reviewedQuest = await supabasePatchUserQuest(questId, patch);
  let member = await getUserById(existingQuest.userId);

  if (updates.status === "confirmed") {
    const confirmationTime = new Date().toISOString();
    reviewedQuest = await supabasePatchUserQuest(questId, {
      status: "confirmed",
      confirmed_at: confirmationTime,
      confirmed_by: adminUser.id,
      reward_granted_at: existingQuest.rewardGrantedAt || confirmationTime,
      completed_at: confirmationTime,
      confirmation_notes: patch.confirmation_notes
    });

    if (!existingQuest.rewardGrantedAt) {
      member = await supabasePatchProfile(existingQuest.userId, {
        points: (member.points || 0) + existingQuest.xpReward,
        readiness_score: Math.min(
          100,
          (member.readinessScore || 0) + existingQuest.readinessReward
        )
      });
    }
  }

  return {
    user: member,
    quest: {
      ...reviewedQuest,
      mission: await getMissionCatalogEntryById(reviewedQuest.missionId),
      user: member,
      statusMeta: getQuestStatusMeta(reviewedQuest.status)
    }
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
  const redirectTo = new URL("/reset-password", origin).toString();
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

async function handleAdminQuestList(response) {
  const quests = await listQuestQueue();
  sendJson(response, 200, { quests });
}

async function handleAdminMissionList(response) {
  const missions = await listAdminMissions();
  sendJson(response, 200, { missions });
}

async function handleAdminMissionCreate(request, response, adminUser) {
  const body = await parseBody(request);
  const mission = await createMission(adminUser, body);
  sendJson(response, 201, { mission });
}

async function handleAdminMissionUpdate(request, response, adminUser, missionId) {
  const body = await parseBody(request);
  const mission = await updateMission(adminUser, missionId, body);
  sendJson(response, 200, { mission });
}

async function handleAdminMissionDelete(response, missionId) {
  const payload = await deleteMission(missionId);
  sendJson(response, 200, payload);
}

async function handleAdminQuestReview(request, response, adminUser, questId) {
  const body = await parseBody(request);
  const payload = await reviewQuest(adminUser, questId, {
    status: body.status,
    confirmationNotes: body.confirmationNotes
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

  if (urlPath === "/api/admin/missions" && request.method === "GET") {
    const user = await requireAdmin(request, response);
    if (!user) {
      return;
    }

    await handleAdminMissionList(response);
    return;
  }

  if (urlPath === "/api/admin/missions" && request.method === "POST") {
    const user = await requireAdmin(request, response);
    if (!user) {
      return;
    }

    await handleAdminMissionCreate(request, response, user);
    return;
  }

  if (urlPath.startsWith("/api/admin/missions/") && request.method === "PATCH") {
    const user = await requireAdmin(request, response);
    if (!user) {
      return;
    }

    const missionId = urlPath.split("/").pop();
    await handleAdminMissionUpdate(request, response, user, missionId);
    return;
  }

  if (urlPath.startsWith("/api/admin/missions/") && request.method === "DELETE") {
    const user = await requireAdmin(request, response);
    if (!user) {
      return;
    }

    const missionId = urlPath.split("/").pop();
    await handleAdminMissionDelete(response, missionId);
    return;
  }

  if (urlPath === "/api/admin/quests" && request.method === "GET") {
    const user = await requireAdmin(request, response);
    if (!user) {
      return;
    }

    await handleAdminQuestList(response);
    return;
  }

  if (urlPath.startsWith("/api/admin/quests/") && request.method === "PATCH") {
    const user = await requireAdmin(request, response);
    if (!user) {
      return;
    }

    const questId = urlPath.split("/").pop();
    await handleAdminQuestReview(request, response, user, questId);
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
  const canonicalRoute = canonicalRouteMap.get(routePath);

  if (urlPath.endsWith(".html") && canonicalRoute) {
    if (routePath === "/index.html" && user) {
      sendRedirect(response, user.isAdmin ? "/admin" : "/dashboard");
      return;
    }

    if (protectedRoutes.has(routePath) && !user) {
      sendRedirect(response, "/");
      return;
    }

    if (adminRoutes.has(routePath) && user && !user.isAdmin) {
      sendRedirect(response, "/dashboard");
      return;
    }

    sendRedirect(response, canonicalRoute);
    return;
  }

  if (routePath === "/index.html" && user) {
    sendRedirect(response, user.isAdmin ? "/admin" : "/dashboard");
    return;
  }

  if (protectedRoutes.has(routePath) && !user) {
    sendRedirect(response, "/");
    return;
  }

  if (adminRoutes.has(routePath) && user && !user.isAdmin) {
    sendRedirect(response, "/dashboard");
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
