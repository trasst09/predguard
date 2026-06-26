const currentPage = document.body.dataset.page;
const PAGE_CONFIG = {
  auth: { routePath: "/", legacyPath: "/index.html" },
  "reset-password": { routePath: "/reset-password", legacyPath: "/reset-password.html" },
  dashboard: { routePath: "/dashboard", legacyPath: "/dashboard.html" },
  onboarding: { routePath: "/onboarding", legacyPath: "/onboarding.html" },
  missions: { routePath: "/missions", legacyPath: "/missions.html" },
  map: { routePath: "/map", legacyPath: "/map.html" },
  training: { routePath: "/training", legacyPath: "/training.html" },
  reporting: { routePath: "/reporting", legacyPath: "/reporting.html" },
  leaderboard: { routePath: "/leaderboard", legacyPath: "/leaderboard.html" },
  roadmap: { routePath: "/roadmap", legacyPath: "/roadmap.html" },
  account: { routePath: "/account", legacyPath: "/account.html" },
  admin: { routePath: "/admin", legacyPath: "/admin.html" }
};
const PUBLIC_PAGE_KEYS = new Set(["auth", "reset-password"]);
const ADMIN_ONLY_PAGE_KEYS = new Set(["admin"]);
const LEGACY_PAGE_LOOKUP = new Map(
  Object.values(PAGE_CONFIG).map((config) => [config.legacyPath, config.routePath])
);
const ROUTE_PAGE_LOOKUP = new Map(
  Object.entries(PAGE_CONFIG).flatMap(([key, config]) => [
    [key, config],
    [config.routePath, config],
    [config.legacyPath, config]
  ])
);

const ROLE_OPTIONS = [
  "Spotter / Tipster",
  "Decoy / Support",
  "Verifier / Moderator",
  "Officer / LE Partner"
];

const VERIFICATION_OPTIONS = [
  "Email verified / ID pending",
  "Phone + ID complete",
  "Moderator review required",
  "Officer verification pending",
  "Officer path approved"
];
const IDENTITY_STATUS_LABELS = {
  draft: "Draft in progress",
  submitted: "Submitted",
  in_review: "In review",
  changes_requested: "Changes requested",
  approved: "Approved",
  rejected: "Rejected"
};
const IDENTITY_REVIEW_STATUS_OPTIONS = ["in_review", "changes_requested", "approved", "rejected"];
const ID_DOCUMENT_OPTIONS = [
  { value: "drivers_license", label: "Driver's license" },
  { value: "state_id", label: "State ID" },
  { value: "passport", label: "Passport" },
  { value: "other", label: "Other government ID" }
];

const seededProfile =
  typeof guardianProfile !== "undefined"
    ? guardianProfile
    : {
        role: ROLE_OPTIONS[0],
        nextRole: ROLE_OPTIONS[1],
        readinessScore: 42,
        points: 0,
        region: "California",
        verification: "Email verified / ID pending",
        readinessItems: [
          {
            title: "Create your account",
            detail: "Start with a base guardian account and complete identity checks."
          },
          {
            title: "Finish onboarding",
            detail: "Complete training and profile details to unlock higher-trust workflows."
          },
          {
            title: "Earn readiness",
            detail: "XP, verification, and training progress expand what you can access."
          }
        ]
      };

const dashboardStatsData = typeof dashboardStats !== "undefined" ? dashboardStats : [];
const verificationStepsData = typeof verificationSteps !== "undefined" ? verificationSteps : [];
const missionsData = typeof missions !== "undefined" ? missions : [];
const modulesData = typeof modules !== "undefined" ? modules : [];
const safetyControlsData = typeof safetyControls !== "undefined" ? safetyControls : [];
const leaderboardData = typeof leaderboard !== "undefined" ? leaderboard : [];
const scoringModelData = typeof scoringModel !== "undefined" ? scoringModel : [];
const roadmapData = typeof roadmap !== "undefined" ? roadmap : [];
const roadmapPhasesData = typeof roadmapPhases !== "undefined" ? roadmapPhases : [];
const roadmapFocusData = typeof roadmapFocus !== "undefined" ? roadmapFocus : [];
const pageLinksData = typeof pageLinks !== "undefined" ? pageLinks : [];
const mapRegionsData = typeof mapRegions !== "undefined" ? mapRegions : [];
const mapUsersData = typeof mapUsers !== "undefined" ? mapUsers : [];
const mapQuestsData = typeof mapQuests !== "undefined" ? mapQuests : [];
const dashboardHotspotsData = typeof dashboardHotspots !== "undefined" ? dashboardHotspots : [];
const dashboardActivityData = typeof dashboardActivity !== "undefined" ? dashboardActivity : [];
const dashboardReportsData = typeof dashboardReports !== "undefined" ? dashboardReports : [];
const dashboardQuickActionsData =
  typeof dashboardQuickActions !== "undefined" ? dashboardQuickActions : [];
const LEGAL_VERSION = "2026-06-22";
const STATIC_SUPABASE_SCRIPT = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
const REDDIT_PAGE_META = {
  dashboard: {
    label: "Command center",
    description:
      "A feed-first overview of live operations, readiness signals, and the next actions that matter.",
    highlights: ["Check live hotspots", "Review feed activity", "Jump into missions"],
    relatedPages: ["missions", "reporting", "map"]
  },
  onboarding: {
    label: "Verification flow",
    description:
      "Track onboarding progress, submit identity details, and understand what unlocks next.",
    highlights: ["Finish identity package", "Review current status", "Understand review rules"],
    relatedPages: ["training", "account", "dashboard"]
  },
  missions: {
    label: "Quest board",
    description:
      "Browse available missions, review your assignments, and filter opportunities by channel.",
    highlights: ["See personal quests", "Filter mission types", "Preview role requirements"],
    relatedPages: ["dashboard", "map", "reporting"]
  },
  map: {
    label: "Operations map",
    description:
      "Track coverage across states, active guardians, current quests, and saved location signals.",
    highlights: ["Filter nodes by type", "Inspect selected nodes", "Compare coverage regions"],
    relatedPages: ["missions", "dashboard", "account"]
  },
  training: {
    label: "Learning path",
    description:
      "Review required modules and the safety controls that gate higher-trust workflows.",
    highlights: ["Track module completion", "Review safety controls", "Plan next certification"],
    relatedPages: ["onboarding", "leaderboard", "dashboard"]
  },
  reporting: {
    label: "Evidence intake",
    description:
      "Create structured drafts for moderator review with a compact, workflow-oriented form.",
    highlights: ["Draft a report", "Check evidence structure", "Keep handoff consistent"],
    relatedPages: ["missions", "dashboard", "roadmap"]
  },
  leaderboard: {
    label: "Recognition board",
    description:
      "See how points are awarded and which guardians are leading through safe, verified work.",
    highlights: ["Review top guardians", "Understand the scoring model", "Compare contribution patterns"],
    relatedPages: ["training", "missions", "dashboard"]
  },
  roadmap: {
    label: "Build roadmap",
    description:
      "A release-oriented view of what is shipped, active, and still planned across the MVP.",
    highlights: ["See execution windows", "Review milestones", "Jump to built surfaces"],
    relatedPages: ["dashboard", "admin", "reporting"]
  },
  account: {
    label: "Account controls",
    description:
      "Manage profile data, password, legal consent, and location preferences from one page.",
    highlights: ["Update profile", "Change password", "Control privacy settings"],
    relatedPages: ["onboarding", "map", "dashboard"]
  },
  admin: {
    label: "Moderator tools",
    description:
      "Review members, verification state, mission records, and confirmation queues in one workspace.",
    highlights: ["Manage users", "Review identity queue", "Moderate missions and quests"],
    relatedPages: ["dashboard", "roadmap", "missions"]
  }
};

let sessionUser = null;
let adminUsers = [];
let adminQuestRecords = [];
let adminMissionRecords = [];
let missionCatalog = Array.isArray(missionsData)
  ? missionsData.map((mission) => ({
      ...mission,
      isActive: mission.isActive !== false
    }))
  : [];
let questBoard = {
  availableQuests: [],
  assignments: [],
  summary: {
    activeCount: 0,
    submittedCount: 0,
    completedCount: 0,
    totalXpEarned: 0,
    claimableCount: 0
  }
};
let mapState = {
  filter: "all",
  selectedType: null,
  selectedId: null
};
let dashboardState = {
  selectedHotspotId: dashboardHotspotsData[0]?.id || null,
  activityFilter: "all"
};
let liveMap = null;
let liveMapLayers = [];
let authTransportPromise = null;
let browserSupabaseClient = null;
let identityVerificationRecord = null;
let adminIdentityRecords = [];
let missionCommentsByMissionId = {};
let browserAdminMissionMode = false;

const MAX_MISSION_ATTACHMENTS = 4;
const MAX_MISSION_ATTACHMENT_BYTES = 8 * 1024 * 1024;
const MISSION_TYPES = new Set(["online", "hybrid", "realworld"]);

function getRuntimeConfig() {
  const config = window.PREDGUARD_CONFIG || {};

  return {
    supabaseUrl:
      config.supabaseUrl || config.SUPABASE_URL || config.nextPublicSupabaseUrl || "",
    supabaseAnonKey:
      config.supabaseAnonKey ||
      config.SUPABASE_ANON_KEY ||
      config.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      ""
  };
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes < 1024) {
    return `${Math.max(0, Math.round(bytes || 0))} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isMissionMediaFile(file) {
  return Boolean(file?.type?.startsWith("image/") || file?.type?.startsWith("video/"));
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error(`Unable to read ${file.name}.`));
    reader.readAsDataURL(file);
  });
}

async function buildMissionAttachmentPayload(fileInput, existingAttachments = []) {
  const selectedFiles = Array.from(fileInput?.files || []);
  const totalCount = existingAttachments.length + selectedFiles.length;
  if (totalCount > MAX_MISSION_ATTACHMENTS) {
    throw new Error(`You can keep up to ${MAX_MISSION_ATTACHMENTS} attachments per mission.`);
  }

  for (const file of selectedFiles) {
    if (!isMissionMediaFile(file)) {
      throw new Error("Only image and video files are supported.");
    }
    if (file.size > MAX_MISSION_ATTACHMENT_BYTES) {
      throw new Error(`Each attachment must be 8 MB or smaller. ${file.name} is too large.`);
    }
  }

  const newAttachments = await Promise.all(
    selectedFiles.map(async (file) => ({
      name: file.name,
      dataUrl: await readFileAsDataUrl(file)
    }))
  );

  return [...existingAttachments, ...newAttachments];
}

function buildSubmissionAttachmentMarkup(attachments = [], removable = false) {
  if (!attachments.length) {
    return '<div class="mission-attachment-empty">No photos or videos uploaded yet.</div>';
  }

  return attachments
    .map((attachment, index) => {
      const preview =
        attachment.kind === "image"
          ? `<img src="${escapeHtml(attachment.url)}" alt="${escapeHtml(attachment.name)}" />`
          : `<video controls preload="metadata" src="${escapeHtml(attachment.url)}"></video>`;
      const removeButton = removable
        ? `<button class="text-button" data-remove-attachment="${index}" type="button">Remove</button>`
        : "";
      return `
        <article class="mission-attachment-card">
          <div class="mission-attachment-preview">${preview}</div>
          <div class="mission-attachment-meta">
            <strong>${escapeHtml(attachment.name || "Attachment")}</strong>
            <span>${escapeHtml(attachment.kind || "media")} · ${formatBytes(attachment.size)}</span>
          </div>
          ${removeButton}
        </article>
      `;
    })
    .join("");
}

const runtimeConfig = getRuntimeConfig();

const US_STATES = [
  "Alabama",
  "Alaska",
  "Arizona",
  "Arkansas",
  "California",
  "Colorado",
  "Connecticut",
  "Delaware",
  "Florida",
  "Georgia",
  "Hawaii",
  "Idaho",
  "Illinois",
  "Indiana",
  "Iowa",
  "Kansas",
  "Kentucky",
  "Louisiana",
  "Maine",
  "Maryland",
  "Massachusetts",
  "Michigan",
  "Minnesota",
  "Mississippi",
  "Missouri",
  "Montana",
  "Nebraska",
  "Nevada",
  "New Hampshire",
  "New Jersey",
  "New Mexico",
  "New York",
  "North Carolina",
  "North Dakota",
  "Ohio",
  "Oklahoma",
  "Oregon",
  "Pennsylvania",
  "Rhode Island",
  "South Carolina",
  "South Dakota",
  "Tennessee",
  "Texas",
  "Utah",
  "Vermont",
  "Virginia",
  "Washington",
  "West Virginia",
  "Wisconsin",
  "Wyoming",
  "District of Columbia"
];

const STATE_COORDINATES = {
  Alabama: { lat: 32.806671, lng: -86.79113 },
  Alaska: { lat: 61.370716, lng: -152.404419 },
  Arizona: { lat: 33.729759, lng: -111.431221 },
  Arkansas: { lat: 34.969704, lng: -92.373123 },
  California: { lat: 36.116203, lng: -119.681564 },
  Colorado: { lat: 39.059811, lng: -105.311104 },
  Connecticut: { lat: 41.597782, lng: -72.755371 },
  Delaware: { lat: 39.318523, lng: -75.507141 },
  Florida: { lat: 27.766279, lng: -81.686783 },
  Georgia: { lat: 33.040619, lng: -83.643074 },
  Hawaii: { lat: 21.094318, lng: -157.498337 },
  Idaho: { lat: 44.240459, lng: -114.478828 },
  Illinois: { lat: 40.349457, lng: -88.986137 },
  Indiana: { lat: 39.849426, lng: -86.258278 },
  Iowa: { lat: 42.011539, lng: -93.210526 },
  Kansas: { lat: 38.5266, lng: -96.726486 },
  Kentucky: { lat: 37.66814, lng: -84.670067 },
  Louisiana: { lat: 31.169546, lng: -91.867805 },
  Maine: { lat: 44.693947, lng: -69.381927 },
  Maryland: { lat: 39.063946, lng: -76.802101 },
  Massachusetts: { lat: 42.230171, lng: -71.530106 },
  Michigan: { lat: 43.326618, lng: -84.536095 },
  Minnesota: { lat: 45.694454, lng: -93.900192 },
  Mississippi: { lat: 32.741646, lng: -89.678696 },
  Missouri: { lat: 38.456085, lng: -92.288368 },
  Montana: { lat: 46.921925, lng: -110.454353 },
  Nebraska: { lat: 41.12537, lng: -98.268082 },
  Nevada: { lat: 38.313515, lng: -117.055374 },
  "New Hampshire": { lat: 43.452492, lng: -71.563896 },
  "New Jersey": { lat: 40.298904, lng: -74.521011 },
  "New Mexico": { lat: 34.840515, lng: -106.248482 },
  "New York": { lat: 42.165726, lng: -74.948051 },
  "North Carolina": { lat: 35.630066, lng: -79.806419 },
  "North Dakota": { lat: 47.528912, lng: -99.784012 },
  Ohio: { lat: 40.388783, lng: -82.764915 },
  Oklahoma: { lat: 35.565342, lng: -96.928917 },
  Oregon: { lat: 44.572021, lng: -122.070938 },
  Pennsylvania: { lat: 40.590752, lng: -77.209755 },
  "Rhode Island": { lat: 41.680893, lng: -71.51178 },
  "South Carolina": { lat: 33.856892, lng: -80.945007 },
  "South Dakota": { lat: 44.299782, lng: -99.438828 },
  Tennessee: { lat: 35.747845, lng: -86.692345 },
  Texas: { lat: 31.054487, lng: -97.563461 },
  Utah: { lat: 40.150032, lng: -111.862434 },
  Vermont: { lat: 44.045876, lng: -72.710686 },
  Virginia: { lat: 37.769337, lng: -78.169968 },
  Washington: { lat: 47.400902, lng: -121.490494 },
  "West Virginia": { lat: 38.491226, lng: -80.954453 },
  Wisconsin: { lat: 44.268543, lng: -89.616508 },
  Wyoming: { lat: 42.755966, lng: -107.30249 },
  "District of Columbia": { lat: 38.9072, lng: -77.0369 }
};

function getNextRole(role) {
  const index = ROLE_OPTIONS.indexOf(role);
  if (index === -1 || index === ROLE_OPTIONS.length - 1) {
    return "Officer / LE Partner";
  }

  return ROLE_OPTIONS[index + 1];
}

function buildProfile(user) {
  return {
    ...seededProfile,
    role: user?.role || seededProfile.role,
    nextRole: user?.nextRole || getNextRole(user?.role || seededProfile.role),
    readinessScore: user?.readinessScore ?? seededProfile.readinessScore,
    points: user?.points ?? seededProfile.points,
    region: user?.region || seededProfile.region,
    verification: user?.verificationStatus || seededProfile.verification,
    readinessItems: seededProfile.readinessItems
  };
}

function getRoleRank(role) {
  const index = ROLE_OPTIONS.indexOf(role);
  return index === -1 ? 0 : index;
}

function findMissionById(missionId) {
  return missionCatalog.find((mission) => mission.id === missionId) || null;
}

function normalizeMissionRecord(mission) {
  if (!mission) {
    return null;
  }

  return {
    ...mission,
    roles: Array.isArray(mission.roles) ? mission.roles : [],
    steps: Array.isArray(mission.steps) ? mission.steps : [],
    isActive: mission.isActive !== false
  };
}

function buildDefaultQuestBoard() {
  const availableQuests = missionCatalog
    .filter((mission) => mission.isActive !== false)
    .map((mission) => ({
      ...mission,
      access: describeMissionAccess(mission, [])
    }));

  return {
    availableQuests,
    assignments: [],
    summary: {
      activeCount: 0,
      submittedCount: 0,
      completedCount: 0,
      totalXpEarned: 0,
      claimableCount: availableQuests.filter((mission) => mission.access.claimable).length
    }
  };
}

function getQuestStatusMeta(status) {
  switch (status) {
    case "accepted":
      return {
        label: "Accepted",
        rewardLabel: "Reward pending confirmation",
        userLocked: false
      };
    case "submitted":
      return {
        label: "Submitted for confirmation",
        rewardLabel: "Awaiting confirmer review",
        userLocked: true
      };
    case "needs_revision":
      return {
        label: "Needs revision",
        rewardLabel: "Revise and resubmit",
        userLocked: false
      };
    case "confirmed":
      return {
        label: "Confirmed",
        rewardLabel: "Rewards granted",
        userLocked: true
      };
    default:
      return {
        label: status,
        rewardLabel: "Reward pending",
        userLocked: false
      };
  }
}

function describeMissionAccess(mission, assignments = questBoard.assignments) {
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

  if (getRoleRank(sessionUser?.role) < getRoleRank(mission.minimumRole || ROLE_OPTIONS[0])) {
    return {
      claimable: false,
      state: "locked",
      reason: `Requires ${mission.minimumRole}.`,
      assignmentId: null
    };
  }

  if ((sessionUser?.readinessScore || 0) < (mission.minReadiness || 0)) {
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

function normalizeQuestBoardPayload(payload) {
  if (Array.isArray(payload?.availableQuests)) {
    missionCatalog = payload.availableQuests.map((mission) => normalizeMissionRecord(mission)).filter(Boolean);
  }

  const assignments = Array.isArray(payload?.assignments)
    ? payload.assignments
        .map((assignment) => {
          const mission = findMissionById(assignment.missionId) || assignment.mission || null;
          return mission ? { ...assignment, mission, statusMeta: getQuestStatusMeta(assignment.status) } : null;
        })
        .filter(Boolean)
    : [];

  const availableQuests = Array.isArray(payload?.availableQuests)
    ? payload.availableQuests.map((mission) => normalizeMissionRecord(mission)).filter(Boolean)
    : missionCatalog
        .filter((mission) => mission.isActive !== false)
        .map((mission) => ({
        ...mission,
        access: describeMissionAccess(mission, assignments)
        }));

  return {
    availableQuests,
    assignments,
    summary: {
      activeCount:
        payload?.summary?.activeCount ??
        assignments.filter((item) => ["accepted", "needs_revision"].includes(item.status)).length,
      submittedCount:
        payload?.summary?.submittedCount ??
        assignments.filter((item) => item.status === "submitted").length,
      completedCount:
        payload?.summary?.completedCount ??
        assignments.filter((item) => item.status === "confirmed").length,
      totalXpEarned:
        payload?.summary?.totalXpEarned ??
        assignments
          .filter((item) => item.status === "confirmed")
          .reduce((sum, item) => sum + (item.xpReward || 0), 0),
      claimableCount:
        payload?.summary?.claimableCount ??
        availableQuests.filter((mission) => mission.access?.claimable).length
    }
  };
}

function getPageUrl(pageName) {
  const rawTarget = String(pageName || "").trim() || "/";
  if (/^(?:[a-z]+:)?\/\//iu.test(rawTarget)) {
    return rawTarget;
  }

  const normalizedTarget = rawTarget.replace(/^\.\//u, "/");
  const routeConfig =
    ROUTE_PAGE_LOOKUP.get(rawTarget) ||
    ROUTE_PAGE_LOOKUP.get(normalizedTarget) ||
    ROUTE_PAGE_LOOKUP.get(`/${normalizedTarget.replace(/^\//u, "")}`);
  const currentPathSegments = window.location.pathname.split("/").filter(Boolean);
  const firstPathSegment = currentPathSegments[0] ? `/${currentPathSegments[0]}` : "";
  const githubPagesBasePath =
    window.location.hostname.endsWith("github.io") &&
    firstPathSegment &&
    !ROUTE_PAGE_LOOKUP.has(firstPathSegment)
      ? firstPathSegment
      : "";
  const useLegacyPath =
    window.location.protocol === "file:" || window.location.hostname.endsWith("github.io");
  const path = routeConfig
    ? useLegacyPath
      ? `${githubPagesBasePath}${routeConfig.legacyPath}`
      : routeConfig.routePath
    : rawTarget;
  const resolvedPath = useLegacyPath ? path : path.replace(/^(?!\/)/u, "/");
  return new URL(resolvedPath, window.location.origin).toString();
}

function goToPage(pageName) {
  window.location.href = getPageUrl(pageName);
}

function isApiRequest(url) {
  return typeof url === "string" && url.startsWith("/api/");
}

function parseJsonBody(body) {
  if (!body) {
    return {};
  }

  if (typeof body === "string") {
    try {
      return JSON.parse(body);
    } catch (error) {
      throw new Error("Unable to read the request payload.");
    }
  }

  return body;
}

function buildDefaultUserProfile({ id, email, displayName, region, isAdmin = false }) {
  return {
    id,
    email: String(email || "").trim().toLowerCase(),
    displayName: String(displayName || "").trim() || "Guardian",
    role: isAdmin ? "Verifier / Moderator" : "Spotter / Tipster",
    region: String(region || "").trim() || "United States",
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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastLoginAt: null
  };
}

function buildDefaultIdentityVerification(user = sessionUser) {
  const now = new Date().toISOString();
  return {
    userId: user?.id || "",
    legalName: user?.displayName || "",
    phoneNumber: "",
    city: "",
    state: user?.region || "",
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

function mapBrowserSupabaseProfile(record) {
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

function profileToBrowserSupabaseRecord(user) {
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

function mapBrowserIdentityVerification(record) {
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

function identityVerificationToBrowserRecord(record) {
  return {
    user_id: record.userId,
    legal_name: record.legalName || null,
    phone_number: record.phoneNumber || null,
    city: record.city || null,
    state: record.state || null,
    birth_date: record.birthDate || null,
    id_document_type: record.idDocumentType || "unset",
    id_document_last4: record.idDocumentLast4 || null,
    officer_path_requested: Boolean(record.officerPathRequested),
    officer_department: record.officerDepartment || null,
    officer_work_email: record.officerWorkEmail || null,
    background_consent_at: record.backgroundConsentAt || null,
    training_acknowledged_at: record.trainingAcknowledgedAt || null,
    code_of_conduct_accepted_at: record.codeOfConductAcceptedAt || null,
    status: record.status || "draft",
    review_notes: record.reviewNotes || "",
    submitted_at: record.submittedAt || null,
    reviewed_at: record.reviewedAt || null
  };
}

async function ensureSupabaseBrowserScript() {
  if (window.supabase?.createClient) {
    return;
  }

  await new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-supabase-browser="true"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Unable to load Supabase.")), {
        once: true
      });
      return;
    }

    const script = document.createElement("script");
    script.src = STATIC_SUPABASE_SCRIPT;
    script.dataset.supabaseBrowser = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Unable to load Supabase."));
    document.head.appendChild(script);
  });
}

async function getBrowserSupabaseClient() {
  if (browserSupabaseClient) {
    return browserSupabaseClient;
  }

  if (!runtimeConfig.supabaseUrl || !runtimeConfig.supabaseAnonKey) {
    throw new Error(
      "GitHub Pages auth needs ./config.js with SUPABASE_URL and SUPABASE_ANON_KEY."
    );
  }

  await ensureSupabaseBrowserScript();
  browserSupabaseClient = window.supabase.createClient(
    runtimeConfig.supabaseUrl,
    runtimeConfig.supabaseAnonKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    }
  );
  return browserSupabaseClient;
}

async function detectAuthTransport() {
  try {
    const response = await fetch("/api/auth/session", {
      method: "GET",
      credentials: "same-origin",
      headers: {
        Accept: "application/json"
      }
    });
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      return "server";
    }
  } catch (error) {
    console.warn("Falling back to browser auth mode.", error);
  }

  if (runtimeConfig.supabaseUrl && runtimeConfig.supabaseAnonKey) {
    return "browser";
  }

  if (window.location.hostname.endsWith("github.io") || window.location.protocol === "file:") {
    return "browser";
  }

  return "server";
}

async function getAuthTransport() {
  if (!authTransportPromise) {
    authTransportPromise = detectAuthTransport();
  }

  return authTransportPromise;
}

async function getPostAuthLandingPage(user) {
  return user?.isAdmin ? "admin" : "dashboard";
}

async function requestJson(url, options = {}) {
  if (isApiRequest(url) && (await getAuthTransport()) === "browser") {
    return requestBrowserJson(url, options);
  }

  const response = await fetch(url, {
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : null;

  if (!response.ok) {
    throw new Error(payload?.error || "Request failed.");
  }

  return payload;
}

async function fetchBrowserProfile(client, authUser) {
  const { data, error } = await client.from("profiles").select("*").eq("id", authUser.id).maybeSingle();
  if (error) {
    throw new Error(error.message || "Unable to load your profile.");
  }

  if (data) {
    return mapBrowserSupabaseProfile(data);
  }

  const fallbackProfile = buildDefaultUserProfile({
    id: authUser.id,
    email: authUser.email,
    displayName: authUser.user_metadata?.displayName || authUser.user_metadata?.name || "Guardian",
    region: authUser.user_metadata?.region || "United States",
    isAdmin: Boolean(authUser.app_metadata?.is_admin)
  });

  const insertPayload = {
    ...profileToBrowserSupabaseRecord(fallbackProfile),
    last_login_at: new Date().toISOString()
  };
  const insertResult = await client.from("profiles").upsert(insertPayload).select().single();
  if (insertResult.error) {
    throw new Error(insertResult.error.message || "Unable to create your profile.");
  }

  return mapBrowserSupabaseProfile(insertResult.data);
}

async function updateBrowserProfile(client, userId, updates) {
  const { data, error } = await client.from("profiles").update(updates).eq("id", userId).select().single();
  if (error) {
    throw new Error(error.message || "Unable to update your profile.");
  }

  return mapBrowserSupabaseProfile(data);
}

async function getBrowserSessionPayload() {
  const client = await getBrowserSupabaseClient();
  const {
    data: { session },
    error
  } = await client.auth.getSession();

  if (error) {
    throw new Error(error.message || "Unable to read your session.");
  }

  if (!session?.user) {
    return {
      authenticated: false,
      provider: "supabase-browser"
    };
  }

  const user = await fetchBrowserProfile(client, session.user);

  return {
    authenticated: true,
    provider: "supabase-browser",
    user
  };
}

async function loginWithBrowserSupabase({ email, password }) {
  const client = await getBrowserSupabaseClient();
  const { data, error } = await client.auth.signInWithPassword({
    email: String(email || "").trim(),
    password: String(password || "")
  });

  if (error) {
    throw new Error(error.message || "Invalid email or password.");
  }

  const authUser = data.user;
  if (!authUser?.id) {
    throw new Error("Supabase did not return a user record.");
  }

  await fetchBrowserProfile(client, authUser);
  const user = await updateBrowserProfile(client, authUser.id, {
    last_login_at: new Date().toISOString()
  });

  return {
    ok: true,
    user
  };
}

async function registerWithBrowserSupabase(body) {
  const client = await getBrowserSupabaseClient();
  const email = String(body.email || "").trim().toLowerCase();
  const displayName = String(body.displayName || "").trim();
  const region = String(body.region || "").trim();
  const password = String(body.password || "");
  const legalAcceptance = buildLegalAcceptance({
    acceptedTerms: body.acceptedTerms,
    acceptedPrivacy: body.acceptedPrivacy,
    locationTrackingPreference: body.locationTrackingPreference
  });

  const signUpResult = await client.auth.signUp({
    email,
    password,
    options: {
      data: {
        displayName,
        region
      }
    }
  });

  if (signUpResult.error) {
    throw new Error(signUpResult.error.message || "Unable to create the account.");
  }

  let authUser = signUpResult.data.user;
  let session = signUpResult.data.session;

  if (!authUser?.id) {
    throw new Error("Supabase did not return a user record.");
  }

  if (!session) {
    const loginResult = await client.auth.signInWithPassword({
      email,
      password
    });
    if (loginResult.error) {
      throw new Error(
        loginResult.error.message ||
          "Account created. Check your email confirmation settings before signing in."
      );
    }
    authUser = loginResult.data.user;
  }

  const defaultProfile = buildDefaultUserProfile({
    id: authUser.id,
    email,
    displayName,
    region,
    isAdmin: Boolean(authUser.app_metadata?.is_admin)
  });
  const upsertPayload = {
    ...profileToBrowserSupabaseRecord({
      ...defaultProfile,
      legalVersion: legalAcceptance.legalVersion,
      termsAcceptedAt: legalAcceptance.termsAcceptedAt,
      privacyAcceptedAt: legalAcceptance.privacyAcceptedAt,
      locationTrackingPreference: legalAcceptance.locationTrackingPreference,
      locationTrackingUpdatedAt: legalAcceptance.locationTrackingUpdatedAt,
      lastLoginAt: new Date().toISOString()
    })
  };
  const upsertResult = await client.from("profiles").upsert(upsertPayload).select().single();
  if (upsertResult.error) {
    throw new Error(upsertResult.error.message || "Unable to save the account profile.");
  }

  return {
    ok: true,
    user: mapBrowserSupabaseProfile(upsertResult.data)
  };
}

async function updateBrowserAccount(body) {
  const client = await getBrowserSupabaseClient();
  const sessionPayload = await getBrowserSessionPayload();
  if (!sessionPayload.authenticated) {
    throw new Error("You must be signed in.");
  }

  const patch = {};
  const authData = {};

  if (body.displayName !== undefined) {
    patch.display_name = String(body.displayName || "").trim();
    authData.displayName = patch.display_name;
  }

  if (body.region !== undefined) {
    patch.region = String(body.region || "").trim();
    authData.region = patch.region;
  }

  if (body.locationTrackingPreference !== undefined) {
    patch.location_tracking_preference = normalizeLocationPreference(body.locationTrackingPreference);
    patch.location_tracking_updated_at =
      patch.location_tracking_preference === "unset" ? null : new Date().toISOString();
  }

  if (body.acceptedTerms) {
    patch.terms_accepted_at = new Date().toISOString();
  }

  if (body.acceptedPrivacy) {
    patch.privacy_accepted_at = new Date().toISOString();
  }

  if (body.acceptedTerms || body.acceptedPrivacy) {
    patch.legal_version = LEGAL_VERSION;
  }

  if (Object.keys(authData).length > 0) {
    const { error } = await client.auth.updateUser({
      data: authData
    });
    if (error) {
      throw new Error(error.message || "Unable to update your account metadata.");
    }
  }

  const user =
    Object.keys(patch).length > 0
      ? await updateBrowserProfile(client, sessionPayload.user.id, patch)
      : sessionPayload.user;

  return { user };
}

async function updateBrowserPassword(body) {
  const client = await getBrowserSupabaseClient();
  const sessionPayload = await getBrowserSessionPayload();
  if (!sessionPayload.authenticated) {
    throw new Error("You must be signed in.");
  }

  const verification = await client.auth.signInWithPassword({
    email: sessionPayload.user.email,
    password: String(body.currentPassword || "")
  });
  if (verification.error) {
    throw new Error(verification.error.message || "Current password is incorrect.");
  }

  const { error } = await client.auth.updateUser({
    password: String(body.newPassword || "")
  });
  if (error) {
    throw new Error(error.message || "Unable to update your password.");
  }

  return { ok: true };
}

function sanitizeBrowserMissionText(value, maxLength = 200, fallback = "") {
  return String(value ?? fallback)
    .trim()
    .slice(0, maxLength);
}

function sanitizeBrowserMissionList(value, maxItems = 12, itemMaxLength = 120) {
  const rawItems = Array.isArray(value)
    ? value
    : String(value || "")
        .split(/\r?\n|,/u)
        .map((item) => item.trim())
        .filter(Boolean);

  return rawItems
    .map((item) => sanitizeBrowserMissionText(item, itemMaxLength))
    .filter(Boolean)
    .slice(0, maxItems);
}

function slugifyBrowserMissionId(value) {
  const base = sanitizeBrowserMissionText(value, 80)
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-+|-+$/gu, "");

  return base || `mission-${Date.now().toString(36)}`;
}

function mapBrowserMissionRecord(record) {
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
    minimumRole: record.minimum_role || ROLE_OPTIONS[0],
    minReadiness: record.min_readiness ?? 0,
    xpReward: record.xp_reward ?? 0,
    readinessReward: record.readiness_reward ?? 0,
    rewardLabel: record.reward_label || "",
    steps: Array.isArray(record.steps) ? record.steps : [],
    isActive: record.is_active !== false,
    createdBy: record.created_by || null,
    updatedBy: record.updated_by || null,
    createdAt: record.created_at,
    updatedAt: record.updated_at
  };
}

function buildBrowserMissionMutation(body, { partial = false, existingMission = null } = {}) {
  const patch = {};

  if (!partial || body.id !== undefined) {
    const nextId = slugifyBrowserMissionId(body.id || body.title || existingMission?.id);
    if (!nextId) {
      throw new Error("Mission id is required.");
    }
    patch.id = nextId;
  }

  if (!partial || body.type !== undefined) {
    const nextType = sanitizeBrowserMissionText(body.type, 40);
    if (!MISSION_TYPES.has(nextType)) {
      throw new Error("Mission type must be online, hybrid, or realworld.");
    }
    patch.type = nextType;
  }

  if (!partial || body.title !== undefined) {
    const title = sanitizeBrowserMissionText(body.title, 120);
    if (!title) {
      throw new Error("Mission title is required.");
    }
    patch.title = title;
  }

  if (!partial || body.minimumRole !== undefined) {
    const minimumRole = sanitizeBrowserMissionText(body.minimumRole, 80);
    if (!ROLE_OPTIONS.includes(minimumRole)) {
      throw new Error("Mission minimum role is invalid.");
    }
    patch.minimum_role = minimumRole;
  }

  if (!partial || body.description !== undefined) {
    patch.description = sanitizeBrowserMissionText(body.description, 1200);
  }
  if (!partial || body.risk !== undefined) {
    patch.risk = sanitizeBrowserMissionText(body.risk, 120);
  }
  if (!partial || body.questGiver !== undefined) {
    patch.quest_giver = sanitizeBrowserMissionText(body.questGiver, 120);
  }
  if (!partial || body.questConfirmer !== undefined) {
    patch.quest_confirmer = sanitizeBrowserMissionText(body.questConfirmer, 120);
  }
  if (!partial || body.location !== undefined) {
    patch.location = sanitizeBrowserMissionText(body.location, 160);
  }
  if (!partial || body.schedule !== undefined) {
    patch.schedule = sanitizeBrowserMissionText(body.schedule, 160);
  }
  if (!partial || body.protocol !== undefined) {
    patch.protocol = sanitizeBrowserMissionText(body.protocol, 240);
  }
  if (!partial || body.rewardLabel !== undefined) {
    patch.reward_label = sanitizeBrowserMissionText(body.rewardLabel, 160);
  }
  if (!partial || body.roles !== undefined) {
    patch.roles = sanitizeBrowserMissionList(body.roles, 12, 80);
  }
  if (!partial || body.steps !== undefined) {
    patch.steps = sanitizeBrowserMissionList(body.steps, 12, 200);
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

async function listBrowserMissions(client, { includeInactive = true } = {}) {
  let query = client.from("missions").select("*").order("title", { ascending: true });
  if (!includeInactive) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message || "Unable to load missions.");
  }

  return data.map((record) => mapBrowserMissionRecord(record)).filter(Boolean);
}

async function ensureBrowserAdminSession() {
  const sessionPayload = await getBrowserSessionPayload();
  if (!sessionPayload.authenticated) {
    throw new Error("You must be signed in.");
  }
  if (!sessionPayload.user?.isAdmin) {
    throw new Error("Administrator access required.");
  }

  return sessionPayload;
}

async function listBrowserAdminMissions() {
  const client = await getBrowserSupabaseClient();
  await ensureBrowserAdminSession();
  return {
    missions: await listBrowserMissions(client, { includeInactive: true })
  };
}

async function createBrowserAdminMission(body) {
  const client = await getBrowserSupabaseClient();
  const sessionPayload = await ensureBrowserAdminSession();
  const patch = buildBrowserMissionMutation(body, { partial: false });

  const { data: existing, error: existingError } = await client
    .from("missions")
    .select("id")
    .eq("id", patch.id)
    .maybeSingle();
  if (existingError) {
    throw new Error(existingError.message || "Unable to validate the mission id.");
  }
  if (existing) {
    throw new Error("A mission with that id already exists.");
  }

  const { data, error } = await client
    .from("missions")
    .insert({
      ...patch,
      created_by: sessionPayload.user.id,
      updated_by: sessionPayload.user.id
    })
    .select()
    .single();
  if (error) {
    throw new Error(error.message || "Unable to create the mission.");
  }

  return { mission: mapBrowserMissionRecord(data) };
}

async function updateBrowserAdminMission(body, missionId) {
  const client = await getBrowserSupabaseClient();
  const sessionPayload = await ensureBrowserAdminSession();
  const { data: existing, error: existingError } = await client
    .from("missions")
    .select("*")
    .eq("id", missionId)
    .maybeSingle();
  if (existingError) {
    throw new Error(existingError.message || "Unable to load the mission.");
  }
  if (!existing) {
    throw new Error("Mission not found.");
  }

  if (body.id !== undefined && slugifyBrowserMissionId(body.id) !== missionId) {
    throw new Error("Mission ids cannot be changed after creation.");
  }

  const patch = buildBrowserMissionMutation(body, {
    partial: true,
    existingMission: mapBrowserMissionRecord(existing)
  });
  if (!Object.keys(patch).length) {
    throw new Error("No valid mission updates were provided.");
  }

  const { data, error } = await client
    .from("missions")
    .update({
      ...patch,
      updated_by: sessionPayload.user.id
    })
    .eq("id", missionId)
    .select()
    .single();
  if (error) {
    throw new Error(error.message || "Unable to update the mission.");
  }

  return { mission: mapBrowserMissionRecord(data) };
}

async function deleteBrowserAdminMission(missionId) {
  const client = await getBrowserSupabaseClient();
  await ensureBrowserAdminSession();
  const { data: existing, error: existingError } = await client
    .from("missions")
    .select("id")
    .eq("id", missionId)
    .maybeSingle();
  if (existingError) {
    throw new Error(existingError.message || "Unable to load the mission.");
  }
  if (!existing) {
    throw new Error("Mission not found.");
  }

  const { count, error: countError } = await client
    .from("user_quests")
    .select("id", { count: "exact", head: true })
    .eq("mission_id", missionId);
  if (countError) {
    throw new Error(countError.message || "Unable to check mission assignments.");
  }
  if ((count || 0) > 0) {
    throw new Error("This mission already has assignments. Set it inactive instead of deleting it.");
  }

  const { error } = await client.from("missions").delete().eq("id", missionId);
  if (error) {
    throw new Error(error.message || "Unable to delete the mission.");
  }

  return { ok: true };
}

async function getBrowserIdentityVerification() {
  const client = await getBrowserSupabaseClient();
  const sessionPayload = await getBrowserSessionPayload();
  if (!sessionPayload.authenticated) {
    throw new Error("You must be signed in.");
  }

  const { data, error } = await client
    .from("identity_verifications")
    .select("*")
    .eq("user_id", sessionPayload.user.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "Unable to load identity verification.");
  }

  if (data) {
    return { verification: mapBrowserIdentityVerification(data) };
  }

  const draft = buildDefaultIdentityVerification(sessionPayload.user);
  const insertResult = await client
    .from("identity_verifications")
    .upsert(identityVerificationToBrowserRecord(draft))
    .select()
    .single();

  if (insertResult.error) {
    throw new Error(insertResult.error.message || "Unable to create identity verification.");
  }

  return { verification: mapBrowserIdentityVerification(insertResult.data) };
}

async function updateBrowserIdentityVerification(body) {
  const client = await getBrowserSupabaseClient();
  const sessionPayload = await getBrowserSessionPayload();
  if (!sessionPayload.authenticated) {
    throw new Error("You must be signed in.");
  }

  const existingPayload = await getBrowserIdentityVerification();
  const existing = existingPayload.verification;
  const now = new Date().toISOString();
  const patch = {};

  if (body.legalName !== undefined) {
    patch.legal_name = String(body.legalName || "").trim();
  }
  if (body.phoneNumber !== undefined) {
    patch.phone_number = String(body.phoneNumber || "").trim();
  }
  if (body.city !== undefined) {
    patch.city = String(body.city || "").trim();
  }
  if (body.state !== undefined) {
    patch.state = String(body.state || "").trim();
  }
  if (body.birthDate !== undefined) {
    patch.birth_date = String(body.birthDate || "").trim();
  }
  if (body.idDocumentType !== undefined) {
    patch.id_document_type = String(body.idDocumentType || "unset").trim().toLowerCase();
  }
  if (body.idDocumentLast4 !== undefined) {
    patch.id_document_last4 = String(body.idDocumentLast4 || "").replace(/\D+/gu, "").slice(-4);
  }
  if (body.officerPathRequested !== undefined) {
    patch.officer_path_requested = Boolean(body.officerPathRequested);
  }
  if (body.officerDepartment !== undefined) {
    patch.officer_department = String(body.officerDepartment || "").trim();
  }
  if (body.officerWorkEmail !== undefined) {
    patch.officer_work_email = String(body.officerWorkEmail || "").trim().toLowerCase();
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

  if (existing.status === "changes_requested" || existing.status === "rejected") {
    patch.status = "draft";
  }

  const { data, error } = await client
    .from("identity_verifications")
    .update(patch)
    .eq("user_id", sessionPayload.user.id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message || "Unable to update identity verification.");
  }

  return { verification: mapBrowserIdentityVerification(data) };
}

function validateIdentityVerificationForSubmit(record) {
  if (!record.legalName) {
    throw new Error("Enter your legal name before submitting identity verification.");
  }
  if (!record.phoneNumber) {
    throw new Error("A phone number is required before submitting identity verification.");
  }
  if (!record.city || !record.state) {
    throw new Error("City and state are required before submitting identity verification.");
  }
  if (!record.birthDate) {
    throw new Error("Your date of birth is required before submitting identity verification.");
  }
  if (record.idDocumentType === "unset") {
    throw new Error("Choose an ID document type before submitting identity verification.");
  }
  if (!/^\d{4}$/u.test(record.idDocumentLast4 || "")) {
    throw new Error("Enter the last 4 digits of your ID document before submitting.");
  }
  if (!record.backgroundConsentAt || !record.trainingAcknowledgedAt || !record.codeOfConductAcceptedAt) {
    throw new Error("Consent and training acknowledgments are required before submitting.");
  }
  if (record.officerPathRequested && (!record.officerDepartment || !record.officerWorkEmail)) {
    throw new Error("Officer-path requests require a department and work email.");
  }
}

async function submitBrowserIdentityVerification() {
  const client = await getBrowserSupabaseClient();
  const sessionPayload = await getBrowserSessionPayload();
  if (!sessionPayload.authenticated) {
    throw new Error("You must be signed in.");
  }

  const current = (await getBrowserIdentityVerification()).verification;
  validateIdentityVerificationForSubmit(current);

  const now = new Date().toISOString();
  const { data: verificationData, error: verificationError } = await client
    .from("identity_verifications")
    .update({
      status: "in_review",
      submitted_at: now,
      reviewed_at: null
    })
    .eq("user_id", sessionPayload.user.id)
    .select()
    .single();

  if (verificationError) {
    throw new Error(verificationError.message || "Unable to submit identity verification.");
  }

  const verificationStatus = current.officerPathRequested
    ? "Officer verification pending"
    : "Moderator review required";
  const user = await updateBrowserProfile(client, sessionPayload.user.id, {
    verification_status: verificationStatus
  });

  return {
    user,
    verification: mapBrowserIdentityVerification(verificationData)
  };
}

async function requestBrowserPasswordReset(body) {
  const client = await getBrowserSupabaseClient();
  const redirectTo = getPageUrl("reset-password");
  const { error } = await client.auth.resetPasswordForEmail(String(body.email || "").trim(), {
    redirectTo
  });

  if (error) {
    throw new Error(error.message || "Unable to send a password reset email.");
  }

  return {
    ok: true,
    message: "If an account exists for that email, a reset link has been sent."
  };
}

async function listBrowserUserQuests(client, userId) {
  const { data, error } = await client
    .from("user_quests")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message || "Unable to load your quests.");
  }

  return data.map((record) => ({
    id: record.id,
    userId: record.user_id,
    missionId: record.mission_id,
    status: record.status,
    progressPercent: record.progress_percent,
    notes: record.notes || "",
    submissionText: record.submission_text || "",
    submissionAttachments: Array.isArray(record.submission_attachments)
      ? record.submission_attachments
      : [],
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
  }));
}

async function buildBrowserQuestBoard(user) {
  const client = await getBrowserSupabaseClient();
  missionCatalog = await listBrowserMissions(client, { includeInactive: true });
  const assignments = await listBrowserUserQuests(client, user.id);
  return normalizeQuestBoardPayload({
    assignments,
    availableQuests: missionCatalog
      .filter((mission) => mission.isActive !== false)
      .map((mission) => ({
      ...mission,
      access: describeMissionAccess(mission, assignments)
      }))
  });
}

async function claimBrowserQuest(body) {
  const client = await getBrowserSupabaseClient();
  const sessionPayload = await getBrowserSessionPayload();
  if (!sessionPayload.authenticated) {
    throw new Error("You must be signed in.");
  }

  const mission = findMissionById(String(body.missionId || "").trim());
  if (!mission) {
    throw new Error("Quest not found.");
  }

  const assignments = await listBrowserUserQuests(client, sessionPayload.user.id);
  const access = describeMissionAccess(mission, assignments);
  if (!access.claimable) {
    throw new Error(access.reason);
  }

  const { error } = await client.from("user_quests").insert({
    user_id: sessionPayload.user.id,
    mission_id: mission.id,
    status: "accepted",
    progress_percent: 0,
    notes: "",
    submission_text: "",
    submission_attachments: [],
    xp_reward: mission.xpReward,
    readiness_reward: mission.readinessReward,
    confirmation_notes: ""
  });
  if (error) {
    throw new Error(error.message || "Unable to claim the quest.");
  }

  return {
    user: sessionPayload.user,
    questBoard: await buildBrowserQuestBoard(sessionPayload.user)
  };
}

async function updateBrowserQuest(body, questId) {
  const client = await getBrowserSupabaseClient();
  const sessionPayload = await getBrowserSessionPayload();
  if (!sessionPayload.authenticated) {
    throw new Error("You must be signed in.");
  }

  const assignments = await listBrowserUserQuests(client, sessionPayload.user.id);
  const existingQuest = assignments.find((entry) => entry.id === questId);
  if (!existingQuest) {
    throw new Error("Quest not found.");
  }

  if (existingQuest.status === "confirmed") {
    throw new Error("Confirmed quests are read-only.");
  }

  if (existingQuest.status === "submitted") {
    throw new Error("This quest is waiting for confirmer review.");
  }

  const patch = {};
  if (body.notes !== undefined) {
    patch.notes = String(body.notes || "").trim().slice(0, 2000);
  }

  if (body.submissionText !== undefined) {
    patch.submission_text = String(body.submissionText || "").trim().slice(0, 4000);
  }

  if (Array.isArray(body.submissionAttachments) && body.submissionAttachments.some((item) => item?.dataUrl)) {
    throw new Error("Photo and video uploads require the Node server deployment.");
  }

  if (Array.isArray(body.submissionAttachments)) {
    patch.submission_attachments = body.submissionAttachments;
  }

  if (body.progressPercent !== undefined) {
    const progress = Number(body.progressPercent);
    if (!Number.isFinite(progress)) {
      throw new Error("Progress must be a number.");
    }
    patch.progress_percent = Math.max(0, Math.min(100, Math.round(progress)));
  }

  if (body.status !== undefined) {
    if (body.status !== "accepted" && body.status !== "submitted") {
      throw new Error("Quest status must stay accepted or move to submitted.");
    }
    patch.status = body.status;
  }

  const isSubmitting = patch.status === "submitted";
  if (isSubmitting) {
    const progress = patch.progress_percent ?? existingQuest.progressPercent;
    if (progress < 100) {
      throw new Error("Quests must reach 100% progress before confirmation can be requested.");
    }

    patch.submitted_at = new Date().toISOString();
  }

  const { error } = await client.from("user_quests").update(patch).eq("id", questId);
  if (error) {
    throw new Error(error.message || "Unable to update the quest.");
  }

  return {
    user: sessionPayload.user,
    questBoard: await buildBrowserQuestBoard(sessionPayload.user)
  };
}

async function requestBrowserJson(url, options = {}) {
  const body = parseJsonBody(options.body);

  if (url === "/api/auth/session") {
    return getBrowserSessionPayload();
  }

  if (url === "/api/auth/login") {
    return loginWithBrowserSupabase(body);
  }

  if (url === "/api/auth/register") {
    return registerWithBrowserSupabase(body);
  }

  if (url === "/api/auth/forgot-password") {
    return requestBrowserPasswordReset(body);
  }

  if (url === "/api/auth/logout") {
    const client = await getBrowserSupabaseClient();
    const { error } = await client.auth.signOut();
    if (error) {
      throw new Error(error.message || "Unable to sign out.");
    }

    return { ok: true };
  }

  if (url === "/api/account" && options.method === "GET") {
    const session = await getBrowserSessionPayload();
    if (!session.authenticated) {
      throw new Error("You must be signed in.");
    }

    return { user: session.user };
  }

  if (url === "/api/account" && options.method === "PATCH") {
    return updateBrowserAccount(body);
  }

  if (url === "/api/account/password" && options.method === "PATCH") {
    return updateBrowserPassword(body);
  }

  if (url === "/api/identity" && options.method === "GET") {
    return getBrowserIdentityVerification();
  }

  if (url === "/api/identity" && options.method === "PATCH") {
    return updateBrowserIdentityVerification(body);
  }

  if (url === "/api/identity/submit" && options.method === "POST") {
    return submitBrowserIdentityVerification();
  }

  if (url === "/api/quests" && options.method === "GET") {
    const session = await getBrowserSessionPayload();
    if (!session.authenticated) {
      throw new Error("You must be signed in.");
    }

    return buildBrowserQuestBoard(session.user);
  }

  if (url === "/api/quests" && options.method === "POST") {
    return claimBrowserQuest(body);
  }

  if (url.startsWith("/api/quests/") && options.method === "PATCH") {
    return updateBrowserQuest(body, url.split("/").pop());
  }

  if (url === "/api/admin/missions" && options.method === "GET") {
    return listBrowserAdminMissions();
  }

  if (url === "/api/admin/missions" && options.method === "POST") {
    return createBrowserAdminMission(body);
  }

  if (url.startsWith("/api/admin/missions/") && options.method === "PATCH") {
    return updateBrowserAdminMission(body, url.split("/").pop());
  }

  if (url.startsWith("/api/admin/missions/") && options.method === "DELETE") {
    return deleteBrowserAdminMission(url.split("/").pop());
  }

  if (url.startsWith("/api/admin/")) {
    throw new Error("The admin console still requires the Node/Supabase server deployment.");
  }

  throw new Error("Request failed.");
}

async function ensureMissionCommentsLoaded(missionId) {
  if (!missionId) {
    return [];
  }

  if (Array.isArray(missionCommentsByMissionId[missionId])) {
    return missionCommentsByMissionId[missionId];
  }

  const payload = await requestJson(`/api/missions/${missionId}/comments`, { method: "GET" });
  missionCommentsByMissionId[missionId] = Array.isArray(payload.comments) ? payload.comments : [];
  return missionCommentsByMissionId[missionId];
}

function renderMissionComments(container, missionId) {
  if (!container) {
    return;
  }

  const comments = Array.isArray(missionCommentsByMissionId[missionId])
    ? missionCommentsByMissionId[missionId]
    : null;

  if (!comments) {
    container.innerHTML = '<div class="mission-comment-empty">Loading mission discussion...</div>';
    return;
  }

  container.innerHTML = comments.length
    ? comments
        .map(
          (comment) => `
            <article class="mission-comment">
              <div class="mission-comment-head">
                <strong>${escapeHtml(comment.user?.displayName || "Guardian")}</strong>
                <span>${escapeHtml(comment.user?.role || "Member")} · ${new Date(
                  comment.createdAt
                ).toLocaleString()}</span>
              </div>
              <p>${escapeHtml(comment.message)}</p>
            </article>
          `
        )
        .join("")
    : '<div class="mission-comment-empty">No discussion yet. Start the thread for this mission.</div>';
}

async function postMissionComment(missionId, message) {
  const payload = await requestJson(`/api/missions/${missionId}/comments`, {
    method: "POST",
    body: JSON.stringify({ message })
  });
  missionCommentsByMissionId[missionId] = Array.isArray(payload.comments) ? payload.comments : [];
  return missionCommentsByMissionId[missionId];
}

function setFeedback(targetId, message, type = "info") {
  const target = document.getElementById(targetId);
  if (!target) {
    return;
  }

  target.textContent = message;
  target.className = `form-feedback ${type}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getRedditPageMeta() {
  return (
    REDDIT_PAGE_META[currentPage] || {
      label: "Workspace",
      description: "A focused surface for the current PredatorGuard workflow.",
      highlights: ["Review page content", "Use the left rail", "Follow the active workflow"],
      relatedPages: ["dashboard", "account", "roadmap"]
    }
  );
}

function renderRedditRailProfile() {
  const container = document.getElementById("reddit-rail-profile");
  if (!container || !sessionUser) {
    return;
  }

  container.innerHTML = `
    <div class="reddit-identity-row">
      <div class="brand-mark reddit-avatar">${escapeHtml(
        (sessionUser.displayName || "Guardian").slice(0, 2).toUpperCase()
      )}</div>
      <div>
        <strong>${escapeHtml(sessionUser.displayName || "Guardian")}</strong>
        <span>${escapeHtml(sessionUser.role || "Member")} · ${sessionUser.isAdmin ? "Admin" : "Guardian"}</span>
      </div>
    </div>
    <div class="reddit-rail-metrics">
      <div>
        <span>Karma</span>
        <strong>${buildProfile(sessionUser).points.toLocaleString()} XP</strong>
      </div>
      <div>
        <span>Status</span>
        <strong>${escapeHtml(buildProfile(sessionUser).verification)}</strong>
      </div>
    </div>
  `;
}

function renderRedditSidebar() {
  const container = document.getElementById("reddit-page-sidebar");
  if (!container) {
    return;
  }

  const meta = getRedditPageMeta();
  const relatedLinks = meta.relatedPages
    .map((pageKey) => {
      const config = PAGE_CONFIG[pageKey];
      if (!config) {
        return "";
      }

      const title = pageKey.charAt(0).toUpperCase() + pageKey.slice(1);
      return `<a class="reddit-side-link" href="${escapeHtml(
        getPageUrl(pageKey)
      )}">${escapeHtml(title)}</a>`;
    })
    .join("");

  container.innerHTML = `
    <section class="glass-card reddit-side-card">
      <p class="eyebrow">About this page</p>
      <h3>${escapeHtml(meta.label)}</h3>
      <p class="hero-text reddit-side-copy">${escapeHtml(meta.description)}</p>
      <div class="reddit-highlight-list">
        ${meta.highlights
          .map((item) => `<div class="reddit-highlight-item">${escapeHtml(item)}</div>`)
          .join("")}
      </div>
    </section>
    <section class="glass-card reddit-side-card">
      <p class="eyebrow">Related routes</p>
      <div class="reddit-side-links">${relatedLinks}</div>
    </section>
    <section class="glass-card reddit-side-card">
      <p class="eyebrow">Community rules</p>
      <div class="reddit-rule-list">
        <div class="reddit-rule-item">Stay workflow-focused and evidence-first.</div>
        <div class="reddit-rule-item">Use verified surfaces instead of freeform handoffs.</div>
        <div class="reddit-rule-item">Keep actions safety-gated and role-aware.</div>
      </div>
    </section>
  `;
}

function applyProtectedPageShell() {
  const shell = document.querySelector(".page-shell");
  const hero = shell?.querySelector("header.hero");
  const main = shell?.querySelector("main");
  const topbar = hero?.querySelector(".topbar");
  const nav = hero?.querySelector("#site-nav");

  if (!shell || !hero || !main || !topbar || shell.dataset.redditShellApplied === "true") {
    return;
  }

  shell.dataset.redditShellApplied = "true";
  shell.classList.add("reddit-shell");
  topbar.classList.add("reddit-topbar");
  shell.insertBefore(topbar, shell.firstChild);

  const frame = document.createElement("div");
  frame.className = "reddit-frame";

  const leftRail = document.createElement("aside");
  leftRail.className = "reddit-leftbar";

  const railCard = document.createElement("section");
  railCard.className = "glass-card reddit-rail-card";
  railCard.innerHTML = `
    <p class="eyebrow">Community</p>
    <h3>r/PredatorGuard</h3>
    <p class="hero-text reddit-rail-copy">
      A Reddit-style workspace for the operational pages this product actually needs.
    </p>
    <div id="reddit-rail-profile"></div>
  `;

  if (nav) {
    nav.classList.add("reddit-nav");
    railCard.appendChild(nav);
  }

  leftRail.appendChild(railCard);

  const mainColumn = document.createElement("div");
  mainColumn.className = "reddit-main-column";
  mainColumn.appendChild(hero);
  mainColumn.appendChild(main);

  const rightRail = document.createElement("aside");
  rightRail.className = "reddit-rightbar";
  rightRail.innerHTML = '<div id="reddit-page-sidebar"></div>';

  frame.append(leftRail, mainColumn, rightRail);
  shell.appendChild(frame);

  renderRedditRailProfile();
  renderRedditSidebar();
}

function createNav() {
  const nav = document.getElementById("site-nav");
  if (!nav) {
    return;
  }

  nav.innerHTML = "";

  const links = [
    ...pageLinksData,
    {
      title: "Account",
      href: getPageUrl("account"),
      description: "Manage your profile details, password, and session settings."
    }
  ];

  if (sessionUser?.isAdmin) {
    links.push({
      title: "Admin",
      href: getPageUrl("admin"),
      description: "Review members, roles, verification state, and access controls."
    });
  }

  links.forEach((link) => {
    const anchor = document.createElement("a");
    anchor.href = getPageUrl(link.href);
    anchor.textContent = link.title;
    anchor.className = currentPage === link.title.toLowerCase() ? "nav-link active" : "nav-link";
    nav.appendChild(anchor);
  });
}

function updateSessionChrome() {
  const badge = document.querySelector("[data-session-badge]");
  if (badge && sessionUser) {
    badge.textContent = `${sessionUser.displayName} - ${sessionUser.role}`;
  }

  document.querySelectorAll("[data-signout]").forEach((button) => {
    button.addEventListener("click", handleSignOut);
  });
}

async function handleSignOut() {
  try {
    await requestJson("/api/auth/logout", {
      method: "POST"
    });
  } catch (error) {
    console.error(error);
  } finally {
    goToPage("auth");
  }
}

function renderReadiness() {
  const badge = document.getElementById("readiness-badge");
  const score = document.getElementById("readiness-score");
  const list = document.getElementById("readiness-list");
  const profile = buildProfile(sessionUser);

  if (!badge || !score || !list) {
    return;
  }

  badge.textContent = `Next unlock: ${profile.nextRole}`;
  score.textContent = `${profile.readinessScore}%`;
  list.innerHTML = "";

  profile.readinessItems.forEach((item) => {
    const row = document.createElement("div");
    row.className = "readiness-item";
    row.innerHTML = `<strong>${item.title}</strong><span>${item.detail}</span>`;
    list.appendChild(row);
  });
}

function renderProfileCard() {
  const card = document.getElementById("profile-card");
  const profile = buildProfile(sessionUser);

  if (!card) {
    return;
  }

  card.innerHTML = "";

  const items = [
    ["Display name", sessionUser?.displayName || "Guardian"],
    ["Email", sessionUser?.email || "Not available"],
    ["Role", profile.role],
    ["Points", `${profile.points.toLocaleString()} XP`],
    ["Verification", profile.verification],
    ["State", profile.region],
    ["Admin access", sessionUser?.isAdmin ? "Enabled" : "Disabled"],
    ["Next role", profile.nextRole]
  ];

  items.forEach(([label, value]) => {
    const cell = document.createElement("div");
    cell.innerHTML = `<p class="profile-label">${label}</p><strong>${value}</strong>`;
    card.appendChild(cell);
  });
}

function renderDashboardStats() {
  const container = document.getElementById("dashboard-stats");
  if (!container) {
    return;
  }

  container.innerHTML = "";

  dashboardStatsData.forEach((stat) => {
    const card = document.createElement("article");
    card.className = "stat-card";
    card.innerHTML = `<p>${stat.label}</p><strong>${stat.value}</strong><span>${stat.detail}</span>`;
    container.appendChild(card);
  });
}

function getHotspotToneClass(tone) {
  if (tone === "high") {
    return "tone-high";
  }

  if (tone === "medium") {
    return "tone-medium";
  }

  return "tone-low";
}

function getDashboardHotspotById(hotspotId) {
  return dashboardHotspotsData.find((item) => item.id === hotspotId) || dashboardHotspotsData[0] || null;
}

function getHotspotMission(hotspot) {
  if (!hotspot?.missionId) {
    return null;
  }

  return missionsData.find((mission) => mission.id === hotspot.missionId) || null;
}

function renderDashboardHeroMiniGrid() {
  const container = document.getElementById("dashboard-hero-mini-grid");
  if (!container) {
    return;
  }

  const activeHotspot = getDashboardHotspotById(dashboardState.selectedHotspotId);
  const activeMission = getHotspotMission(activeHotspot);
  const items = [
    {
      label: "Active watch",
      value: activeHotspot ? activeHotspot.label : "No hotspot",
      detail: activeHotspot ? `${activeHotspot.state} • ${activeHotspot.window}` : "Awaiting radar data"
    },
    {
      label: "Claimable quests",
      value: `${questBoard.summary.claimableCount}`,
      detail: "Ready for your current role"
    },
    {
      label: "Priority route",
      value: activeMission ? activeMission.title : "Mission board",
      detail: activeMission ? activeMission.protocol : "Jump into a workflow"
    }
  ];

  container.innerHTML = items
    .map(
      (item) => `
        <div class="hero-mini-card">
          <span>${escapeHtml(item.label)}</span>
          <strong>${escapeHtml(item.value)}</strong>
          <small>${escapeHtml(item.detail)}</small>
        </div>
      `
    )
    .join("");
}

function renderDashboardHeroFocus() {
  const container = document.getElementById("dashboard-hero-focus");
  if (!container) {
    return;
  }

  const hotspot = getDashboardHotspotById(dashboardState.selectedHotspotId);
  const mission = getHotspotMission(hotspot);

  if (!hotspot) {
    container.innerHTML = "";
    return;
  }

  container.innerHTML = `
    <div class="dashboard-focus-head">
      <span class="mission-risk ${getHotspotToneClass(hotspot.tone)}">${escapeHtml(hotspot.coverage)}</span>
      <strong>${escapeHtml(hotspot.label)}</strong>
    </div>
    <p>${escapeHtml(hotspot.summary)}</p>
    <div class="dashboard-focus-meta">
      <span>${escapeHtml(hotspot.state)}</span>
      <span>${escapeHtml(hotspot.window)} window</span>
      <span>${hotspot.pings} pings</span>
    </div>
    <a class="secondary-button compact-button" href="${escapeHtml(
      getPageUrl(mission ? "missions" : "map")
    )}">${mission ? "Review mission" : "Open map"}</a>
  `;
}

function renderDashboardRadar() {
  const list = document.getElementById("dashboard-radar-list");
  const detail = document.getElementById("dashboard-radar-detail");
  if (!list || !detail) {
    return;
  }

  const selectedHotspot = getDashboardHotspotById(dashboardState.selectedHotspotId);
  const selectedMission = getHotspotMission(selectedHotspot);

  list.innerHTML = "";

  dashboardHotspotsData.forEach((hotspot) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `dashboard-radar-item ${
      hotspot.id === selectedHotspot?.id ? "active" : ""
    } ${getHotspotToneClass(hotspot.tone)}`;
    button.innerHTML = `
      <span>${escapeHtml(hotspot.coverage)}</span>
      <strong>${escapeHtml(hotspot.label)}</strong>
      <small>${escapeHtml(hotspot.state)} • ${escapeHtml(hotspot.window)}</small>
      <div class="dashboard-radar-metrics">
        <b>${hotspot.pings}</b>
        <small>pings</small>
      </div>
    `;
    button.addEventListener("click", () => {
      dashboardState.selectedHotspotId = hotspot.id;
      renderDashboardExperience();
    });
    list.appendChild(button);
  });

  if (!selectedHotspot) {
    detail.innerHTML = "";
    return;
  }

  detail.innerHTML = `
    <div class="dashboard-detail-stage ${getHotspotToneClass(selectedHotspot.tone)}">
      <div class="dashboard-detail-topline">
        <span class="mission-risk ${getHotspotToneClass(selectedHotspot.tone)}">${escapeHtml(
          selectedHotspot.coverage
        )}</span>
        <span class="chip">${selectedHotspot.pings} live pings</span>
      </div>
      <h4>${escapeHtml(selectedHotspot.label)} radar focus</h4>
      <p class="mission-description">${escapeHtml(selectedHotspot.summary)}</p>
      <div class="dashboard-detail-stats">
        <div>
          <span class="profile-label">Recommended response</span>
          <strong>${escapeHtml(selectedHotspot.response)}</strong>
        </div>
        <div>
          <span class="profile-label">Linked mission</span>
          <strong>${escapeHtml(selectedMission?.title || "Open workflow routing")}</strong>
        </div>
        <div>
          <span class="profile-label">Window</span>
          <strong>${escapeHtml(selectedHotspot.window)}</strong>
        </div>
        <div>
          <span class="profile-label">Trust lane</span>
          <strong>${escapeHtml(selectedMission?.minimumRole || seededProfile.role)}</strong>
        </div>
      </div>
    </div>
  `;
}

function renderDashboardActionGrid() {
  const container = document.getElementById("dashboard-action-grid");
  if (!container) {
    return;
  }

  const hotspot = getDashboardHotspotById(dashboardState.selectedHotspotId);
  const mission = getHotspotMission(hotspot);
  const cards = dashboardQuickActionsData.slice();

  if (hotspot && mission) {
    cards.unshift({
      id: `focus-${hotspot.id}`,
      title: `Focus ${hotspot.label}`,
      detail: hotspot.response,
      href: getPageUrl("missions"),
      cta: `Open ${mission.title}`
    });
  }

  container.innerHTML = cards
    .map(
      (card) => `
        <a class="dashboard-action-card" href="${escapeHtml(getPageUrl(card.href))}">
          <strong>${escapeHtml(card.title)}</strong>
          <span>${escapeHtml(card.detail)}</span>
          <b>${escapeHtml(card.cta)}</b>
        </a>
      `
    )
    .join("");
}

function renderDashboardActivityFilters() {
  const container = document.getElementById("dashboard-activity-filters");
  if (!container) {
    return;
  }

  const filters = [
    { id: "all", label: "All signals" },
    { id: "missions", label: "Missions" },
    { id: "reports", label: "Reports" },
    { id: "safety", label: "Safety" },
    { id: "training", label: "Training" }
  ];

  container.innerHTML = "";

  filters.forEach((filter) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `filter-button ${
      dashboardState.activityFilter === filter.id ? "active" : ""
    }`;
    button.textContent = filter.label;
    button.addEventListener("click", () => {
      dashboardState.activityFilter = filter.id;
      renderDashboardActivityFilters();
      renderDashboardActivityList();
    });
    container.appendChild(button);
  });
}

function renderDashboardActivityList() {
  const container = document.getElementById("dashboard-activity-list");
  if (!container) {
    return;
  }

  const items = dashboardActivityData.filter(
    (item) => dashboardState.activityFilter === "all" || item.category === dashboardState.activityFilter
  );

  container.innerHTML = items
    .map(
      (item) => `
        <article class="dashboard-activity-item ${getHotspotToneClass(item.tone)}">
          <div class="dashboard-activity-topline">
            <span class="mission-risk ${getHotspotToneClass(item.tone)}">${escapeHtml(item.category)}</span>
            <span>${escapeHtml(item.time)}</span>
          </div>
          <strong>${escapeHtml(item.title)}</strong>
          <p>${escapeHtml(item.detail)}</p>
          <small>${escapeHtml(item.actor)}</small>
        </article>
      `
    )
    .join("");
}

function renderDashboardReports() {
  const container = document.getElementById("dashboard-report-list");
  if (!container) {
    return;
  }

  container.innerHTML = dashboardReportsData
    .map(
      (report) => `
        <article class="dashboard-report-item">
          <div class="dashboard-activity-topline">
            <strong>${escapeHtml(report.title)}</strong>
            <span>${escapeHtml(report.confidence)}</span>
          </div>
          <p>${escapeHtml(report.status)}</p>
          <small>${escapeHtml(report.state)} • ${escapeHtml(report.channel)}</small>
        </article>
      `
    )
    .join("");
}

function renderDashboardExperience() {
  if (currentPage !== "dashboard") {
    return;
  }

  if (!dashboardState.selectedHotspotId && dashboardHotspotsData[0]?.id) {
    dashboardState.selectedHotspotId = dashboardHotspotsData[0].id;
  }

  renderDashboardHeroMiniGrid();
  renderDashboardHeroFocus();
  renderDashboardRadar();
  renderDashboardActionGrid();
  renderDashboardActivityFilters();
  renderDashboardActivityList();
  renderDashboardReports();
}

function renderPageLinks() {
  const container = document.getElementById("page-link-grid");
  if (!container) {
    return;
  }

  container.innerHTML = "";

  const links = pageLinksData
    .filter((link) => link.title.toLowerCase() !== "dashboard")
    .concat([
      {
        title: "Account",
        href: getPageUrl("account"),
        description: "Update your name, state, password, and device location."
      }
    ]);

  if (sessionUser?.isAdmin) {
    links.push({
      title: "Admin",
      href: getPageUrl("admin"),
      description: "Manage users, verification, points, and elevated access."
    });
  }

  links.forEach((link) => {
    const anchor = document.createElement("a");
    anchor.className = "page-link-card";
    anchor.href = getPageUrl(link.href);
    anchor.innerHTML = `<strong>${link.title}</strong><span>${link.description}</span>`;
    container.appendChild(anchor);
  });
}

function renderVerificationTimeline() {
  const timeline = document.getElementById("verification-timeline");
  if (!timeline) {
    return;
  }

  const activeStatus = identityVerificationRecord?.status || "draft";
  const officerRequested = Boolean(identityVerificationRecord?.officerPathRequested);

  timeline.innerHTML = "";

  verificationStepsData.forEach((step, index) => {
    let stepState = "pending";
    if (index === 0 && sessionUser) {
      stepState = "complete";
    } else if (index === 1 && identityVerificationRecord?.submittedAt) {
      stepState = activeStatus === "approved" ? "complete" : "current";
    } else if (
      index === 2 &&
      ["submitted", "in_review", "changes_requested", "approved", "rejected"].includes(activeStatus)
    ) {
      stepState = activeStatus === "approved" ? "complete" : "current";
    }

    if (index === 3 && activeStatus === "approved") {
      stepState = "complete";
    }

    const detailSuffix =
      index === 2 && officerRequested
        ? " Officer-path review requires department validation before approval."
        : "";
    const row = document.createElement("div");
    row.className = `timeline-step ${stepState}`;
    row.innerHTML = `
      <div class="timeline-marker"></div>
      <div class="timeline-copy">
        <strong>${step.title}</strong>
        <span>${step.detail}${detailSuffix}</span>
      </div>
    `;
    timeline.appendChild(row);
  });
}

function renderIdentityStatusCards() {
  const container = document.getElementById("identity-status-grid");
  if (!container || !identityVerificationRecord || !sessionUser) {
    return;
  }

  const submittedLabel = identityVerificationRecord.submittedAt
    ? new Date(identityVerificationRecord.submittedAt).toLocaleString()
    : "Not submitted";
  const reviewedLabel = identityVerificationRecord.reviewedAt
    ? new Date(identityVerificationRecord.reviewedAt).toLocaleString()
    : "Waiting for review";

  container.innerHTML = `
    <article class="mini-stat">
      <p>Verification state</p>
      <strong>${IDENTITY_STATUS_LABELS[identityVerificationRecord.status] || "Draft in progress"}</strong>
      <span>${sessionUser.verificationStatus}</span>
    </article>
    <article class="mini-stat">
      <p>Submission</p>
      <strong>${submittedLabel}</strong>
      <span>${identityVerificationRecord.officerPathRequested ? "Officer path requested" : "Standard guardian path"}</span>
    </article>
    <article class="mini-stat">
      <p>Review</p>
      <strong>${reviewedLabel}</strong>
      <span>${identityVerificationRecord.reviewNotes || "No reviewer notes yet."}</span>
    </article>
  `;
}

function renderIdentityProfileCard() {
  const card = document.getElementById("profile-card");
  if (!card || !sessionUser || !identityVerificationRecord) {
    return;
  }

  card.innerHTML = `
    <div>
      <p class="profile-label">Display name</p>
      <strong>${escapeHtml(sessionUser.displayName)}</strong>
    </div>
    <div>
      <p class="profile-label">Current role</p>
      <strong>${escapeHtml(sessionUser.role)}</strong>
    </div>
    <div>
      <p class="profile-label">Verification label</p>
      <strong>${escapeHtml(sessionUser.verificationStatus)}</strong>
    </div>
    <div>
      <p class="profile-label">Requested track</p>
      <strong>${identityVerificationRecord.officerPathRequested ? "Officer / LE Partner" : "Guardian progression"}</strong>
    </div>
    <div>
      <p class="profile-label">Region</p>
      <strong>${escapeHtml(identityVerificationRecord.state || sessionUser.region)}</strong>
    </div>
    <div>
      <p class="profile-label">Reviewer notes</p>
      <strong>${escapeHtml(identityVerificationRecord.reviewNotes || "No notes yet")}</strong>
    </div>
  `;
}

function populateIdentityForm(form) {
  if (!form || !identityVerificationRecord) {
    return;
  }

  form.elements.legalName.value = identityVerificationRecord.legalName || "";
  form.elements.phoneNumber.value = identityVerificationRecord.phoneNumber || "";
  form.elements.city.value = identityVerificationRecord.city || "";
  form.elements.state.value = identityVerificationRecord.state || sessionUser?.region || "";
  form.elements.birthDate.value = identityVerificationRecord.birthDate || "";
  form.elements.idDocumentType.value = identityVerificationRecord.idDocumentType || "unset";
  form.elements.idDocumentLast4.value = identityVerificationRecord.idDocumentLast4 || "";
  form.elements.officerPathRequested.checked = Boolean(identityVerificationRecord.officerPathRequested);
  form.elements.officerDepartment.value = identityVerificationRecord.officerDepartment || "";
  form.elements.officerWorkEmail.value = identityVerificationRecord.officerWorkEmail || "";
  form.elements.backgroundConsent.checked = Boolean(identityVerificationRecord.backgroundConsentAt);
  form.elements.trainingAcknowledged.checked = Boolean(identityVerificationRecord.trainingAcknowledgedAt);
  form.elements.codeOfConductAccepted.checked = Boolean(identityVerificationRecord.codeOfConductAcceptedAt);
}

function renderQuestSummary() {
  const summary = document.getElementById("quest-summary");
  if (!summary) {
    return;
  }

  summary.innerHTML = `
    <article class="mini-stat">
      <p>Active quests</p>
      <strong>${questBoard.summary.activeCount}</strong>
      <span>Assignments currently in progress</span>
    </article>
    <article class="mini-stat">
      <p>Awaiting confirmation</p>
      <strong>${questBoard.summary.submittedCount}</strong>
      <span>Ready for a confirmer to review</span>
    </article>
    <article class="mini-stat">
      <p>Confirmed</p>
      <strong>${questBoard.summary.completedCount}</strong>
      <span>Rewards granted after review</span>
    </article>
    <article class="mini-stat">
      <p>Quest XP earned</p>
      <strong>${questBoard.summary.totalXpEarned}</strong>
      <span>Total rewards from confirmed quests</span>
    </article>
  `;
}

function buildMissionBrief(mission, access) {
  const steps = Array.isArray(mission.steps)
    ? `<ol class="quest-step-list">${mission.steps
        .map((step) => `<li>${escapeHtml(step)}</li>`)
        .join("")}</ol>`
    : "";

  return `
    <strong>${escapeHtml(mission.title)}</strong><br />
    Quest giver: ${escapeHtml(mission.questGiver || "Operations board")}<br />
    Quest confirmer: ${escapeHtml(mission.questConfirmer || "Command review")}<br />
    Access: ${escapeHtml(mission.risk)}<br />
    Unlock: ${escapeHtml(access.reason)}<br />
    Rewards: ${mission.xpReward} XP, ${mission.readinessReward}% readiness, ${escapeHtml(
      mission.rewardLabel || "mission credit"
    )}<br />
    Protocol: ${escapeHtml(mission.protocol)}<br />
    ${steps}
  `;
}

function updateMissionPreview(message) {
  const missionPreview = document.getElementById("mission-preview");
  if (missionPreview) {
    missionPreview.innerHTML = message;
  }
}

async function handleQuestClaim(missionId) {
  updateMissionPreview("Accepting quest...");

  try {
    const payload = await requestJson("/api/quests", {
      method: "POST",
      body: JSON.stringify({ missionId })
    });

    if (payload.user) {
      sessionUser = payload.user;
    }
    questBoard = normalizeQuestBoardPayload(payload.questBoard);
    refreshQuestViews();
    updateMissionPreview("Quest accepted. Track your progress in My quests.");
  } catch (error) {
    updateMissionPreview(escapeHtml(error.message));
  }
}

async function handleQuestSave(questId, form, shouldSubmit = false) {
  const progress = Number(form.elements.progressPercent.value);
  const notes = form.elements.notes.value;

  try {
    const submissionText = form.elements.submissionText.value;
    const existingAttachments = parseJsonBody(form.elements.existingAttachments.value) || [];
    const submissionAttachments = await buildMissionAttachmentPayload(
      form.elements.submissionFiles,
      existingAttachments
    );
    const payload = await requestJson(`/api/quests/${questId}`, {
      method: "PATCH",
      body: JSON.stringify({
        progressPercent: shouldSubmit ? 100 : progress,
        notes,
        submissionText,
        submissionAttachments,
        status: shouldSubmit ? "submitted" : "accepted"
      })
    });

    if (payload.user) {
      sessionUser = payload.user;
    }
    questBoard = normalizeQuestBoardPayload(payload.questBoard);
    refreshQuestViews();
    updateMissionPreview(
      shouldSubmit
        ? "Quest submitted to the confirmer. Rewards will apply after approval."
        : "Quest progress saved."
    );
  } catch (error) {
    const feedback = form.querySelector(".form-feedback");
    if (feedback) {
      feedback.textContent = error.message;
      feedback.className = "form-feedback error";
    }
  }
}

function renderMyQuests() {
  const list = document.getElementById("my-quest-list");
  if (!list) {
    return;
  }

  if (!questBoard.assignments.length) {
    list.innerHTML =
      '<article class="mission-card"><h4>No quests accepted yet</h4><p class="mission-description">Accept a quest from the board to start tracking notes, progress, and rewards.</p></article>';
    return;
  }

  list.innerHTML = "";

  questBoard.assignments.forEach((assignment) => {
    const mission = assignment.mission;
    const card = document.createElement("article");
    card.className = "mission-card quest-progress-card";
    const statusMeta = assignment.statusMeta || getQuestStatusMeta(assignment.status);
    const isConfirmed = assignment.status === "confirmed";
    const isSubmitted = assignment.status === "submitted";
    const isLocked = statusMeta.userLocked;
    const attachments = Array.isArray(assignment.submissionAttachments)
      ? assignment.submissionAttachments
      : [];
    card.innerHTML = `
      <div class="mission-topline">
        <span class="mission-type">${escapeHtml(mission.type.replace("realworld", "real-world"))}</span>
        <span class="mission-risk">${escapeHtml(statusMeta.label)}</span>
      </div>
      <h4>${escapeHtml(mission.title)}</h4>
      <p class="mission-description">${escapeHtml(mission.description)}</p>
      <div class="quest-progress-meta">
        <span>Reward: ${assignment.xpReward} XP</span>
        <span>Readiness: +${assignment.readinessReward}%</span>
        <span>Giver: ${escapeHtml(mission.questGiver || "Operations")}</span>
        <span>Confirmer: ${escapeHtml(mission.questConfirmer || "Review queue")}</span>
        <span>Submitted: ${assignment.submittedAt ? new Date(assignment.submittedAt).toLocaleString() : "Not yet"}</span>
        <span>Confirmed: ${assignment.confirmedAt ? new Date(assignment.confirmedAt).toLocaleString() : "Pending admin review"}</span>
      </div>
      <form class="quest-progress-form">
        <label>
          Progress
          <input name="progressPercent" type="range" min="0" max="100" step="5" value="${assignment.progressPercent}" ${
            isLocked ? "disabled" : ""
          } />
        </label>
        <div class="quest-progress-meter">
          <span style="width: ${assignment.progressPercent}%"></span>
        </div>
        <div class="quest-progress-value">${assignment.progressPercent}% complete</div>
        <label>
          Field notes
          <textarea name="notes" rows="4" ${isLocked ? "disabled" : ""}>${escapeHtml(
            assignment.notes || ""
          )}</textarea>
        </label>
        <label>
          Mission submission
          <textarea name="submissionText" rows="4" placeholder="Add the mission write-up, what you observed, and anything reviewers should know." ${
            isLocked ? "disabled" : ""
          }>${escapeHtml(assignment.submissionText || "")}</textarea>
        </label>
        <input name="existingAttachments" type="hidden" value="${escapeHtml(
          JSON.stringify(attachments)
        )}" />
        <div class="mission-media-block">
          <div class="mission-media-head">
            <strong>Photos and videos</strong>
            <span>${attachments.length}/${MAX_MISSION_ATTACHMENTS} attached</span>
          </div>
          <div class="mission-attachment-grid">${buildSubmissionAttachmentMarkup(attachments, !isLocked)}</div>
          <label>
            Add media
            <input name="submissionFiles" type="file" accept="image/*,video/*" multiple ${
              isLocked ? "disabled" : ""
            } />
          </label>
        </div>
        <label>
          Confirmer notes
          <textarea name="confirmationNotes" rows="3" disabled>${escapeHtml(
            assignment.confirmationNotes || "No confirmer notes yet."
          )}</textarea>
        </label>
        <div class="mission-footer">
          <div class="required-roles"><span>${escapeHtml(mission.minimumRole)}</span></div>
          <div class="quest-actions">
            ${
              isConfirmed
                ? `<button class="secondary-button" type="button" disabled>Rewards applied</button>`
                : isSubmitted
                  ? `<button class="secondary-button" type="button" disabled>Waiting for confirmer</button>`
                  : `<button class="secondary-button" data-action="save" type="submit">Save progress</button>
                   <button class="primary-button" data-action="submit" type="button">Submit for confirmation</button>`
            }
          </div>
        </div>
        <div class="form-feedback ${isConfirmed ? "success" : isSubmitted ? "info" : "info"}">${
          isConfirmed
            ? "Quest confirmed and rewards granted."
            : isSubmitted
              ? "Awaiting confirmer review."
              : assignment.status === "needs_revision"
                ? "Revise the quest based on confirmer notes, then resubmit."
                : "Update progress and notes as you work."
        }</div>
      </form>
      <section class="mission-discussion-panel">
        <div class="mission-discussion-head">
          <div>
            <p class="profile-label">Mission forum</p>
            <strong>Mission thread</strong>
          </div>
        </div>
        <div class="mission-comment-list" data-mission-comments="${assignment.missionId}"></div>
        <form class="mission-comment-form" data-mission-id="${assignment.missionId}">
          <label>
            Add message
            <textarea name="message" rows="3" placeholder="Share context, ask a question, or post an update."></textarea>
          </label>
          <div class="quest-actions">
            <button class="secondary-button" type="submit">Post to thread</button>
          </div>
          <div class="form-feedback"></div>
        </form>
      </section>
    `;

    const form = card.querySelector(".quest-progress-form");
    const slider = form.querySelector('input[name="progressPercent"]');
    const value = card.querySelector(".quest-progress-value");
    const meter = card.querySelector(".quest-progress-meter span");

    if (slider && value && meter) {
      slider.addEventListener("input", () => {
        value.textContent = `${slider.value}% complete`;
        meter.style.width = `${slider.value}%`;
      });
    }

    const attachmentsInput = form.elements.existingAttachments;
    const attachmentsGrid = card.querySelector(".mission-attachment-grid");
    const fileInput = form.elements.submissionFiles;
    if (attachmentsInput && attachmentsGrid) {
      attachmentsGrid.addEventListener("click", (event) => {
        const button = event.target.closest("[data-remove-attachment]");
        if (!button || isLocked) {
          return;
        }

        const current = parseJsonBody(attachmentsInput.value) || [];
        current.splice(Number(button.dataset.removeAttachment), 1);
        attachmentsInput.value = JSON.stringify(current);
        attachmentsGrid.innerHTML = buildSubmissionAttachmentMarkup(current, !isLocked);
        const mediaHead = card.querySelector(".mission-media-head span");
        if (mediaHead) {
          mediaHead.textContent = `${current.length}/${MAX_MISSION_ATTACHMENTS} attached`;
        }
      });
    }

    if (!isLocked) {
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        await handleQuestSave(assignment.id, form, false);
      });

      form.querySelector('[data-action="submit"]').addEventListener("click", async () => {
        slider.value = "100";
        value.textContent = "100% complete";
        meter.style.width = "100%";
        await handleQuestSave(assignment.id, form, true);
      });
    }

    const commentList = card.querySelector(`[data-mission-comments="${assignment.missionId}"]`);
    const commentForm = card.querySelector(`.mission-comment-form[data-mission-id="${assignment.missionId}"]`);
    if (commentList) {
      renderMissionComments(commentList, assignment.missionId);
      ensureMissionCommentsLoaded(assignment.missionId)
        .then(() => renderMissionComments(commentList, assignment.missionId))
        .catch((error) => {
          commentList.innerHTML = `<div class="mission-comment-empty">${escapeHtml(error.message)}</div>`;
        });
    }

    commentForm?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const feedback = commentForm.querySelector(".form-feedback");
      const message = commentForm.elements.message.value.trim();
      if (!message) {
        if (feedback) {
          feedback.textContent = "Enter a message before posting.";
          feedback.className = "form-feedback error";
        }
        return;
      }

      if (feedback) {
        feedback.textContent = "Posting update...";
        feedback.className = "form-feedback";
      }

      try {
        await postMissionComment(assignment.missionId, message);
        commentForm.reset();
        renderMissionComments(commentList, assignment.missionId);
        if (feedback) {
          feedback.textContent = "Posted to mission thread.";
          feedback.className = "form-feedback success";
        }
      } catch (error) {
        if (feedback) {
          feedback.textContent = error.message;
          feedback.className = "form-feedback error";
        }
      }
    });

    list.appendChild(card);
  });
}

function renderMissions(filter = "all") {
  const missionList = document.getElementById("mission-list");
  if (!missionList) {
    return;
  }

  missionList.innerHTML = "";

  questBoard.availableQuests
    .filter((mission) => filter === "all" || mission.type === filter)
    .forEach((mission) => {
      const access = mission.access || describeMissionAccess(mission);
      const node = document.createElement("article");
      node.className = "mission-card";
      node.innerHTML = `
        <div class="mission-topline">
          <span class="mission-type">${escapeHtml(mission.type.replace("realworld", "real-world"))}</span>
          <span class="mission-risk">${escapeHtml(mission.risk)}</span>
        </div>
        <h4>${escapeHtml(mission.title)}</h4>
        <p class="mission-description">${escapeHtml(mission.description)}</p>
        <div class="mission-meta">
          Quest giver: ${escapeHtml(mission.questGiver || "Operations board")}<br />
          Quest confirmer: ${escapeHtml(mission.questConfirmer || "Command review")}<br />
          Location: ${escapeHtml(mission.location)}<br />
          Window: ${escapeHtml(mission.schedule)}<br />
          Protocol: ${escapeHtml(mission.protocol)}<br />
          Minimum role: ${escapeHtml(mission.minimumRole)}<br />
          Rewards: ${mission.xpReward} XP, ${mission.readinessReward}% readiness, ${escapeHtml(
            mission.rewardLabel || "mission credit"
          )}
        </div>
        <div class="mission-footer">
          <div class="required-roles"></div>
          <div class="quest-actions">
            <button class="secondary-button mission-button" type="button">View brief</button>
            <button class="primary-button mission-claim-button" type="button" ${
              access.claimable ? "" : "disabled"
            }>${access.claimable ? "Accept quest" : access.state === "confirmed" ? "Confirmed" : access.state === "submitted" ? "Pending review" : access.state === "needs_revision" ? "Needs revision" : access.state === "accepted" ? "Accepted" : access.state === "inactive" ? "Inactive" : "Locked"}</button>
          </div>
        </div>
        <div class="quest-status-note">${escapeHtml(access.reason)}</div>
      `;

      const roles = node.querySelector(".required-roles");
      mission.roles.forEach((role) => {
        const pill = document.createElement("span");
        pill.textContent = role;
        roles.appendChild(pill);
      });

      node.querySelector(".mission-button").addEventListener("click", () => {
        updateMissionPreview(buildMissionBrief(mission, access));
      });

      const claimButton = node.querySelector(".mission-claim-button");
      claimButton.addEventListener("click", async () => {
        await handleQuestClaim(mission.id);
      });

      missionList.appendChild(node);
    });
}

function renderDashboardQuestPanel() {
  const panel = document.getElementById("dashboard-quest-panel");
  if (!panel) {
    return;
  }

  const activeAssignments = questBoard.assignments.filter((assignment) =>
    ["accepted", "needs_revision", "submitted"].includes(assignment.status)
  );
  panel.innerHTML = `
    <div class="section-heading">
      <div>
        <p class="eyebrow">Quest system</p>
        <h3>Your live board</h3>
      </div>
      <a class="secondary-button compact-button" href="${escapeHtml(
        getPageUrl("missions")
      )}">Open quests</a>
    </div>
    <div class="dashboard-quest-stack">
      <div class="quest-dashboard-stat">
        <strong>${questBoard.summary.activeCount}</strong>
        <span>editable quests</span>
      </div>
      <div class="quest-dashboard-stat">
        <strong>${questBoard.summary.submittedCount}</strong>
        <span>awaiting confirmation</span>
      </div>
      <div class="quest-dashboard-stat">
        <strong>${questBoard.summary.totalXpEarned}</strong>
        <span>quest XP earned</span>
      </div>
    </div>
    <div class="dashboard-quest-list">
      ${
        activeAssignments.length
          ? activeAssignments
              .slice(0, 2)
              .map(
                (assignment) => `
                  <article class="dashboard-quest-card">
                    <strong>${escapeHtml(assignment.mission.title)}</strong>
                    <span>${escapeHtml((assignment.statusMeta || getQuestStatusMeta(assignment.status)).label)}</span>
                  </article>
                `
              )
              .join("")
          : '<article class="dashboard-quest-card"><strong>No active quests</strong><span>Accept a quest from the mission board to start earning rewards.</span></article>'
      }
    </div>
  `;
}

function refreshQuestViews() {
  updateSessionChrome();
  renderReadiness();
  renderProfileCard();
  renderQuestSummary();
  renderMyQuests();
  renderMissions(document.querySelector("[data-filter].active")?.dataset.filter || "all");
  renderDashboardQuestPanel();
  renderDashboardExperience();
}

function wireMissionFilters() {
  const filterButtons = document.querySelectorAll("[data-filter]");
  if (!filterButtons.length) {
    return;
  }

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      filterButtons.forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      renderMissions(button.dataset.filter);
    });
  });
}

function renderModules() {
  const list = document.getElementById("module-list");
  if (!list) {
    return;
  }

  list.innerHTML = "";

  modulesData.forEach((module) => {
    const card = document.createElement("article");
    card.className = "module-card";
    card.innerHTML = `
      <strong>${module.title}</strong>
      <span>${module.detail}</span>
      <div class="module-progress"><span style="width: ${module.progress}%"></span></div>
    `;
    list.appendChild(card);
  });
}

function renderSafetyControls() {
  const list = document.getElementById("safety-stack");
  if (!list) {
    return;
  }

  list.innerHTML = "";

  safetyControlsData.forEach((control) => {
    const card = document.createElement("div");
    card.className = "safety-card";
    card.innerHTML = `<span>${control.title}</span><strong>${control.detail}</strong>`;
    list.appendChild(card);
  });
}

function renderReportForm() {
  const reportForm = document.getElementById("report-form");
  const preview = document.getElementById("report-preview");
  if (!reportForm || !preview) {
    return;
  }

  reportForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(reportForm);
    const platform = formData.get("platform");
    const evidence = formData.get("evidence");
    const summary = formData.get("summary") || "No summary provided.";

    preview.innerHTML = `
      <strong>Draft created</strong><br />
      Platform: ${escapeHtml(platform)}<br />
      Evidence: ${escapeHtml(evidence)}<br />
      Status: Pending moderator validation<br />
      Summary: ${escapeHtml(summary)}
    `;
  });
}

function renderLeaderboard() {
  const list = document.getElementById("leaderboard");
  if (!list) {
    return;
  }

  list.innerHTML = "";

  leaderboardData.forEach((entry, index) => {
    const row = document.createElement("div");
    row.className = "leader-row";
    row.innerHTML = `
      <div class="leader-rank">${index + 1}</div>
      <div class="leader-copy">
        <strong>${entry.name}</strong>
        <span>${entry.role}</span>
      </div>
      <strong>${entry.points.toLocaleString()} XP</strong>
    `;
    list.appendChild(row);
  });
}

function renderScoringModel() {
  const list = document.getElementById("scoring-list");
  if (!list) {
    return;
  }

  list.innerHTML = "";

  scoringModelData.forEach((item) => {
    const card = document.createElement("article");
    card.className = "module-card";
    card.innerHTML = `<strong>${item.title}</strong><span>${item.detail}</span>`;
    list.appendChild(card);
  });
}

function renderRoadmap() {
  const grid = document.getElementById("roadmap-grid");
  if (!grid) {
    return;
  }

  grid.innerHTML = "";

  roadmapData.forEach((step) => {
    const card = document.createElement("article");
    const stepStatus = String(step.status || "planned");
    card.className = `roadmap-step roadmap-step-${stepStatus}`;
    card.innerHTML = `
      <div class="roadmap-step-topline">
        <span class="eyebrow">${escapeHtml(step.week)}</span>
        <span class="roadmap-status-chip roadmap-status-${stepStatus}">${escapeHtml(stepStatus)}</span>
      </div>
      <strong>${escapeHtml(step.title)}</strong>
      <p>${escapeHtml(step.detail)}</p>
      <small>${escapeHtml(step.progressLabel || "")}</small>
    `;
    grid.appendChild(card);
  });
}

function renderRoadmapPhases() {
  const list = document.getElementById("roadmap-phase-list");
  if (!list) {
    return;
  }

  list.innerHTML = "";

  roadmapPhasesData.forEach((phase) => {
    const article = document.createElement("article");
    const status = String(phase.status || "planned");
    const deliverables = Array.isArray(phase.deliverables) ? phase.deliverables : [];

    article.className = "roadmap-phase-card";
    article.innerHTML = `
      <div class="roadmap-phase-copy">
        <div class="roadmap-step-topline">
          <span class="eyebrow">${escapeHtml(phase.week || "")}</span>
          <span class="roadmap-status-chip roadmap-status-${status}">${escapeHtml(status)}</span>
        </div>
        <h4>${escapeHtml(phase.title || "")}</h4>
        <p>${escapeHtml(phase.summary || "")}</p>
        <p class="roadmap-phase-outcome">${escapeHtml(phase.outcome || "")}</p>
      </div>
      <div class="roadmap-deliverable-list">
        ${deliverables
          .map((item) => {
            const itemStatus = String(item.status || "planned");
            const label = escapeHtml(item.label || "");
            const href = item.href ? getPageUrl(item.href) : "";
            const linkMarkup = href
              ? `<a href="${href}">${label}</a>`
              : `<span>${label}</span>`;

            return `
              <div class="roadmap-deliverable">
                <div class="roadmap-deliverable-copy">
                  ${linkMarkup}
                </div>
                <span class="roadmap-status-chip roadmap-status-${itemStatus}">${escapeHtml(itemStatus)}</span>
              </div>
            `;
          })
          .join("")}
      </div>
    `;

    list.appendChild(article);
  });
}

function renderRoadmapFocus() {
  const list = document.getElementById("roadmap-focus-list");
  if (!list) {
    return;
  }

  list.innerHTML = "";

  roadmapFocusData.forEach((item) => {
    const card = document.createElement("article");
    const status = String(item.status || "next");

    card.className = `roadmap-focus-card roadmap-focus-${status}`;
    card.innerHTML = `
      <span class="roadmap-focus-label">${escapeHtml(status)}</span>
      <strong>${escapeHtml(item.title || "")}</strong>
      <p>${escapeHtml(item.detail || "")}</p>
    `;
    list.appendChild(card);
  });
}

function renderRoadmapPageLinks() {
  const container = document.getElementById("roadmap-page-links");
  if (!container) {
    return;
  }

  container.innerHTML = "";

  const links = pageLinksData
    .filter((link) => !["dashboard", "roadmap"].includes(String(link.title || "").toLowerCase()))
    .concat([
      {
        title: "Account",
        href: getPageUrl("account"),
        description: "Manage profile details, password changes, and location preferences."
      }
    ]);

  if (sessionUser?.isAdmin) {
    links.push({
      title: "Admin",
      href: getPageUrl("admin"),
      description: "Review user access, verification state, and quest operations."
    });
  }

  links.forEach((link) => {
    const anchor = document.createElement("a");
    anchor.className = "page-link-card";
    anchor.href = getPageUrl(link.href);
    anchor.innerHTML = `
      <strong>${escapeHtml(link.title || "")}</strong>
      <span>${escapeHtml(link.description || "")}</span>
    `;
    container.appendChild(anchor);
  });
}

function stateToId(stateName) {
  return String(stateName || "")
    .toLowerCase()
    .replace(/[^a-z]+/g, "-")
    .replace(/^-|-$/g, "");
}

function isKnownState(value) {
  return US_STATES.includes(String(value || ""));
}

function getStateCoordinates(stateName) {
  return STATE_COORDINATES[stateName] || { lat: 39.8283, lng: -98.5795 };
}

function offsetLatLng(base, latOffset = 0, lngOffset = 0) {
  return {
    lat: base.lat + latOffset,
    lng: base.lng + lngOffset
  };
}

function populateStateSelect(select, selectedValue = "") {
  if (!select || select.dataset.statesReady === "true") {
    if (select && selectedValue) {
      select.value = selectedValue;
    }
    return;
  }

  US_STATES.forEach((stateName) => {
    const option = document.createElement("option");
    option.value = stateName;
    option.textContent = stateName;
    select.appendChild(option);
  });

  select.dataset.statesReady = "true";
  if (selectedValue) {
    select.value = selectedValue;
  }
}

function getLocationStorageKey() {
  return sessionUser?.id ? `pg_location_${sessionUser.id}` : "";
}

function getStoredLocation() {
  const key = getLocationStorageKey();
  if (!key) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error(error);
    return null;
  }
}

function saveStoredLocation(location) {
  const key = getLocationStorageKey();
  if (!key) {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(location));
}

function clearStoredLocation() {
  const key = getLocationStorageKey();
  if (!key) {
    return;
  }

  window.localStorage.removeItem(key);
}

function formatStoredLocation(location) {
  if (!location) {
    return "No browser location captured yet.";
  }

  const timestamp = new Date(location.capturedAt).toLocaleString();
  const sourceLabel = location.source === "manual" ? "Manual" : "Device";
  const accuracy =
    location.source === "manual" ? "State-level estimate" : `+/-${Math.round(location.accuracy || 0)}m`;
  const coords =
    Number.isFinite(location.latitude) && Number.isFinite(location.longitude)
      ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`
      : "State center";
  const label = location.label ? `${location.label} - ` : "";
  return `${sourceLabel}: ${label}${location.state} - ${coords} - ${accuracy} - ${timestamp}`;
}

function renderLocationPreview() {
  const preview = document.getElementById("location-preview");
  if (!preview) {
    return;
  }

  const location = getStoredLocation();
  preview.textContent = location
    ? `Current saved location: ${formatStoredLocation(location)}`
    : "No location saved yet. Capture your device location or choose a manual state-based location to place yourself on the U.S. map.";
}

function renderLegalSummary() {
  const summary = document.getElementById("legal-summary");
  if (!summary || !sessionUser) {
    return;
  }

  const termsAccepted = sessionUser.termsAcceptedAt
    ? new Date(sessionUser.termsAcceptedAt).toLocaleString()
    : "Not yet accepted";
  const privacyAccepted = sessionUser.privacyAcceptedAt
    ? new Date(sessionUser.privacyAcceptedAt).toLocaleString()
    : "Not yet accepted";
  const preferenceLabels = {
    unset: "No preference saved",
    device: "Device location when allowed",
    manual: "Manual location only",
    declined: "Location declined"
  };

  summary.innerHTML = `
    <div>
      <p class="profile-label">Legal version</p>
      <strong>${LEGAL_VERSION}</strong>
    </div>
    <div>
      <p class="profile-label">Terms accepted</p>
      <strong>${termsAccepted}</strong>
    </div>
    <div>
      <p class="profile-label">Privacy accepted</p>
      <strong>${privacyAccepted}</strong>
    </div>
    <div>
      <p class="profile-label">Tracking preference</p>
      <strong>${preferenceLabels[sessionUser.locationTrackingPreference] || "No preference saved"}</strong>
    </div>
  `;
}

function buildRuntimeMapUsers() {
  const users = mapUsersData.map((user) => ({ ...user }));
  const storedLocation = getStoredLocation();

  if (sessionUser && isKnownState(sessionUser.region)) {
    users.push({
      id: `session-${sessionUser.id}`,
      name: sessionUser.displayName,
      role: sessionUser.role,
      xp: sessionUser.points ?? 0,
      status: storedLocation
        ? storedLocation.source === "manual"
          ? "Manual location shared"
          : "Device location shared"
        : "State selected",
      focus: storedLocation
        ? storedLocation.source === "manual"
          ? "Manual fallback location available"
          : "Current device location available"
        : "Awaiting location capture",
      state: sessionUser.region,
      isCurrentUser: true
    });
  }

  return users;
}

function buildRuntimeMapRegions() {
  const users = buildRuntimeMapUsers();
  const stateNames = new Set([
    ...mapRegionsData.map((region) => region.name),
    ...users.map((user) => user.state),
    ...mapQuestsData.map((quest) => quest.state)
  ]);

  return Array.from(stateNames)
    .filter(Boolean)
    .map((stateName) => {
      const seeded = mapRegionsData.find((region) => region.name === stateName);
      const userCount = users.filter((user) => user.state === stateName).length;
      const questCount = mapQuestsData.filter((quest) => quest.state === stateName).length;

      return {
        id: seeded?.id || stateToId(stateName),
        name: stateName,
        focus: seeded?.focus || "State-selected guardian coverage",
        status: seeded?.status || (questCount ? "Active coverage" : "Profile-only location"),
        users: userCount,
        quests: questCount
      };
    })
    .sort((left, right) => left.name.localeCompare(right.name));
}

function buildProjectedLocationMarker(location) {
  if (!location || !isKnownState(location.state)) {
    return null;
  }

  const fallback = getStateCoordinates(location.state);

  return {
    id: "current-location",
    state: location.state,
    lat: Number.isFinite(location.latitude) ? location.latitude : fallback.lat,
    lng: Number.isFinite(location.longitude) ? location.longitude : fallback.lng,
    latitude: location.latitude,
    longitude: location.longitude,
    accuracy: location.accuracy,
    capturedAt: location.capturedAt,
    source: location.source || "device",
    label: location.label || ""
  };
}

function getMapSelection() {
  if (!mapState.selectedType || !mapState.selectedId) {
    return null;
  }

  if (mapState.selectedType === "location") {
    const location = getStoredLocation();
    return location ? buildProjectedLocationMarker(location) : null;
  }

  const source =
    mapState.selectedType === "region"
      ? buildRuntimeMapRegions()
      : mapState.selectedType === "user"
        ? buildRuntimeMapUsers()
        : mapQuestsData;

  return source.find((item) => item.id === mapState.selectedId) || null;
}

function getMapRelatedSet(selectedType, selectedId) {
  const regions = buildRuntimeMapRegions();
  const users = buildRuntimeMapUsers();
  const quests = mapQuestsData;
  const location = buildProjectedLocationMarker(getStoredLocation());

  if (!selectedType || !selectedId) {
    return {
      regionIds: new Set(regions.map((region) => region.id)),
      userIds: new Set(users.map((user) => user.id)),
      questIds: new Set(quests.map((quest) => quest.id)),
      locationIds: new Set(location ? [location.id] : [])
    };
  }

  const selectedState =
    selectedType === "region"
      ? regions.find((region) => region.id === selectedId)?.name
      : selectedType === "user"
        ? users.find((user) => user.id === selectedId)?.state
        : selectedType === "quest"
          ? quests.find((quest) => quest.id === selectedId)?.state
          : location?.state;

  if (!selectedState) {
    return getMapRelatedSet(null, null);
  }

  return {
    regionIds: new Set(regions.filter((region) => region.name === selectedState).map((region) => region.id)),
    userIds: new Set(users.filter((user) => user.state === selectedState).map((user) => user.id)),
    questIds: new Set(quests.filter((quest) => quest.state === selectedState).map((quest) => quest.id)),
    locationIds: new Set(location?.state === selectedState ? [location.id] : [])
  };
}

function setMapSelection(type, id) {
  mapState.selectedType = type;
  mapState.selectedId = id;
  renderMapExperience();
}

function clearMapSelection() {
  mapState.selectedType = null;
  mapState.selectedId = null;
  renderMapExperience();
}

function getMapDetailContent() {
  const selection = getMapSelection();
  const regions = buildRuntimeMapRegions();
  const users = buildRuntimeMapUsers();

  if (!selection) {
    return {
      title: "U.S. overview",
      copy: "Select any state, guardian, quest, or your location marker to inspect linked activity.",
      stats: [
        ["States", String(regions.length)],
        ["Users", String(users.length)],
        ["Quests", String(mapQuestsData.length)],
        ["Location", getStoredLocation() ? "Saved" : "Not saved"]
      ],
      preview:
        "State selection is stored on the backend. Device coordinates stay on this browser, and manual fallback uses the state you choose."
    };
  }

  if (mapState.selectedType === "region") {
    return {
      title: selection.name,
      copy: `${selection.focus}. ${selection.status}.`,
      stats: [
        ["Status", selection.status],
        ["Users", String(selection.users)],
        ["Quests", String(selection.quests)],
        ["State", selection.name]
      ],
      preview: `${selection.name} currently shows ${selection.users} guardians and ${selection.quests} active quests.`
    };
  }

  if (mapState.selectedType === "user") {
    return {
      title: selection.name,
      copy: `${selection.role} assigned to ${selection.state}. Current focus: ${selection.focus}.`,
      stats: [
        ["Status", selection.status],
        ["XP", `${selection.xp}`],
        ["State", selection.state],
        ["Role", selection.role]
      ],
      preview: selection.isCurrentUser
        ? "This is your current account marker. Capture device location or save a manual location to place a more precise point on the map."
        : `${selection.name} is linked to active quests in ${selection.state}.`
    };
  }

  if (mapState.selectedType === "location") {
    const accuracy =
      selection.source === "manual" ? "State-level estimate" : `+/-${Math.round(selection.accuracy || 0)}m`;
    return {
      title: selection.source === "manual" ? "Your manual location" : "Your current location",
      copy:
        selection.source === "manual"
          ? `Manual location saved for ${selection.state}. This marker uses the state you selected so you can stay visible on the map without browser geolocation.`
          : `Browser-captured location in ${selection.state}. This marker reflects the current device and stored coordinates on this browser.`,
      stats: [
        ["State", selection.state],
        ["Latitude", selection.latitude.toFixed(4)],
        ["Longitude", selection.longitude.toFixed(4)],
        ["Accuracy", accuracy]
      ],
      preview:
        selection.source === "manual"
          ? `Saved ${new Date(selection.capturedAt).toLocaleString()}${selection.label ? ` for ${selection.label}` : ""}.`
          : `Captured ${new Date(selection.capturedAt).toLocaleString()}.`
    };
  }

  return {
    title: selection.title,
    copy: `${selection.type} quest in ${selection.state} with a ${selection.difficulty.toLowerCase()} access level.`,
    stats: [
      ["Type", selection.type],
      ["Window", selection.window],
      ["Difficulty", selection.difficulty],
      ["State", selection.state]
    ],
    preview: selection.objective
  };
}

function renderMapDetail() {
  const title = document.getElementById("map-detail-title");
  const copy = document.getElementById("map-detail-copy");
  const stats = document.getElementById("map-detail-stats");
  const preview = document.getElementById("map-detail-preview");

  if (!title || !copy || !stats || !preview) {
    return;
  }

  const detail = getMapDetailContent();
  title.textContent = detail.title;
  copy.textContent = detail.copy;
  preview.textContent = detail.preview;
  stats.innerHTML = "";

  detail.stats.forEach(([label, value]) => {
    const cell = document.createElement("div");
    cell.innerHTML = `<p class="profile-label">${label}</p><strong>${value}</strong>`;
    stats.appendChild(cell);
  });
}

function createMapEntityCard(type, item, isActive) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `map-entity-card${isActive ? " active" : ""}`;

  if (type === "region") {
    button.innerHTML = `
      <span class="map-entity-meta">State</span>
      <strong>${item.name}</strong>
      <span>${item.users} users · ${item.quests} quests</span>
    `;
  }

  if (type === "user") {
    button.innerHTML = `
      <span class="map-entity-meta">User</span>
      <strong>${item.name}</strong>
      <span>${item.role} - ${item.state}</span>
    `;
  }

  if (type === "quest") {
    button.innerHTML = `
      <span class="map-entity-meta">Quest</span>
      <strong>${item.title}</strong>
      <span>${item.type} - ${item.state}</span>
    `;
  }

  button.addEventListener("click", () => {
    setMapSelection(type, item.id);
  });

  return button;
}

function renderMapLists() {
  const regionList = document.getElementById("map-region-list");
  const userList = document.getElementById("map-user-list");
  const questList = document.getElementById("map-quest-list");

  if (!regionList || !userList || !questList) {
    return;
  }

  const related = getMapRelatedSet(mapState.selectedType, mapState.selectedId);
  const regions = buildRuntimeMapRegions();
  const users = buildRuntimeMapUsers();

  regionList.innerHTML = "";
  userList.innerHTML = "";
  questList.innerHTML = "";

  regions
    .filter((region) => related.regionIds.has(region.id))
    .forEach((region) => {
      regionList.appendChild(
        createMapEntityCard("region", region, mapState.selectedType === "region" && mapState.selectedId === region.id)
      );
    });

  users
    .filter((user) => related.userIds.has(user.id))
    .forEach((user) => {
      userList.appendChild(
        createMapEntityCard("user", user, mapState.selectedType === "user" && mapState.selectedId === user.id)
      );
    });

  mapQuestsData
    .filter((quest) => related.questIds.has(quest.id))
    .forEach((quest) => {
      questList.appendChild(
        createMapEntityCard("quest", quest, mapState.selectedType === "quest" && mapState.selectedId === quest.id)
      );
    });
}

function renderMapStage() {
  const canvas = document.getElementById("map-canvas");
  if (!canvas || typeof window.L === "undefined") {
    return;
  }

  if (!liveMap) {
    liveMap = window.L.map(canvas, {
      zoomControl: true,
      scrollWheelZoom: true
    }).setView([39.8283, -98.5795], 4);

    window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(liveMap);
  }

  liveMapLayers.forEach((layer) => {
    liveMap.removeLayer(layer);
  });
  liveMapLayers = [];

  const related = getMapRelatedSet(mapState.selectedType, mapState.selectedId);
  const filter = mapState.filter;
  const regions = buildRuntimeMapRegions();
  const users = buildRuntimeMapUsers();
  const location = buildProjectedLocationMarker(getStoredLocation());

  const bounds = [];

  regions.forEach((region) => {
    if (filter !== "all" && filter !== "regions") {
      return;
    }

    const statePosition = getStateCoordinates(region.name);
    const marker = window.L.circleMarker([statePosition.lat, statePosition.lng], {
      radius: mapState.selectedType === "region" && mapState.selectedId === region.id ? 14 : 10,
      color: related.regionIds.has(region.id) ? "#7cf7cf" : "rgba(156,179,202,0.55)",
      weight: 2,
      fillColor: "#569dff",
      fillOpacity: related.regionIds.has(region.id) ? 0.45 : 0.18
    })
      .addTo(liveMap)
      .bindTooltip(`${region.name}: ${region.users} users, ${region.quests} quests`)
      .on("click", () => setMapSelection("region", region.id));

    liveMapLayers.push(marker);
    bounds.push([statePosition.lat, statePosition.lng]);
  });

  users.forEach((user) => {
    if (filter !== "all" && filter !== "users") {
      return;
    }

    const statePosition = getStateCoordinates(user.state);
    const userPosition = offsetLatLng(
      statePosition,
      user.isCurrentUser ? 0.9 : 0.55,
      user.isCurrentUser ? 0.9 : -0.9
    );
    const marker = window.L.marker([userPosition.lat, userPosition.lng], {
      title: user.name
    })
      .addTo(liveMap)
      .bindPopup(`<strong>${escapeHtml(user.name)}</strong><br />${escapeHtml(user.role)}<br />${escapeHtml(user.state)}`)
      .on("click", () => setMapSelection("user", user.id));

    if (!related.userIds.has(user.id)) {
      marker.setOpacity(0.4);
    }

    liveMapLayers.push(marker);
    bounds.push([userPosition.lat, userPosition.lng]);
  });

  mapQuestsData.forEach((quest) => {
    if (filter !== "all" && filter !== "quests") {
      return;
    }

    const statePosition = getStateCoordinates(quest.state);
    const questPosition = offsetLatLng(statePosition, -0.8, 1.2);
    const marker = window.L.circleMarker([questPosition.lat, questPosition.lng], {
      radius: mapState.selectedType === "quest" && mapState.selectedId === quest.id ? 11 : 8,
      color: related.questIds.has(quest.id) ? "#ffcb66" : "rgba(156,179,202,0.55)",
      weight: 2,
      fillColor: "#ffcb66",
      fillOpacity: related.questIds.has(quest.id) ? 0.55 : 0.2
    })
      .addTo(liveMap)
      .bindPopup(
        `<strong>${escapeHtml(quest.title)}</strong><br />${escapeHtml(quest.type)}<br />${escapeHtml(quest.state)}`
      )
      .on("click", () => setMapSelection("quest", quest.id));

    liveMapLayers.push(marker);
    bounds.push([questPosition.lat, questPosition.lng]);
  });

  if (location) {
    const accuracyCircle = window.L.circle([location.lat, location.lng], {
      radius: Math.max(Number(location.accuracy || 0), 50),
      color: "#87baff",
      weight: 1,
      fillColor: "#87baff",
      fillOpacity: 0.18
    }).addTo(liveMap);

    const locationMarker = window.L.circleMarker([location.lat, location.lng], {
      radius: mapState.selectedType === "location" ? 10 : 8,
      color: "#87baff",
      weight: 2,
      fillColor: "#d6e8ff",
      fillOpacity: 0.95
    })
      .addTo(liveMap)
      .bindPopup("<strong>You are here</strong>")
      .on("click", () => setMapSelection("location", location.id));

    if (!related.locationIds.has(location.id)) {
      accuracyCircle.setStyle({ opacity: 0.25, fillOpacity: 0.08 });
      locationMarker.setStyle({ opacity: 0.4, fillOpacity: 0.45 });
    }

    liveMapLayers.push(accuracyCircle, locationMarker);
    bounds.push([location.lat, location.lng]);
  }

  if (bounds.length) {
    const latLngBounds = window.L.latLngBounds(bounds);
    if (mapState.selectedType) {
      liveMap.fitBounds(latLngBounds.pad(0.8), {
        maxZoom: mapState.selectedType === "location" ? 10 : 6,
        animate: false
      });
    } else {
      liveMap.fitBounds(latLngBounds.pad(0.45), {
        maxZoom: 5,
        animate: false
      });
    }
  } else {
    liveMap.setView([39.8283, -98.5795], 4);
  }
}

function wireMapControls() {
  document.querySelectorAll("[data-map-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      mapState.filter = button.dataset.mapFilter;
      document
        .querySelectorAll("[data-map-filter]")
        .forEach((item) => item.classList.toggle("active", item === button));
      renderMapStage();
    });
  });

  document.getElementById("map-clear-selection")?.addEventListener("click", clearMapSelection);
}

function renderMapExperience() {
  if (currentPage !== "map") {
    return;
  }

  renderMapStage();
  renderMapDetail();
  renderMapLists();
}

function initMapPage() {
  if (currentPage !== "map") {
    return;
  }

  wireMapControls();
  renderMapExperience();
  window.setTimeout(() => {
    liveMap?.invalidateSize();
  }, 0);
}

async function initAuthPage() {
  const authTransport = await getAuthTransport();
  if (
    authTransport === "browser" &&
    (!runtimeConfig.supabaseUrl || !runtimeConfig.supabaseAnonKey)
  ) {
    const message =
      "Static hosting detected. Add ./config.js with SUPABASE_URL and SUPABASE_ANON_KEY to enable sign in.";
    setFeedback("auth-feedback", message, "error");
    setFeedback("register-feedback", message, "error");
  }

  try {
    const session = await requestJson("/api/auth/session");
    if (session.authenticated) {
      goToPage(await getPostAuthLandingPage(session.user));
      return;
    }
  } catch (error) {
    if (error.message !== "Request failed.") {
      console.error(error);
    }
  }

  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");
  const forgotForm = document.getElementById("forgot-password-form");
  populateStateSelect(document.getElementById("register-region"));

  loginForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    setFeedback("auth-feedback", "Signing you in...");

    const formData = new FormData(loginForm);

    try {
      const payload = await requestJson("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: formData.get("email"),
          password: formData.get("password")
        })
      });

      setFeedback("auth-feedback", "Signed in. Loading your dashboard...", "success");
      goToPage(await getPostAuthLandingPage(payload.user));
    } catch (error) {
      setFeedback("auth-feedback", error.message, "error");
    }
  });

  registerForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    setFeedback("register-feedback", "Creating your account...");

    const formData = new FormData(registerForm);

    try {
      const payload = await requestJson("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          displayName: formData.get("displayName"),
          email: formData.get("email"),
          region: formData.get("region"),
          password: formData.get("password"),
          acceptedTerms: formData.get("acceptedTerms") === "on",
          acceptedPrivacy: formData.get("acceptedPrivacy") === "on",
          locationTrackingPreference: formData.get("locationTrackingPreference")
        })
      });

      setFeedback("register-feedback", "Account created. Redirecting you now...", "success");
      goToPage(await getPostAuthLandingPage(payload.user));
    } catch (error) {
      setFeedback("register-feedback", error.message, "error");
    }
  });

  forgotForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    setFeedback("forgot-feedback", "Sending reset link...");

    try {
      const payload = await requestJson("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({
          email: forgotForm.elements.email.value
        })
      });

      setFeedback("forgot-feedback", payload.message || "Reset link sent.", "success");
      forgotForm.reset();
    } catch (error) {
      setFeedback("forgot-feedback", error.message, "error");
    }
  });
}

async function initPasswordResetPage() {
  const feedbackId = "reset-password-feedback";
  const form = document.getElementById("reset-password-form");
  if (!form) {
    return;
  }

  try {
    const client = await getBrowserSupabaseClient();
    const {
      data: { session },
      error
    } = await client.auth.getSession();

    if (error) {
      throw error;
    }

    if (!session?.user) {
      setFeedback(
        feedbackId,
        "Open this page from the password reset email so we can verify the recovery token.",
        "error"
      );
    }
  } catch (error) {
    setFeedback(feedbackId, error.message || "Unable to validate your recovery link.", "error");
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setFeedback(feedbackId, "Updating your password...");

    try {
      const client = await getBrowserSupabaseClient();
      const password = String(form.elements.newPassword.value || "");
      const confirmPassword = String(form.elements.confirmPassword.value || "");
      if (password.length < 8) {
        throw new Error("Your new password must be at least 8 characters.");
      }
      if (password !== confirmPassword) {
        throw new Error("The password confirmation does not match.");
      }

      const { error } = await client.auth.updateUser({ password });
      if (error) {
        throw error;
      }

      setFeedback(feedbackId, "Password updated. Redirecting to sign in...", "success");
      window.setTimeout(() => {
        goToPage("auth");
      }, 900);
    } catch (error) {
      setFeedback(feedbackId, error.message || "Unable to update your password.", "error");
    }
  });
}

function renderOfficerPathFields(form) {
  const block = document.getElementById("officer-path-fields");
  if (!block || !form) {
    return;
  }

  block.hidden = !form.elements.officerPathRequested.checked;
}

async function initOnboardingPage() {
  const form = document.getElementById("identity-form");
  const submitButton = document.getElementById("identity-submit");
  if (!form || !sessionUser) {
    return;
  }

  populateStateSelect(form.elements.state, sessionUser.region);
  identityVerificationRecord = (await requestJson("/api/identity", { method: "GET" })).verification;
  populateIdentityForm(form);
  renderOfficerPathFields(form);
  renderIdentityStatusCards();
  renderIdentityProfileCard();
  renderVerificationTimeline();

  form.elements.officerPathRequested.addEventListener("change", () => {
    renderOfficerPathFields(form);
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setFeedback("identity-feedback", "Saving your verification draft...");

    try {
      const payload = await requestJson("/api/identity", {
        method: "PATCH",
        body: JSON.stringify({
          legalName: form.elements.legalName.value,
          phoneNumber: form.elements.phoneNumber.value,
          city: form.elements.city.value,
          state: form.elements.state.value,
          birthDate: form.elements.birthDate.value,
          idDocumentType: form.elements.idDocumentType.value,
          idDocumentLast4: form.elements.idDocumentLast4.value,
          officerPathRequested: form.elements.officerPathRequested.checked,
          officerDepartment: form.elements.officerDepartment.value,
          officerWorkEmail: form.elements.officerWorkEmail.value,
          backgroundConsent: form.elements.backgroundConsent.checked,
          trainingAcknowledged: form.elements.trainingAcknowledged.checked,
          codeOfConductAccepted: form.elements.codeOfConductAccepted.checked
        })
      });

      identityVerificationRecord = payload.verification;
      populateIdentityForm(form);
      renderIdentityStatusCards();
      renderIdentityProfileCard();
      renderVerificationTimeline();
      setFeedback("identity-feedback", "Verification draft saved.", "success");
    } catch (error) {
      setFeedback("identity-feedback", error.message, "error");
    }
  });

  submitButton?.addEventListener("click", async () => {
    setFeedback("identity-feedback", "Submitting your verification package...");

    try {
      const payload = await requestJson("/api/identity/submit", {
        method: "POST",
        body: JSON.stringify({})
      });

      sessionUser = payload.user;
      identityVerificationRecord = payload.verification;
      updateSessionChrome();
      renderProfileCard();
      renderIdentityStatusCards();
      renderIdentityProfileCard();
      renderVerificationTimeline();
      setFeedback("identity-feedback", "Verification submitted for review.", "success");
    } catch (error) {
      setFeedback("identity-feedback", error.message, "error");
    }
  });
}

async function initAccountPage() {
  const profileForm = document.getElementById("account-form");
  const passwordForm = document.getElementById("password-form");
  const summary = document.getElementById("account-summary");
  const captureLocationButton = document.getElementById("capture-location");
  const manualLocationForm = document.getElementById("manual-location-form");
  const legalForm = document.getElementById("legal-form");
  const renderAccountSummary = () => {
    if (!summary || !sessionUser) {
      return;
    }

    summary.innerHTML = `
      <div>
        <p class="profile-label">Member since</p>
        <strong>${new Date(sessionUser.createdAt).toLocaleDateString()}</strong>
      </div>
      <div>
        <p class="profile-label">Access level</p>
        <strong>${sessionUser.isAdmin ? "Administrator" : "Guardian"}</strong>
      </div>
      <div>
        <p class="profile-label">Current role</p>
        <strong>${sessionUser.role}</strong>
      </div>
      <div>
        <p class="profile-label">Verification</p>
        <strong>${sessionUser.verificationStatus}</strong>
      </div>
      <div>
        <p class="profile-label">Location preference</p>
        <strong>${sessionUser.locationTrackingPreference || "unset"}</strong>
      </div>
    `;
  };

  populateStateSelect(document.getElementById("account-region"), sessionUser?.region);
  populateStateSelect(document.getElementById("manual-region"), sessionUser?.region);
  renderLocationPreview();
  renderLegalSummary();
  renderAccountSummary();

  if (profileForm && sessionUser) {
    profileForm.elements.displayName.value = sessionUser.displayName;
    profileForm.elements.email.value = sessionUser.email;
    profileForm.elements.region.value = sessionUser.region;

    profileForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      setFeedback("account-feedback", "Saving profile...");

      try {
        const payload = await requestJson("/api/account", {
          method: "PATCH",
          body: JSON.stringify({
            displayName: profileForm.elements.displayName.value,
            region: profileForm.elements.region.value
          })
        });

        sessionUser = payload.user;
        updateSessionChrome();
        renderProfileCard();
        renderAccountSummary();
        renderLegalSummary();
        renderMapExperience();
        setFeedback("account-feedback", "Profile updated.", "success");
      } catch (error) {
        setFeedback("account-feedback", error.message, "error");
      }
    });
  }

  captureLocationButton?.addEventListener("click", () => {
    if (!sessionUser?.privacyAcceptedAt || !sessionUser?.termsAcceptedAt) {
      setFeedback("location-feedback", "Accept the Terms and Privacy Notice before sharing location.", "error");
      return;
    }

    if (!navigator.geolocation) {
      setFeedback("location-feedback", "This browser does not support geolocation. Use the manual location form below.", "error");
      return;
    }

    if (!isKnownState(profileForm?.elements.region.value)) {
      setFeedback("location-feedback", "Select and save your state before capturing location.", "error");
      return;
    }

    setFeedback("location-feedback", "Capturing your current location...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        saveStoredLocation({
          source: "device",
          state: profileForm.elements.region.value,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          capturedAt: new Date().toISOString()
        });
        requestJson("/api/account", {
          method: "PATCH",
          body: JSON.stringify({
            locationTrackingPreference: "device"
          })
        })
          .then((payload) => {
            sessionUser = payload.user;
            renderAccountSummary();
            renderLegalSummary();
            renderLocationPreview();
            renderMapExperience();
            setFeedback("location-feedback", "Location captured on this device.", "success");
          })
          .catch((error) => {
            setFeedback("location-feedback", error.message, "error");
          });
      },
      (error) => {
        const fallbackMessage =
          error.code === 1
            ? "Location permission was declined. You can still save a manual location below."
            : error.message || "Unable to capture location.";
        setFeedback("location-feedback", fallbackMessage, "error");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });

  manualLocationForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!sessionUser?.privacyAcceptedAt || !sessionUser?.termsAcceptedAt) {
      setFeedback("location-feedback", "Accept the Terms and Privacy Notice before saving location.", "error");
      return;
    }

    const manualRegion = manualLocationForm.elements.manualRegion.value;
    if (!isKnownState(manualRegion)) {
      setFeedback("location-feedback", "Choose a valid state for the manual location.", "error");
      return;
    }

    const fallback = getStateCoordinates(manualRegion);
    saveStoredLocation({
      source: "manual",
      label: String(manualLocationForm.elements.manualLabel.value || "").trim(),
      state: manualRegion,
      latitude: fallback.lat,
      longitude: fallback.lng,
      accuracy: null,
      capturedAt: new Date().toISOString()
    });

    try {
      const payload = await requestJson("/api/account", {
        method: "PATCH",
        body: JSON.stringify({
          locationTrackingPreference: "manual"
        })
      });

      sessionUser = payload.user;
      renderAccountSummary();
      renderLegalSummary();
      renderLocationPreview();
      renderMapExperience();
      setFeedback("location-feedback", "Manual location saved for the map.", "success");
    } catch (error) {
      setFeedback("location-feedback", error.message, "error");
    }
  });

  if (legalForm && sessionUser) {
    legalForm.elements.acceptedTerms.checked = Boolean(sessionUser.termsAcceptedAt);
    legalForm.elements.acceptedPrivacy.checked = Boolean(sessionUser.privacyAcceptedAt);
    legalForm.elements.locationTrackingPreference.value = sessionUser.locationTrackingPreference || "unset";

    legalForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      setFeedback("legal-feedback", "Saving legal settings...");

      try {
        const payload = await requestJson("/api/account", {
          method: "PATCH",
          body: JSON.stringify({
            acceptedTerms: legalForm.elements.acceptedTerms.checked,
            acceptedPrivacy: legalForm.elements.acceptedPrivacy.checked,
            locationTrackingPreference: legalForm.elements.locationTrackingPreference.value
          })
        });

        sessionUser = payload.user;
        renderAccountSummary();
        const storedLocation = getStoredLocation();
        if (sessionUser.locationTrackingPreference === "declined") {
          clearStoredLocation();
          renderLocationPreview();
          renderMapExperience();
        } else if (
          sessionUser.locationTrackingPreference === "manual" &&
          storedLocation &&
          storedLocation.source !== "manual"
        ) {
          clearStoredLocation();
          renderLocationPreview();
          renderMapExperience();
        }
        renderLegalSummary();
        setFeedback("legal-feedback", "Legal settings updated.", "success");
      } catch (error) {
        setFeedback("legal-feedback", error.message, "error");
      }
    });
  }

  passwordForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    setFeedback("password-feedback", "Updating password...");

    try {
      await requestJson("/api/account/password", {
        method: "PATCH",
        body: JSON.stringify({
          currentPassword: passwordForm.elements.currentPassword.value,
          newPassword: passwordForm.elements.newPassword.value
        })
      });

      passwordForm.reset();
      setFeedback("password-feedback", "Password updated successfully.", "success");
    } catch (error) {
      setFeedback("password-feedback", error.message, "error");
    }
  });
}

function buildAdminUserCard(user) {
  const roleOptions = ROLE_OPTIONS.map(
    (role) => `<option value="${role}" ${role === user.role ? "selected" : ""}>${role}</option>`
  ).join("");

  const verificationOptions = VERIFICATION_OPTIONS.map(
    (value) =>
      `<option value="${value}" ${value === user.verificationStatus ? "selected" : ""}>${value}</option>`
  ).join("");

  return `
    <article class="admin-user-card" data-user-id="${user.id}">
      <div class="admin-user-head">
        <div>
          <strong>${escapeHtml(user.displayName)}</strong>
          <span>${escapeHtml(user.email)}</span>
        </div>
        <span class="chip">${user.isAdmin ? "Admin" : "Guardian"}</span>
      </div>
      <form class="admin-user-form">
        <label>
          Role
          <select name="role">${roleOptions}</select>
        </label>
        <label>
          Verification
          <select name="verificationStatus">${verificationOptions}</select>
        </label>
        <label>
          Points
          <input name="points" type="number" min="0" value="${user.points}" />
        </label>
        <label class="toggle-field">
          <input name="isAdmin" type="checkbox" ${user.isAdmin ? "checked" : ""} />
          Admin access
        </label>
        <button class="primary-button" type="submit">Save member</button>
      </form>
      <div class="form-feedback" id="admin-feedback-${user.id}"></div>
    </article>
  `;
}

function renderAdminStatCards(items) {
  return items
    .map(
      (item) => `
        <article class="stat-card">
          <p>${escapeHtml(item.label)}</p>
          <strong>${escapeHtml(item.value)}</strong>
          <span>${escapeHtml(item.detail)}</span>
        </article>
      `
    )
    .join("");
}

function renderAdminSummary() {
  const summary = document.getElementById("admin-summary");
  if (!summary) {
    return;
  }

  if (browserAdminMissionMode) {
    const activeMissionCount = adminMissionRecords.filter((mission) => mission.isActive !== false).length;
    summary.innerHTML = renderAdminStatCards([
      {
        label: "Admin console",
        value: "Browser mission mode",
        detail: "Static hosting can manage mission briefs through Supabase."
      },
      {
        label: "Persisted briefs",
        value: adminMissionRecords.length,
        detail: "Mission records available to authenticated users."
      },
      {
        label: "Active missions",
        value: activeMissionCount,
        detail: "Currently open mission briefs on the board."
      }
    ]);
    return;
  }

  const verifiedCount = adminUsers.filter((user) =>
    ["Phone + ID complete", "Officer path approved"].includes(user.verificationStatus)
  ).length;
  const adminCount = adminUsers.filter((user) => user.isAdmin).length;
  const activeMissionCount = adminMissionRecords.filter((mission) => mission.isActive !== false).length;
  const submittedQuestCount = adminQuestRecords.filter((quest) => quest.status === "submitted").length;

  summary.innerHTML = renderAdminStatCards([
    { label: "Total accounts", value: adminUsers.length, detail: "Stored account profiles" },
    { label: "Verified members", value: verifiedCount, detail: "ID-complete or officer-approved" },
    { label: "Active missions", value: activeMissionCount, detail: "Mission briefs available to members" },
    {
      label: "Quest reviews",
      value: submittedQuestCount,
      detail: "Submitted quests waiting on confirmation"
    },
    { label: "Admin users", value: adminCount, detail: "Accounts with elevated access" }
  ]);
}

function wireAdminForms() {
  document.querySelectorAll(".admin-user-form").forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const card = form.closest("[data-user-id]");
      const userId = card?.dataset.userId;
      if (!userId) {
        return;
      }

      setFeedback(`admin-feedback-${userId}`, "Saving member...");

      try {
        const payload = await requestJson(`/api/admin/users/${userId}`, {
          method: "PATCH",
          body: JSON.stringify({
            role: form.elements.role.value,
            verificationStatus: form.elements.verificationStatus.value,
            points: Number(form.elements.points.value),
            isAdmin: form.elements.isAdmin.checked
          })
        });

        adminUsers = adminUsers.map((user) => (user.id === payload.user.id ? payload.user : user));
        renderAdminSummary();
        renderAdminUserList();
        setFeedback(`admin-feedback-${userId}`, "Member updated.", "success");
      } catch (error) {
        setFeedback(`admin-feedback-${userId}`, error.message, "error");
      }
    });
  });
}

function renderAdminUserList() {
  const container = document.getElementById("admin-user-list");
  if (!container) {
    return;
  }

  container.innerHTML = adminUsers
    .slice()
    .sort((left, right) => left.displayName.localeCompare(right.displayName))
    .map(buildAdminUserCard)
    .join("");

  wireAdminForms();
}

function buildAdminIdentityCard(record) {
  const statusOptions = IDENTITY_REVIEW_STATUS_OPTIONS.map(
    (status) =>
      `<option value="${status}" ${status === record.status ? "selected" : ""}>${
        IDENTITY_STATUS_LABELS[status] || status
      }</option>`
  ).join("");

  return `
    <article class="admin-user-card" data-identity-user-id="${record.userId}">
      <div class="admin-user-head">
        <div>
          <strong>${escapeHtml(record.user?.displayName || record.legalName || "Unknown member")}</strong>
          <span>${escapeHtml(record.user?.email || record.officerWorkEmail || "No email on file")}</span>
        </div>
        <span class="chip">${record.officerPathRequested ? "Officer path" : "Guardian path"}</span>
      </div>
      <div class="profile-card admin-identity-profile">
        <div>
          <p class="profile-label">State</p>
          <strong>${escapeHtml(record.state || record.user?.region || "Not provided")}</strong>
        </div>
        <div>
          <p class="profile-label">ID document</p>
          <strong>${escapeHtml(record.idDocumentType || "unset")} ${record.idDocumentLast4 ? `· ${escapeHtml(record.idDocumentLast4)}` : ""}</strong>
        </div>
        <div>
          <p class="profile-label">Submitted</p>
          <strong>${record.submittedAt ? new Date(record.submittedAt).toLocaleString() : "Draft only"}</strong>
        </div>
        <div>
          <p class="profile-label">Current profile status</p>
          <strong>${escapeHtml(record.user?.verificationStatus || "Unknown")}</strong>
        </div>
      </div>
      <form class="admin-identity-form">
        <label>
          Review status
          <select name="status">${statusOptions}</select>
        </label>
        <label class="span-two-field">
          Reviewer notes
          <textarea name="reviewNotes" rows="3" placeholder="Add the next action or approval notes.">${escapeHtml(
            record.reviewNotes || ""
          )}</textarea>
        </label>
        <button class="primary-button" type="submit">Save review</button>
      </form>
      <div class="form-feedback" id="identity-admin-feedback-${record.userId}"></div>
    </article>
  `;
}

function wireAdminIdentityForms() {
  document.querySelectorAll(".admin-identity-form").forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const card = form.closest("[data-identity-user-id]");
      const userId = card?.dataset.identityUserId;
      if (!userId) {
        return;
      }

      setFeedback(`identity-admin-feedback-${userId}`, "Saving review...");

      try {
        const payload = await requestJson(`/api/admin/identity/${userId}`, {
          method: "PATCH",
          body: JSON.stringify({
            status: form.elements.status.value,
            reviewNotes: form.elements.reviewNotes.value
          })
        });

        adminUsers = adminUsers.map((user) => (user.id === payload.user.id ? payload.user : user));
        adminIdentityRecords = adminIdentityRecords.map((record) =>
          record.userId === userId
            ? {
                ...record,
                ...payload.verification,
                user: payload.user
              }
            : record
        );
        renderAdminSummary();
        renderAdminUserList();
        renderAdminIdentityList();
      } catch (error) {
        setFeedback(`identity-admin-feedback-${userId}`, error.message, "error");
      }
    });
  });
}

function renderAdminIdentityList() {
  const container = document.getElementById("admin-identity-list");
  if (!container) {
    return;
  }

  container.innerHTML = adminIdentityRecords.length
    ? adminIdentityRecords
        .slice()
        .sort((left, right) => {
          const leftTime = left.submittedAt ? new Date(left.submittedAt).getTime() : 0;
          const rightTime = right.submittedAt ? new Date(right.submittedAt).getTime() : 0;
          return rightTime - leftTime;
        })
        .map(buildAdminIdentityCard)
        .join("")
    : '<article class="admin-user-card"><div class="admin-user-head"><div><strong>No verification packages yet</strong><span>Members will appear here after they save or submit their onboarding record.</span></div></div></article>';

  wireAdminIdentityForms();
}

function buildMissionFormValues(form) {
  return {
    title: form.elements.title.value,
    type: form.elements.type.value,
    risk: form.elements.risk.value,
    questGiver: form.elements.questGiver.value,
    questConfirmer: form.elements.questConfirmer.value,
    description: form.elements.description.value,
    location: form.elements.location.value,
    schedule: form.elements.schedule.value,
    roles: form.elements.roles.value
      .split(/\r?\n|,/u)
      .map((item) => item.trim())
      .filter(Boolean),
    protocol: form.elements.protocol.value,
    minimumRole: form.elements.minimumRole.value,
    minReadiness: Number(form.elements.minReadiness.value),
    xpReward: Number(form.elements.xpReward.value),
    readinessReward: Number(form.elements.readinessReward.value),
    rewardLabel: form.elements.rewardLabel.value,
    steps: form.elements.steps.value
      .split(/\r?\n/u)
      .map((item) => item.trim())
      .filter(Boolean),
    isActive: form.elements.isActive.checked
  };
}

function buildMissionTypeOptions(selectedValue) {
  return [
    { value: "online", label: "Online" },
    { value: "hybrid", label: "Hybrid" },
    { value: "realworld", label: "Real-world support" }
  ]
    .map(
      (option) =>
        `<option value="${option.value}" ${option.value === selectedValue ? "selected" : ""}>${option.label}</option>`
    )
    .join("");
}

function buildAdminMissionCard(mission) {
  const roleOptions = ROLE_OPTIONS.map(
    (role) =>
      `<option value="${role}" ${role === mission.minimumRole ? "selected" : ""}>${role}</option>`
  ).join("");

  return `
    <article class="admin-user-card" data-mission-id="${mission.id}">
      <div class="admin-user-head">
        <div>
          <strong>${escapeHtml(mission.title)}</strong>
          <span>${escapeHtml(mission.id)} · ${escapeHtml(mission.isActive ? "Active" : "Inactive")}</span>
        </div>
        <span class="chip">${escapeHtml(mission.type.replace("realworld", "real-world"))}</span>
      </div>
      <form class="admin-mission-form">
        <label>
          Title
          <input name="title" type="text" value="${escapeHtml(mission.title)}" />
        </label>
        <label>
          Type
          <select name="type">${buildMissionTypeOptions(mission.type)}</select>
        </label>
        <label>
          Risk
          <input name="risk" type="text" value="${escapeHtml(mission.risk || "")}" />
        </label>
        <label>
          Minimum role
          <select name="minimumRole">${roleOptions}</select>
        </label>
        <label>
          Quest giver
          <input name="questGiver" type="text" value="${escapeHtml(mission.questGiver || "")}" />
        </label>
        <label>
          Quest confirmer
          <input name="questConfirmer" type="text" value="${escapeHtml(mission.questConfirmer || "")}" />
        </label>
        <label class="span-two-field">
          Description
          <textarea name="description" rows="3">${escapeHtml(mission.description || "")}</textarea>
        </label>
        <label>
          Location
          <input name="location" type="text" value="${escapeHtml(mission.location || "")}" />
        </label>
        <label>
          Schedule
          <input name="schedule" type="text" value="${escapeHtml(mission.schedule || "")}" />
        </label>
        <label class="span-two-field">
          Roles
          <textarea name="roles" rows="2" placeholder="Spotter, Verifier">${escapeHtml(
            (mission.roles || []).join(", ")
          )}</textarea>
        </label>
        <label class="span-two-field">
          Protocol
          <input name="protocol" type="text" value="${escapeHtml(mission.protocol || "")}" />
        </label>
        <label>
          Minimum readiness
          <input name="minReadiness" type="number" min="0" max="100" value="${mission.minReadiness || 0}" />
        </label>
        <label>
          XP reward
          <input name="xpReward" type="number" min="0" value="${mission.xpReward || 0}" />
        </label>
        <label>
          Readiness reward
          <input name="readinessReward" type="number" min="0" max="100" value="${mission.readinessReward || 0}" />
        </label>
        <label>
          Reward label
          <input name="rewardLabel" type="text" value="${escapeHtml(mission.rewardLabel || "")}" />
        </label>
        <label class="span-two-field">
          Steps
          <textarea name="steps" rows="4" placeholder="One step per line">${escapeHtml(
            (mission.steps || []).join("\n")
          )}</textarea>
        </label>
        <label class="toggle-field">
          <input name="isActive" type="checkbox" ${mission.isActive ? "checked" : ""} />
          Mission is active
        </label>
        <div class="quest-actions">
          <button class="primary-button" type="submit">Save mission</button>
          <button class="secondary-button" data-action="delete" type="button">Delete mission</button>
        </div>
      </form>
      <div class="form-feedback" id="mission-admin-feedback-${mission.id}"></div>
    </article>
  `;
}

function wireAdminMissionForms() {
  document.querySelectorAll(".admin-mission-form").forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const card = form.closest("[data-mission-id]");
      const missionId = card?.dataset.missionId;
      if (!missionId) {
        return;
      }

      setFeedback(`mission-admin-feedback-${missionId}`, "Saving mission...");

      try {
        const payload = await requestJson(`/api/admin/missions/${missionId}`, {
          method: "PATCH",
          body: JSON.stringify(buildMissionFormValues(form))
        });

        adminMissionRecords = adminMissionRecords.map((record) =>
          record.id === missionId ? normalizeMissionRecord(payload.mission) : record
        );
        missionCatalog = adminMissionRecords.slice();
        questBoard = normalizeQuestBoardPayload(questBoard);
        renderAdminSummary();
        renderAdminMissionList();
        refreshQuestViews();
        setFeedback(`mission-admin-feedback-${missionId}`, "Mission updated.", "success");
      } catch (error) {
        setFeedback(`mission-admin-feedback-${missionId}`, error.message, "error");
      }
    });

    const deleteButton = form.querySelector('[data-action="delete"]');
    deleteButton?.addEventListener("click", async () => {
      const card = form.closest("[data-mission-id]");
      const missionId = card?.dataset.missionId;
      if (!missionId) {
        return;
      }

      setFeedback(`mission-admin-feedback-${missionId}`, "Deleting mission...");

      try {
        await requestJson(`/api/admin/missions/${missionId}`, { method: "DELETE" });
        adminMissionRecords = adminMissionRecords.filter((record) => record.id !== missionId);
        missionCatalog = adminMissionRecords.slice();
        questBoard = normalizeQuestBoardPayload(questBoard);
        renderAdminSummary();
        renderAdminMissionList();
        refreshQuestViews();
      } catch (error) {
        setFeedback(`mission-admin-feedback-${missionId}`, error.message, "error");
      }
    });
  });

  const createForm = document.getElementById("admin-mission-create-form");
  if (createForm && !createForm.dataset.wired) {
    createForm.dataset.wired = "true";
    createForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      setFeedback("mission-admin-create-feedback", "Creating mission...");

      try {
        const payload = await requestJson("/api/admin/missions", {
          method: "POST",
          body: JSON.stringify(buildMissionFormValues(createForm))
        });

        const nextMission = normalizeMissionRecord(payload.mission);
        adminMissionRecords = [...adminMissionRecords, nextMission].sort((left, right) =>
          left.title.localeCompare(right.title)
        );
        missionCatalog = adminMissionRecords.slice();
        questBoard = normalizeQuestBoardPayload(questBoard);
        renderAdminSummary();
        renderAdminMissionList();
        refreshQuestViews();
        createForm.reset();
        createForm.elements.type.value = "online";
        createForm.elements.minimumRole.value = ROLE_OPTIONS[0];
        createForm.elements.isActive.checked = true;
        setFeedback("mission-admin-create-feedback", "Mission created.", "success");
      } catch (error) {
        setFeedback("mission-admin-create-feedback", error.message, "error");
      }
    });
  }
}

function renderAdminMissionList() {
  const createContainer = document.getElementById("admin-mission-create");
  const listContainer = document.getElementById("admin-mission-list");
  if (!createContainer || !listContainer) {
    return;
  }

  const roleOptions = ROLE_OPTIONS.map((role) => `<option value="${role}">${role}</option>`).join("");
  createContainer.innerHTML = `
    <form class="admin-user-form" id="admin-mission-create-form">
      <label>
        Title
        <input name="title" type="text" placeholder="Mission title" />
      </label>
      <label>
        Type
        <select name="type">${buildMissionTypeOptions("online")}</select>
      </label>
      <label>
        Risk
        <input name="risk" type="text" placeholder="Moderate oversight" />
      </label>
      <label>
        Minimum role
        <select name="minimumRole">${roleOptions}</select>
      </label>
      <label>
        Quest giver
        <input name="questGiver" type="text" placeholder="Dispatcher Nyra" />
      </label>
      <label>
        Quest confirmer
        <input name="questConfirmer" type="text" placeholder="Moderator Sable" />
      </label>
      <label class="span-two-field">
        Description
        <textarea name="description" rows="3" placeholder="Mission description"></textarea>
      </label>
      <label>
        Location
        <input name="location" type="text" placeholder="Remote / Pacific time" />
      </label>
      <label>
        Schedule
        <input name="schedule" type="text" placeholder="Tonight, 7:00 PM" />
      </label>
      <label class="span-two-field">
        Roles
        <textarea name="roles" rows="2" placeholder="Spotter, Verifier"></textarea>
      </label>
      <label class="span-two-field">
        Protocol
        <input name="protocol" type="text" placeholder="Evidence template required" />
      </label>
      <label>
        Minimum readiness
        <input name="minReadiness" type="number" min="0" max="100" value="0" />
      </label>
      <label>
        XP reward
        <input name="xpReward" type="number" min="0" value="0" />
      </label>
      <label>
        Readiness reward
        <input name="readinessReward" type="number" min="0" max="100" value="0" />
      </label>
      <label>
        Reward label
        <input name="rewardLabel" type="text" placeholder="Mission credit" />
      </label>
      <label class="span-two-field">
        Steps
        <textarea name="steps" rows="4" placeholder="One step per line"></textarea>
      </label>
      <label class="toggle-field">
        <input name="isActive" type="checkbox" checked />
        Mission is active
      </label>
      <button class="primary-button" type="submit">Create mission</button>
    </form>
    <div class="form-feedback" id="mission-admin-create-feedback"></div>
  `;

  listContainer.innerHTML = adminMissionRecords.length
    ? adminMissionRecords
        .slice()
        .sort((left, right) => left.title.localeCompare(right.title))
        .map(buildAdminMissionCard)
        .join("")
    : '<article class="admin-user-card"><div class="admin-user-head"><div><strong>No missions yet</strong><span>Create the first mission brief here.</span></div></div></article>';

  wireAdminMissionForms();
}

function buildAdminQuestCard(record) {
  const statusMeta = record.statusMeta || getQuestStatusMeta(record.status);
  const reviewOptions = [
    { value: "submitted", label: "Keep submitted" },
    { value: "needs_revision", label: "Needs revision" },
    { value: "confirmed", label: "Confirm and grant rewards" }
  ]
    .map(
      (option) =>
        `<option value="${option.value}" ${option.value === record.status ? "selected" : ""}>${option.label}</option>`
    )
    .join("");

  return `
    <article class="admin-user-card" data-quest-id="${record.id}">
      <div class="admin-user-head">
        <div>
          <strong>${escapeHtml(record.mission?.title || "Unknown quest")}</strong>
          <span>${escapeHtml(record.user?.displayName || "Unknown member")} · ${escapeHtml(
            statusMeta.label
          )}</span>
        </div>
        <span class="chip">${escapeHtml(record.mission?.questConfirmer || "Review queue")}</span>
      </div>
      <div class="profile-card admin-identity-profile">
        <div>
          <p class="profile-label">Quest giver</p>
          <strong>${escapeHtml(record.mission?.questGiver || "Operations board")}</strong>
        </div>
        <div>
          <p class="profile-label">Progress</p>
          <strong>${record.progressPercent}%</strong>
        </div>
        <div>
          <p class="profile-label">Submitted</p>
          <strong>${record.submittedAt ? new Date(record.submittedAt).toLocaleString() : "Not submitted"}</strong>
        </div>
        <div>
          <p class="profile-label">Reward</p>
          <strong>${record.xpReward} XP · +${record.readinessReward}% readiness</strong>
        </div>
      </div>
      <div class="profile-card admin-identity-profile">
        <div class="span-two-field">
          <p class="profile-label">Member notes</p>
          <strong>${escapeHtml(record.notes || "No member notes yet.")}</strong>
        </div>
      </div>
      <div class="profile-card admin-identity-profile">
        <div class="span-two-field">
          <p class="profile-label">Submission text</p>
          <strong>${escapeHtml(record.submissionText || "No mission submission text yet.")}</strong>
        </div>
        <div class="span-two-field">
          <p class="profile-label">Media uploads</p>
          <div class="mission-attachment-grid">${buildSubmissionAttachmentMarkup(
            record.submissionAttachments || [],
            false
          )}</div>
        </div>
      </div>
      <form class="admin-quest-form">
        <label>
          Review status
          <select name="status">${reviewOptions}</select>
        </label>
        <label class="span-two-field">
          Confirmer notes
          <textarea name="confirmationNotes" rows="3" placeholder="Add guidance or confirmation details.">${escapeHtml(
            record.confirmationNotes || ""
          )}</textarea>
        </label>
        <button class="primary-button" type="submit">Save quest review</button>
      </form>
      <div class="form-feedback" id="quest-admin-feedback-${record.id}"></div>
    </article>
  `;
}

function wireAdminQuestForms() {
  document.querySelectorAll(".admin-quest-form").forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const card = form.closest("[data-quest-id]");
      const questId = card?.dataset.questId;
      if (!questId) {
        return;
      }

      setFeedback(`quest-admin-feedback-${questId}`, "Saving quest review...");

      try {
        const payload = await requestJson(`/api/admin/quests/${questId}`, {
          method: "PATCH",
          body: JSON.stringify({
            status: form.elements.status.value,
            confirmationNotes: form.elements.confirmationNotes.value
          })
        });

        adminUsers = adminUsers.map((user) => (user.id === payload.user.id ? payload.user : user));
        adminQuestRecords = adminQuestRecords.map((record) =>
          record.id === questId ? { ...record, ...payload.quest, user: payload.user } : record
        );
        renderAdminSummary();
        renderAdminUserList();
        renderAdminQuestList();
        setFeedback(`quest-admin-feedback-${questId}`, "Quest review updated.", "success");
      } catch (error) {
        setFeedback(`quest-admin-feedback-${questId}`, error.message, "error");
      }
    });
  });
}

function renderAdminQuestList() {
  const container = document.getElementById("admin-quest-list");
  if (!container) {
    return;
  }

  container.innerHTML = adminQuestRecords.length
    ? adminQuestRecords
        .slice()
        .sort((left, right) => {
          const leftPriority = left.status === "submitted" ? 0 : left.status === "needs_revision" ? 1 : 2;
          const rightPriority = right.status === "submitted" ? 0 : right.status === "needs_revision" ? 1 : 2;
          if (leftPriority !== rightPriority) {
            return leftPriority - rightPriority;
          }

          const leftTime = left.submittedAt ? new Date(left.submittedAt).getTime() : 0;
          const rightTime = right.submittedAt ? new Date(right.submittedAt).getTime() : 0;
          return rightTime - leftTime;
        })
        .map(buildAdminQuestCard)
        .join("")
    : '<article class="admin-user-card"><div class="admin-user-head"><div><strong>No submitted quests yet</strong><span>Accepted quests will appear here after members request confirmation.</span></div></div></article>';

  wireAdminQuestForms();
}

async function initAdminPage() {
  const [usersResponse, identityResponse, missionResponse, questResponse] = await Promise.all([
    requestJson("/api/admin/users"),
    requestJson("/api/admin/identity"),
    requestJson("/api/admin/missions"),
    requestJson("/api/admin/quests")
  ]);
  adminUsers = usersResponse.users;
  adminIdentityRecords = identityResponse.records;
  adminMissionRecords = missionResponse.missions.map((mission) => normalizeMissionRecord(mission));
  missionCatalog = adminMissionRecords.slice();
  adminQuestRecords = questResponse.quests;
  renderAdminSummary();
  renderAdminUserList();
  renderAdminIdentityList();
  renderAdminMissionList();
  renderAdminQuestList();
}

async function initProtectedPage() {
  const session = await requestJson("/api/auth/session");
  if (!session?.authenticated || !session.user) {
    goToPage("auth");
    return;
  }

  if (ADMIN_ONLY_PAGE_KEYS.has(currentPage) && !session.user.isAdmin) {
    goToPage("dashboard");
    return;
  }

  sessionUser = session.user;
  questBoard = buildDefaultQuestBoard();
  const authTransport = await getAuthTransport();

  try {
    questBoard = normalizeQuestBoardPayload(await requestJson("/api/quests", { method: "GET" }));
  } catch (error) {
    console.warn("Quest board unavailable.", error);
  }

  applyProtectedPageShell();
  updateSessionChrome();
  createNav();
  renderRedditRailProfile();
  renderRedditSidebar();
  renderReadiness();
  renderProfileCard();
  renderDashboardStats();
  renderPageLinks();
  renderVerificationTimeline();
  renderQuestSummary();
  renderMyQuests();
  renderMissions();
  wireMissionFilters();
  renderDashboardQuestPanel();
  renderDashboardExperience();
  renderModules();
  renderSafetyControls();
  renderReportForm();
  renderLeaderboard();
  renderScoringModel();
  renderRoadmap();
  renderRoadmapPhases();
  renderRoadmapFocus();
  renderRoadmapPageLinks();
  initMapPage();

  if (currentPage === "account") {
    await initAccountPage();
  }

  if (currentPage === "onboarding") {
    await initOnboardingPage();
  }

  if (currentPage === "admin") {
    if (authTransport === "browser") {
      browserAdminMissionMode = true;
      const list = document.getElementById("admin-user-list");
      const identityList = document.getElementById("admin-identity-list");
      const questList = document.getElementById("admin-quest-list");
      renderAdminSummary();
      if (list) {
        list.innerHTML =
          '<article class="admin-user-card"><div class="admin-user-head"><div><strong>Static hosting limitation</strong><span>GitHub Pages can sign users in, but bulk admin management still runs through the server APIs.</span></div></div></article>';
      }
      if (identityList) {
        identityList.innerHTML =
          '<article class="admin-user-card"><div class="admin-user-head"><div><strong>Verification review unavailable</strong><span>Identity moderation uses privileged server APIs and is not exposed on static hosting.</span></div></div></article>';
      }
      if (questList) {
        questList.innerHTML =
          '<article class="admin-user-card"><div class="admin-user-head"><div><strong>Quest confirmation unavailable</strong><span>Quest confirmer actions rely on privileged server APIs and are not exposed on static hosting.</span></div></div></article>';
      }
      try {
        const payload = await requestJson("/api/admin/missions", { method: "GET" });
        adminMissionRecords = Array.isArray(payload.missions)
          ? payload.missions.map((mission) => normalizeMissionRecord(mission)).filter(Boolean)
          : [];
        missionCatalog = adminMissionRecords.slice();
        renderAdminSummary();
        renderAdminMissionList();
      } catch (error) {
        const missionCreate = document.getElementById("admin-mission-create");
        const missionList = document.getElementById("admin-mission-list");
        if (missionCreate) {
          missionCreate.innerHTML =
            `<article class="admin-user-card"><div class="admin-user-head"><div><strong>Mission management unavailable</strong><span>${escapeHtml(
              error.message
            )}</span></div></div></article>`;
        }
        if (missionList) {
          missionList.innerHTML =
            '<article class="admin-user-card"><div class="admin-user-head"><div><strong>Mission catalog unavailable</strong><span>Mission records could not be loaded from Supabase.</span></div></div></article>';
        }
      }
      document.body.classList.add("page-ready");
      return;
    }

    browserAdminMissionMode = false;
    await initAdminPage();
  }

  document.body.classList.add("page-ready");
}

async function init() {
  if (!PUBLIC_PAGE_KEYS.has(currentPage || "auth")) {
    const canonicalRoute = LEGACY_PAGE_LOOKUP.get(window.location.pathname);
    const shouldUseLegacyPaths =
      window.location.protocol === "file:" || window.location.hostname.endsWith("github.io");
    if (canonicalRoute && !shouldUseLegacyPaths) {
      window.history.replaceState(
        {},
        "",
        `${canonicalRoute}${window.location.search}${window.location.hash}`
      );
    }
  }

  if (currentPage === "reset-password") {
    await initPasswordResetPage();
    return;
  }

  if (document.body.classList.contains("auth-body")) {
    await initAuthPage();
    return;
  }

  try {
    await initProtectedPage();
  } catch (error) {
    console.error(error);
    goToPage("auth");
  }
}

void init();
