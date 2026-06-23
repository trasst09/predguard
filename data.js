const guardianProfile = {
  role: "Spotter / Tipster",
  nextRole: "Decoy / Support",
  readinessScore: 74,
  points: 1420,
  region: "Bay Area, CA",
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
    type: "online",
    risk: "Moderate oversight",
    title: "Patrol the Shadows",
    description:
      "Monitor flagged Discord communities, document suspicious grooming patterns, and prepare moderator-ready notes.",
    location: "Remote / Pacific time",
    schedule: "Tonight, 7:00 PM",
    roles: ["Spotter", "Verifier"],
    protocol: "Evidence template required"
  },
  {
    type: "hybrid",
    risk: "Supervisor approval",
    title: "Chapter: The Hidden Meet",
    description:
      "Coordinate remote observers, decoy support, and a law-enforcement liaison around a time-boxed meetup window.",
    location: "San Jose, CA",
    schedule: "Wednesday, 5:30 PM",
    roles: ["Decoy", "Support", "Officer"],
    protocol: "Safety briefing + live check-ins"
  },
  {
    type: "realworld",
    risk: "High restriction",
    title: "Meetup Vigil",
    description:
      "A tightly controlled support operation with role-gated access, location sharing, and post-event debrief requirements.",
    location: "Oakland, CA",
    schedule: "Saturday, 2:00 PM",
    roles: ["Officer", "Safety monitor", "Video recorder"],
    protocol: "Location consent expires automatically"
  },
  {
    type: "online",
    risk: "Open to trained users",
    title: "Signal Lantern",
    description:
      "Review tip submissions for completeness, normalize timestamps, and route validated reports to moderators.",
    location: "Remote / Nationwide",
    schedule: "Rolling window",
    roles: ["Spotter", "Verifier"],
    protocol: "Structured report handoff"
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
    detail: "Identity flow, verification checkpoints, and training shell with progress state."
  },
  {
    week: "Week 3-4",
    title: "Missions, reports, and gamification",
    detail: "CRUD for missions, XP ledger, leaderboard filters, and structured reporting drafts."
  },
  {
    week: "Week 5-6",
    title: "Platform and safety tooling",
    detail: "Consent-based linking, evidence vault structure, map placeholders, and panic escalation UX."
  },
  {
    week: "Week 7-8",
    title: "Moderation, QA, and launch prep",
    detail: "Security hardening, moderator dashboards, accessibility checks, and beta deployment."
  }
];

const pageLinks = [
  {
    title: "Dashboard",
    href: "./dashboard.html",
    description: "Overview metrics, readiness, and entry points to focused workflows."
  },
  {
    title: "Onboarding",
    href: "./onboarding.html",
    description: "Verification checkpoints, role progression, and current guardian profile."
  },
  {
    title: "Missions",
    href: "./missions.html",
    description: "Browse mission briefs by type, required roles, and oversight level."
  },
  {
    title: "Training",
    href: "./training.html",
    description: "Track certification progress across legal, safety, and evidence modules."
  },
  {
    title: "Reporting",
    href: "./reporting.html",
    description: "Create structured evidence drafts for moderator review and handoff."
  },
  {
    title: "Leaderboard",
    href: "./leaderboard.html",
    description: "Recognize protocol adherence and constructive contribution."
  },
  {
    title: "Roadmap",
    href: "./roadmap.html",
    description: "Review the eight-week MVP release track from setup through beta."
  }
];
