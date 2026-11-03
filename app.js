
/* =========================================================
   BLUES999 DEVELOPMENT MANAGEMENT SYSTEM
   BDMS v1.0.0
   GitHub Pages / Vanilla JavaScript
   ========================================================= */

"use strict";

/* ======================== CONFIG ======================== */

const CONFIG = {
    storageKey: "blues999_bdms_v1",
    sessionKey: "blues999_bdms_session",
    version: 1,
    departments: [
        "Police Development",
        "NHS Development",
        "Fire & Rescue Development",
        "Vehicle Development",
        "Map Development",
        "Core Systems",
        "UI/UX Development",
        "General Development"
    ],
    priorities: ["Low", "Medium", "High", "Urgent"],
    assignmentStatuses: [
        "Not Started", "In Progress", "Awaiting Review",
        "Changes Requested", "Completed", "On Hold"
    ],
    projectStatuses: [
        "Planning", "In Development", "Testing",
        "Awaiting Approval", "Completed", "Paused", "Cancelled"
    ],
    announcementCategories: [
        "General", "Development Update", "Important",
        "Maintenance", "Recruitment"
    ]
};

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const uid = () => "id_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const today = () => new Date().toISOString().slice(0, 10);
const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;",
    '"': "&quot;", "'": "&#39;"
})[c]);

const formatDate = value => {
    if (!value) return "Not set";
    const date = new Date(value + "T00:00:00");
    return Number.isNaN(date.getTime()) ? "Invalid date" :
        date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

const formatTime = value => new Date(value).toLocaleString("en-GB", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
});

const initials = name => String(name || "U")
    .split(/[\s._-]+/).filter(Boolean).slice(0, 2)
    .map(part => part[0].toUpperCase()).join("");

const slug = value => String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const isOverdue = item =>
    item.dueDate && item.dueDate < today() &&
    item.status !== "Completed" && item.status !== "Cancelled";

/* ======================== DEMO ACCOUNTS ======================== */

/*
    DEMONSTRATION ONLY.
    These passwords are visible to anyone who can access app.js.
    Never use this mechanism for production authentication.
*/

const DEMO_USERS = [
    {
        id: "user_owner",
        username: "owner",
        password: "owner123",
        displayName: "Blues999 Owner",
        role: "Owner",
        department: "General Development",
        joinDate: "2026-01-01",
        lastActive: new Date().toISOString()
    },
    {
        id: "user_lead",
        username: "lead",
        password: "lead123",
        displayName: "Lead Developer",
        role: "Lead Developer",
        department: "Core Systems",
        joinDate: "2026-02-01",
        lastActive: new Date().toISOString()
    },
    {
        id: "user_dev",
        username: "developer",
        password: "dev123",
        displayName: "Developer",
        role: "Developer",
        department: "Police Development",
        joinDate: "2026-03-01",
        lastActive: new Date().toISOString()
    }
];

const PERMISSIONS = {
    Owner: ["*"],
    "Lead Developer": [
        "dashboard", "assignments", "projects", "developers",
        "announcements", "calendar", "statistics", "activity",
        "notifications", "settings", "create-assignment",
        "edit-assignment", "create-project", "edit-project",
        "create-announcement", "edit-announcement"
    ],
    Developer: [
        "dashboard", "assignments", "projects", "developers",
        "announcements", "calendar", "statistics", "activity",
        "notifications", "settings", "update-own-assignment"
    ]
};

let currentUser = null;
let database = null;
let dashboardChart = null;
let departmentChart = null;
let projectChart = null;
let calendarDate = new Date();
let saveTimer = null;

/* ======================== DATABASE ======================== */

function createInitialDatabase() {
    const departments = CONFIG.departments.map(name => ({
        id: uid(), name, description: "Blues999 development department."
    }));

    const users = DEMO_USERS.map(user => ({
        ...user,
        permissions: PERMISSIONS[user.role].slice()
    }));

    const projects = [
        {
            id: uid(), name: "Blues999 Core Platform",
            description: "Development of the main Blues999 British roleplay experience.",
            status: "In Development", priority: "High",
            leaderId: "user_owner", developerIds: ["user_owner", "user_lead", "user_dev"],
            startDate: "2026-10-01", dueDate: "2026-12-15",
            progress: 35, createdAt: new Date().toISOString()
        },
        {
            id: uid(), name: "Police Service Development",
            description: "Police vehicles, systems, uniforms and operational features.",
            status: "Planning", priority: "Medium",
            leaderId: "user_lead", developerIds: ["user_lead", "user_dev"],
            startDate: today(), dueDate: "2027-01-15",
            progress: 10, createdAt: new Date().toISOString()
        }
    ];

    const assignments = [
        {
            id: uid(), title: "Create initial police vehicle fleet",
            description: "Prepare the initial fleet for the police service.",
            department: "Vehicle Development", priority: "High",
            status: "In Progress", progress: 45,
            assigneeId: "user_dev", projectId: projects[0].id,
            dueDate: "2026-11-20", createdAt: new Date().toISOString()
        },
        {
            id: uid(), title: "Establish core development systems",
            description: "Set up the foundations for the development platform.",
            department: "Core Systems", priority: "Urgent",
            status: "Awaiting Review", progress: 90,
            assigneeId: "user_lead", projectId: projects[0].id,
            dueDate: "2026-11-12", createdAt: new Date().toISOString()
        },
        {
            id: uid(), title: "Plan police department structure",
            description: "Prepare the department structure and responsibilities.",
            department: "Police Development", priority: "Medium",
            status: "Not Started", progress: 0,
            assigneeId: "user_owner", projectId: projects[1].id,
            dueDate: "2026-12-01", createdAt: new Date().toISOString()
        }
    ];

    return {
        version: CONFIG.version,
        users, departments, projects, assignments,
        announcements: [
            {
                id: uid(), title: "Welcome to BDMS",
                content: "The Blues999 Development Management System is now available in its demonstration environment. Development teams can use this workspace to organise tasks and track projects.",
                category: "General", authorId: "user_owner",
                createdAt: new Date().toISOString()
            }
        ],
        notifications: [],
        activity: [],
        settings: {
            theme: "dark",
            defaultDepartment: "General Development",
            defaultPriority: "Medium"
        }
    };
}

function validateDatabase(data) {
    if (!data || typeof data !== "object" || Array.isArray(data)) return false;

    const required = [
        "users", "departments", "projects", "assignments",
        "announcements", "notifications", "activity", "settings"
    ];

    if (!required.every(key => Array.isArray(data[key]) ||
        (key === "settings" && typeof data[key] === "object" && data[key] !== null))) {
        return false;
    }

    if (data.users.some(u => !u || typeof u.id !== "string" ||
        typeof u.username !== "string" || typeof u.role !== "string")) return false;

    if (data.assignments.some(a => !a || typeof a.id !== "string" ||
        typeof a.title !== "string" || typeof a.status !== "string")) return false;

    if (data.projects.some(p => !p || typeof p.id !== "string" ||
        typeof p.name !== "string")) return false;

    return true;
}

function loadDatabase() {
    try {
        const saved = localStorage.getItem(CONFIG.storageKey);
        if (saved) {
            const parsed = JSON.parse(saved);
            if (validateDatabase(parsed)) return parsed;
            console.warn("BDMS: Invalid saved database. Initial data restored.");
        }
    } catch (error) {
        console.error("BDMS storage error:", error);
        toast("Could not read saved data. A new workspace was created.", "warning");
    }

    const fresh = createInitialDatabase();
    try {
        localStorage.setItem(CONFIG.storageKey, JSON.stringify(fresh));
    } catch (error) {
        console.error("BDMS initial save failed:", error);
    }
    return fresh;
}

function saveDatabase() {
    try {
        localStorage.setItem(CONFIG.storageKey, JSON.stringify(database));
        return true;
    } catch (error) {
        console.error("BDMS save failed:", error);
        toast("Storage failed. Export a backup to protect your changes.", "error");
        return false;
    }
}

function persist() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveDatabase, 100);
}

function findUser(id) {
    return database.users.find(user => user.id === id);
}

function getUserName(id) {
    const user = findUser(id);
    return user ? user.displayName : "Unassigned";
}

function can(permission) {
    if (!currentUser) return false;
    const permissions = PERMISSIONS[currentUser.role] || [];
    return permissions.includes("*") || permissions.includes(permission);
}

function requirePermission(permission) {
    if (can(permission)) return true;
    toast("You do not have permission to perform this action.", "error");
    return false;
}

/* ======================== NOTIFICATIONS & ACTIVITY ======================== */

function logActivity(action, details) {
    if (!currentUser || !database) return;

    database.activity.unshift({
        id: uid(),
        userId: currentUser.id,
        action,
        details,
        createdAt: new Date().toISOString()
    });

    database.activity = database.activity.slice(0, 500);
    persist();
}

function addNotification(title, message, targetId = null) {
    database.notifications.unshift({
        id: uid(), title, message, targetId,
        createdAt: new Date().toISOString(),
        read: false
    });
    database.notifications = database.notifications.slice(0, 200);
    persist();
    updateNotificationCount();
}

function markNotificationRead(id) {
    const notification = database.notifications.find(n => n.id === id);
    if (!notification) return;
    notification.read = true;
    persist();
    renderNotifications();
}

function updateNotificationCount() {
    const count = database.notifications.filter(n => !n.read).length;
    $("#notificationNavCount").textContent = count;
    $("#notificationDot").classList.toggle("hidden", count === 0);
}

/* ======================== UI UTILITIES ======================== */

function toast(message, type = "success") {
    const container = $("#toastContainer");
    if (!container) return;

    const icons = {
        success: "check-circle",
        error: "alert-circle",
        warning: "alert-triangle"
    };

    const item = document.createElement("div");
    item.className = `toast ${type}`;
    item.innerHTML = `<i data-lucide="${icons[type] || "info"}"></i><span>${escapeHTML(message)}</span>`;
    container.appendChild(item);
    if (window.lucide) lucide.createIcons();

    setTimeout(() => item.remove(), 3500);
}

function refreshIcons() {
    if (window.lucide) lucide.createIcons();
}

function statusClass(status) {
    return "status-" + slug(status);
}

function badge(status, type = "status") {
    return `<span class="${type}-badge ${type === "status" ? statusClass(status) : "priority-" + slug(status)}">${escapeHTML(status)}</span>`;
}

function emptyState(message, icon = "inbox") {
    return `<div class="empty-state"><i data-lucide="${icon}"></i>${escapeHTML(message)}</div>`;
}

function actionButtons(type, id, allowEdit = true, allowDelete = true) {
    return `<div class="action-buttons">
        ${allowEdit ? `<button data-action="edit-${type}" data-id="${escapeHTML(id)}" title="Edit"><i data-lucide="pencil"></i></button>` : ""}
        ${allowDelete ? `<button data-action="delete-${type}" data-id="${escapeHTML(id)}" title="Delete"><i data-lucide="trash-2"></i></button>` : ""}
    </div>`;
}

function updateClock() {
    $("#liveClock").textContent = new Date().toLocaleTimeString("en-GB", {
        hour: "2-digit", minute: "2-digit"
    });
}

/* ======================== AUTHENTICATION ======================== */

function login(username, password, remember) {
    const user = database.users.find(u =>
        u.username.toLowerCase() === username.trim().toLowerCase() &&
        u.password === password
    );

    if (!user) return false;

    currentUser = user;
    currentUser.lastActive = new Date().toISOString();

    const session = JSON.stringify({ userId: user.id });
    try {
        if (remember) localStorage.setItem(CONFIG.sessionKey, session);
        else sessionStorage.setItem(CONFIG.sessionKey, session);
    } catch (error) {
        console.warn("Session storage unavailable:", error);
    }

    logActivity("Logged in", "Signed in to BDMS.");
    addNotification("Welcome to BDMS", `You are signed in as ${user.role}.`);
    return true;
}

function restoreSession() {
    try {
        const raw = sessionStorage.getItem(CONFIG.sessionKey) ||
            localStorage.getItem(CONFIG.sessionKey);
        if (!raw) return false;

        const session = JSON.parse(raw);
        const user = database.users.find(u => u.id === session.userId);
        if (!user) return false;

        currentUser = user;
        return true;
    } catch {
        return false;
    }
}

function logout() {
    if (!currentUser) return;
    logActivity("Logged out", "Signed out of BDMS.");

    try {
        sessionStorage.removeItem(CONFIG.sessionKey);
        localStorage.removeItem(CONFIG.sessionKey);
    } catch {}

    currentUser = null;
    $("#application").classList.add("hidden");
    $("#loginScreen").classList.remove("hidden");
    $("#loginPassword").value = "";
    toast("You have been signed out.");
}

function showApplication() {
    $("#loginScreen").classList.add("hidden");
    $("#application").classList.remove("hidden");

    const name = currentUser.displayName;
    $("#sidebarUsername").textContent = name;
    $("#sidebarRole").textContent = currentUser.role;
    $("#sidebarAvatar").textContent = initials(name);
    $("#topbarAvatar").textContent = initials(name);
    $("#welcomeHeading").textContent = `Welcome back, ${name.split(" ")[0]}.`;

    applyTheme();
    applyPermissions();
    refreshAll();
    navigate("dashboard");
}

function applyPermissions() {
    $$(".owner-only").forEach(el => {
        el.classList.toggle("hidden", !can("*"));
    });

    $$("[data-action]").forEach(el => {
        const action = el.dataset.action;
        const permission = action.startsWith("create-")
            ? action
            : action.startsWith("edit-")
                ? action
                : action.startsWith("delete-")
                    ? action.replace("delete-", "edit-")
                    : null;

        if (permission && !can(permission) && !can("*")) {
            if (action !== "edit-assignment") el.classList.add("hidden");
        }
    });
}

/* ======================== NAVIGATION ======================== */

function navigate(page) {
    const allowedPages = [
        "dashboard", "assignments", "projects", "developers",
        "departments", "announcements", "calendar", "statistics",
        "activity", "notifications", "settings"
    ];

    if (!allowedPages.includes(page)) return;

    $$(".page").forEach(p => p.classList.remove("active"));
    const target = $(`#page-${page}`);
    if (!target) return;

    target.classList.add("active");
    $$(".nav-link").forEach(link =>
        link.classList.toggle("active", link.dataset.page === page)
    );

    $("#breadcrumbPage").textContent =
        page.charAt(0).toUpperCase() + page.slice(1);

    $("#sidebar").classList.remove("mobile-open");

    renderPage(page);
}

/* ======================== DASHBOARD ======================== */

function renderDashboard() {
    const assignments = database.assignments;
    const completed = assignments.filter(a => a.status === "Completed").length;
    const inProgress = assignments.filter(a => a.status === "In Progress").length;
    const overdue = assignments.filter(isOverdue).length;
    const projects = database.projects.filter(p =>
        !["Completed", "Cancelled"].includes(p.status)
    );

    const progress = assignments.length
        ? Math.round(assignments.reduce((sum, a) => sum + Number(a.progress || 0), 0) / assignments.length)
        : 0;

    $("#statTotal").textContent = assignments.length;
    $("#statProgress").textContent = inProgress;
    $("#statCompleted").textContent = completed;
    $("#statOverdue").textContent = overdue;
    $("#statDevelopers").textContent = database.users.length;
    $("#statProjects").textContent = projects.length;
    $("#statDepartments").textContent = database.departments.length;
    $("#statOverall").textContent = progress + "%";

    $("#progressPercentage").textContent = progress + "%";
    $("#progressRing").style.background =
        `conic-gradient(var(--primary) ${progress}%, #273348 ${progress}%)`;

    $("#progressLabel").textContent = progress >= 80
        ? "Excellent progress"
        : progress >= 50 ? "Good progress"
        : progress >= 20 ? "Getting underway" : "Getting started";

    $("#progressDescription").textContent =
        `${completed} of ${assignments.length} assignments completed.`;

    $("#currentDate").textContent = new Date().toLocaleDateString("en-GB", {
        weekday: "long", day: "numeric", month: "long", year: "numeric"
    });

    $("#assignmentNavCount").textContent =
        assignments.filter(a => a.status !== "Completed").length;

    const recent = [...assignments]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

    $("#recentAssignments").innerHTML = recent.length
        ? `<table><thead><tr><th>Assignment</th><th>Developer</th><th>Status</th></tr></thead><tbody>
        ${recent.map(a => `<tr><td><span class="table-title">${escapeHTML(a.title)}</span><span class="table-subtitle">${escapeHTML(a.department)}</span></td><td>${escapeHTML(getUserName(a.assigneeId))}</td><td>${badge(a.status)}</td></tr>`).join("")}
        </tbody></table>`
        : emptyState("No assignments yet.");

    const announcements = [...database.announcements]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 3);

    $("#dashboardAnnouncements").innerHTML = announcements.length
        ? announcements.map(a => `<div class="preview-item">
            <strong>${escapeHTML(a.title)}</strong>
            <p>${escapeHTML(a.content.slice(0, 105))}${a.content.length > 105 ? "..." : ""}</p>
            <small>${escapeHTML(a.category)} · ${formatDate(a.createdAt.slice(0, 10))}</small>
        </div>`).join("")
        : emptyState("No announcements.");

    $("#dashboardActivity").innerHTML = activityMarkup(database.activity.slice(0, 5));

    drawDashboardChart();
}

function drawDashboardChart() {
    const counts = CONFIG.assignmentStatuses.map(status =>
        database.assignments.filter(a => a.status === status).length
    );

    if (dashboardChart) dashboardChart.destroy();
    dashboardChart = new Chart($("#dashboardChart"), {
        type: "doughnut",
        data: {
            labels: CONFIG.assignmentStatuses,
            datasets: [{
                data: counts,
                backgroundColor: ["#64748b", "#5865f2", "#f59e0b", "#ef4444", "#22c55e", "#94a3b8"],
                borderColor: "#111827",
                borderWidth: 3,
                hoverOffset: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "70%",
            plugins: {
                legend: {
                    position: "right",
                    labels: { color: "#9aa7bb", padding: 13, boxWidth: 8, font: { size: 9 } }
                }
            }
        }
    });
}

/* ======================== ASSIGNMENTS ======================== */

function populateFilters() {
    const options = list => list.map(item =>
        `<option value="${escapeHTML(item)}">${escapeHTML(item)}</option>`
    ).join("");

    $("#assignmentStatusFilter").innerHTML =
        '<option value="">All statuses</option>' + options(CONFIG.assignmentStatuses);

    $("#assignmentPriorityFilter").innerHTML =
        '<option value="">All priorities</option>' + options(CONFIG.priorities);

    $("#assignmentDepartmentFilter").innerHTML =
        '<option value="">All departments</option>' +
        options(database.departments.map(d => d.name));

    $("#developerDepartmentFilter").innerHTML =
        '<option value="">All departments</option>' +
        options(database.departments.map(d => d.name));

    $("#projectStatusFilter").innerHTML =
        '<option value="">All statuses</option>' + options(CONFIG.projectStatuses);

    $("#settingDepartment").innerHTML =
        options(database.departments.map(d => d.name));
}

function renderAssignments() {
    const search = ($("#assignmentSearch").value || "").toLowerCase();
    const status = $("#assignmentStatusFilter").value;
    const priority = $("#assignmentPriorityFilter").value;
    const department = $("#assignmentDepartmentFilter").value;
    const sort = $("#assignmentSort").value;

    let items = database.assignments.filter(a => {
        const matchesSearch = [a.title, a.description, a.department,
            getUserName(a.assigneeId)].join(" ").toLowerCase().includes(search);

        return matchesSearch &&
            (!status || a.status === status) &&
            (!priority || a.priority === priority) &&
            (!department || a.department === department);
    });

    if (currentUser.role === "Developer") {
        items = items.filter(a =>
            a.assigneeId === currentUser.id || a.status === "Completed"
        );
    }

    items.sort((a, b) => {
        if (sort === "oldest") return new Date(a.createdAt) - new Date(b.createdAt);
        if (sort === "due") return (a.dueDate || "9999") .localeCompare(b.dueDate || "9999");
        if (sort === "priority") return CONFIG.priorities.indexOf(b.priority) - CONFIG.priorities.indexOf(a.priority);
        return new Date(b.createdAt) - new Date(a.createdAt);
    });

    $("#assignmentsTable").innerHTML = items.length ? `
        <table>
            <thead><tr><th>Assignment</th><th>Department</th><th>Assigned to</th><th>Priority</th><th>Status</th><th>Progress</th><th>Due date</th><th>Actions</th></tr></thead>
            <tbody>${items.map(a => {
                const editable = can("edit-assignment") ||
                    (can("update-own-assignment") && a.assigneeId === currentUser.id);
                return `<tr>
                    <td><span class="table-title">${escapeHTML(a.title)}</span><span class="table-subtitle">${escapeHTML(a.description || "")}</span></td>
                    <td>${escapeHTML(a.department)}</td>
                    <td>${escapeHTML(getUserName(a.assigneeId))}</td>
                    <td>${badge(a.priority, "priority")}</td>
                    <td>${badge(a.status)}</td>
                    <td><strong>${Number(a.progress)}%</strong></td>
                    <td>${formatDate(a.dueDate)}${isOverdue(a) ? '<br><small style="color:var(--red)">Overdue</small>' : ""}</td>
                    <td>${actionButtons("assignment", a.id, editable, can("*"))}</td>
                </tr>`;
            }).join("")}</tbody>
        </table>` : emptyState("No assignments match your filters.", "clipboard-list");

    refreshIcons();
}

function saveAssignment(form) {
    const data = Object.fromEntries(new FormData(form));
    const existing = database.assignments.find(a => a.id === data.id);

    if (existing) {
        if (!can("edit-assignment") &&
            !(can("update-own-assignment") && existing.assigneeId === currentUser.id)) {
            return toast("You cannot edit this assignment.", "error");
        }

        if (!can("edit-assignment")) {
            existing.status = data.status;
            existing.progress = Math.min(100, Math.max(0, Number(data.progress)));
            if (existing.progress === 100) existing.status = "Completed";
        } else {
            Object.assign(existing, data, { progress: Number(data.progress) });
            if (existing.status === "Completed") existing.progress = 100;
        }

        logActivity("Updated assignment", existing.title);
        addNotification("Assignment updated", existing.title, existing.id);
        toast("Assignment updated successfully.");
    } else {
        if (!requirePermission("create-assignment")) return;

        const item = {
            id: uid(),
            title: data.title.trim(),
            description: data.description.trim(),
            department: data.department,
            priority: data.priority,
            status: data.status,
            progress: Number(data.progress),
            assigneeId: data.assigneeId || "",
            projectId: data.projectId || "",
            dueDate: data.dueDate,
            createdAt: new Date().toISOString()
        };

        if (!item.title) return toast("An assignment title is required.", "error");

        if (item.status === "Completed") item.progress = 100;
        database.assignments.unshift(item);
        logActivity("Created assignment", item.title);
        addNotification("New assignment created", item.title, item.id);
        toast("Assignment created.");
    }

    persist();
    closeModal();
    refreshAll();
}

/* ======================== PROJECTS ======================== */

function renderProjects() {
    const search = ($("#projectSearch").value || "").toLowerCase();
    const status = $("#projectStatusFilter").value;

    let projects = database.projects.filter(p =>
        (!status || p.status === status) &&
        [p.name, p.description, getUserName(p.leaderId)].join(" ").toLowerCase().includes(search)
    );

    if (currentUser.role === "Developer") {
        projects = projects.filter(p => p.developerIds.includes(currentUser.id));
    }

    $("#projectGrid").innerHTML = projects.length ? projects.map(p => `
        <div class="project-card">
            <div class="card-top"><span class="eyebrow">DEVELOPMENT PROJECT</span>${badge(p.status)}</div>
            <h3>${escapeHTML(p.name)}</h3>
            <p>${escapeHTML(p.description || "No description provided.")}</p>
            <div class="card-meta">
                <span><i data-lucide="user"></i>${escapeHTML(getUserName(p.leaderId))}</span>
                <span><i data-lucide="calendar"></i>${formatDate(p.dueDate)}</span>
            </div>
            <div class="progress-track"><div class="progress-fill" style="width:${Math.min(100, Math.max(0, p.progress))}%"></div></div>
            <div class="progress-line"><span>Project progress</span><strong>${p.progress}%</strong></div>
            <div class="card-footer"><span class="muted">${database.assignments.filter(a => a.projectId === p.id).length} assignments</span>${actionButtons("project", p.id, can("edit-project"), can("*"))}</div>
        </div>
    `).join("") : emptyState("No projects found.", "folder-kanban");

    refreshIcons();
}

function saveProject(form) {
    if (!requirePermission(form.elements.id.value ? "edit-project" : "create-project")) return;

    const data = Object.fromEntries(new FormData(form));
    const developerIds = $$('input[name="developerIds"]:checked')
        .map(input => input.value);

    const existing = database.projects.find(p => p.id === data.id);
    const project = {
        id: data.id || uid(),
        name: data.name.trim(),
        description: data.description.trim(),
        status: data.status,
        priority: data.priority,
        leaderId: data.leaderId,
        developerIds,
        startDate: data.startDate,
        dueDate: data.dueDate,
        progress: Math.min(100, Math.max(0, Number(data.progress))),
        createdAt: existing?.createdAt || new Date().toISOString()
    };

    if (!project.name) return toast("Project name is required.", "error");

    if (existing) {
        Object.assign(existing, project);
        logActivity("Updated project", project.name);
    } else {
        database.projects.unshift(project);
        logActivity("Created project", project.name);
    }

    addNotification("Project updated", project.name);
    persist();
    closeModal();
    refreshAll();
    toast("Project saved successfully.");
}

/* ======================== DEVELOPERS ======================== */

function renderDevelopers() {
    const search = ($("#developerSearch").value || "").toLowerCase();
    const department = $("#developerDepartmentFilter").value;

    let users = database.users.filter(u =>
        [u.username, u.displayName, u.role, u.department].join(" ").toLowerCase().includes(search) &&
        (!department || u.department === department)
    );

    $("#developerGrid").innerHTML = users.length ? users.map(u => {
        const tasks = database.assignments.filter(a => a.assigneeId === u.id);
        const completed = tasks.filter(a => a.status === "Completed").length;
        const active = tasks.filter(a => a.status !== "Completed").length;

        return `<div class="developer-card">
            <div class="card-top"><span class="eyebrow">TEAM MEMBER</span>${badge(u.role, "role")}</div>
            <div class="developer-avatar">${escapeHTML(initials(u.displayName))}</div>
            <h3>${escapeHTML(u.displayName)}</h3>
            <p>@${escapeHTML(u.username)}</p>
            <div class="card-meta" style="justify-content:center"><span>${escapeHTML(u.department)}</span></div>
            <div class="developer-metrics">
                <div><strong>${tasks.length}</strong><span>Assigned</span></div>
                <div><strong>${completed}</strong><span>Completed</span></div>
                <div><strong>${active}</strong><span>Active</span></div>
            </div>
            <div class="card-meta"><span>Joined ${formatDate(u.joinDate)}</span></div>
            <div class="card-footer"><span class="muted">Last active ${u.lastActive ? formatDate(u.lastActive.slice(0, 10)) : "Unknown"}</span>
            ${can("*") ? actionButtons("developer", u.id, true, u.id !== currentUser.id) : ""}</div>
        </div>`;
    }).join("") : emptyState("No developers found.", "users");

    refreshIcons();
}

function saveDeveloper(form) {
    if (!requirePermission("*")) return;

    const data = Object.fromEntries(new FormData(form));
    const existing = database.users.find(u => u.id === data.id);

    if (!data.displayName.trim() || !data.username.trim()) {
        return toast("Name and username are required.", "error");
    }

    if (!existing && (!data.password || data.password.length < 4)) {
        return toast("Enter a demonstration password of at least four characters.", "error");
    }

    if (database.users.some(u =>
        u.username.toLowerCase() === data.username.trim().toLowerCase() &&
        u.id !== data.id
    )) return toast("That username is already in use.", "error");

    const user = {
        id: data.id || uid(),
        username: data.username.trim(),
        displayName: data.displayName.trim(),
        password: data.password || existing?.password || "",
        role: data.role,
        department: data.department,
        joinDate: existing?.joinDate || today(),
        lastActive: existing?.lastActive || null,
        permissions: PERMISSIONS[data.role].slice()
    };

    if (existing) Object.assign(existing, user);
    else database.users.push(user);

    logActivity(existing ? "Updated developer" : "Added developer", user.displayName);
    addNotification("Developer account updated", user.displayName);
    persist();
    closeModal();
    refreshAll();
    toast("Developer saved successfully.");
}

/* ======================== DEPARTMENTS ======================== */

function renderDepartments() {
    $("#departmentGrid").innerHTML = database.departments.length
        ? database.departments.map(d => {
            const tasks = database.assignments.filter(a => a.department === d.name);
            const members = database.users.filter(u => u.department === d.name);
            return `<div class="department-card">
                <div class="card-top"><div class="department-icon"><i data-lucide="building-2"></i></div>
                ${can("*") ? actionButtons("department", d.id, true, true) : ""}</div>
                <h3>${escapeHTML(d.name)}</h3>
                <p>${escapeHTML(d.description || "Blues999 development department.")}</p>
                <div class="card-footer"><span>${members.length} developers</span><span>${tasks.length} assignments</span></div>
            </div>`;
        }).join("")
        : emptyState("No departments available.", "network");

    refreshIcons();
}

function saveDepartment(form) {
    if (!requirePermission("*")) return;
    const data = Object.fromEntries(new FormData(form));
    const existing = database.departments.find(d => d.id === data.id);

    if (!data.name.trim()) return toast("Department name is required.", "error");

    if (database.departments.some(d =>
        d.name.toLowerCase() === data.name.trim().toLowerCase() && d.id !== data.id
    )) return toast("This department already exists.", "error");

    if (existing) {
        const oldName = existing.name;
        existing.name = data.name.trim();
        existing.description = data.description.trim();

        database.assignments.forEach(a => {
            if (a.department === oldName) a.department = existing.name;
        });
        database.users.forEach(u => {
            if (u.department === oldName) u.department = existing.name;
        });
    } else {
        database.departments.push({
            id: uid(), name: data.name.trim(),
            description: data.description.trim()
        });
    }

    logActivity(existing ? "Renamed department" : "Created department", data.name);
    persist();
    closeModal();
    refreshAll();
    toast("Department saved.");
}

function deleteDepartment(id) {
    if (!requirePermission("*")) return;
    const department = database.departments.find(d => d.id === id);
    if (!department) return;

    if (database.assignments.some(a => a.department === department.name) ||
        database.users.some(u => u.department === department.name)) {
        return toast("Reassign its developers and assignments before deleting.", "warning");
    }

    if (!confirm(`Delete department "${department.name}"?`)) return;

    database.departments = database.departments.filter(d => d.id !== id);
    logActivity("Deleted department", department.name);
    persist();
    refreshAll();
    toast("Department deleted.");
}

/* ======================== ANNOUNCEMENTS ======================== */

function renderAnnouncements() {
    const items = [...database.announcements]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    $("#announcementGrid").innerHTML = items.length ? items.map(a => `
        <div class="announcement-card announcement-${slug(a.category)}">
            <div class="card-top"><span class="eyebrow">${escapeHTML(a.category)}</span>
                ${actionButtons("announcement", a.id, can("edit-announcement"), can("*"))}
            </div>
            <h3>${escapeHTML(a.title)}</h3>
            <p>${escapeHTML(a.content)}</p>
            <div class="card-meta"><span>By ${escapeHTML(getUserName(a.authorId))}</span><span>${formatDate(a.createdAt.slice(0, 10))}</span></div>
        </div>
    `).join("") : emptyState("No announcements published.", "megaphone");

    refreshIcons();
}

function saveAnnouncement(form) {
    if (!requirePermission(form.elements.id.value ? "edit-announcement" : "create-announcement")) return;

    const data = Object.fromEntries(new FormData(form));
    const existing = database.announcements.find(a => a.id === data.id);

    if (!data.title.trim() || !data.content.trim()) {
        return toast("A title and announcement message are required.", "error");
    }

    if (existing) {
        if (!can("edit-announcement") && existing.authorId !== currentUser.id) {
            return toast("You cannot edit this announcement.", "error");
        }
        Object.assign(existing, data);
        logActivity("Edited announcement", data.title);
    } else {
        database.announcements.unshift({
            id: uid(), title: data.title.trim(),
            content: data.content.trim(), category: data.category,
            authorId: currentUser.id,
            createdAt: new Date().toISOString()
        });
        logActivity("Published announcement", data.title);
    }

    addNotification("New announcement", data.title);
    persist();
    closeModal();
    refreshAll();
    toast("Announcement published.");
}

/* ======================== CALENDAR ======================== */

function getCalendarEvents() {
    const assignmentEvents = database.assignments
        .filter(a => a.dueDate)
        .map(a => ({
            id: a.id, title: a.title, date: a.dueDate,
            type: "assignment", details: a.description,
            status: a.status
        }));

    const projectEvents = database.projects
        .filter(p => p.dueDate)
        .map(p => ({
            id: p.id, title: p.name, date: p.dueDate,
            type: "project", details: p.description,
            status: p.status
        }));

    return [...assignmentEvents, ...projectEvents];
}

function renderCalendar() {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const offset = (first.getDay() + 6) % 7;
    const start = new Date(year, month, 1 - offset);
    const events = getCalendarEvents();

    $("#calendarMonth").textContent = calendarDate.toLocaleDateString("en-GB", {
        month: "long", year: "numeric"
    });

    const cells = [];
    for (let i = 0; i < 42; i++) {
        const date = new Date(start);
        date.setDate(start.getDate() + i);
        const key = date.toISOString().slice(0, 10);
        const dayEvents = events.filter(e => e.date === key);

        cells.push(`<div class="calendar-day ${date.getMonth() !== month ? "muted-day" : ""} ${key === today() ? "today" : ""}" data-calendar-date="${key}">
            <span class="calendar-number">${date.getDate()}</span>
            ${dayEvents.slice(0, 3).map(e =>
                `<span class="calendar-event ${e.type === "project" ? "project-event" : ""}" data-event-id="${escapeHTML(e.id)}" data-event-type="${e.type}" title="${escapeHTML(e.title)}">${escapeHTML(e.title)}</span>`
            ).join("")}
            ${dayEvents.length > 3 ? `<span class="calendar-event">+${dayEvents.length - 3} more</span>` : ""}
        </div>`);
    }

    $("#calendarGrid").innerHTML = cells.join("");

    const upcoming = events.filter(e => e.date >= today())
        .sort((a, b) => a.date.localeCompare(b.date)).slice(0, 10);

    $("#upcomingEvents").innerHTML = upcoming.length
        ? upcoming.map(e => `<div class="activity-item">
            <div class="activity-icon"><i data-lucide="${e.type === "project" ? "folder-kanban" : "clipboard-list"}"></i></div>
            <div class="activity-copy"><strong>${escapeHTML(e.title)}</strong><small>${formatDate(e.date)} · ${escapeHTML(e.type)} · ${escapeHTML(e.status)}</small></div>
        </div>`).join("")
        : emptyState("No upcoming deadlines.", "calendar");

    refreshIcons();
}

function showCalendarEvent(id, type) {
    const item = type === "project"
        ? database.projects.find(p => p.id === id)
        : database.assignments.find(a => a.id === id);

    if (!item) return;

    showModal(item.name || item.title, `
        <div class="modal-info">
            <p><strong>Type:</strong> ${escapeHTML(type)}</p>
            <p><strong>Status:</strong> ${escapeHTML(item.status)}</p>
            <p><strong>Deadline:</strong> ${formatDate(item.dueDate)}</p>
            <p><strong>Description:</strong> ${escapeHTML(item.description || "No description.")}</p>
        </div>
        <div class="form-actions"><button type="button" class="btn btn-secondary" id="eventClose">Close</button></div>
    `);
    $("#eventClose").onclick = closeModal;
}

/* ======================== STATISTICS ======================== */

function renderStatistics() {
    const assignments = database.assignments;
    const total = assignments.length;
    const completed = assignments.filter(a => a.status === "Completed").length;
    const progress = total ? Math.round(assignments.reduce((s, a) => s + Number(a.progress || 0), 0) / total) : 0;
    const overdue = assignments.filter(isOverdue).length;

    $("#analyticsCompletion").textContent = (total ? Math.round(completed / total * 100) : 0) + "%";
    $("#analyticsOpen").textContent = total - completed;
    $("#analyticsProgress").textContent = progress + "%";
    $("#analyticsOverdue").textContent = overdue;

    if (departmentChart) departmentChart.destroy();
    departmentChart = new Chart($("#departmentChart"), {
        type: "bar",
        data: {
            labels: database.departments.map(d => d.name.replace(" Development", "")),
            datasets: [{
                label: "Assignments",
                data: database.departments.map(d => assignments.filter(a => a.department === d.name).length),
                backgroundColor: "#5865f2",
                borderRadius: 5
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { ticks: { color: "#8995a8", font: { size: 8 } }, grid: { display: false } },
                y: { beginAtZero: true, ticks: { color: "#8995a8", precision: 0 }, grid: { color: "#263244" } }
            }
        }
    });

    const projects = database.projects;
    if (projectChart) projectChart.destroy();
    projectChart = new Chart($("#projectChart"), {
        type: "bar",
        data: {
            labels: projects.map(p => p.name.length > 19 ? p.name.slice(0, 19) + "..." : p.name),
            datasets: [{
                label: "Progress %",
                data: projects.map(p => p.progress),
                backgroundColor: "#22c55e",
                borderRadius: 5
            }]
        },
        options: {
            indexAxis: "y", responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { min: 0, max: 100, ticks: { color: "#8995a8" }, grid: { color: "#263244" } },
                y: { ticks: { color: "#8995a8", font: { size: 9 } }, grid: { display: false } }
            }
        }
    });

    $("#workloadTable").innerHTML = database.users.length ? `
        <table><thead><tr><th>Developer</th><th>Department</th><th>Assigned</th><th>Completed</th><th>Active</th></tr></thead>
        <tbody>${database.users.map(u => {
            const tasks = assignments.filter(a => a.assigneeId === u.id);
            return `<tr><td class="table-title">${escapeHTML(u.displayName)}</td><td>${escapeHTML(u.department)}</td><td>${tasks.length}</td><td>${tasks.filter(a => a.status === "Completed").length}</td><td>${tasks.filter(a => a.status !== "Completed").length}</td></tr>`;
        }).join("")}</tbody></table>` : emptyState("No developer data.");

    refreshIcons();
}

/* ======================== ACTIVITY ======================== */

function activityMarkup(items) {
    if (!items.length) return emptyState("No activity recorded.", "history");

    return items.map(item => `
        <div class="activity-item">
            <div class="activity-icon"><i data-lucide="activity"></i></div>
            <div class="activity-copy">
                <strong>${escapeHTML(getUserName(item.userId))}</strong>
                ${escapeHTML(item.action.toLowerCase())}
                <br>${escapeHTML(item.details)}
                <small>${formatTime(item.createdAt)}</small>
            </div>
        </div>
    `).join("");
}

function renderActivity() {
    $("#activityFullList").innerHTML = activityMarkup(database.activity);
    refreshIcons();
}

/* ======================== NOTIFICATIONS ======================== */

function renderNotifications() {
    updateNotificationCount();

    $("#notificationList").innerHTML = database.notifications.length
        ? database.notifications.map(n => `
            <div class="notification-item ${n.read ? "" : "unread"}">
                <div class="activity-icon"><i data-lucide="bell"></i></div>
                <div class="notification-copy">
                    <strong>${escapeHTML(n.title)}</strong>
                    <p>${escapeHTML(n.message)}</p>
                    <small>${formatTime(n.createdAt)}</small>
                </div>
                ${n.read ? "" : `<button class="btn btn-secondary" data-action="read-notification" data-id="${escapeHTML(n.id)}">Mark read</button>`}
            </div>
        `).join("")
        : emptyState("You're all caught up.", "bell");

    refreshIcons();
}

/* ======================== SETTINGS & BACKUPS ======================== */

function applyTheme() {
    document.body.classList.toggle("light-theme", database.settings.theme === "light");
    $("#settingTheme").value = database.settings.theme || "dark";
}

function renderSettings() {
    $("#settingDisplayName").value = currentUser.displayName;
    $("#settingDepartment").value = currentUser.department;
    $("#settingPriority").value = database.settings.defaultPriority || "Medium";
    $("#settingTheme").value = database.settings.theme || "dark";

    $("#adminUsers").innerHTML = database.users.map(u => `
        <div class="activity-item">
            <div class="avatar">${escapeHTML(initials(u.displayName))}</div>
            <div class="activity-copy"><strong>${escapeHTML(u.displayName)}</strong><small>@${escapeHTML(u.username)} · ${escapeHTML(u.role)}</small></div>
            ${can("*") ? actionButtons("developer", u.id, true, u.id !== currentUser.id) : ""}
        </div>
    `).join("");
    refreshIcons();
}

function exportBackup() {
    const backup = {
        application: "Blues999 BDMS",
        version: CONFIG.version,
        exportedAt: new Date().toISOString(),
        data: database
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], {
        type: "application/json"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `BDMS-Backup-${today()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    logActivity("Exported backup", "Downloaded JSON workspace backup.");
    toast("Backup exported.");
}

function importBackup(file) {
    if (!requirePermission("*")) return;
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
        try {
            const backup = JSON.parse(reader.result);
            const imported = backup.data || backup;

            if (!validateDatabase(imported)) {
                throw new Error("The backup structure is invalid.");
            }

            if (!confirm("Import this backup? Current portal data will be replaced.")) return;

            database = imported;
            saveDatabase();

            const user = database.users.find(u => u.id === currentUser.id);
            if (!user) {
                currentUser = null;
                logout();
                return;
            }

            currentUser = user;
            logActivity("Imported backup", "Restored workspace data from JSON.");
            refreshAll();
            toast("Backup restored successfully.");
        } catch (error) {
            toast(error.message || "Could not import this backup.", "error");
        }
    };

    reader.onerror = () => toast("Could not read the selected file.", "error");
    reader.readAsText(file);
}

/* ======================== MODALS & FORMS ======================== */

function showModal(title, content) {
    $("#modalTitle").textContent = title;
    $("#modalBody").innerHTML = content;
    $("#modalBackdrop").classList.remove("hidden");
    refreshIcons();
}

function closeModal() {
    $("#modalBackdrop").classList.add("hidden");
    $("#modalBody").innerHTML = "";
}

function field(label, name, value = "", type = "text", required = false, full = false) {
    return `<div class="form-field ${full ? "full" : ""}">
        <label for="field_${name}">${escapeHTML(label)}</label>
        <input id="field_${name}" name="${name}" type="${type}" value="${escapeHTML(value)}" ${required ? "required" : ""}>
    </div>`;
}

function selectField(label, name, values, selected, full = false) {
    return `<div class="form-field ${full ? "full" : ""}">
        <label>${escapeHTML(label)}</label>
        <select name="${name}" required>${values.map(v =>
            `<option value="${escapeHTML(v)}" ${v === selected ? "selected" : ""}>${escapeHTML(v)}</option>`
        ).join("")}</select>
    </div>`;
}

function textareaField(label, name, value = "", full = true) {
    return `<div class="form-field ${full ? "full" : ""}">
        <label>${escapeHTML(label)}</label>
        <textarea name="${name}">${escapeHTML(value)}</textarea>
    </div>`;
}

function assigneeOptions(selected) {
    return `<option value="">Unassigned</option>` +
        database.users.map(u => `<option value="${escapeHTML(u.id)}" ${u.id === selected ? "selected" : ""}>${escapeHTML(u.displayName)}</option>`).join("");
}

function projectOptions(selected) {
    return `<option value="">No project</option>` +
        database.projects.map(p => `<option value="${escapeHTML(p.id)}" ${p.id === selected ? "selected" : ""}>${escapeHTML(p.name)}</option>`).join("");
}

function departmentOptions(selected) {
    return database.departments.map(d =>
        `<option value="${escapeHTML(d.name)}" ${d.name === selected ? "selected" : ""}>${escapeHTML(d.name)}</option>`
    ).join("");
}

function openAssignmentModal(id = "") {
    const item = database.assignments.find(a => a.id === id);
    const editing = Boolean(item);

    if (editing && !can("edit-assignment") &&
        !(can("update-own-assignment") && item.assigneeId === currentUser.id)) {
        return toast("You cannot edit this assignment.", "error");
    }

    if (!editing && !requirePermission("create-assignment")) return;

    const restricted = editing && !can("edit-assignment");
    const html = `
        <form id="assignmentForm" class="modal-form">
            <input type="hidden" name="id" value="${escapeHTML(item?.id || "")}">
            ${field("Assignment title", "title", item?.title || "", "text", true, true)}
            ${textareaField("Description", "description", item?.description || "")}
            ${selectField("Department", "department", database.departments.map(d => d.name), item?.department || database.settings.defaultDepartment)}
            ${selectField("Priority", "priority", CONFIG.priorities, item?.priority || database.settings.defaultPriority)}
            ${selectField("Assigned developer", "assigneeId", database.users.map(u => u.id), item?.assigneeId || "", true).replace(/<option value="([^"]+)">([^<]+)<\/option>/g, (match, id, name) => `<option value="${escapeHTML(id)}" ${id === (item?.assigneeId || "") ? "selected" : ""}>${escapeHTML(name)}</option>`)}
            ${selectField("Project", "projectId", database.projects.map(p => p.id), item?.projectId || "", true).replace(/<option value="([^"]+)">([^<]+)<\/option>/g, (match, id, name) => `<option value="${escapeHTML(id)}" ${id === (item?.projectId || "") ? "selected" : ""}>${escapeHTML(name)}</option>`)}
            ${selectField("Status", "status", CONFIG.assignmentStatuses, item?.status || "Not Started", true)}
            ${field("Progress (%)", "progress", item?.progress ?? 0, "number")}
            ${field("Due date", "dueDate", item?.dueDate || "", "date")}
            ${restricted ? '<div class="modal-info full">You may update the status and progress of your own assignment. Other fields are managed by the development team.</div>' : ""}
            <div class="form-actions"><button type="button" class="btn btn-secondary" id="cancelModal">Cancel</button><button class="btn btn-primary" type="submit">Save assignment</button></div>
        </form>`;

    showModal(editing ? "Edit assignment" : "Create assignment", html);

    if (restricted) {
        ["title", "description", "department", "priority", "assigneeId", "projectId", "dueDate"].forEach(name => {
            $("#assignmentForm").elements[name].disabled = true;
        });
    }

    $("#cancelModal").onclick = closeModal;
    $("#assignmentForm").onsubmit = e => {
        e.preventDefault();
        const progress = Number(e.target.elements.progress.value);
        if (!Number.isFinite(progress) || progress < 0 || progress > 100) {
            return toast("Progress must be between 0 and 100.", "error");
        }
        saveAssignment(e.target);
    };
}

function openProjectModal(id = "") {
    const item = database.projects.find(p => p.id === id);
    if (item && !requirePermission("edit-project")) return;
    if (!item && !requirePermission("create-project")) return;

    showModal(item ? "Edit project" : "Create project", `
        <form id="projectForm" class="modal-form">
            <input type="hidden" name="id" value="${escapeHTML(item?.id || "")}">
            ${field("Project name", "name", item?.name || "", "text", true, true)}
            ${textareaField("Description", "description", item?.description || "")}
            ${selectField("Status", "status", CONFIG.projectStatuses, item?.status || "Planning")}
            ${selectField("Priority", "priority", CONFIG.priorities, item?.priority || "Medium")}
            <div class="form-field"><label>Project leader</label><select name="leaderId">${database.users.map(u => `<option value="${escapeHTML(u.id)}" ${u.id === (item?.leaderId || currentUser.id) ? "selected" : ""}>${escapeHTML(u.displayName)}</option>`).join("")}</select></div>
            ${field("Start date", "startDate", item?.startDate || today(), "date")}
            ${field("Expected completion", "dueDate", item?.dueDate || "", "date")}
            ${field("Progress (%)", "progress", item?.progress ?? 0, "number")}
            <div class="form-field full"><label>Project developers</label>
                <div class="developer-picker">${database.users.map(u => `
                    <label class="remember-row"><input type="checkbox" name="developerIds" value="${escapeHTML(u.id)}" ${(item?.developerIds || [currentUser.id]).includes(u.id) ? "checked" : ""}>${escapeHTML(u.displayName)}</label>
                `).join("")}</div>
            </div>
            <div class="form-actions"><button type="button" class="btn btn-secondary" id="cancelModal">Cancel</button><button class="btn btn-primary">Save project</button></div>
        </form>
    `);

    $("#cancelModal").onclick = closeModal;
    $("#projectForm").onsubmit = e => {
        e.preventDefault();
        const progress = Number(e.target.elements.progress.value);
        if (!Number.isFinite(progress) || progress < 0 || progress > 100) return toast("Invalid progress.", "error");
        saveProject(e.target);
    };
}

function openDeveloperModal(id = "") {
    if (!requirePermission("*")) return;
    const item = database.users.find(u => u.id === id);
    if (item && item.id === currentUser.id) {
        return toast("Use Account Settings to edit your own display name.", "warning");
    }

    showModal(item ? "Edit developer" : "Add developer", `
        <form id="developerForm" class="modal-form">
            <input type="hidden" name="id" value="${escapeHTML(item?.id || "")}">
            ${field("Display name", "displayName", item?.displayName || "", "text", true)}
            ${field("Username", "username", item?.username || "", "text", true)}
            ${field("Password", "password", "", "password")}
            ${selectField("Role", "role", ["Owner", "Lead Developer", "Developer"], item?.role || "Developer")}
            ${selectField("Department", "department", database.departments.map(d => d.name), item?.department || database.settings.defaultDepartment, true)}
            <div class="modal-info full">${item ? "Leave password empty to keep the existing demonstration password." : "This creates a local demonstration account. Never use a real password."}</div>
            <div class="form-actions"><button type="button" class="btn btn-secondary" id="cancelModal">Cancel</button><button class="btn btn-primary">Save developer</button></div>
        </form>
    `);
    $("#cancelModal").onclick = closeModal;
    $("#developerForm").onsubmit = e => {
        e.preventDefault();
        saveDeveloper(e.target);
    };
}

function openDepartmentModal(id = "") {
    if (!requirePermission("*")) return;
    const item = database.departments.find(d => d.id === id);

    showModal(item ? "Edit department" : "Create department", `
        <form id="departmentForm" class="modal-form">
            <input type="hidden" name="id" value="${escapeHTML(item?.id || "")}">
            ${field("Department name", "name", item?.name || "", "text", true, true)}
            ${textareaField("Description", "description", item?.description || "")}
            <div class="form-actions"><button type="button" class="btn btn-secondary" id="cancelModal">Cancel</button><button class="btn btn-primary">Save department</button></div>
        </form>
    `);
    $("#cancelModal").onclick = closeModal;
    $("#departmentForm").onsubmit = e => {
        e.preventDefault();
        saveDepartment(e.target);
    };
}

function openAnnouncementModal(id = "") {
    const item = database.announcements.find(a => a.id === id);
    if (item && !can("edit-announcement") && item.authorId !== currentUser.id) {
        return toast("You cannot edit this announcement.", "error");
    }
    if (!item && !requirePermission("create-announcement")) return;

    showModal(item ? "Edit announcement" : "Create announcement", `
        <form id="announcementForm" class="modal-form">
            <input type="hidden" name="id" value="${escapeHTML(item?.id || "")}">
            ${field("Announcement title", "title", item?.title || "", "text", true, true)}
            ${selectField("Category", "category", CONFIG.announcementCategories, item?.category || "General", true)}
            ${textareaField("Announcement message", "content", item?.content || "")}
            <div class="form-actions"><button type="button" class="btn btn-secondary" id="cancelModal">Cancel</button><button class="btn btn-primary">Publish announcement</button></div>
        </form>
    `);
    $("#cancelModal").onclick = closeModal;
    $("#announcementForm").onsubmit = e => {
        e.preventDefault();
        saveAnnouncement(e.target);
    };
}

/* ======================== DELETE ACTIONS ======================== */

function deleteItem(type, id) {
    const map = {
        assignment: "assignments",
        project: "projects",
        developer: "users",
        announcement: "announcements"
    };

    const collection = map[type];
    const item = database[collection]?.find(entry => entry.id === id);
    if (!item) return;

    if (type === "assignment" && !can("*")) return toast("Only an Owner can delete assignments.", "error");
    if (type === "project" && !can("*")) return toast("Only an Owner can delete projects.", "error");
    if (type === "developer" && !can("*")) return toast("Only an Owner can manage accounts.", "error");
    if (type === "announcement" && !can("*")) return toast("Only an Owner can delete announcements.", "error");

    if (type === "developer" && item.id === currentUser.id) {
        return toast("You cannot delete your active account.", "warning");
    }

    if (!confirm(`Are you sure you want to delete "${item.title || item.name || item.displayName}"?`)) return;

    database[collection] = database[collection].filter(entry => entry.id !== id);

    if (type === "project") {
        database.assignments.forEach(a => {
            if (a.projectId === id) a.projectId = "";
        });
    }

    if (type === "developer") {
        database.assignments.forEach(a => {
            if (a.assigneeId === id) a.assigneeId = "";
        });
        database.projects.forEach(p => {
            p.developerIds = p.developerIds.filter(devId => devId !== id);
            if (p.leaderId === id) p.leaderId = "";
        });
    }

    logActivity(`Deleted ${type}`, item.title || item.name || item.displayName);
    persist();
    refreshAll();
    toast("Item deleted.");
}

/* ======================== PAGE RENDERING ======================== */

function renderPage(page) {
    switch (page) {
        case "dashboard": renderDashboard(); break;
        case "assignments": renderAssignments(); break;
        case "projects": renderProjects(); break;
        case "developers": renderDevelopers(); break;
        case "departments": renderDepartments(); break;
        case "announcements": renderAnnouncements(); break;
        case "calendar": renderCalendar(); break;
        case "statistics": renderStatistics(); break;
        case "activity": renderActivity(); break;
        case "notifications": renderNotifications(); break;
        case "settings": renderSettings(); break;
    }
}

function refreshAll() {
    populateFilters();
    renderDashboard();
    renderAssignments();
    renderProjects();
    renderDevelopers();
    renderDepartments();
    renderAnnouncements();
    renderCalendar();
    renderStatistics();
    renderActivity();
    renderNotifications();
    renderSettings();
    updateNotificationCount();
    applyPermissions();
    refreshIcons();
}

/* ======================== EVENT LISTENERS ======================== */

function setupEvents() {
    $("#loginForm").addEventListener("submit", e => {
        e.preventDefault();
        const button = $("#loginButton");
        button.disabled = true;
        button.querySelector("span").textContent = "Signing in...";

        const success = login(
            $("#loginUsername").value,
            $("#loginPassword").value,
            $("#rememberMe").checked
        );

        setTimeout(() => {
            button.disabled = false;
            button.querySelector("span").textContent = "Enter BDMS";

            if (success) {
                $("#loginError").textContent = "";
                showApplication();
                toast(`Welcome, ${currentUser.displayName}.`);
            } else {
                $("#loginError").textContent = "Incorrect username or password.";
            }
        }, 350);
    });

    $("#logoutButton").addEventListener("click", logout);

    $("#navigation").addEventListener("click", e => {
        const link = e.target.closest("[data-page]");
        if (link) navigate(link.dataset.page);
    });

    document.addEventListener("click", e => {
        const pageLink = e.target.closest("[data-page]");
        if (pageLink && !pageLink.closest("#navigation")) {
            navigate(pageLink.dataset.page);
            return;
        }

        const actionButton = e.target.closest("[data-action]");
        if (!actionButton) return;

        const action = actionButton.dataset.action;
        const id = actionButton.dataset.id;

        const actions = {
            "create-assignment": () => openAssignmentModal(),
            "edit-assignment": () => openAssignmentModal(id),
            "delete-assignment": () => deleteItem("assignment", id),
            "create-project": () => openProjectModal(),
            "edit-project": () => openProjectModal(id),
            "delete-project": () => deleteItem("project", id),
            "create-developer": () => openDeveloperModal(),
            "edit-developer": () => openDeveloperModal(id),
            "delete-developer": () => deleteItem("developer", id),
            "create-department": () => openDepartmentModal(),
            "edit-department": () => openDepartmentModal(id),
            "delete-department": () => deleteDepartment(id),
            "create-announcement": () => openAnnouncementModal(),
            "edit-announcement": () => openAnnouncementModal(id),
            "delete-announcement": () => deleteItem("announcement", id),
            "read-notification": () => markNotificationRead(id),
            "clear-activity": () => {
                if (!requirePermission("*")) return;
                if (confirm("Clear the entire activity log?")) {
                    database.activity = [];
                    persist();
                    renderActivity();
                    toast("Activity log cleared.");
                }
            }
        };

        if (actions[action]) actions[action]();
    });

    $("#collapseSidebar").addEventListener("click", () => {
        document.body.classList.toggle("collapsed");
    });

    $("#mobileMenu").addEventListener("click", () => {
        $("#sidebar").classList.toggle("mobile-open");
    });

    $("#closeModal").addEventListener("click", closeModal);
    $("#modalBackdrop").addEventListener("click", e => {
        if (e.target === $("#modalBackdrop")) closeModal();
    });

    $("#assignmentSearch").addEventListener("input", renderAssignments);
    $("#assignmentStatusFilter").addEventListener("change", renderAssignments);
    $("#assignmentPriorityFilter").addEventListener("change", renderAssignments);
    $("#assignmentDepartmentFilter").addEventListener("change", renderAssignments);
    $("#assignmentSort").addEventListener("change", renderAssignments);

    $("#projectSearch").addEventListener("input", renderProjects);
    $("#projectStatusFilter").addEventListener("change", renderProjects);
    $("#developerSearch").addEventListener("input", renderDevelopers);
    $("#developerDepartmentFilter").addEventListener("change", renderDevelopers);

    $("#calendarPrev").addEventListener("click", () => {
        calendarDate.setMonth(calendarDate.getMonth() - 1);
        renderCalendar();
    });

    $("#calendarNext").addEventListener("click", () => {
        calendarDate.setMonth(calendarDate.getMonth() + 1);
        renderCalendar();
    });

    $("#calendarGrid").addEventListener("click", e => {
        const event = e.target.closest("[data-event-id]");
        if (event) showCalendarEvent(event.dataset.eventId, event.dataset.eventType);
        else {
            const day = e.target.closest("[data-calendar-date]");
            if (day) {
                const date = day.dataset.calendarDate;
                const events = getCalendarEvents().filter(item => item.date === date);
                if (events.length) {
                    toast(`${events.length} event(s) scheduled for ${formatDate(date)}.`);
                } else {
                    toast(`No deadlines scheduled for ${formatDate(date)}.`, "warning");
                }
            }
        }
    });

    $("#markAllRead").addEventListener("click", () => {
        database.notifications.forEach(n => n.read = true);
        persist();
        renderNotifications();
        toast("All notifications marked as read.");
    });

    $("#accountForm").addEventListener("submit", e => {
        e.preventDefault();
        currentUser.displayName = $("#settingDisplayName").value.trim();
        currentUser.department = $("#settingDepartment").value;
        database.settings.defaultPriority = $("#settingPriority").value;
        database.settings.defaultDepartment = $("#settingDepartment").value;

        logActivity("Updated account preferences", "Changed profile and default settings.");
        persist();
        showApplication();
        toast("Account settings saved.");
    });

    $("#settingTheme").addEventListener("change", e => {
        database.settings.theme = e.target.value;
        applyTheme();
        persist();
        toast("Theme updated.");
    });

    $("#exportBackup").addEventListener("click", exportBackup);
    $("#importBackup").addEventListener("change", e => {
        importBackup(e.target.files[0]);
        e.target.value = "";
    });

    $("#resetData").addEventListener("click", () => {
        if (!requirePermission("*")) return;
        if (!confirm("This will permanently replace all local portal data. Export a backup first. Continue?")) return;
        if (!confirm("Final confirmation: reset all BDMS data?")) return;

        const originalId = currentUser.id;
        database = createInitialDatabase();
        saveDatabase();
        currentUser = database.users.find(u => u.id === originalId) || database.users[0];
        logActivity("Reset platform data", "Restored the default demonstration database.");
        showApplication();
        toast("Demonstration data reset.");
    });

    document.addEventListener("keydown", e => {
        if (e.key === "Escape") closeModal();
    });
}

/* ======================== INITIALISATION ======================== */

function initialise() {
    database = loadDatabase();

    setupEvents();
    updateClock();
    setInterval(updateClock, 30000);

    if (restoreSession()) {
        showApplication();
    } else {
        $("#loginScreen").classList.remove("hidden");
        $("#application").classList.add("hidden");
    }

    refreshIcons();
}

document.addEventListener("DOMContentLoaded", initialise);
