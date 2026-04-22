const API_BASE = "http://localhost:8000/api";

function getToken() {
  return localStorage.getItem("token");
}

async function apiFetch(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const opts = {
    headers: {
      "Content-Type": "application/json",
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
      ...options.headers,
    },
    ...options,
  };

  if (opts.body && typeof opts.body === "object" && !(opts.body instanceof FormData)) {
    opts.body = JSON.stringify(opts.body);
  }

  try {
    const res = await fetch(url, opts);
    if (res.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "index.html";
      return null;
    }
    const data = res.headers.get("content-type")?.includes("application/json")
      ? await res.json()
      : null;
    if (!res.ok) {
      const err = new Error(data?.detail || `HTTP ${res.status}`);
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  } catch (e) {
    if (e.name === "TypeError") {
      throw new Error("Network error. Is the backend running?");
    }
    throw e;
  }
}

function formatCurrency(value) {
  const num = Number(value);
  if (isNaN(num)) return "0.00";
  return num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 });
}

function formatDate(isoString) {
  if (!isoString) return "-";
  const d = new Date(isoString);
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusBadge(status) {
  const map = {
    pending: "badge-pending",
    approved: "badge-approved",
    rejected: "badge-rejected",
  };
  const cls = map[status] || "badge-pending";
  return `<span class="badge ${cls}">${status}</span>`;
}
