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

const seededProfile =
  typeof guardianProfile !== "undefined"
    ? guardianProfile
    : {
        role: ROLE_OPTIONS[0],
        nextRole: ROLE_OPTIONS[1],
        readinessScore: 42,
        points: 0,
        region: "United States",
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

let sessionUser = null;
let adminUsers = [];

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

async function requestJson(url, options = {}) {
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
    window.location.href = "/index.html";
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
    ["Region", profile.region],
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
        description: "Update your name, region, and password."
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

  timeline.innerHTML = "";

  verificationStepsData.forEach((step) => {
    const row = document.createElement("div");
    row.className = "timeline-step";
    row.innerHTML = `
      <div class="timeline-marker"></div>
      <div class="timeline-copy">
        <strong>${step.title}</strong>
        <span>${step.detail}</span>
      </div>
    `;
    timeline.appendChild(row);
  });
}

function renderMissions(filter = "all") {
  const missionList = document.getElementById("mission-list");
  const missionTemplate = document.getElementById("mission-template");
  const missionPreview = document.getElementById("mission-preview");

  if (!missionList || !missionTemplate) {
    return;
  }

  missionList.innerHTML = "";

  missionsData
    .filter((mission) => filter === "all" || mission.type === filter)
    .forEach((mission) => {
      const node = missionTemplate.content.firstElementChild.cloneNode(true);
      node.querySelector(".mission-type").textContent = mission.type.replace("realworld", "real-world");
      node.querySelector(".mission-risk").textContent = mission.risk;
      node.querySelector("h4").textContent = mission.title;
      node.querySelector(".mission-description").textContent = mission.description;
      node.querySelector(
        ".mission-meta"
      ).innerHTML = `Location: ${mission.location}<br />Window: ${mission.schedule}<br />Protocol: ${mission.protocol}`;

      const roles = node.querySelector(".required-roles");
      mission.roles.forEach((role) => {
        const pill = document.createElement("span");
        pill.textContent = role;
        roles.appendChild(pill);
      });

      node.querySelector(".mission-button").addEventListener("click", () => {
        if (missionPreview) {
          missionPreview.textContent = `${mission.title}: Access requires ${mission.risk}. Brief includes role assignments, safety checklist, and evidence handoff steps.`;
        }
      });

      missionList.appendChild(node);
    });
}

function wireMissionFilters() {
  const filterButtons = document.querySelectorAll(".filter-button");
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

async function initAuthPage() {
  try {
    const session = await requestJson("/api/auth/session");
    if (session.authenticated) {
      window.location.href = session.user.isAdmin ? "/admin.html" : "/dashboard.html";
      return;
    }
  } catch (error) {
    if (error.message !== "Request failed.") {
      console.error(error);
    }
  }

  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");

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
      window.location.href = payload.user.isAdmin ? "/admin.html" : "/dashboard.html";
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
          password: formData.get("password")
        })
      });

      setFeedback("register-feedback", "Account created. Redirecting you now...", "success");
      window.location.href = payload.user.isAdmin ? "/admin.html" : "/dashboard.html";
    } catch (error) {
      setFeedback("register-feedback", error.message, "error");
    }
  });
}

async function initAccountPage() {
  const profileForm = document.getElementById("account-form");
  const passwordForm = document.getElementById("password-form");
  const summary = document.getElementById("account-summary");

  if (summary && sessionUser) {
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
    `;
  }

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
        setFeedback("account-feedback", "Profile updated.", "success");
      } catch (error) {
        setFeedback("account-feedback", error.message, "error");
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

async function initAdminPage() {
  const response = await requestJson("/api/admin/users");
  adminUsers = response.users;
  renderAdminSummary();
  renderAdminUserList();
}

async function initProtectedPage() {
  const session = await requestJson("/api/auth/session");
  sessionUser = session.user;

  updateSessionChrome();
  createNav();
  renderReadiness();
  renderProfileCard();
  renderDashboardStats();
  renderPageLinks();
  renderVerificationTimeline();
  renderMissions();
  wireMissionFilters();
  renderModules();
  renderSafetyControls();
  renderReportForm();
  renderLeaderboard();
  renderScoringModel();
  renderRoadmap();

  if (currentPage === "account") {
    await initAccountPage();
  }

  if (currentPage === "admin") {
    await initAdminPage();
  }
}

async function init() {
  if (document.body.classList.contains("auth-body")) {
    await initAuthPage();
    return;
  }

  try {
    await initProtectedPage();
  } catch (error) {
    console.error(error);
    window.location.href = "/index.html";
  }
}

void init();
