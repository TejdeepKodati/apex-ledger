import React from 'react';
import { ShieldCheck, Activity, Database, GitCommit, Layers, FileSpreadsheet, Code2 } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  invariantStatus: boolean;
  totalTransactions: number;
  auditBlockCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  invariantStatus,
  totalTransactions,
  auditBlockCount,
}) => {
  const tabs = [
    { id: 'dashboard', label: 'Accounts & Ledger', icon: Database },
    { id: 'transfer', label: 'Transfer Studio', icon: Activity },
    { id: 'concurrency', label: 'Concurrency Lab (OCC)', icon: Layers },
    { id: 'audit', label: 'Cryptographic Audit', icon: GitCommit },
    { id: 'reports', label: 'Balance Reconciliation', icon: FileSpreadsheet },
    { id: 'api', label: 'API Playground', icon: Code2 },
  ];

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-white tracking-tight">ApexLedger</span>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  v1.2 Core Engine
                </span>
              </div>
              <p className="text-xs text-slate-400">High-Throughput Double-Entry Ledger & Idempotent Settlement</p>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-4 text-xs">
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60">
              <span className={`w-2 h-2 rounded-full ${invariantStatus ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
              <span className="text-slate-300 font-medium">
                {invariantStatus ? 'Debits == Credits' : 'Invariant Breach'}
              </span>
            </div>
            <div className="px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-slate-300">
              Tx Committed: <span className="text-emerald-400 font-semibold">{totalTransactions}</span>
            </div>
            <div className="px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-slate-300">
              Audit Blocks: <span className="text-indigo-400 font-semibold">{auditBlockCount}</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex space-x-1 overflow-x-auto pb-1 scrollbar-none">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3 py-2 text-xs font-medium rounded-t-lg transition-colors whitespace-nowrap border-b-2 ${
                  isActive
                    ? 'border-emerald-400 text-emerald-400 bg-slate-800/50'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
