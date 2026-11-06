import React, { useMemo } from 'react';
import { Account } from '../types/ledger';
import { generateReconciliationReport } from '../core/reconciliation';
import { FileSpreadsheet, CheckCircle2, AlertOctagon } from 'lucide-react';

interface FinancialReportsProps {
  accounts: Account[];
}

export const FinancialReports: React.FC<FinancialReportsProps> = ({ accounts }) => {
  const report = useMemo(() => generateReconciliationReport(accounts), [accounts]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
              <h3 className="font-semibold text-sm text-white">Trial Balance & Financial Reconciliation</h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              End-of-period verification confirming all general ledger debits match credits and the fundamental accounting equation is satisfied.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            {report.accountingEquationSatisfied ? (
              <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Equation Satisfied (A = L + E)</span>
              </span>
            ) : (
              <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-semibold">
                <AlertOctagon className="w-4 h-4" />
                <span>Equation Out of Balance</span>
              </span>
            )}
          </div>
        </div>

        {/* Accounting Equation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-5 border-t border-slate-800 text-xs">
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
            <span className="text-slate-400 font-medium">Total Assets (A)</span>
            <div className="text-xl font-bold text-white mt-1 font-mono">
              ₹{report.totalAssets.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-slate-500">Cash, Central Bank reserves, clearing balances</span>
          </div>

          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
            <span className="text-slate-400 font-medium">Total Liabilities (L)</span>
            <div className="text-xl font-bold text-white mt-1 font-mono">
              ₹{report.totalLiabilities.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-slate-500">Customer savings, current accounts, merchant payables</span>
          </div>

          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
            <span className="text-slate-400 font-medium">Total Equity & Net Income (E)</span>
            <div className="text-xl font-bold text-white mt-1 font-mono">
              ₹{report.totalEquity.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-slate-500">Retained earnings, paid-in capital, fee surplus</span>
          </div>
        </div>
      </div>

      {/* Trial Balance Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <h4 className="font-semibold text-xs text-white">General Ledger Trial Balance</h4>
          <span className="text-[11px] font-mono text-slate-400">
            Timestamp: {new Date(report.timestamp).toLocaleTimeString()}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950/70 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Account ID</th>
                <th className="py-3 px-4">Account Name</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4 text-right">Debit Balance (₹)</th>
                <th className="py-3 px-4 text-right">Credit Balance (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {report.rows.map(row => (
                <tr key={row.accountId} className="hover:bg-slate-800/40">
                  <td className="py-2.5 px-4 text-slate-400">{row.accountId}</td>
                  <td className="py-2.5 px-4 font-medium text-white">{row.accountName}</td>
                  <td className="py-2.5 px-4 text-slate-400 text-[11px]">{row.accountType}</td>
                  <td className="py-2.5 px-4 text-right text-rose-400 font-semibold">
                    {row.debit > 0 ? `₹${row.debit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                  </td>
                  <td className="py-2.5 px-4 text-right text-emerald-400 font-semibold">
                    {row.credit > 0 ? `₹${row.credit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-950/90 font-bold border-t-2 border-slate-700 text-white">
              <tr>
                <td colSpan={3} className="py-3 px-4 uppercase text-[11px] tracking-wider text-slate-300">
                  Total Balanced Postings
                </td>
                <td className="py-3 px-4 text-right text-rose-400">
                  ₹{report.totalDebits.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
                <td className="py-3 px-4 text-right text-emerald-400">
                  ₹{report.totalCredits.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
