function getOpTypeText(type) {
  return type === "deposit" ? "Withdrawal transaction credited" : "Transaction debiting";
}

function getOpTypeClass(type) {
  return type === "deposit" ? "credit" : "debit";
}

document.addEventListener("DOMContentLoaded", async () => {
  const sumDepositAmount = document.getElementById("sum-deposit-amount");
  const sumWithdrawalAmount = document.getElementById("sum-withdrawal-amount");
  const sumDepositOther = document.getElementById("sum-deposit-other");
  const sumWithdrawalOther = document.getElementById("sum-withdrawal-other");
  const sumTxAmount = document.getElementById("sum-tx-amount");
  const sumTrustDebit = document.getElementById("sum-trust-debit");
  const sumIncomeComm = document.getElementById("sum-income-comm");
  const sumIncomeDeduct = document.getElementById("sum-income-deduct");

  const historyBody = document.getElementById("history-body");
  const histNoData = document.getElementById("hist-no-data");

  const tabs = document.querySelectorAll(".stat-tab");
  const fromEl = document.getElementById("stat-from");
  const toEl = document.getElementById("stat-to");

  const filterHistId = document.getElementById("filter-hist-id");
  const filterHistWallet = document.getElementById("filter-hist-wallet");
  const filterHistDate = document.getElementById("filter-hist-date");
  const filterHistOp = document.getElementById("filter-hist-op");
  const btnHistDownload = document.getElementById("btn-hist-download");
  const histDateWrap = document.getElementById("hist-date-wrap");
  const histDateBtn = document.getElementById("hist-date-btn");



  let allTransactions = [];
  let activeTab = "trust";

  async function load() {
    try {
      allTransactions = await apiFetch("/transactions/all");
      compute(allTransactions);
      renderHistory(allTransactions);
    } catch (err) {
      showAlert("alert-container", err.message);
    }
  }

  function getFiltered() {
    let filtered = [...allTransactions];
    const fromVal = fromEl.value;
    const toVal = toEl.value;

    if (fromVal) {
      const fromDate = new Date(fromVal);
      fromDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter((t) => new Date(t.created_at) >= fromDate);
    }
    if (toVal) {
      const toDate = new Date(toVal);
      toDate.setHours(23, 59, 59);
      filtered = filtered.filter((t) => new Date(t.created_at) <= toDate);
    }
    return filtered;
  }

  function compute(items) {
    const filtered = getFiltered();

    let depositAmount = 0;
    let withdrawalAmount = 0;
    let depositOther = 0;
    let withdrawalOther = 0;
    let txAmount = 0;
    let trustDebit = 0;
    let incomeComm = 0;
    let incomeDeduct = 0;

    filtered.forEach((t) => {
      const amt = Number(t.amount) || 0;
      const comm = Number(t.commission_amount) || 0;
      const deduct = Number(t.income_deduct_amount) || 0;

      txAmount += amt;
      incomeComm += comm;
      incomeDeduct += deduct;

      if (t.type === "deposit") {
        depositAmount += amt;
        depositOther += comm;
      } else {
        withdrawalAmount += amt;
        withdrawalOther += deduct;
        trustDebit += amt;
      }
    });

    sumDepositAmount.textContent = formatCurrency(depositAmount) + " BDT";
    sumWithdrawalAmount.textContent = formatCurrency(withdrawalAmount) + " BDT";
    sumDepositOther.textContent = formatCurrency(depositOther) + " BDT";
    sumWithdrawalOther.textContent = formatCurrency(withdrawalOther) + " BDT";
    sumTxAmount.textContent = formatCurrency(txAmount) + " BDT";
    sumTrustDebit.textContent = formatCurrency(trustDebit) + " BDT";
    sumIncomeComm.textContent = formatCurrency(incomeComm) + " BDT";
    sumIncomeDeduct.textContent = formatCurrency(incomeDeduct) + " BDT";
  }

  function renderHistory(items) {
    let filtered = getFiltered();
    const idVal = filterHistId.value.trim().toLowerCase();
    const walletVal = filterHistWallet.value.trim();
    const dateVal = filterHistDate.value;
    const opVal = filterHistOp.value;

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
    if (activeTab === "income") {
      filtered = filtered.filter((t) => Number(t.commission_amount) > 0 || Number(t.income_deduct_amount) > 0);
    }

    // Sort by date ascending for running balance
    filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    if (filtered.length === 0) {
      historyBody.innerHTML = "";
      histNoData.style.display = "block";
      return;
    }
    histNoData.style.display = "none";

    let runningBalance = 0;
    historyBody.innerHTML = filtered
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
            <span class="hist-op-type ${getOpTypeClass(t.type)}">${getOpTypeText(t.type)}</span>
          </td>
          <td class="${amountClass}">${amountPrefix}${formatCurrency(amt)} BDT</td>
          <td class="hist-balance ${balanceClass}">${formatCurrency(runningBalance)} BDT</td>
        </tr>
      `;
      })
      .join("");
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      activeTab = tab.dataset.tab;
      renderHistory(allTransactions);
    });
  });

  fromEl.addEventListener("change", () => {
    compute(allTransactions);
    renderHistory(allTransactions);
  });
  toEl.addEventListener("change", () => {
    compute(allTransactions);
    renderHistory(allTransactions);
  });

  if (histDateWrap && filterHistDate) {
    histDateWrap.addEventListener("click", (e) => {
      if (e.target !== filterHistDate) filterHistDate.showPicker?.() || filterHistDate.focus();
    });
    filterHistDate.addEventListener("change", () => renderHistory(allTransactions));
  }
  if (histDateBtn && filterHistDate) {
    histDateBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      filterHistDate.showPicker?.() || filterHistDate.focus();
    });
  }

  btnHistDownload.addEventListener("click", () => {
    const rows = allTransactions.map(
      (t) => `${t.id},${t.type},${t.account_type || ""},${t.account_number || ""},${t.amount},${t.status},${t.created_at}`
    );
    const csv = "ID,Type,Account,Number,Amount,Status,CreatedAt\n" + rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "history.csv";
    a.click();
    URL.revokeObjectURL(url);
  });



  load();
});
