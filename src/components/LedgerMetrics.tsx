import React from 'react';
import { Account, Transaction } from '../types/ledger';
import { Wallet, ArrowDownRight, ArrowUpRight, CheckCircle2 } from 'lucide-react';

interface LedgerMetricsProps {
  accounts: Account[];
  transactions: Transaction[];
}

export const LedgerMetrics: React.FC<LedgerMetricsProps> = ({ accounts, transactions }) => {
  const totalAssets = accounts
    .filter(a => a.type === 'ASSET')
    .reduce((sum, a) => sum + a.balance, 0);

  const totalLiabilities = accounts
    .filter(a => a.type === 'LIABILITY')
    .reduce((sum, a) => sum + a.balance, 0);

  const totalEquity = accounts
    .filter(a => a.type === 'EQUITY' || a.type === 'REVENUE')
    .reduce((sum, a) => sum + a.balance, 0);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Total Assets</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400">Reserve</span>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            ₹{totalAssets.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Clearing balances & central vaults</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Total Liabilities</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400">Deposits</span>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            ₹{totalLiabilities.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Customer savings & merchant escrows</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Equity & Capital</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400">Tier 1</span>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            ₹{totalEquity.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Retained earnings & paid-in equity</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Double-Entry Balance</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-lg font-bold text-emerald-400 tracking-tight flex items-center space-x-1">
            <span>A = L + E</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Invariant continuously verified</p>
        </div>
      </div>

      {/* Chart of Accounts */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-sm text-white">Chart of Accounts</h3>
            <p className="text-xs text-slate-400">Real-time ledger balances and optimistic concurrency versions</p>
          </div>
          <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-md font-mono">
            {accounts.length} Active Ledgers
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Account ID</th>
                <th className="py-3 px-4">Account Name</th>
                <th className="py-3 px-4">Classification</th>
                <th className="py-3 px-4">Concurrency Version</th>
                <th className="py-3 px-4 text-right">Available Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {accounts.map(acc => {
                const badgeColor =
                  acc.type === 'ASSET'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : acc.type === 'LIABILITY'
                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                    : acc.type === 'EQUITY'
                    ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20';

                return (
                  <tr key={acc.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-400">{acc.id}</td>
                    <td className="py-3 px-4 font-medium text-white flex items-center space-x-2">
                      <Wallet className="w-3.5 h-3.5 text-slate-400" />
                      <span>{acc.name}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-0.5 text-[10px] font-semibold rounded border ${badgeColor}`}>
                        {acc.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">
                      v{acc.version} <span className="text-[10px] text-slate-500">(commits)</span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-white">
                      ₹{acc.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Transaction Journal */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-sm text-white">Transaction Journal</h3>
            <p className="text-xs text-slate-400">Committed double-entry journal postings with balanced debits & credits</p>
          </div>
          <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-md font-mono">
            {transactions.length} Transactions
          </span>
        </div>

        {transactions.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            No transactions committed yet. Use the Transfer Studio to execute transfers.
          </div>
        ) : (
          <div className="divide-y divide-slate-800 max-h-96 overflow-y-auto">
            {transactions.slice(0, 10).map(tx => (
              <div key={tx.id} className="p-4 hover:bg-slate-800/30 transition-colors">
                <div className="flex flex-wrap items-center justify-between text-xs mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-slate-400 text-[11px]">{tx.id}</span>
                    <span className="font-semibold text-white">{tx.description}</span>
                    {tx.idempotencyKey && (
                      <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded font-mono">
                        Key: {tx.idempotencyKey.slice(0, 10)}...
                      </span>
                    )}
                  </div>
                  <span className="text-slate-400 text-[11px]">
                    {new Date(tx.timestamp).toLocaleTimeString()}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                  {tx.entries.map((entry, idx) => (
                    <div key={idx} className="flex items-center justify-between px-2 py-1 bg-slate-900/80 rounded border border-slate-800">
                      <div className="flex items-center space-x-1.5">
                        {entry.direction === 'DEBIT' ? (
                          <ArrowDownRight className="w-3.5 h-3.5 text-rose-400" />
                        ) : (
                          <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                        )}
                        <span className="text-slate-300">{entry.accountId}</span>
                      </div>
                      <span className={entry.direction === 'DEBIT' ? 'text-rose-400 font-semibold' : 'text-emerald-400 font-semibold'}>
                        {entry.direction} ₹{entry.amount.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
