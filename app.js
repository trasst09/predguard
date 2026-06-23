const currentPage = document.body.dataset.page;

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
const pageLinksData = typeof pageLinks !== "undefined" ? pageLinks : [];
const mapRegionsData = typeof mapRegions !== "undefined" ? mapRegions : [];
const mapUsersData = typeof mapUsers !== "undefined" ? mapUsers : [];
const mapQuestsData = typeof mapQuests !== "undefined" ? mapQuests : [];
const LEGAL_VERSION = "2026-06-22";
const STATIC_SUPABASE_SCRIPT = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";

let sessionUser = null;
let adminUsers = [];
let questBoard = {
  availableQuests: [],
  assignments: [],
  summary: {
    activeCount: 0,
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
let liveMap = null;
let liveMapLayers = [];
let authTransportPromise = null;
let browserSupabaseClient = null;
let identityVerificationRecord = null;
let adminIdentityRecords = [];

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
  return missionsData.find((mission) => mission.id === missionId) || null;
}

function buildDefaultQuestBoard() {
  return {
    availableQuests: missionsData.map((mission) => ({
      ...mission,
      access: describeMissionAccess(mission, [])
    })),
    assignments: [],
    summary: {
      activeCount: 0,
      completedCount: 0,
      totalXpEarned: 0,
      claimableCount: 0
    }
  };
}

function describeMissionAccess(mission, assignments = questBoard.assignments) {
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
  const assignments = Array.isArray(payload?.assignments)
    ? payload.assignments
        .map((assignment) => {
          const mission = assignment.mission || findMissionById(assignment.missionId);
          return mission ? { ...assignment, mission } : null;
        })
        .filter(Boolean)
    : [];

  const availableQuests = Array.isArray(payload?.availableQuests)
    ? payload.availableQuests
    : missionsData.map((mission) => ({
        ...mission,
        access: describeMissionAccess(mission, assignments)
      }));

  return {
    availableQuests,
    assignments,
    summary: {
      activeCount: payload?.summary?.activeCount ?? assignments.filter((item) => item.status === "active").length,
      completedCount:
        payload?.summary?.completedCount ??
        assignments.filter((item) => item.status === "completed").length,
      totalXpEarned:
        payload?.summary?.totalXpEarned ??
        assignments
          .filter((item) => item.status === "completed")
          .reduce((sum, item) => sum + (item.xpReward || 0), 0),
      claimableCount:
        payload?.summary?.claimableCount ??
        availableQuests.filter((mission) => mission.access?.claimable).length
    }
  };
}

function getPageUrl(pageName) {
  return new URL(pageName, window.location.href).toString();
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
  const transport = await getAuthTransport();
  if (transport === "browser") {
    return "dashboard.html";
  }

  return user?.isAdmin ? "admin.html" : "dashboard.html";
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
  const redirectTo = getPageUrl("reset-password.html");
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
    xpReward: record.xp_reward,
    readinessReward: record.readiness_reward,
    startedAt: record.started_at,
    completedAt: record.completed_at,
    createdAt: record.created_at,
    updatedAt: record.updated_at
  }));
}

async function buildBrowserQuestBoard(user) {
  const client = await getBrowserSupabaseClient();
  const assignments = await listBrowserUserQuests(client, user.id);
  return normalizeQuestBoardPayload({
    assignments,
    availableQuests: missionsData.map((mission) => ({
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
    status: "active",
    progress_percent: 0,
    notes: "",
    xp_reward: mission.xpReward,
    readiness_reward: mission.readinessReward
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

  if (existingQuest.status === "completed") {
    throw new Error("Completed quests are read-only.");
  }

  const patch = {};
  if (body.notes !== undefined) {
    patch.notes = String(body.notes || "").trim().slice(0, 2000);
  }

  if (body.progressPercent !== undefined) {
    const progress = Number(body.progressPercent);
    if (!Number.isFinite(progress)) {
      throw new Error("Progress must be a number.");
    }
    patch.progress_percent = Math.max(0, Math.min(100, Math.round(progress)));
  }

  if (body.status !== undefined) {
    if (body.status !== "active" && body.status !== "completed") {
      throw new Error("Quest status must be active or completed.");
    }
    patch.status = body.status;
  }

  const isCompleting = patch.status === "completed";
  if (isCompleting) {
    patch.progress_percent = 100;
    patch.completed_at = new Date().toISOString();
  }

  const { error } = await client.from("user_quests").update(patch).eq("id", questId);
  if (error) {
    throw new Error(error.message || "Unable to update the quest.");
  }

  let user = sessionPayload.user;
  if (isCompleting) {
    user = await updateBrowserProfile(client, sessionPayload.user.id, {
      points: (sessionPayload.user.points || 0) + existingQuest.xpReward,
      readiness_score: Math.min(
        100,
        (sessionPayload.user.readinessScore || 0) + existingQuest.readinessReward
      )
    });
  }

  return {
    user,
    questBoard: await buildBrowserQuestBoard(user)
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

  if (url.startsWith("/api/admin/")) {
    throw new Error("The admin console still requires the Node/Supabase server deployment.");
  }

  throw new Error("Request failed.");
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

function createNav() {
  const nav = document.getElementById("site-nav");
  if (!nav) {
    return;
  }

  const links = [
    ...pageLinksData,
    {
      title: "Account",
      href: "./account.html",
      description: "Manage your profile details, password, and session settings."
    }
  ];

  if (sessionUser?.isAdmin) {
    links.push({
      title: "Admin",
      href: "./admin.html",
      description: "Review members, roles, verification state, and access controls."
    });
  }

  links.forEach((link) => {
    const anchor = document.createElement("a");
    anchor.href = link.href;
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
    goToPage("index.html");
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
        href: "./account.html",
        description: "Update your name, state, password, and device location."
      }
    ]);

  if (sessionUser?.isAdmin) {
    links.push({
      title: "Admin",
      href: "./admin.html",
      description: "Manage users, verification, points, and elevated access."
    });
  }

  links.forEach((link) => {
    const anchor = document.createElement("a");
    anchor.className = "page-link-card";
    anchor.href = link.href;
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
      <p>Completed</p>
      <strong>${questBoard.summary.completedCount}</strong>
      <span>Finished with rewards applied</span>
    </article>
    <article class="mini-stat">
      <p>Claimable now</p>
      <strong>${questBoard.summary.claimableCount}</strong>
      <span>Unlocked by your current role and readiness</span>
    </article>
    <article class="mini-stat">
      <p>Quest XP earned</p>
      <strong>${questBoard.summary.totalXpEarned}</strong>
      <span>Total rewards from completed quests</span>
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
    Access: ${escapeHtml(mission.risk)}<br />
    Unlock: ${escapeHtml(access.reason)}<br />
    Rewards: ${mission.xpReward} XP and ${mission.readinessReward}% readiness<br />
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
  updateMissionPreview("Claiming quest...");

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
    updateMissionPreview("Quest claimed. Track your progress in My quests.");
  } catch (error) {
    updateMissionPreview(escapeHtml(error.message));
  }
}

async function handleQuestSave(questId, form, shouldComplete = false) {
  const progress = Number(form.elements.progressPercent.value);
  const notes = form.elements.notes.value;

  try {
    const payload = await requestJson(`/api/quests/${questId}`, {
      method: "PATCH",
      body: JSON.stringify({
        progressPercent: shouldComplete ? 100 : progress,
        notes,
        status: shouldComplete ? "completed" : "active"
      })
    });

    if (payload.user) {
      sessionUser = payload.user;
    }
    questBoard = normalizeQuestBoardPayload(payload.questBoard);
    refreshQuestViews();
    updateMissionPreview(
      shouldComplete
        ? "Quest completed. Rewards have been added to your profile."
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
      '<article class="mission-card"><h4>No quests claimed yet</h4><p class="mission-description">Claim a quest from the board to start tracking notes, progress, and rewards.</p></article>';
    return;
  }

  list.innerHTML = "";

  questBoard.assignments.forEach((assignment) => {
    const mission = assignment.mission;
    const card = document.createElement("article");
    card.className = "mission-card quest-progress-card";
    const isCompleted = assignment.status === "completed";
    card.innerHTML = `
      <div class="mission-topline">
        <span class="mission-type">${escapeHtml(mission.type.replace("realworld", "real-world"))}</span>
        <span class="mission-risk">${isCompleted ? "Completed" : "Active quest"}</span>
      </div>
      <h4>${escapeHtml(mission.title)}</h4>
      <p class="mission-description">${escapeHtml(mission.description)}</p>
      <div class="quest-progress-meta">
        <span>Reward: ${assignment.xpReward} XP</span>
        <span>Readiness: +${assignment.readinessReward}%</span>
      </div>
      <form class="quest-progress-form">
        <label>
          Progress
          <input name="progressPercent" type="range" min="0" max="100" step="5" value="${assignment.progressPercent}" ${
            isCompleted ? "disabled" : ""
          } />
        </label>
        <div class="quest-progress-meter">
          <span style="width: ${assignment.progressPercent}%"></span>
        </div>
        <div class="quest-progress-value">${assignment.progressPercent}% complete</div>
        <label>
          Field notes
          <textarea name="notes" rows="4" ${isCompleted ? "disabled" : ""}>${escapeHtml(
            assignment.notes || ""
          )}</textarea>
        </label>
        <div class="mission-footer">
          <div class="required-roles"><span>${escapeHtml(mission.minimumRole)}</span></div>
          <div class="quest-actions">
            ${
              isCompleted
                ? `<button class="secondary-button" type="button" disabled>Rewards applied</button>`
                : `<button class="secondary-button" data-action="save" type="submit">Save progress</button>
                   <button class="primary-button" data-action="complete" type="button">Complete quest</button>`
            }
          </div>
        </div>
        <div class="form-feedback ${isCompleted ? "success" : "info"}">${
          isCompleted ? "Quest completed." : "Update progress and notes as you work."
        }</div>
      </form>
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

    if (!isCompleted) {
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        await handleQuestSave(assignment.id, form, false);
      });

      form.querySelector('[data-action="complete"]').addEventListener("click", async () => {
        slider.value = "100";
        value.textContent = "100% complete";
        meter.style.width = "100%";
        await handleQuestSave(assignment.id, form, true);
      });
    }

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
          Location: ${escapeHtml(mission.location)}<br />
          Window: ${escapeHtml(mission.schedule)}<br />
          Protocol: ${escapeHtml(mission.protocol)}<br />
          Minimum role: ${escapeHtml(mission.minimumRole)}<br />
          Rewards: ${mission.xpReward} XP and ${mission.readinessReward}% readiness
        </div>
        <div class="mission-footer">
          <div class="required-roles"></div>
          <div class="quest-actions">
            <button class="secondary-button mission-button" type="button">View brief</button>
            <button class="primary-button mission-claim-button" type="button" ${
              access.claimable ? "" : "disabled"
            }>${access.claimable ? "Claim quest" : access.state === "completed" ? "Completed" : access.state === "active" ? "In progress" : "Locked"}</button>
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

  const activeAssignments = questBoard.assignments.filter((assignment) => assignment.status === "active");
  panel.innerHTML = `
    <div class="section-heading">
      <div>
        <p class="eyebrow">Quest system</p>
        <h3>Your live board</h3>
      </div>
      <a class="secondary-button compact-button" href="./missions.html">Open quests</a>
    </div>
    <div class="dashboard-quest-stack">
      <div class="quest-dashboard-stat">
        <strong>${questBoard.summary.activeCount}</strong>
        <span>active quests</span>
      </div>
      <div class="quest-dashboard-stat">
        <strong>${questBoard.summary.claimableCount}</strong>
        <span>ready to claim</span>
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
                    <span>${assignment.progressPercent}% complete</span>
                  </article>
                `
              )
              .join("")
          : '<article class="dashboard-quest-card"><strong>No active quests</strong><span>Claim a quest from the mission board to start earning rewards.</span></article>'
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
    card.className = "roadmap-step";
    card.innerHTML = `
      <span class="eyebrow">${step.week}</span>
      <strong>${step.title}</strong>
      <p>${step.detail}</p>
    `;
    grid.appendChild(card);
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
        goToPage("index.html");
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

function renderAdminSummary() {
  const summary = document.getElementById("admin-summary");
  if (!summary) {
    return;
  }

  const verifiedCount = adminUsers.filter((user) =>
    ["Phone + ID complete", "Officer path approved"].includes(user.verificationStatus)
  ).length;
  const adminCount = adminUsers.filter((user) => user.isAdmin).length;

  summary.innerHTML = `
    <article class="stat-card">
      <p>Total accounts</p>
      <strong>${adminUsers.length}</strong>
      <span>Stored account profiles</span>
    </article>
    <article class="stat-card">
      <p>Verified members</p>
      <strong>${verifiedCount}</strong>
      <span>ID-complete or officer-approved</span>
    </article>
    <article class="stat-card">
      <p>Admin users</p>
      <strong>${adminCount}</strong>
      <span>Accounts with elevated access</span>
    </article>
  `;
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

async function initAdminPage() {
  const [usersResponse, identityResponse] = await Promise.all([
    requestJson("/api/admin/users"),
    requestJson("/api/admin/identity")
  ]);
  adminUsers = usersResponse.users;
  adminIdentityRecords = identityResponse.records;
  renderAdminSummary();
  renderAdminUserList();
  renderAdminIdentityList();
}

async function initProtectedPage() {
  const session = await requestJson("/api/auth/session");
  sessionUser = session.user;
  questBoard = buildDefaultQuestBoard();
  const authTransport = await getAuthTransport();

  try {
    questBoard = normalizeQuestBoardPayload(await requestJson("/api/quests", { method: "GET" }));
  } catch (error) {
    console.warn("Quest board unavailable.", error);
  }

  updateSessionChrome();
  createNav();
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
  renderModules();
  renderSafetyControls();
  renderReportForm();
  renderLeaderboard();
  renderScoringModel();
  renderRoadmap();
  initMapPage();

  if (currentPage === "account") {
    await initAccountPage();
  }

  if (currentPage === "onboarding") {
    await initOnboardingPage();
  }

  if (currentPage === "admin") {
    if (authTransport === "browser") {
      const list = document.getElementById("admin-user-list");
      const identityList = document.getElementById("admin-identity-list");
      const summary = document.getElementById("admin-summary");
      if (summary) {
        summary.innerHTML =
          '<article class="stat-card"><p>Admin console</p><strong>Server-backed only</strong><span>Use the Node deployment for member administration.</span></article>';
      }
      if (list) {
        list.innerHTML =
          '<article class="admin-user-card"><div class="admin-user-head"><div><strong>Static hosting limitation</strong><span>GitHub Pages can sign users in, but bulk admin management still runs through the server APIs.</span></div></div></article>';
      }
      if (identityList) {
        identityList.innerHTML =
          '<article class="admin-user-card"><div class="admin-user-head"><div><strong>Verification review unavailable</strong><span>Identity moderation uses privileged server APIs and is not exposed on static hosting.</span></div></div></article>';
      }
      return;
    }

    await initAdminPage();
  }
}

async function init() {
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
    goToPage("index.html");
  }
}

void init();
