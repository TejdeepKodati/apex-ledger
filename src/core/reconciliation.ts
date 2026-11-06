import { Account, ReconciliationReport, TrialBalanceRow } from '../types/ledger';

/**
 * Generates an end-of-period trial balance and balance sheet verification
 */
export function generateReconciliationReport(accounts: Account[]): ReconciliationReport {
  let totalDebits = 0;
  let totalCredits = 0;
  let totalAssets = 0;
  let totalLiabilities = 0;
  let totalEquity = 0;
  let totalRevenue = 0;
  let totalExpense = 0;

  const rows: TrialBalanceRow[] = accounts.map(acc => {
    let debit = 0;
    let credit = 0;

    switch (acc.type) {
      case 'ASSET':
      case 'EXPENSE':
        if (acc.balance >= 0) debit = acc.balance;
        else credit = Math.abs(acc.balance);
        break;
      case 'LIABILITY':
      case 'EQUITY':
      case 'REVENUE':
        if (acc.balance >= 0) credit = acc.balance;
        else debit = Math.abs(acc.balance);
        break;
    }

    totalDebits += debit;
    totalCredits += credit;

    if (acc.type === 'ASSET') totalAssets += acc.balance;
    if (acc.type === 'LIABILITY') totalLiabilities += acc.balance;
    if (acc.type === 'EQUITY') totalEquity += acc.balance;
    if (acc.type === 'REVENUE') totalRevenue += acc.balance;
    if (acc.type === 'EXPENSE') totalExpense += acc.balance;

    return {
      accountId: acc.id,
      accountName: acc.name,
      accountType: acc.type,
      debit,
      credit,
    };
  });

  // Net Income = Revenue - Expenses
  const netIncome = totalRevenue - totalExpense;
  const effectiveEquity = totalEquity + netIncome;

  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.0001;
  const accountingEquationSatisfied = Math.abs(totalAssets - (totalLiabilities + effectiveEquity)) < 0.0001;

  return {
    timestamp: Date.now(),
    totalDebits: Number(totalDebits.toFixed(2)),
    totalCredits: Number(totalCredits.toFixed(2)),
    isBalanced,
    totalAssets: Number(totalAssets.toFixed(2)),
    totalLiabilities: Number(totalLiabilities.toFixed(2)),
    totalEquity: Number(effectiveEquity.toFixed(2)),
    accountingEquationSatisfied,
    rows,
  };
}
