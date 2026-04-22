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
  const filterWdId = document.getElementById("filter-wd-id");
  const filterStatus = document.getElementById("filter-wd-status");
  const dateWrap = document.getElementById("wd-date-wrap");
  const dateBtn = document.getElementById("wd-date-btn");

  let allWithdrawals = [];

  async function loadBalances() {
    try {
      const wallet = await apiFetch("/wallet/balances");
      if (wallet) {
        const trustVal = parseFloat(wallet.trust_balance) || 0;
        trustEl.innerHTML = `${formatCurrency(wallet.trust_balance)} <span style="font-size:1rem; color:var(--text-muted);">BDT</span>`;
        trustEl.classList.toggle("negative", trustVal < 0);
        if (trustDot) trustDot.classList.toggle("active", trustVal >= 0);
        incomeEl.innerHTML = `${formatCurrency(wallet.income_balance)} <span style="font-size:1rem; color:var(--text-muted);">BDT</span>`;
      }
    } catch (err) {
      showAlert("alert-container", err.message);
    }
  }

  function render(items) {
    let filtered = [...items];
    const fromVal = filterFrom.value;
    const wdIdVal = filterWdId.value.trim().toLowerCase();
    const statusVal = filterStatus.value;

    if (fromVal) {
      const fromDate = new Date(fromVal);
      fromDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter((t) => new Date(t.created_at) >= fromDate);
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

  if (dateWrap && filterFrom) {
    dateWrap.addEventListener("click", (e) => {
      if (e.target !== filterFrom) filterFrom.showPicker?.() || filterFrom.focus();
    });
    filterFrom.addEventListener("change", () => render(allWithdrawals));
  }
  if (dateBtn && filterFrom) {
    dateBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      filterFrom.showPicker?.() || filterFrom.focus();
    });
  }

  loadBalances();
  loadWithdrawals();
});
