document.addEventListener("DOMContentLoaded", async () => {
  const trustEl = document.getElementById("trust-balance");
  const incomeEl = document.getElementById("income-balance");
  const trustStatusDot = document.getElementById("trust-status-dot");
  const toggleEl = document.getElementById("deduct-toggle");
  const userAvatar = document.getElementById("user-avatar");
  const txBody = document.getElementById("transactions-body");
  const btnFilter = document.getElementById("btn-filter");
  const btnDeposit = document.getElementById("btn-deposit");
  const btnWithdraw = document.getElementById("btn-withdraw");
  const btnShowDetails = document.getElementById("btn-show-details");

  let allTransactions = [];

  // Load user info
  try {
    const user = await loadUser();
    if (user) {
      userAvatar.textContent = (user.full_name?.[0] || user.email?.[0] || "U").toUpperCase();
    }
  } catch {
    // silent
  }

  // Load balances
  try {
    const wallet = await apiFetch("/wallet/balances");
    if (wallet) {
      const trustNum = Number(wallet.trust_balance);
      trustEl.innerHTML = `${formatCurrency(wallet.trust_balance)} <span style="font-size:1rem; color:var(--text-muted);">BDT</span>`;
      if (trustNum < 0) {
        trustEl.classList.add("negative");
        trustStatusDot.style.background = "var(--danger)";
      } else {
        trustStatusDot.style.background = "var(--success)";
      }
      incomeEl.innerHTML = `${formatCurrency(wallet.income_balance)} <span style="font-size:1rem; color:var(--text-muted);">BDT</span>`;
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

  // Load statistics
  async function loadStats() {
    try {
      const transactions = await apiFetch("/transactions/all");
      if (!transactions) return;
      allTransactions = transactions;

      let depositAmount = 0;
      let withdrawalAmount = 0;
      let depositOther = 0;
      let withdrawalOther = 0;
      let txAmount = 0;
      let txTrustDebit = 0;
      let txCommission = 0;
      let txIncomeDeduct = 0;

      transactions.forEach((t) => {
        const amt = Number(t.amount);
        const comm = Number(t.commission_amount);
        const deduct = Number(t.income_deduct_amount);

        if (t.type === "deposit" && t.status === "approved") {
          depositAmount += amt;
          depositOther += comm;
        }
        if (t.type === "withdrawal") {
          if (t.status === "approved") withdrawalAmount += amt;
          withdrawalOther += deduct;
          txTrustDebit += amt;
        }
        txAmount += amt;
        txCommission += comm;
        txIncomeDeduct += deduct;
      });

      document.getElementById("stat-deposit-amount").textContent = formatCurrency(depositAmount) + " BDT";
      document.getElementById("stat-withdrawal-amount").textContent = formatCurrency(withdrawalAmount) + " BDT";
      document.getElementById("stat-deposit-other").textContent = formatCurrency(depositOther) + " BDT";
      document.getElementById("stat-withdrawal-other").textContent = formatCurrency(withdrawalOther) + " BDT";
      document.getElementById("stat-tx-amount").textContent = formatCurrency(txAmount) + " BDT";
      document.getElementById("stat-tx-trust-debit").textContent = formatCurrency(txTrustDebit) + " BDT";
      document.getElementById("stat-tx-commission").textContent = formatCurrency(txCommission) + " BDT";
      document.getElementById("stat-tx-income-deduct").textContent = formatCurrency(txIncomeDeduct) + " BDT";

      renderTransactions(transactions);
    } catch (err) {
      showAlert("alert-container", err.message);
    }
  }

  function renderTransactions(items) {
    const fromVal = document.getElementById("filter-from").value;
    const txidVal = document.getElementById("filter-txid").value.trim().toLowerCase();
    const accountVal = document.getElementById("filter-account").value;

    let filtered = items;
    if (fromVal) {
      const fromDate = new Date(fromVal);
      filtered = filtered.filter((t) => new Date(t.created_at) >= fromDate);
    }
    if (txidVal) {
      filtered = filtered.filter((t) => String(t.id).includes(txidVal));
    }
    if (accountVal) {
      filtered = filtered.filter((t) => t.account_type === accountVal);
    }

    txBody.innerHTML = filtered
      .map((t) => {
        const commClass = Number(t.commission_amount) > 0 ? "tx-positive" : "";
        const deductClass = Number(t.income_deduct_amount) > 0 ? "tx-negative" : "";
        const dateStr = formatDate(t.created_at);
        const shortId = String(t.id).padStart(6, "0");

        return `
        <tr>
          <td>
            <div>${dateStr}</div>
            <div style="font-size:0.75rem; color:var(--text-muted);">${shortId}</div>
          </td>
          <td>
            <span style="display:inline-flex; align-items:center; gap:0.4rem; background:var(--bg); padding:0.3rem 0.6rem; border-radius:0.35rem;">
              <span style="font-size:0.9rem;">&#128179;</span>
              <span>${t.account_type || "-"}</span>
            </span>
          </td>
          <td>${t.type}</td>
          <td>${t.account_number || "-"}</td>
          <td>${formatCurrency(t.amount)} BDT</td>
          <td class="${commClass}">${Number(t.commission_amount) > 0 ? "+" : ""}${formatCurrency(t.commission_amount)} BDT</td>
          <td class="${deductClass}">${Number(t.income_deduct_amount) > 0 ? "-" : ""}${formatCurrency(t.income_deduct_amount)} BDT</td>
          <td>${statusBadge(t.status)}</td>
        </tr>
      `;
      })
      .join("") || `<tr><td colspan="8" class="empty-state">No transactions found</td></tr>`;
  }

  btnFilter.addEventListener("click", () => renderTransactions(allTransactions));

  btnDeposit.addEventListener("click", () => {
    window.location.href = "transactions.html";
  });

  btnWithdraw.addEventListener("click", () => {
    window.location.href = "withdrawals.html";
  });

  btnShowDetails.addEventListener("click", () => {
    window.location.href = "statistics.html";
  });

  // Set today in date range
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("stat-date-from").textContent = today;
  document.getElementById("stat-date-to").textContent = today;

  loadStats();
});
