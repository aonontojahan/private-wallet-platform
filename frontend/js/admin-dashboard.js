document.addEventListener("DOMContentLoaded", async () => {
  // State
  let allUsers = [];
  let allTransactions = [];
  let pendingTransactions = [];

  // DOM Elements
  const statTotalUsers = document.getElementById("stat-total-users");
  const statTotalTrust = document.getElementById("stat-total-trust");
  const statTotalIncome = document.getElementById("stat-total-income");
  const statPendingCount = document.getElementById("stat-pending-count");
  const usersTableBody = document.getElementById("users-table-body");
  const pendingBody = document.getElementById("pending-transactions-body");
  const recentBody = document.getElementById("recent-transactions");
  const userSearch = document.getElementById("user-search");
  const userFilter = document.getElementById("user-filter");

  // Load all data
  await Promise.all([loadUsers(), loadTransactions()]);

  // Event Listeners
  if (userSearch) {
    userSearch.addEventListener("input", () => renderUsers());
  }

  if (userFilter) {
    userFilter.addEventListener("change", () => renderUsers());
  }

  // Quick Action Buttons
  document.getElementById("btn-create-user").addEventListener("click", () => {
    window.location.href = "accounts.html";
  });

  document.getElementById("btn-deposit").addEventListener("click", () => {
    openModal("admin-deposit-modal");
    populateUserSelect("deposit-user-select");
  });

  document.getElementById("btn-pending").addEventListener("click", () => {
    window.location.href = "withdrawals.html";
  });

  document.getElementById("btn-adjust-balance").addEventListener("click", () => {
    openModal("adjust-balance-modal");
    populateUserSelect("adjust-user-select");
  });

  // Admin Deposit Form
  const depositForm = document.getElementById("admin-deposit-form");
  if (depositForm) {
    depositForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const userId = document.getElementById("deposit-user-select").value;
      const amount = document.getElementById("deposit-amount").value;
      const accountType = document.getElementById("deposit-account-type").value;
      const accountNumber = document.getElementById("deposit-account-number").value;

      try {
        await apiFetch(`/admin/deposits?user_id=${userId}&amount=${amount}`, {
          method: "POST",
          body: accountType ? { account_type: accountType, account_number: accountNumber } : {},
        });
        closeModal("admin-deposit-modal");
        depositForm.reset();
        showAlert("alert-container", "Deposit processed successfully", "success");
        await loadTransactions();
        await loadUsers();
      } catch (err) {
        showAlert("alert-container", err.message);
      }
    });
  }

  // Adjust Balance Form
  const adjustForm = document.getElementById("adjust-balance-form");
  if (adjustForm) {
    adjustForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const userId = document.getElementById("adjust-user-select").value;
      const walletType = document.getElementById("adjust-wallet-type").value;
      const amount = document.getElementById("adjust-amount").value;
      const description = document.getElementById("adjust-description").value;

      try {
        await apiFetch("/admin/adjust-balance", {
          method: "POST",
          body: {
            user_id: parseInt(userId),
            wallet_type: walletType,
            amount: parseFloat(amount),
            description: description || "Admin adjustment",
          },
        });
        closeModal("adjust-balance-modal");
        adjustForm.reset();
        showAlert("alert-container", "Balance adjusted successfully", "success");
        await loadUsers();
      } catch (err) {
        showAlert("alert-container", err.message);
      }
    });
  }

  // Modal Close Buttons
  setupModalClose("user-detail-modal", "user-detail-close");
  setupModalClose("adjust-balance-modal", "adjust-balance-close");
  setupModalClose("admin-deposit-modal", "admin-deposit-close");

  // Functions
  async function loadUsers() {
    try {
      const users = await apiFetch("/admin/users");
      if (users) {
        allUsers = users;
        renderUsers();
        updatePlatformStats();
      }
    } catch (err) {
      showAlert("alert-container", err.message);
    }
  }

  async function loadTransactions() {
    try {
      const transactions = await apiFetch("/transactions/all");
      if (transactions) {
        allTransactions = transactions;
        pendingTransactions = transactions.filter((t) => t.status === "pending");
        renderPendingTransactions();
        renderRecentTransactions();
        updatePlatformStats();
      }
    } catch (err) {
      showAlert("alert-container", err.message);
    }
  }

  function renderUsers() {
    const searchTerm = userSearch ? userSearch.value.toLowerCase() : "";
    const filterValue = userFilter ? userFilter.value : "all";

    let filtered = allUsers;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (u) =>
          u.full_name.toLowerCase().includes(searchTerm) ||
          u.email.toLowerCase().includes(searchTerm)
      );
    }

    // Apply status/role filter
    if (filterValue === "active") {
      filtered = filtered.filter((u) => u.is_active);
    } else if (filterValue === "inactive") {
      filtered = filtered.filter((u) => !u.is_active);
    } else if (filterValue === "admin") {
      filtered = filtered.filter((u) => u.is_admin);
    }

    if (!filtered.length) {
      usersTableBody.innerHTML = `<tr><td colspan="9" class="empty-state">No users found</td></tr>`;
      return;
    }

    usersTableBody.innerHTML = filtered
      .map(
        (u) => `
      <tr>
        <td>#${u.id}</td>
        <td>${escapeHtml(u.full_name)}</td>
        <td>${escapeHtml(u.email)}</td>
        <td>${formatCurrency(u.wallet?.trust_balance || 0)}</td>
        <td>${formatCurrency(u.wallet?.income_balance || 0)}</td>
        <td><span class="badge ${u.is_active ? 'badge-active' : 'badge-inactive'}">${u.is_active ? 'Active' : 'Inactive'}</span></td>
        <td><span class="badge ${u.is_admin ? 'badge-admin' : 'badge-user'}">${u.is_admin ? 'Admin' : 'User'}</span></td>
        <td>${formatDate(u.created_at)}</td>
        <td>
          <div class="user-actions">
            <button class="btn btn-sm btn-icon btn-view" onclick="viewUserDetail(${u.id})" title="View Details">&#128065;</button>
            <button class="btn btn-sm btn-icon btn-toggle" onclick="toggleUserStatus(${u.id}, ${u.is_active})" title="${u.is_active ? 'Deactivate' : 'Activate'}">${u.is_active ? '&#128274;' : '&#128275;'}</button>
          </div>
        </td>
      </tr>
    `
      )
      .join("");
  }

  function renderPendingTransactions() {
    if (!pendingBody) return;

    if (!pendingTransactions.length) {
      pendingBody.innerHTML = `<tr><td colspan="7" class="empty-state">No pending transactions</td></tr>`;
      return;
    }

    pendingBody.innerHTML = pendingTransactions
      .slice(0, 10)
      .map(
        (t) => `
      <tr>
        <td>#${t.id}</td>
        <td>${getUserName(t.user_id)}</td>
        <td>${t.type}</td>
        <td>${formatCurrency(t.amount)}</td>
        <td>${t.account_type ? `${t.account_type} (${t.account_number})` : '-'}</td>
        <td>${formatDate(t.created_at)}</td>
        <td>
          <div class="user-actions">
            <button class="btn btn-sm btn-success" onclick="approveTransaction(${t.id})">&#10004; Approve</button>
            <button class="btn btn-sm btn-danger" onclick="rejectTransaction(${t.id})">&#10008; Reject</button>
          </div>
        </td>
      </tr>
    `
      )
      .join("");
  }

  function renderRecentTransactions() {
    if (!recentBody) return;

    const recent = allTransactions.slice(0, 10);
    recentBody.innerHTML = recent
      .map(
        (t) => `
      <tr>
        <td>#${t.id}</td>
        <td>${getUserName(t.user_id)}</td>
        <td>${t.type}</td>
        <td>${formatCurrency(t.amount)}</td>
        <td>${statusBadge(t.status)}</td>
        <td>${formatDate(t.created_at)}</td>
      </tr>
    `
      )
      .join("") || `<tr><td colspan="6" class="empty-state">No transactions yet</td></tr>`;
  }

  function updatePlatformStats() {
    // Total users
    if (statTotalUsers) {
      statTotalUsers.textContent = allUsers.length;
    }

    // Total trust and income balance
    let totalTrust = 0;
    let totalIncome = 0;
    allUsers.forEach((u) => {
      if (u.wallet) {
        totalTrust += Number(u.wallet.trust_balance || 0);
        totalIncome += Number(u.wallet.income_balance || 0);
      }
    });

    if (statTotalTrust) {
      statTotalTrust.textContent = formatCurrency(totalTrust);
    }
    if (statTotalIncome) {
      statTotalIncome.textContent = formatCurrency(totalIncome);
    }

    // Pending transactions
    if (statPendingCount) {
      statPendingCount.textContent = pendingTransactions.length;
    }
  }

  function populateUserSelect(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;

    select.innerHTML = '<option value="">Choose a user...</option>';
    allUsers
      .filter((u) => !u.is_admin) // Exclude admins
      .forEach((u) => {
        const option = document.createElement("option");
        option.value = u.id;
        option.textContent = `${u.full_name} (${u.email})`;
        select.appendChild(option);
      });
  }

  function getUserName(userId) {
    const user = allUsers.find((u) => u.id === userId);
    return user ? escapeHtml(user.full_name) : `User #${userId}`;
  }

  async function viewUserDetail(userId) {
    try {
      const user = await apiFetch(`/admin/users/${userId}`);
      if (!user) return;

      const content = document.getElementById("user-detail-content");
      content.innerHTML = `
        <div class="user-detail-header">
          <div class="user-avatar-large">${user.full_name.charAt(0).toUpperCase()}</div>
          <div class="user-info-basic">
            <h3>${escapeHtml(user.full_name)}</h3>
            <p>&#9993; ${escapeHtml(user.email)}</p>
            <p>&#128197; Joined ${formatDate(user.created_at)}</p>
          </div>
        </div>

        <div class="user-balance-grid">
          <div class="user-balance-card">
            <div class="label">Trust Balance</div>
            <div class="amount">${formatCurrency(user.trust_balance || 0)}</div>
          </div>
          <div class="user-balance-card">
            <div class="label">Income Balance</div>
            <div class="amount">${formatCurrency(user.income_balance || 0)}</div>
          </div>
        </div>

        <div class="user-detail-section">
          <h4>Account Information</h4>
          <div class="user-detail-row">
            <span class="label">User ID</span>
            <span class="value">#${user.id}</span>
          </div>
          <div class="user-detail-row">
            <span class="label">Email</span>
            <span class="value">${escapeHtml(user.email)}</span>
          </div>
          <div class="user-detail-row">
            <span class="label">Full Name</span>
            <span class="value">${escapeHtml(user.full_name)}</span>
          </div>
          <div class="user-detail-row">
            <span class="label">Role</span>
            <span class="value"><span class="badge ${user.is_admin ? 'badge-admin' : 'badge-user'}">${user.is_admin ? 'Admin' : 'User'}</span></span>
          </div>
          <div class="user-detail-row">
            <span class="label">Status</span>
            <span class="value"><span class="badge ${user.is_active ? 'badge-active' : 'badge-inactive'}">${user.is_active ? 'Active' : 'Inactive'}</span></span>
          </div>
          <div class="user-detail-row">
            <span class="label">Deduct from Income</span>
            <span class="value">${user.deduct_from_income ? 'Yes' : 'No'}</span>
          </div>
        </div>

        <div style="display: flex; gap: 1rem; margin-top: 2rem;">
          <button class="btn btn-primary btn-block" onclick="closeModal('user-detail-modal'); openModal('adjust-balance-modal'); populateUserSelect('adjust-user-select'); document.getElementById('adjust-user-select').value = ${user.id};">
            &#9881; Adjust Balance
          </button>
        </div>
      `;

      openModal("user-detail-modal");
    } catch (err) {
      showAlert("alert-container", err.message);
    }
  }

  async function toggleUserStatus(userId, currentStatus) {
    const action = currentStatus ? "deactivate" : "activate";
    if (!confirm(`Are you sure you want to ${action} this user?`)) return;

    try {
      await apiFetch(`/admin/users/${userId}/toggle-status`, {
        method: "POST",
        body: { is_active: !currentStatus },
      });
      showAlert("alert-container", `User ${action}d successfully`, "success");
      await loadUsers();
    } catch (err) {
      showAlert("alert-container", err.message);
    }
  }

  async function approveTransaction(transactionId) {
    if (!confirm("Are you sure you want to approve this transaction?")) return;

    try {
      await apiFetch(`/admin/transactions/${transactionId}/approve`, {
        method: "POST",
        body: { admin_note: "Approved by admin" },
      });
      showAlert("alert-container", "Transaction approved successfully", "success");
      // Reload all data to reflect changes
      await Promise.all([loadTransactions(), loadUsers()]);
    } catch (err) {
      showAlert("alert-container", err.message);
    }
  }

  async function rejectTransaction(transactionId) {
    if (!confirm("Are you sure you want to reject this transaction?")) return;

    try {
      await apiFetch(`/admin/transactions/${transactionId}/reject`, {
        method: "POST",
        body: { admin_note: "Rejected by admin" },
      });
      showAlert("alert-container", "Transaction rejected successfully", "success");
      // Reload all data to reflect changes
      await Promise.all([loadTransactions(), loadUsers()]);
    } catch (err) {
      showAlert("alert-container", err.message);
    }
  }

  function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add("open");
  }

  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove("open");
  }

  function setupModalClose(modalId, closeBtnId) {
    const modal = document.getElementById(modalId);
    const closeBtn = document.getElementById(closeBtnId);

    if (closeBtn && modal) {
      closeBtn.addEventListener("click", () => closeModal(modalId));
      modal.addEventListener("click", (e) => {
        if (e.target === modal) closeModal(modalId);
      });
    }
  }

  // Make functions globally accessible
  window.viewUserDetail = viewUserDetail;
  window.toggleUserStatus = toggleUserStatus;
  window.approveTransaction = approveTransaction;
  window.rejectTransaction = rejectTransaction;
  window.closeModal = closeModal;
  window.openModal = openModal;
  window.populateUserSelect = populateUserSelect;
});
