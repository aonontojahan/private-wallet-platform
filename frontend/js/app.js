function formatTxDate(iso) {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const mins = String(d.getMinutes()).padStart(2, "0");
  return `${day}.${month}.${year} ${hours}:${mins}`;
}

function shortId(id) {
  const hex = id.toString(16).padStart(16, "0");
  return hex;
}

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

  // Avatar dropdown
  const avatar = document.getElementById("user-avatar");
  const avatarDropdown = document.getElementById("avatar-dropdown");
  if (avatar && avatarDropdown) {
    avatar.addEventListener("click", (e) => {
      e.stopPropagation();
      avatarDropdown.classList.toggle("open");
      // close others
      const nd = document.getElementById("notification-dropdown");
      if (nd) nd.classList.remove("open");
    });
  }

  // Support modal
  const supportBtn = document.getElementById("support-btn");
  const supportModal = document.getElementById("support-modal");
  const supportModalClose = document.getElementById("support-modal-close");
  const supportForm = document.getElementById("support-form");
  if (supportBtn && supportModal) {
    supportBtn.addEventListener("click", () => supportModal.classList.add("open"));
  }
  if (supportModalClose && supportModal) {
    supportModalClose.addEventListener("click", () => supportModal.classList.remove("open"));
    supportModal.addEventListener("click", (e) => {
      if (e.target === supportModal) supportModal.classList.remove("open");
    });
  }
  if (supportForm) {
    supportForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const subject = document.getElementById("support-subject").value.trim();
      const message = document.getElementById("support-message").value.trim();
      if (!message) {
        showAlert("alert-container", "Please enter a message.");
        return;
      }
      try {
        await apiFetch("/support/send", {
          method: "POST",
          body: { subject: subject || "Support Request", message },
        });
        supportModal.classList.remove("open");
        supportForm.reset();
        showAlert("alert-container", "Message sent successfully!", "success");
      } catch (err) {
        showAlert("alert-container", err.message || "Failed to send message.");
      }
    });
  }

  // FAQ modal
  const helpBtn = document.getElementById("help-btn");
  const faqModal = document.getElementById("faq-modal");
  const faqModalClose = document.getElementById("faq-modal-close");
  const faqSearch = document.getElementById("faq-search");
  const faqTabs = document.querySelectorAll(".faq-tab");
  if (helpBtn && faqModal) {
    helpBtn.addEventListener("click", () => {
      faqModal.classList.add("open");
      renderFAQ();
    });
  }
  if (faqModalClose && faqModal) {
    faqModalClose.addEventListener("click", () => faqModal.classList.remove("open"));
    faqModal.addEventListener("click", (e) => {
      if (e.target === faqModal) faqModal.classList.remove("open");
    });
  }
  if (faqSearch) {
    faqSearch.addEventListener("input", (e) => {
      const activeTab = document.querySelector(".faq-tab.active");
      const cat = activeTab ? activeTab.getAttribute("data-category") : "all";
      renderFAQ(e.target.value, cat);
    });
  }
  faqTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      faqTabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      const cat = tab.getAttribute("data-category");
      const searchVal = faqSearch ? faqSearch.value : "";
      renderFAQ(searchVal, cat);
    });
  });

  // Exchange rate swap
  const swapBtn = document.getElementById("swap-rate-btn");
  const rateText = document.getElementById("exchange-rate-text");
  if (swapBtn && rateText) {
    let usdtToBdt = true;
    swapBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      usdtToBdt = !usdtToBdt;
      rateText.textContent = usdtToBdt ? "1 USDT → 127.65 BDT" : "1 BDT → 0.008 USDT";
    });
  }

  // Close dropdowns on outside click
  document.addEventListener("click", () => {
    if (avatarDropdown) avatarDropdown.classList.remove("open");
  });

  // Populate avatar dropdown with user info
  populateAvatarDropdown();
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

function renderNotifications(dropdownEl, items) {
  const body = dropdownEl.querySelector(".notification-dropdown-body") || dropdownEl;
  if (!items.length) {
    body.innerHTML = `<div class="empty-state" style="padding:2rem; text-align:center; color:var(--text-muted);">No notifications</div>`;
    return;
  }
  body.innerHTML = items
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

async function populateAvatarDropdown() {
  const nameEl = document.getElementById("dropdown-user-name");
  const emailEl = document.getElementById("dropdown-user-email");
  const avatarLarge = document.getElementById("dropdown-avatar-large");
  if (!nameEl && !emailEl) return;
  try {
    const user = await loadUser();
    if (user) {
      const initial = (user.full_name?.[0] || user.email?.[0] || "U").toUpperCase();
      if (nameEl) nameEl.textContent = user.full_name || "User";
      if (emailEl) emailEl.textContent = user.email || "";
      if (avatarLarge) avatarLarge.textContent = initial;
    }
  } catch {
    // silent
  }
}

const faqData = [
  {
    category: "access",
    question: "What should I do if I forget my password?",
    answer: "Contact your administrator or support team at shakibalarman.cse@gmail.com. They can reset your password for you."
  },
  {
    category: "access",
    question: "Why can't I see any data after logging in?",
    answer: "Ensure your account is active. If you just registered, an admin may need to approve your account first. Contact support if the issue persists."
  },
  {
    category: "access",
    question: "What browsers and devices are supported?",
    answer: "Our platform works on all modern browsers including Chrome, Firefox, Safari, and Edge. It is also responsive on mobile devices."
  },
  {
    category: "balances",
    question: "What is the difference between Trust balance and Income balance?",
    answer: "Trust balance is used as a security deposit for transactions. Income balance represents your earnings and can be withdrawn."
  },
  {
    category: "balances",
    question: "What is the minimum trust balance required?",
    answer: "The minimum trust balance is 10,000 BDT and the minimum work trust balance is 15,000 BDT."
  },
  {
    category: "transactions",
    question: "How long do withdrawals take?",
    answer: "Withdrawals take 30 days from the last order in transactions. If there were no transactions, the refund will take up to 3 days."
  },
  {
    category: "transactions",
    question: "What fees are charged on deposits and withdrawals?",
    answer: "A commission is deducted from deposits and an income deduct fee applies to withdrawals. The exact amount is shown in your transaction details."
  },
  {
    category: "accounts",
    question: "How do I add a new withdrawal account?",
    answer: "Go to the Withdrawals page and submit a new withdrawal request with your bKash, Nagad, or Bank account details."
  },
  {
    category: "security",
    question: "Is two-factor authentication available?",
    answer: "Two-factor authentication is coming soon. You will be notified once it is available for your account."
  },
  {
    category: "security",
    question: "How is my data protected?",
    answer: "All data is encrypted in transit using HTTPS and stored securely in our PostgreSQL database with role-based access control."
  }
];

function renderFAQ(filterText = "", category = "all") {
  const list = document.getElementById("faq-list");
  if (!list) return;
  let filtered = faqData;
  if (category !== "all") {
    filtered = filtered.filter((f) => f.category === category);
  }
  if (filterText.trim()) {
    const q = filterText.toLowerCase();
    filtered = filtered.filter((f) => f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q));
  }
  if (!filtered.length) {
    list.innerHTML = `<div class="empty-state">No questions found</div>`;
    return;
  }
  list.innerHTML = filtered
    .map(
      (f, idx) => `
    <div class="faq-item" data-faq="${idx}">
      <div class="faq-question" onclick="toggleFAQItem(this)">
        <span>${escapeHtml(f.question)}</span>
        <span class="faq-arrow">&#8595;</span>
      </div>
      <div class="faq-answer">${escapeHtml(f.answer)}</div>
    </div>
  `
    )
    .join("");
}

function toggleFAQItem(el) {
  const item = el.closest(".faq-item");
  item.classList.toggle("open");
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
