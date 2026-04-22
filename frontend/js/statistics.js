document.addEventListener("DOMContentLoaded", async () => {
  const stDeposits = document.getElementById("st-deposits");
  const stWithdrawals = document.getElementById("st-withdrawals");
  const stPending = document.getElementById("st-pending");
  const stTotal = document.getElementById("st-total");
  const statsBody = document.getElementById("stats-body");
  const btnFilter = document.getElementById("btn-stat-filter");
  const btnExport = document.getElementById("btn-stat-export");
  const fromEl = document.getElementById("stat-from");
  const toEl = document.getElementById("stat-to");

  let allTransactions = [];

  async function load() {
    try {
      allTransactions = await apiFetch("/transactions/all");
      compute(allTransactions);
    } catch (err) {
      showAlert("alert-container", err.message);
    }
  }

  function compute(items) {
    let filtered = items;
    const fromVal = fromEl.value;
    const toVal = toEl.value;

    if (fromVal) {
      const fromDate = new Date(fromVal);
      filtered = filtered.filter((t) => new Date(t.created_at) >= fromDate);
    }
    if (toVal) {
      const toDate = new Date(toVal);
      toDate.setHours(23, 59, 59);
      filtered = filtered.filter((t) => new Date(t.created_at) <= toDate);
    }

    let totalDeposits = 0;
    let totalWithdrawals = 0;
    let pending = 0;
    const byAccount = {};

    filtered.forEach((t) => {
      if (t.type === "deposit" && t.status === "approved") totalDeposits += Number(t.amount);
      if (t.type === "withdrawal" && t.status === "approved") totalWithdrawals += Number(t.amount);
      if (t.status === "pending") pending++;

      const acc = t.account_type || "Unknown";
      if (!byAccount[acc]) byAccount[acc] = { count: 0, total: 0 };
      byAccount[acc].count++;
      byAccount[acc].total += Number(t.amount);
    });

    stDeposits.textContent = formatCurrency(totalDeposits);
    stWithdrawals.textContent = formatCurrency(totalWithdrawals);
    stPending.textContent = pending;
    stTotal.textContent = filtered.length;

    statsBody.innerHTML = Object.entries(byAccount)
      .map(
        ([acc, data]) => `
      <tr>
        <td>${escapeHtml(acc)}</td>
        <td>${data.count}</td>
        <td>${formatCurrency(data.total)}</td>
      </tr>
    `
      )
      .join("") || `<tr><td colspan="3" class="empty-state">No data</td></tr>`;
  }

  btnFilter.addEventListener("click", () => compute(allTransactions));

  btnExport.addEventListener("click", () => {
    const rows = allTransactions.map(
      (t) =>
        `${t.id},${t.type},${t.account_type || ""},${t.amount},${t.status},${t.created_at}`
    );
    const csv = "ID,Type,Account,Amount,Status,CreatedAt\n" + rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "statistics.csv";
    a.click();
    URL.revokeObjectURL(url);
  });

  load();
});
