document.addEventListener("DOMContentLoaded", async () => {
  const trustEl = document.getElementById("trust-balance");
  const incomeEl = document.getElementById("income-balance");
  const tbody = document.getElementById("withdrawals-body");
  const modal = document.getElementById("withdrawal-modal");
  const btnNew = document.getElementById("btn-new-withdrawal");
  const btnClose = document.getElementById("modal-close");
  const form = document.getElementById("withdrawal-form");

  async function loadBalances() {
    try {
      const wallet = await apiFetch("/wallet/balances");
      if (wallet) {
        trustEl.textContent = formatCurrency(wallet.trust_balance);
        incomeEl.textContent = formatCurrency(wallet.income_balance);
      }
    } catch (err) {
      showAlert("alert-container", err.message);
    }
  }

  async function loadWithdrawals() {
    try {
      const items = await apiFetch("/transactions/withdrawals");
      tbody.innerHTML = items
        .map(
          (t) => `
        <tr>
          <td>#${t.id}</td>
          <td>${formatCurrency(t.amount)}</td>
          <td>${t.account_type || "-"}</td>
          <td>${t.account_number || "-"}</td>
          <td>${statusBadge(t.status)}</td>
          <td>${formatDate(t.created_at)}</td>
        </tr>
      `
        )
        .join("") || `<tr><td colspan="6" class="empty-state">No withdrawals yet</td></tr>`;
    } catch (err) {
      showAlert("alert-container", err.message);
    }
  }

  btnNew.addEventListener("click", () => modal.classList.add("open"));
  btnClose.addEventListener("click", () => modal.classList.remove("open"));
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.classList.remove("open");
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearAlert("alert-container");
    const amount = parseFloat(document.getElementById("w-amount").value);
    const accountType = document.getElementById("w-account-type").value;
    const accountNumber = document.getElementById("w-account-number").value;

    try {
      await apiFetch("/transactions/withdrawals", {
        method: "POST",
        body: { type: "withdrawal", amount, account_type: accountType, account_number: accountNumber },
      });
      modal.classList.remove("open");
      form.reset();
      await loadBalances();
      await loadWithdrawals();
      showAlert("alert-container", "Withdrawal request submitted", "success");
    } catch (err) {
      showAlert("alert-container", err.message);
    }
  });

  loadBalances();
  loadWithdrawals();
});
