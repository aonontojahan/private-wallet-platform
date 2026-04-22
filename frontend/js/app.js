document.addEventListener("DOMContentLoaded", () => {
  // Auth guard for non-login pages
  const isLoginPage = document.body.classList.contains("login-page") || location.pathname.endsWith("index.html");
  if (!isLoginPage && !isLoggedIn()) {
    window.location.href = "index.html";
    return;
  }

  // Sidebar toggle
  const sidebarToggle = document.getElementById("sidebar-toggle");
  const sidebar = document.getElementById("sidebar");
  const mainContent = document.getElementById("main-content");
  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener("click", () => {
      sidebar.classList.toggle("collapsed");
      if (mainContent) mainContent.classList.toggle("collapsed");
    });
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
  if (!nameEl) return;
  try {
    const wallet = await apiFetch("/wallet/balances");
    if (wallet && wallet.user_id) {
      nameEl.textContent = "User";
    }
  } catch {
    nameEl.textContent = "Guest";
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
