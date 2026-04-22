document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;
      const errorDiv = document.getElementById("login-error");
      errorDiv.style.display = "none";

      try {
        const data = await apiFetch("/auth/login", {
          method: "POST",
          body: { email, password },
        });
        if (data && data.access_token) {
          localStorage.setItem("token", data.access_token);
          window.location.href = "dashboard.html";
        }
      } catch (err) {
        errorDiv.textContent = err.message || "Login failed";
        errorDiv.style.display = "block";
      }
    });
  }
});

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "index.html";
}

function isLoggedIn() {
  return !!localStorage.getItem("token");
}

async function loadUser() {
  const cached = localStorage.getItem("user");
  if (cached) return JSON.parse(cached);
  try {
    const user = await apiFetch("/auth/me");
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    }
    return user;
  } catch {
    return null;
  }
}
