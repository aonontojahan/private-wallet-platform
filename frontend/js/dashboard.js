document.addEventListener("DOMContentLoaded", async () => {
  const trustEl = document.getElementById("trust-balance");
  const incomeEl = document.getElementById("income-balance");
  const toggleEl = document.getElementById("deduct-toggle");
  const recentBody = document.getElementById("recent-transactions");
  const statDeposits = document.getElementById("stat-deposits");
  const statWithdrawals = document.getElementById("stat-withdrawals");
  const statPending = document.getElementById("stat-pending");
  const statCount = document.getElementById("stat-count");

  try {
    const wallet = await apiFetch("/wallet/balances");
    if (wallet) {
      trustEl.textContent = formatCurrency(wallet.trust_balance);
      incomeEl.textContent = formatCurrency(wallet.income_balance);
      toggleEl.checked = wallet.deduct_from_income;
    }
  } catch (err) {
    showAlert("alert-container", err.message);
  }

  toggleEl.addEventListener("change", async () => {
    try {
      await apiFetch("/wallet/toggle-deduct", {
        method: "POST",
        body: { deduct_from_income: toggleEl.checked },
      });
    } catch (err) {
      showAlert("alert-container", err.message);
      toggleEl.checked = !toggleEl.checked;
    }
  });

  document.getElementById("btn-deposit").addEventListener("click", () => {
    window.location.href = "transactions.html";
  });

  document.getElementById("btn-withdraw").addEventListener("click", () => {
    window.location.href = "withdrawals.html";
  });

  try {
    const transactions = await apiFetch("/transactions/all");
    if (transactions) {
      const recent = transactions.slice(0, 5);
      recentBody.innerHTML = recent
        .map(
          (t) => `
        <tr>
          <td>#${t.id}</td>
          <td>${t.type}</td>
          <td>${formatCurrency(t.amount)}</td>
          <td>${statusBadge(t.status)}</td>
          <td>${formatDate(t.created_at)}</td>
        </tr>
      `
        )
        .join("") || `<tr><td colspan="5" class="empty-state">No transactions yet</td></tr>`;

      let totalDeposits = 0;
      let totalWithdrawals = 0;
      let pending = 0;
      transactions.forEach((t) => {
        if (t.type === "deposit" && t.status === "approved") totalDeposits += Number(t.amount);
        if (t.type === "withdrawal" && t.status === "approved") totalWithdrawals += Number(t.amount);
        if (t.status === "pending") pending++;
      });
      statDeposits.textContent = formatCurrency(totalDeposits);
      statWithdrawals.textContent = formatCurrency(totalWithdrawals);
      statPending.textContent = pending;
      statCount.textContent = transactions.length;
    }
  } catch (err) {
    showAlert("alert-container", err.message);
  }
});
