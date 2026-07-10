const guardianProfile = {
  role: "Spotter / Tipster",
  nextRole: "Decoy / Support",
  readinessScore: 74,
  points: 1420,
  region: "California",
  verification: "Phone + ID complete",
  readinessItems: [
    {
      title: "Identity verification complete",
      detail: "Email, phone, and government ID are on file and marked current."
    },
    {
      title: "Training in progress",
      detail: "Legal boundaries and chain-of-custody passed. Safety simulation pending."
    },
    {
      title: "Promotion path",
      detail: "Earn 280 XP and finish the real-world safety protocol module to unlock support missions."
    }
  ]
};

const dashboardStats = [
  {
    label: "Active guardians",
    value: "1,284",
    detail: "83% trained in legal + evidence modules"
  },
  {
    label: "Open missions",
    value: "18",
    detail: "Role-gated by risk and oversight level"
  },
  {
    label: "Validated reports",
    value: "242",
    detail: "Structured handoff templates included"
  },
  {
    label: "Safety check-ins",
    value: "97%",
    detail: "Compliance rate in live support windows"
  }
];

const verificationSteps = [
  {
    title: "Identity and contact checks",
    detail: "Email, phone, and government ID verification create the base trust layer for all users."
  },
  {
    title: "Background and behavior screening",
    detail: "Manual review, partner screening, and anomaly checks gate access to higher-risk tools."
  },
  {
    title: "Training certification",
    detail: "Users must pass mandatory quizzes with an 80% threshold before role expansion."
  },
  {
    title: "Ongoing re-verification",
    detail: "Periodic reviews, conduct signals, and incident handling keep access current."
  }
];

const missions = [
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

const modules = [
  {
    title: "Legal boundaries and entrapment risks",
    progress: 100,
    detail: "Completed. Includes citizen limitations, evidence handling, and escalation rules."
  },
  {
    title: "Grooming recognition across platforms",
    progress: 82,
    detail: "Scenario-based examples for Discord, Instagram, Roblox, and direct messaging patterns."
  },
  {
    title: "Real-world safety protocol",
    progress: 64,
    detail: "Covers meeting location rules, backup roles, exit strategies, and de-escalation."
  },
  {
    title: "Trauma-informed reporting",
    progress: 41,
    detail: "Focuses on supportive language, documentation precision, and mental health awareness."
  }
];

const safetyControls = [
  {
    title: "Check-in cadence",
    detail: "Every 15 minutes during active support windows."
  },
  {
    title: "Panic escalation",
    detail: "Moderator, mission lead, and emergency contact fan-out."
  },
  {
    title: "Location sharing",
    detail: "Consent-based and automatically expires after the mission window."
  }
];

const leaderboard = [
  { name: "Alex", role: "Officer partner", points: 2210 },
  { name: "Jordan", role: "Verifier", points: 1890 },
  { name: "Rin", role: "Support", points: 1760 },
  { name: "Maya", role: "Spotter", points: 1420 }
];

const mapRegions = [
  {
    id: "ca",
    name: "California",
    focus: "West Coast reporting, coordination, and hybrid support",
    status: "Stable coverage",
    users: 5,
    quests: 2,
    state: "California"
  },
  {
    id: "tx",
    name: "Texas",
    focus: "Large-area support relay and field coordination",
    status: "High activity",
    users: 8,
    quests: 3,
    state: "Texas"
  },
  {
    id: "fl",
    name: "Florida",
    focus: "Tip intake, review, and coastal monitoring",
    status: "Quest surge",
    users: 4,
    quests: 2,
    state: "Florida"
  },
  {
    id: "ny",
    name: "New York",
    focus: "Northeast moderation and evidence review",
    status: "Restricted access",
    users: 3,
    quests: 2,
    state: "New York"
  }
];

const mapUsers = [
  {
    id: "user-maya",
    name: "Maya",
    role: "Spotter / Tipster",
    regionId: "ca",
    xp: 1420,
    status: "On patrol",
    focus: "Discord and forum sweeps",
    state: "California"
  },
  {
    id: "user-jordan",
    name: "Jordan",
    role: "Verifier / Moderator",
    regionId: "ny",
    xp: 1890,
    status: "Reviewing reports",
    focus: "Evidence validation",
    state: "New York"
  },
  {
    id: "user-rin",
    name: "Rin",
    role: "Decoy / Support",
    regionId: "tx",
    xp: 1760,
    status: "Ready",
    focus: "Escalation support",
    state: "Texas"
  },
  {
    id: "user-alex",
    name: "Alex",
    role: "Officer / LE Partner",
    regionId: "fl",
    xp: 2210,
    status: "In briefing",
    focus: "Field safety oversight",
    state: "Florida"
  },
  {
    id: "user-noor",
    name: "Noor",
    role: "Verifier / Moderator",
    regionId: "ca",
    xp: 1685,
    status: "Monitoring",
    focus: "Case triage",
    state: "California"
  }
];

const mapQuests = [
  {
    id: "quest-shadow",
    title: "Patrol the Shadows",
    type: "Online",
    regionId: "ny",
    difficulty: "Moderate",
    window: "Tonight, 7:00 PM",
    objective: "Track suspicious grooming patterns and package moderator-ready notes.",
    state: "New York"
  },
  {
    id: "quest-hidden-meet",
    title: "The Hidden Meet",
    type: "Hybrid",
    regionId: "ca",
    difficulty: "Supervisor approval",
    window: "Wednesday, 5:30 PM",
    objective: "Coordinate observers, support roles, and live safety check-ins.",
    state: "California"
  },
  {
    id: "quest-lantern",
    title: "Signal Lantern",
    type: "Online",
    regionId: "tx",
    difficulty: "Open to trained users",
    window: "Rolling window",
    objective: "Normalize timestamps and route validated tips into the reporting queue.",
    state: "Texas"
  },
  {
    id: "quest-vigil",
    title: "Meetup Vigil",
    type: "Field",
    regionId: "fl",
    difficulty: "High restriction",
    window: "Saturday, 2:00 PM",
    objective: "Run a tightly controlled support operation with debrief requirements.",
    state: "Florida"
  }
];

const scoringModel = [
  {
    title: "Training completion",
    detail: "100-500 points per module based on scope and assessment depth."
  },
  {
    title: "Validated tips",
    detail: "Higher-value points are reserved for reviewed, well-documented submissions."
  },
  {
    title: "Mission participation",
    detail: "Points scale with responsibility and protocol adherence rather than confrontation."
  }
];

const roadmap = [
  {
    week: "Week 1-2",
    title: "Auth, profiles, and onboarding",
    detail: "Identity flow, verification checkpoints, and training shell with progress state.",
    status: "complete",
    progressLabel: "3 of 3 delivered"
  },
  {
    week: "Week 3-4",
    title: "Missions, reports, and gamification",
    detail: "CRUD for missions, XP ledger, leaderboard filters, and structured reporting drafts.",
    status: "complete",
    progressLabel: "4 of 4 delivered"
  },
  {
    week: "Week 5-6",
    title: "Platform and safety tooling",
    detail: "Consent-based linking, evidence vault with chain-of-custody, safety controls, and expiring location sharing.",
    status: "complete",
    progressLabel: "5 of 5 delivered"
  },
  {
    week: "Week 7-8",
    title: "Moderation, QA, and launch prep",
    detail: "Security hardening (CSP, headers, RLS), integration tests, accessibility checks, and an operator deployment runbook.",
    status: "complete",
    progressLabel: "6 of 6 delivered"
  }
];

const roadmapPhases = [
  {
    week: "Weeks 1-2",
    title: "Identity and onboarding spine",
    status: "complete",
    summary: "The account system, verification flow, and training/onboarding surfaces are in place and connected to shared seeded state.",
    outcome: "This gives the MVP a real login boundary plus role-aware profile scaffolding instead of a pure prototype shell.",
    deliverables: [
      { label: "Protected auth flow with registration, sign-in, and session handling", status: "complete", href: "/" },
      { label: "Account page for profile updates, password changes, and legal notices", status: "complete", href: "/account" },
      { label: "Onboarding flow with identity review states and officer path fields", status: "complete", href: "/onboarding" },
      { label: "Training page with progress cards and safety controls", status: "complete", href: "/training" }
    ]
  },
  {
    week: "Weeks 3-4",
    title: "Mission loop and reporting",
    status: "complete",
    summary: "Core quest browsing, reporting, and leaderboard surfaces are already built across dedicated pages.",
    outcome: "Users can understand the game loop end to end: discover work, submit structured notes, and see progress reflected in points and rank.",
    deliverables: [
      { label: "Mission board with filters, summaries, and personal quest assignments", status: "complete", href: "/missions" },
      { label: "Reporting workflow with structured evidence draft fields", status: "complete", href: "/reporting" },
      { label: "Leaderboard and scoring model views", status: "complete", href: "/leaderboard" },
      { label: "Dashboard entry points tying readiness, missions, and reporting together", status: "complete", href: "/dashboard" }
    ]
  },
  {
    week: "Weeks 5-6",
    title: "Safety tooling and operational map",
    status: "complete",
    summary: "The operational map plus constrained, audit-friendly Field Ops tooling for active mission support are in place.",
    outcome: "Placeholders became durable, consent-based tools: linked platforms, an evidence vault with chain-of-custody, simulated safety controls, and expiring location shares.",
    deliverables: [
      { label: "Interactive operations map with regions, hotspot details, and quest overlays", status: "complete", href: "/map" },
      { label: "Consent-based account linking for external platforms", status: "complete", href: "/safety" },
      { label: "Evidence vault model for media, notes, and chain-of-custody events", status: "complete", href: "/safety" },
      { label: "Live check-ins, panic escalation, and backup coordination flows", status: "complete", href: "/safety" },
      { label: "Real-time location sharing with expiration and safety prompts", status: "complete", href: "/safety" }
    ]
  },
  {
    week: "Weeks 7-8",
    title: "Moderation, QA, and launch hardening",
    status: "complete",
    summary: "Admin tooling, Supabase storage, an integration test pass, accessibility improvements, security hardening, and an operator runbook are in place.",
    outcome: "The project now has a safer release path: automated route/auth tests, a Content-Security-Policy and hardened headers, own-row RLS on every table, and a documented deployment runbook.",
    deliverables: [
      { label: "Admin review console for member roles, points, and verification state", status: "complete", href: "/admin" },
      { label: "Supabase-backed auth/profile storage with schema and env setup", status: "complete" },
      { label: "Integration test pass across auth, protected pages, and field-ops routes", status: "complete" },
      { label: "Accessibility pass for keyboard flow, contrast, and mobile layout", status: "complete" },
      { label: "Security hardening: CSP, headers, session flags, and own-row RLS", status: "complete" },
      { label: "Beta deployment and operator documentation", status: "complete" }
    ]
  }
];

const roadmapFocus = [
  {
    status: "next",
    title: "Legal review before any real-world deployment",
    detail: "The Field Ops tooling is built and simulated. Panic, location sharing, and evidence handling must pass review by counsel experienced in child-safety tech before any live use."
  },
  {
    status: "next",
    title: "Replace simulated integrations with real ones",
    detail: "Account linking, panic escalation, and NCMEC reporting are modeled end-to-end but not yet wired to Discord/Instagram OAuth, real dispatch, or the live CyberTipline."
  },
  {
    status: "watch",
    title: "Operationalize the deployment runbook",
    detail: "Migrations, environment variables, and the security checklist are documented in OPERATIONS.md — run through it on a staging project before beta."
  }
];

const pageLinks = [
  {
    title: "Dashboard",
    href: "/dashboard",
    description: "Overview metrics, readiness, and entry points to focused workflows."
  },
  {
    title: "Onboarding",
    href: "/onboarding",
    description: "Verification checkpoints, role progression, and current guardian profile."
  },
  {
    title: "Missions",
    href: "/missions",
    description: "Browse mission briefs by type, required roles, and oversight level."
  },
  {
    title: "Map",
    href: "/map",
    description: "Explore regions, guardians, and quests through an interactive operations map."
  },
  {
    title: "Training",
    href: "/training",
    description: "Track certification progress across legal, safety, and evidence modules."
  },
  {
    title: "Reporting",
    href: "/reporting",
    description: "Create structured evidence drafts for moderator review and handoff."
  },
  {
    title: "Leaderboard",
    href: "/leaderboard",
    description: "Recognize protocol adherence and constructive contribution."
  },
  {
    title: "Field Ops",
    href: "/safety",
    description: "Linked platforms, evidence vault, safety controls, and location sharing."
  },
  {
    title: "Roadmap",
    href: "/roadmap",
    description: "Review the eight-week MVP release track from setup through beta."
  }
];

const dashboardHotspots = [
  {
    id: "bay-relay",
    label: "Bay Relay",
    state: "California",
    tone: "high",
    pings: 12,
    window: "18 min",
    coverage: "Hybrid support",
    summary: "Observer coverage is steady, but the meetup support chain needs one more confirmed handoff.",
    response: "Confirm support role coverage and lock the debrief owner before the window opens.",
    missionId: "quest-hidden-meet"
  },
  {
    id: "triage-lantern",
    label: "Triage Lantern",
    state: "Texas",
    tone: "medium",
    pings: 8,
    window: "Rolling",
    coverage: "Tip validation",
    summary: "The queue is healthy, though timestamp cleanup is lagging on mobile screenshots from late-night intake.",
    response: "Route one verifier to cleanup and package the next batch for the reporting queue.",
    missionId: "quest-lantern"
  },
  {
    id: "northeast-watch",
    label: "Northeast Watch",
    state: "New York",
    tone: "high",
    pings: 15,
    window: "Tonight",
    coverage: "Discord sweep",
    summary: "Multiple grooming-pattern alerts landed within the same moderation window and need evidence normalization.",
    response: "Prioritize moderator-ready notes and keep one escalation slot open for fast review.",
    missionId: "quest-shadow"
  },
  {
    id: "coastal-vigil",
    label: "Coastal Vigil",
    state: "Florida",
    tone: "low",
    pings: 4,
    window: "Sat 2:00 PM",
    coverage: "Field readiness",
    summary: "High-trust mission access remains restricted, but checklist completion is trending in the right direction.",
    response: "Use the lull to verify equipment, consent settings, and final safety acknowledgments.",
    missionId: "quest-vigil"
  }
];

const dashboardActivity = [
  {
    id: "activity-1",
    category: "missions",
    tone: "high",
    actor: "Jordan",
    title: "Moderator review accelerated for Northeast Watch",
    detail: "Two evidence bundles were normalized and moved to the handoff queue after duplicate handles were merged.",
    time: "2 min ago"
  },
  {
    id: "activity-2",
    category: "reports",
    tone: "medium",
    actor: "Maya",
    title: "Signal Lantern tip packet submitted",
    detail: "Four tips were grouped into one cleaner narrative with normalized timestamps and attachment notes.",
    time: "11 min ago"
  },
  {
    id: "activity-3",
    category: "safety",
    tone: "low",
    actor: "Alex",
    title: "Live safety check cadence confirmed",
    detail: "The next hybrid support window has check-ins assigned, backup contact listed, and incident route tested.",
    time: "22 min ago"
  },
  {
    id: "activity-4",
    category: "training",
    tone: "medium",
    actor: "Noor",
    title: "Real-world safety module moved past 80%",
    detail: "One final simulation remains before support-mission eligibility can be reviewed for the next tier.",
    time: "45 min ago"
  },
  {
    id: "activity-5",
    category: "missions",
    tone: "medium",
    actor: "Rin",
    title: "Bay Relay support role reopened",
    detail: "A backup observer dropped, so dispatch reopened one slot and moved the mission to active staffing watch.",
    time: "1 hr ago"
  }
];

const dashboardReports = [
  {
    id: "report-1",
    title: "Moderator-ready package",
    state: "New York",
    status: "Ready to hand off",
    confidence: "94%",
    channel: "Discord sweep"
  },
  {
    id: "report-2",
    title: "Cross-platform tip cluster",
    state: "Texas",
    status: "Needs one timestamp pass",
    confidence: "81%",
    channel: "Signal Lantern queue"
  },
  {
    id: "report-3",
    title: "Safety brief recap",
    state: "California",
    status: "Locked for dispatch",
    confidence: "98%",
    channel: "Bay Relay"
  }
];

const dashboardQuickActions = [
  {
    id: "action-1",
    title: "Open mission board",
    detail: "Review claims, unlocks, and current staffing gaps.",
    href: "/missions",
    cta: "Review quests"
  },
  {
    id: "action-2",
    title: "Prepare report handoff",
    detail: "Package the next evidence bundle with moderator-ready notes.",
    href: "/reporting",
    cta: "Draft report"
  },
  {
    id: "action-3",
    title: "Check training progress",
    detail: "Push readiness toward the next trust tier.",
    href: "/training",
    cta: "Open training"
  }
];
