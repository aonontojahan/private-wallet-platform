document.addEventListener("DOMContentLoaded", () => {
  // Auth guard for non-login pages
  const isLoginPage = document.body.classList.contains("login-page") || location.pathname.endsWith("index.html");
  if (!isLoginPage && !isLoggedIn()) {
    window.location.href = "index.html";
    return;
  }

  // Sidebar toggle (admin layout)
  const sidebarToggle = document.getElementById("sidebar-toggle");
  const sidebar = document.getElementById("sidebar");
  const mainContent = document.getElementById("main-content");
  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener("click", () => {
      sidebar.classList.toggle("collapsed");
      if (mainContent) mainContent.classList.toggle("collapsed");
    });
  }

  // User nav drawer toggle (user layout)
  const userMenuBtn = document.getElementById("user-menu-btn");
  const userNavDrawer = document.getElementById("user-nav-drawer");
  const userNavOverlay = document.getElementById("user-nav-overlay");
  const userNavClose = document.getElementById("user-nav-close");

  function openUserNav() {
    if (userNavDrawer) userNavDrawer.classList.add("open");
    if (userNavOverlay) userNavOverlay.classList.add("open");
  }
  function closeUserNav() {
    if (userNavDrawer) userNavDrawer.classList.remove("open");
    if (userNavOverlay) userNavOverlay.classList.remove("open");
  }

  if (userMenuBtn) {
    userMenuBtn.addEventListener("click", openUserNav);
  }
  if (userNavClose) {
    userNavClose.addEventListener("click", closeUserNav);
  }
  if (userNavOverlay) {
    userNavOverlay.addEventListener("click", closeUserNav);
  }

  // Active nav highlighting
  const currentPage = location.pathname.split("/").pop() || "dashboard.html";
  document.querySelectorAll(".nav-item").forEach((item) => {
    const href = item.getAttribute("data-href");
    if (href === currentPage) {
      item.classList.add("active");
    }
    item.addEventListener("click", () => {
      if (href) window.location.href = href;
    });
  });

  document.querySelectorAll(".user-nav-item").forEach((item) => {
    const href = item.getAttribute("data-href");
    if (href === currentPage) {
      item.classList.add("active");
    }
    item.addEventListener("click", () => {
      if (href) window.location.href = href;
    });
  });

  // Logout
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
  }

  // Load notifications bell
  loadNotificationBell();

  // Load user info in topbar
  loadTopbarUser();
});

async function loadNotificationBell() {
  const bell = document.getElementById("notification-bell");
  const badge = document.getElementById("notification-badge");
  const dropdown = document.getElementById("notification-dropdown");
  if (!bell) return;

  try {
    const notifications = await apiFetch("/notifications/");
    if (!notifications) return;
    const unread = notifications.filter((n) => !n.is_read);
    if (badge) {
      badge.textContent = unread.length;
      badge.style.display = unread.length > 0 ? "block" : "none";
    }

    bell.addEventListener("click", (e) => {
      e.stopPropagation();
      if (dropdown) {
        dropdown.classList.toggle("open");
        renderNotifications(dropdown, notifications.slice(0, 5));
      }
    });

    document.addEventListener("click", () => {
      if (dropdown) dropdown.classList.remove("open");
    });
  } catch {
    // silent
  }
}

function renderNotifications(container, items) {
  if (!items.length) {
    container.innerHTML = `<div class="empty-state">No notifications</div>`;
    return;
  }
  container.innerHTML = items
    .map(
      (n) => `
    <div class="notification-item" onclick="markNotificationRead(${n.id})">
      <strong>${escapeHtml(n.title)}</strong>
      <p>${escapeHtml(n.message)}</p>
      <small>${formatDate(n.created_at)}</small>
    </div>
  `
    )
    .join("");
}

async function markNotificationRead(id) {
  try {
    await apiFetch(`/notifications/${id}/read`, { method: "POST" });
    loadNotificationBell();
  } catch {
    // silent
  }
}

async function loadTopbarUser() {
  const nameEl = document.getElementById("topbar-user-name");
  const avatarEl = document.getElementById("user-avatar");
  if (!nameEl && !avatarEl) return;
  try {
    const user = await loadUser();
    if (user) {
      if (nameEl) nameEl.textContent = user.full_name || "User";
      if (avatarEl) avatarEl.textContent = (user.full_name?.[0] || user.email?.[0] || "U").toUpperCase();
    } else {
      if (nameEl) nameEl.textContent = "Guest";
      if (avatarEl) avatarEl.textContent = "G";
    }
  } catch {
    if (nameEl) nameEl.textContent = "Guest";
    if (avatarEl) avatarEl.textContent = "G";
  }
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function showAlert(containerId, message, type = "error") {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = `<div class="alert alert-${type}">${escapeHtml(message)}</div>`;
}

function clearAlert(containerId) {
  const container = document.getElementById(containerId);
  if (container) container.innerHTML = "";
}
