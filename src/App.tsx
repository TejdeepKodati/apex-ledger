import React, { useState, useEffect } from 'react';
import { LedgerEngine, TransferRequest } from './core/engine';
import { Account, AuditBlock, Transaction } from './types/ledger';
import { Navbar } from './components/Navbar';
import { LedgerMetrics } from './components/LedgerMetrics';
import { TransferStudio } from './components/TransferStudio';
import { ConcurrencyLab } from './components/ConcurrencyLab';
import { AuditExplorer } from './components/AuditExplorer';
import { FinancialReports } from './components/FinancialReports';
import { ApiPlayground } from './components/ApiPlayground';
import { Footer } from './components/Footer';

// Singleton instance of the core engine
const engine = new LedgerEngine();

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [auditChain, setAuditChain] = useState<AuditBlock[]>([]);

  const refreshState = () => {
    setAccounts(engine.getAccounts());
    setTransactions(engine.getTransactions());
    setAuditChain(engine.getAuditChain());
  };

  useEffect(() => {
    // Seed initial demo transactions so the UI is immediately rich on load
    const initDemo = async () => {
      try {
        await engine.executeTransfer({
          sourceAccountId: 'acc_central_clearing',
          destinationAccountId: 'acc_cust_rohit',
          amount: 25000,
          reference: 'IMPS/INITIAL-FUNDING/001',
          description: 'Payroll disbursement allocation',
          idempotencyKey: 'idemp_seed_001',
        });

        await engine.executeTransfer({
          sourceAccountId: 'acc_cust_rohit',
          destinationAccountId: 'acc_merchant_flipkart',
          amount: 4500,
          reference: 'UPI/MERCHANT-PAY/994',
          description: 'E-commerce merchant purchase settlement',
          idempotencyKey: 'idemp_seed_002',
        });
      } catch (e) {
        console.error('Demo init error:', e);
      }
      refreshState();
    };

    initDemo();
  }, []);

  const handleExecuteTransfer = async (
    req: TransferRequest,
    options?: { simulateLatencyMs?: number; customPayloadForIdempotency?: any }
  ) => {
    const res = await engine.executeTransfer(req, options);
    refreshState();
    return res;
  };

  const handleTamperWithBlock = (blockIndex: number, newAmount: number) => {
    engine.tamperWithBlock(blockIndex, newAmount);
    refreshState();
  };

  const handleResetChain = () => {
    engine.seedDefaultAccounts();
    refreshState();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      <div>
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          invariantStatus={true}
          totalTransactions={transactions.length}
          auditBlockCount={auditChain.length}
        />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === 'dashboard' && (
            <LedgerMetrics accounts={accounts} transactions={transactions} />
          )}

          {activeTab === 'transfer' && (
            <TransferStudio
              accounts={accounts}
              onExecuteTransfer={handleExecuteTransfer}
            />
          )}

          {activeTab === 'concurrency' && (
            <ConcurrencyLab
              accounts={accounts}
              onExecuteTransfer={handleExecuteTransfer}
            />
          )}

          {activeTab === 'audit' && (
            <AuditExplorer
              auditChain={auditChain}
              onTamperWithBlock={handleTamperWithBlock}
              onResetChain={handleResetChain}
            />
          )}

          {activeTab === 'reports' && (
            <FinancialReports accounts={accounts} />
          )}

          {activeTab === 'api' && <ApiPlayground />}
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default App;
