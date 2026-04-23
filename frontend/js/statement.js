function getTrustOpText(type) {
  return type === "deposit" ? "Withdrawal transaction credited" : "Transaction debiting";
}

function getTrustOpClass(type) {
  return type === "deposit" ? "credit" : "debit";
}

function getIncomeOpText(isCommission) {
  return isCommission
    ? "Account deposit transaction commission credited"
    : "Account deposit transaction debiting";
}

function getIncomeOpClass(isCommission) {
  return isCommission ? "credit" : "debit";
}

document.addEventListener("DOMContentLoaded", async () => {
  const pageTitle = document.getElementById("page-title");
  const subtitle = document.getElementById("stmt-subtitle");
  const tabs = document.querySelectorAll(".stat-tab");
  const trustTableWrap = document.getElementById("trust-table-wrap");
  const incomeTableWrap = document.getElementById("income-table-wrap");
  const trustBody = document.getElementById("trust-body");
  const incomeBody = document.getElementById("income-body");
  const trustNoData = document.getElementById("trust-no-data");
  const incomeNoData = document.getElementById("income-no-data");

  const filterId = document.getElementById("filter-stmt-id");
  const filterWallet = document.getElementById("filter-stmt-wallet");
  const filterDate = document.getElementById("filter-stmt-date");
  const filterOp = document.getElementById("filter-stmt-op");
  const clearOpBtn = document.getElementById("clear-op-type");
  const btnDownload = document.getElementById("btn-stmt-download");
  const dateWrap = document.getElementById("stmt-date-wrap");
  const dateBtn = document.getElementById("stmt-date-btn");

  let allTransactions = [];
  let activeTab = "trust";

  async function load() {
    try {
      allTransactions = await apiFetch("/transactions/all");
      renderTrust(allTransactions);
      renderIncome(allTransactions);
    } catch (err) {
      showAlert("alert-container", err.message);
    }
  }

  function getFiltered(items) {
    let filtered = [...items];
    const idVal = filterId.value.trim().toLowerCase();
    const walletVal = filterWallet.value.trim();
    const dateVal = filterDate.value;
    const opVal = filterOp.value;

    if (idVal) {
      filtered = filtered.filter((t) => t.id.toString().includes(idVal));
    }
    if (walletVal) {
      filtered = filtered.filter((t) => (t.account_number || "").includes(walletVal));
    }
    if (dateVal) {
      const d = new Date(dateVal);
      d.setHours(0, 0, 0, 0);
      filtered = filtered.filter((t) => new Date(t.created_at) >= d);
    }
    if (opVal) {
      filtered = filtered.filter((t) => t.type === opVal);
    }

    // Sort by date ascending for running balance
    filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    return filtered;
  }

  function renderTrust(items) {
    let filtered = getFiltered(items);

    if (filtered.length === 0) {
      trustBody.innerHTML = "";
      trustNoData.style.display = "block";
      return;
    }
    trustNoData.style.display = "none";

    let runningBalance = 0;
    trustBody.innerHTML = filtered
      .map((t) => {
        const amt = Number(t.amount) || 0;
        if (t.type === "deposit") {
          runningBalance += amt;
        } else {
          runningBalance -= amt;
        }
        const amountClass = t.type === "deposit" ? "hist-amount-pos" : "hist-amount-neg";
        const amountPrefix = t.type === "deposit" ? "+" : "-";
        const balanceClass = runningBalance < 0 ? "negative" : "";

        return `
        <tr>
          <td class="hist-id-col">
            <div class="hist-date">${formatTxDate(t.created_at)}</div>
            <div class="hist-id-line">ID: ${shortId(t.id)}</div>
            <div class="hist-wallet">Wallet number: <strong>${t.account_number || "-"}</strong></div>
          </td>
          <td>
            <span class="hist-op-type ${getTrustOpClass(t.type)}">${getTrustOpText(t.type)}</span>
          </td>
          <td class="${amountClass}">${amountPrefix}${formatCurrency(amt)} BDT</td>
          <td class="hist-balance ${balanceClass}">${formatCurrency(runningBalance)} BDT</td>
        </tr>
      `;
      })
      .join("");
  }

  function renderIncome(items) {
    let filtered = getFiltered(items);
    // For income, only show transactions that have commission or income deduct
    filtered = filtered.filter(
      (t) => Number(t.commission_amount) > 0 || Number(t.income_deduct_amount) > 0
    );

    if (filtered.length === 0) {
      incomeBody.innerHTML = "";
      incomeNoData.style.display = "block";
      return;
    }
    incomeNoData.style.display = "none";

    let runningBalance = 0;
    incomeBody.innerHTML = filtered
      .map((t) => {
        const comm = Number(t.commission_amount) || 0;
        const deduct = Number(t.income_deduct_amount) || 0;
        const isCommission = comm > 0;
        const amt = isCommission ? comm : deduct;

        if (isCommission) {
          runningBalance += amt;
        } else {
          runningBalance -= amt;
        }

        const amountClass = isCommission ? "hist-amount-pos" : "hist-amount-neg";
        const amountPrefix = isCommission ? "+" : "-";
        const balanceClass = runningBalance < 0 ? "negative" : "";
        const deducted = deduct > 0 ? "YES" : "NO";

        return `
        <tr>
          <td class="hist-id-col">
            <div class="hist-date">${formatTxDate(t.created_at)}</div>
            <div class="hist-id-line">ID: ${shortId(t.id)}</div>
            <div class="hist-wallet">Wallet number: <strong>${t.account_number || "-"}</strong></div>
          </td>
          <td>
            <span class="hist-op-type ${getIncomeOpClass(isCommission)}">${getIncomeOpText(isCommission)}</span>
          </td>
          <td class="${amountClass}">${amountPrefix}${formatCurrency(amt)} BDT</td>
          <td class="hist-balance ${balanceClass}">${formatCurrency(runningBalance)} BDT</td>
          <td>${deducted}</td>
        </tr>
      `;
      })
      .join("");
  }

  function switchTab(tab) {
    activeTab = tab;
    tabs.forEach((t) => t.classList.remove("active"));
    const activeBtn = document.querySelector(`.stat-tab[data-tab="${tab}"]`);
    if (activeBtn) activeBtn.classList.add("active");

    if (tab === "trust") {
      pageTitle.textContent = "Trust history";
      subtitle.textContent = "Displays all operations that affected your trust balance";
      trustTableWrap.style.display = "block";
      incomeTableWrap.style.display = "none";
      renderTrust(allTransactions);
    } else {
      pageTitle.textContent = "Income balance";
      subtitle.textContent = "Displays all operations that affected your income balance";
      trustTableWrap.style.display = "none";
      incomeTableWrap.style.display = "block";
      renderIncome(allTransactions);
    }
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => switchTab(tab.dataset.tab));
  });

  // Filter events
  [filterId, filterWallet, filterDate, filterOp].forEach((el) => {
    if (el) {
      el.addEventListener("input", () => {
        if (activeTab === "trust") renderTrust(allTransactions);
        else renderIncome(allTransactions);
      });
      el.addEventListener("change", () => {
        if (activeTab === "trust") renderTrust(allTransactions);
        else renderIncome(allTransactions);
      });
    }
  });

  // Clear operation type button
  if (clearOpBtn && filterOp) {
    filterOp.addEventListener("change", () => {
      clearOpBtn.style.display = filterOp.value ? "block" : "none";
    });
    clearOpBtn.addEventListener("click", () => {
      filterOp.value = "";
      clearOpBtn.style.display = "none";
      if (activeTab === "trust") renderTrust(allTransactions);
      else renderIncome(allTransactions);
    });
  }

  // Date picker
  if (dateWrap && filterDate) {
    dateWrap.addEventListener("click", (e) => {
      if (e.target !== filterDate) filterDate.showPicker?.() || filterDate.focus();
    });
  }
  if (dateBtn && filterDate) {
    dateBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      filterDate.showPicker?.() || filterDate.focus();
    });
  }

  // Download
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
    a.download = "statement.csv";
    a.click();
    URL.revokeObjectURL(url);
  });

  load();
});
