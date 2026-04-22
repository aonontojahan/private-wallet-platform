document.addEventListener("DOMContentLoaded", async () => {
  const tbody = document.getElementById("transactions-body");
  const btnFilter = document.getElementById("btn-filter");
  const btnExport = document.getElementById("btn-export");
  const filterFrom = document.getElementById("filter-from");
  const filterTo = document.getElementById("filter-to");
  const filterType = document.getElementById("filter-type");
  const filterStatus = document.getElementById("filter-status");

  let allTransactions = [];

  async function load() {
    try {
      allTransactions = await apiFetch("/transactions/all");
      render(allTransactions);
    } catch (err) {
      showAlert("alert-container", err.message);
    }
  }

  function render(items) {
    let filtered = items;
    const fromVal = filterFrom.value;
    const toVal = filterTo.value;
    const typeVal = filterType.value;
    const statusVal = filterStatus.value;

    if (fromVal) {
      const fromDate = new Date(fromVal);
      filtered = filtered.filter((t) => new Date(t.created_at) >= fromDate);
    }
    if (toVal) {
      const toDate = new Date(toVal);
      toDate.setHours(23, 59, 59);
      filtered = filtered.filter((t) => new Date(t.created_at) <= toDate);
    }
    if (typeVal) filtered = filtered.filter((t) => t.type === typeVal);
    if (statusVal) filtered = filtered.filter((t) => t.status === statusVal);

    tbody.innerHTML = filtered
      .map(
        (t) => `
      <tr>
        <td>#${t.id}</td>
        <td>${t.type}</td>
        <td>${t.account_type || "-"}</td>
        <td>${t.account_number || "-"}</td>
        <td>${formatCurrency(t.amount)}</td>
        <td>${formatCurrency(t.commission_amount)}</td>
        <td>${formatCurrency(t.income_deduct_amount)}</td>
        <td>${statusBadge(t.status)}</td>
        <td>${formatDate(t.created_at)}</td>
      </tr>
    `
      )
      .join("") || `<tr><td colspan="9" class="empty-state">No transactions found</td></tr>`;
  }

  btnFilter.addEventListener("click", () => render(allTransactions));

  btnExport.addEventListener("click", () => {
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

  load();
});
