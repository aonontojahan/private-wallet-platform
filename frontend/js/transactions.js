function txStatusLabel(status) {
  const map = { approved: "Activated", pending: "Pending", rejected: "Rejected" };
  return map[status] || status;
}

function txStatusClass(status) {
  const map = { approved: "", pending: "pending", rejected: "rejected" };
  return map[status] || "";
}

function accountBadge(type) {
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
  const tbody = document.getElementById("transactions-body");
  const noData = document.getElementById("tx-no-data");
  const btnFilter = document.getElementById("btn-filter");
  const btnDownload = document.getElementById("btn-download");
  const filterFrom = document.getElementById("filter-from");
  const filterTxId = document.getElementById("filter-tx-id");
  const filterAccountType = document.getElementById("filter-account-type");
  const tabs = document.querySelectorAll(".tx-tab");
  const dateWrap = document.getElementById("tx-date-wrap");
  const dateBtn = document.getElementById("tx-date-btn");

  let allTransactions = [];
  let activeTab = "all";

  async function load() {
    try {
      allTransactions = await apiFetch("/transactions/all");
      render(allTransactions);
    } catch (err) {
      showAlert("alert-container", err.message);
    }
  }

  function render(items) {
    let filtered = [...items];
    const fromVal = filterFrom.value;
    const txIdVal = filterTxId.value.trim().toLowerCase();
    const accTypeVal = filterAccountType.value;

    if (fromVal) {
      const fromDate = new Date(fromVal);
      fromDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter((t) => new Date(t.created_at) >= fromDate);
    }
    if (txIdVal) {
      filtered = filtered.filter((t) => t.id.toString().includes(txIdVal));
    }
    if (accTypeVal) {
      filtered = filtered.filter((t) => (t.account_type || "").toLowerCase() === accTypeVal);
    }
    if (activeTab === "usdt_sell") {
      filtered = filtered.filter((t) => t.type === "withdrawal");
    }

    if (filtered.length === 0) {
      tbody.innerHTML = "";
      noData.style.display = "block";
      return;
    }
    noData.style.display = "none";

    tbody.innerHTML = filtered
      .map((t) => {
        const commission = parseFloat(t.commission_amount) || 0;
        const incomeDeduct = parseFloat(t.income_deduct_amount) || 0;
        const commissionHtml = commission > 0
          ? `<span class="tx-amount-pos">+${formatCurrency(commission)} BDT</span>`
          : `<span class="tx-amount-plain">-</span>`;
        const incomeHtml = incomeDeduct > 0
          ? `<span class="tx-amount-neg">-${formatCurrency(incomeDeduct)} BDT</span>`
          : `<span class="tx-amount-plain">-</span>`;

        return `
        <tr>
          <td>
            <div class="tx-row-date">${formatTxDate(t.created_at)}</div>
            <div class="tx-row-id">${shortId(t.id)}</div>
          </td>
          <td>
            ${accountBadge(t.account_type)}
            <div class="tx-account-name">${(t.account_type || "-").toLowerCase()}</div>
          </td>
          <td>${t.type === "withdrawal" ? "Withdrawal" : "Deposit"}</td>
          <td>${t.account_number || "-"}</td>
          <td class="tx-amount-plain">${formatCurrency(t.amount)} BDT</td>
          <td>${commissionHtml}</td>
          <td>${incomeHtml}</td>
          <td><span class="tx-status ${txStatusClass(t.status)}">${txStatusLabel(t.status)}</span></td>
        </tr>
      `;
      })
      .join("");
  }

  btnFilter.addEventListener("click", () => render(allTransactions));

  btnDownload.addEventListener("click", () => {
    const rows = allTransactions.map(
      (t) =>
        `${t.id},${t.type},${t.account_type || ""},${t.account_number || ""},${t.amount},${t.commission_amount},${t.income_deduct_amount},${t.status},${t.created_at}`
    );
    const csv = "ID,Type,Account,Number,Amount,Commission,IncomeDeduct,Status,CreatedAt\n" + rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "transactions.csv";
    a.click();
    URL.revokeObjectURL(url);
  });

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      activeTab = tab.dataset.tab;
      render(allTransactions);
    });
  });

  if (dateWrap && filterFrom) {
    dateWrap.addEventListener("click", (e) => {
      if (e.target !== filterFrom) filterFrom.showPicker?.() || filterFrom.focus();
    });
    filterFrom.addEventListener("change", () => render(allTransactions));
  }
  if (dateBtn && filterFrom) {
    dateBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      filterFrom.showPicker?.() || filterFrom.focus();
    });
  }

  load();
});
