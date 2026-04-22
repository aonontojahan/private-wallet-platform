document.addEventListener("DOMContentLoaded", async () => {
  const adminSection = document.getElementById("admin-section");
  const userSection = document.getElementById("user-section");
  const usersBody = document.getElementById("users-body");
  const btnCreate = document.getElementById("btn-create-user");
  const modal = document.getElementById("create-user-modal");
  const btnClose = document.getElementById("modal-close");
  const createForm = document.getElementById("create-user-form");
  const cpForm = document.getElementById("change-password-form");

  let currentUser = null;

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

  btnCreate.addEventListener("click", () => modal.classList.add("open"));
  btnClose.addEventListener("click", () => modal.classList.remove("open"));
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.classList.remove("open");
  });

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
      modal.classList.remove("open");
      createForm.reset();
      loadUsers();
      showAlert("alert-container", "User created successfully", "success");
    } catch (err) {
      showAlert("alert-container", err.message);
    }
  });

  cpForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearAlert("alert-container");
    const payload = {
      current_password: document.getElementById("cp-current").value,
      new_password: document.getElementById("cp-new").value,
    };
    try {
      await apiFetch("/auth/change-password", { method: "POST", body: payload });
      cpForm.reset();
      showAlert("alert-container", "Password changed successfully", "success");
    } catch (err) {
      showAlert("alert-container", err.message);
    }
  });
});
