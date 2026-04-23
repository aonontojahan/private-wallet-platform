function loadLocalAccounts() {
  try {
    return JSON.parse(localStorage.getItem("user_accounts") || "[]");
  } catch {
    return [];
  }
}

function saveLocalAccounts(accs) {
  localStorage.setItem("user_accounts", JSON.stringify(accs));
}

function acAccountBadge(type) {
  const t = (type || "").toLowerCase();
  if (t === "bkash") {
    return `<div class="tx-account-badge"><span class="bkash-icon"></span> bKash</div>`;
  }
  if (t === "nagad") {
    return `<div class="tx-account-badge" style="color:#f7931e;"><span class="bkash-icon" style="background:#f7931e;"></span> Nagad</div>`;
  }
  if (t === "bank") {
    return `<div class="tx-account-badge" style="color:var(--accent);"><span class="bkash-icon" style="background:var(--accent);"></span> Bank</div>`;
  }
  return `<div class="tx-account-badge" style="color:var(--text-muted);"><span class="bkash-icon" style="background:var(--text-muted);"></span> ${type || "-"}</div>`;
}

document.addEventListener("DOMContentLoaded", async () => {
  const adminSection = document.getElementById("admin-section");
  const userSection = document.getElementById("user-section");
  const usersBody = document.getElementById("users-body");
  const btnCreate = document.getElementById("btn-create-user");
  const createModal = document.getElementById("create-user-modal");
  const btnClose = document.getElementById("modal-close");
  const createForm = document.getElementById("create-user-form");

  const accountsBody = document.getElementById("accounts-body");
  const acNoData = document.getElementById("ac-no-data");
  const btnFilter = document.getElementById("btn-filter");
  const filterAcNumber = document.getElementById("filter-ac-number");
  const filterDeviceStatus = document.getElementById("filter-device-status");
  const filterAcStatus = document.getElementById("filter-ac-status");

  const addAcModal = document.getElementById("add-account-modal");
  const btnAddAccount = document.getElementById("btn-add-account");
  const btnAcModalClose = document.getElementById("ac-modal-close");
  const addAcForm = document.getElementById("add-account-form");

  let currentUser = null;
  let allAccounts = [];

  try {
    currentUser = await loadUser();
    if (!currentUser) {
      window.location.href = "index.html";
      return;
    }
    if (currentUser.is_admin) {
      adminSection.style.display = "block";
      loadUsers();
    }
  } catch {
    window.location.href = "index.html";
  }

  async function loadUsers() {
    try {
      const users = await apiFetch("/admin/users");
      usersBody.innerHTML = users
        .map(
          (u) => `
        <tr>
          <td>${u.id}</td>
          <td>${escapeHtml(u.full_name)}</td>
          <td>${escapeHtml(u.email)}</td>
          <td>${u.is_admin ? "Yes" : "No"}</td>
          <td>${u.is_active ? "Yes" : "No"}</td>
          <td>${formatDate(u.created_at)}</td>
        </tr>
      `
        )
        .join("") || `<tr><td colspan="6" class="empty-state">No users</td></tr>`;
    } catch (err) {
      showAlert("alert-container", err.message);
    }
  }

  if (btnCreate && createModal) {
    btnCreate.addEventListener("click", () => createModal.classList.add("open"));
  }
  if (btnClose && createModal) {
    btnClose.addEventListener("click", () => createModal.classList.remove("open"));
    createModal.addEventListener("click", (e) => {
      if (e.target === createModal) createModal.classList.remove("open");
    });
  }

  if (createForm) {
    createForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearAlert("alert-container");
      const payload = {
        full_name: document.getElementById("cu-name").value,
        email: document.getElementById("cu-email").value,
        password: document.getElementById("cu-password").value,
        is_admin: document.getElementById("cu-admin").checked,
      };
      try {
        await apiFetch("/admin/users", { method: "POST", body: payload });
        createModal.classList.remove("open");
        createForm.reset();
        loadUsers();
        showAlert("alert-container", "User created successfully", "success");
      } catch (err) {
        showAlert("alert-container", err.message);
      }
    });
  }

  // User accounts section
  async function loadAccounts() {
    try {
      const transactions = await apiFetch("/transactions/all");
      const localAccs = loadLocalAccounts();

      // Derive accounts from transactions
      const seen = new Set();
      const derived = [];
      transactions.forEach((t) => {
        const key = `${t.account_type || "unknown"}-${t.account_number || ""}`;
        if (t.account_number && !seen.has(key)) {
          seen.add(key);
          derived.push({
            id: 59117 + derived.length * 27,
            type: t.account_type,
            number: t.account_number,
            created_at: t.created_at,
            status: "approved",
            device_status: "created",
          });
        }
      });

      allAccounts = [...derived, ...localAccs];
      renderAccounts(allAccounts);
    } catch (err) {
      showAlert("alert-container", err.message);
    }
  }

  function renderAccounts(items) {
    let filtered = [...items];
    const numVal = filterAcNumber.value.trim();
    const devVal = filterDeviceStatus.value;
    const stVal = filterAcStatus.value;

    if (numVal) {
      filtered = filtered.filter((a) => (a.number || "").includes(numVal));
    }
    if (devVal) {
      filtered = filtered.filter((a) => (a.device_status || "") === devVal);
    }
    if (stVal) {
      filtered = filtered.filter((a) => (a.status || "") === stVal);
    }

    if (filtered.length === 0) {
      accountsBody.innerHTML = "";
      acNoData.style.display = "block";
      return;
    }
    acNoData.style.display = "none";

    accountsBody.innerHTML = filtered
      .map((a) => {
        const statusClass = a.status === "approved" ? "approved" : a.status === "deleted" ? "deleted" : "";
        const statusText = a.status === "approved" ? "Approved" : a.status === "deleted" ? "Deleted" : a.status;
        return `
        <tr>
          <td>
            <div class="ac-row-id">${a.id}</div>
            <div class="ac-row-date">${formatTxDate(a.created_at)}</div>
          </td>
          <td>
            ${acAccountBadge(a.type)}
            <div class="tx-account-name">${(a.type || "-").toLowerCase()}</div>
          </td>
          <td>${a.number || "-"}</td>
          <td class="tx-amount-plain">-</td>
          <td><span class="ac-status-badge">${(a.device_status || "Created").replace(/^\w/, (c) => c.toUpperCase())}</span></td>
          <td>
            <span class="ac-status-badge ${statusClass}">${statusText}</span>
            <span class="ac-lock-icon">&#128274;</span>
          </td>
        </tr>
      `;
      })
      .join("");
  }

  if (btnFilter) {
    btnFilter.addEventListener("click", () => renderAccounts(allAccounts));
  }

  if (btnAddAccount && addAcModal) {
    btnAddAccount.addEventListener("click", () => addAcModal.classList.add("open"));
  }
  if (btnAcModalClose && addAcModal) {
    btnAcModalClose.addEventListener("click", () => addAcModal.classList.remove("open"));
    addAcModal.addEventListener("click", (e) => {
      if (e.target === addAcModal) addAcModal.classList.remove("open");
    });
  }

  if (addAcForm) {
    addAcForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const type = document.getElementById("aa-type").value;
      const number = document.getElementById("aa-number").value.trim();
      if (!number) return;

      const localAccs = loadLocalAccounts();
      const newId = 59117 + (allAccounts.length + localAccs.length) * 27;
      localAccs.push({
        id: newId,
        type,
        number,
        created_at: new Date().toISOString(),
        status: "approved",
        device_status: "created",
      });
      saveLocalAccounts(localAccs);
      addAcModal.classList.remove("open");
      addAcForm.reset();
      loadAccounts();
      showAlert("alert-container", "Account added successfully", "success");
    });
  }

  loadAccounts();
});
