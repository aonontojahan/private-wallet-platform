function wdStatusLabel(status) {
  const map = { approved: "Activated", pending: "Pending", rejected: "Rejected" };
  return map[status] || status;
}

function wdStatusClass(status) {
  const map = { approved: "", pending: "pending", rejected: "rejected" };
  return map[status] || "";
}

document.addEventListener("DOMContentLoaded", async () => {
  const trustEl = document.getElementById("trust-balance");
  const incomeEl = document.getElementById("income-balance");
  const trustDot = document.getElementById("trust-status-dot");
  const tbody = document.getElementById("withdrawals-body");
  const noData = document.getElementById("wd-no-data");
  const modal = document.getElementById("withdrawal-modal");
  const btnWithdraw = document.getElementById("btn-withdraw");
  const btnClose = document.getElementById("modal-close");
  const form = document.getElementById("withdrawal-form");
  const btnFilter = document.getElementById("btn-filter");
  const btnDownload = document.getElementById("btn-download");
  const filterFrom = document.getElementById("filter-from");
  const filterTo = document.getElementById("filter-to");
  const filterWdId = document.getElementById("filter-wd-id");
  const filterStatus = document.getElementById("filter-wd-status");
  const dateFromWrap = document.getElementById("wd-date-from-wrap");
  const dateFromBtn = document.getElementById("wd-date-from-btn");
  const dateToWrap = document.getElementById("wd-date-to-wrap");
  const dateToBtn = document.getElementById("wd-date-to-btn");
  const withdrawAvailable = document.getElementById("withdraw-available");
  const wAmount = document.getElementById("w-amount");
  const btnSubmitWithdraw = document.getElementById("btn-submit-withdraw");

  let allWithdrawals = [];
  let currentTrustBalance = 0;

  function updateButtonText(amount) {
    const usdt = (parseFloat(amount) || 0) * 0.01;
    if (btnSubmitWithdraw) {
      btnSubmitWithdraw.textContent = `Withdraw ${formatCurrency(usdt)} USDT`;
    }
  }

  async function loadBalances() {
    try {
      const wallet = await apiFetch("/wallet/balances");
      if (wallet) {
        const trustVal = parseFloat(wallet.trust_balance) || 0;
        currentTrustBalance = trustVal;
        trustEl.innerHTML = `${formatCurrency(wallet.trust_balance)} <span style="font-size:1rem; color:var(--text-muted);">BDT</span>`;
        trustEl.classList.toggle("negative", trustVal < 0);
        if (trustDot) trustDot.classList.toggle("active", trustVal >= 0);
        incomeEl.innerHTML = `${formatCurrency(wallet.income_balance)} <span style="font-size:1rem; color:var(--text-muted);">BDT</span>`;
        if (withdrawAvailable) {
          withdrawAvailable.textContent = `${formatCurrency(trustVal)} BDT`;
          withdrawAvailable.classList.toggle("negative", trustVal < 0);
        }
      }
    } catch (err) {
      showAlert("alert-container", err.message);
    }
  }

  function render(items) {
    let filtered = [...items];
    const fromVal = filterFrom.value;
    const toVal = filterTo.value;
    const wdIdVal = filterWdId.value.trim().toLowerCase();
    const statusVal = filterStatus.value;

    // Filter by date range
    if (fromVal) {
      const fromDate = new Date(fromVal);
      fromDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter((t) => new Date(t.created_at) >= fromDate);
    }
    if (toVal) {
      const toDate = new Date(toVal);
      toDate.setHours(23, 59, 59, 999); // End of day
      filtered = filtered.filter((t) => new Date(t.created_at) <= toDate);
    }
    if (wdIdVal) {
      filtered = filtered.filter((t) => t.id.toString().includes(wdIdVal));
    }
    if (statusVal) {
      filtered = filtered.filter((t) => t.status === statusVal);
    }

    if (filtered.length === 0) {
      tbody.innerHTML = "";
      noData.style.display = "block";
      return;
    }
    noData.style.display = "none";

    tbody.innerHTML = filtered
      .map((t) => {
        return `
        <tr>
          <td>
            <div class="tx-row-date">${formatTxDate(t.created_at)}</div>
            <div class="tx-row-id">${shortId(t.id)}</div>
          </td>
          <td class="tx-amount-plain">${formatCurrency(t.amount)} BDT</td>
          <td><span class="tx-status ${wdStatusClass(t.status)}">${wdStatusLabel(t.status)}</span></td>
          <td><span style="color:var(--text-muted); font-size:0.85rem;">-</span></td>
        </tr>
      `;
      })
      .join("");
  }

  async function loadWithdrawals() {
    try {
      allWithdrawals = await apiFetch("/transactions/withdrawals");
      render(allWithdrawals);
    } catch (err) {
      showAlert("alert-container", err.message);
    }
  }

  btnWithdraw.addEventListener("click", () => modal.classList.add("open"));
  btnClose.addEventListener("click", () => modal.classList.remove("open"));
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.classList.remove("open");
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearAlert("alert-container");
    const amount = parseFloat(document.getElementById("w-amount").value);
    const walletAddress = document.getElementById("w-wallet-address").value;
    const understand = document.getElementById("w-understand").checked;

    if (!understand) {
      showAlert("alert-container", "Please confirm that you understand the withdrawal terms.");
      return;
    }
    if (amount <= 0) {
      showAlert("alert-container", "Amount must be greater than zero.");
      return;
    }

    try {
      await apiFetch("/transactions/withdrawals", {
        method: "POST",
        body: { type: "withdrawal", amount, account_type: "wallet", account_number: walletAddress },
      });
      modal.classList.remove("open");
      form.reset();
      updateButtonText(1);
      if (withdrawAvailable) withdrawAvailable.textContent = "0.00 BDT";
      await loadBalances();
      await loadWithdrawals();
      showAlert("alert-container", "Withdrawal request submitted", "success");
    } catch (err) {
      showAlert("alert-container", err.message);
    }
  });

  if (wAmount) {
    wAmount.addEventListener("input", () => updateButtonText(wAmount.value));
  }

  btnFilter.addEventListener("click", () => render(allWithdrawals));

  btnDownload.addEventListener("click", () => {
    const rows = allWithdrawals.map(
      (t) => `${t.id},${t.amount},${t.status},${t.created_at}`
    );
    const csv = "ID,Amount,Status,CreatedAt\n" + rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "withdrawals.csv";
    a.click();
    URL.revokeObjectURL(url);
  });

  // Date range picker handlers
  if (dateFromWrap && filterFrom) {
    dateFromWrap.addEventListener("click", (e) => {
      if (e.target !== filterFrom) filterFrom.showPicker?.() || filterFrom.focus();
    });
  }
  if (dateFromBtn && filterFrom) {
    dateFromBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      filterFrom.showPicker?.() || filterFrom.focus();
    });
  }
  if (dateToWrap && filterTo) {
    dateToWrap.addEventListener("click", (e) => {
      if (e.target !== filterTo) filterTo.showPicker?.() || filterTo.focus();
    });
  }
  if (dateToBtn && filterTo) {
    dateToBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      filterTo.showPicker?.() || filterTo.focus();
    });
  }

  // Auto-filter when dates change
  if (filterFrom) {
    filterFrom.addEventListener("change", () => render(allWithdrawals));
  }
  if (filterTo) {
    filterTo.addEventListener("change", () => render(allWithdrawals));
  }

  loadBalances();
  loadWithdrawals();
});
