import React, { useState } from 'react';
import { Account, Transaction } from '../types/ledger';
import { TransferRequest } from '../core/engine';
import { Send, RefreshCw, Key, AlertCircle, CheckCircle2 } from 'lucide-react';

interface TransferStudioProps {
  accounts: Account[];
  onExecuteTransfer: (
    req: TransferRequest,
    options?: { simulateLatencyMs?: number; customPayloadForIdempotency?: any }
  ) => Promise<{ transaction: Transaction; isCached: boolean }>;
}

export const TransferStudio: React.FC<TransferStudioProps> = ({ accounts, onExecuteTransfer }) => {
  const [sourceId, setSourceId] = useState<string>(accounts[1]?.id || '');
  const [destId, setDestId] = useState<string>(accounts[2]?.id || '');
  const [amount, setAmount] = useState<number>(5000);
  const [reference, setReference] = useState<string>('NEFT/IMPS-SETTLEMENT-001');
  const [description, setDescription] = useState<string>('Inter-account funds transfer');
  const [enableIdempotency, setEnableIdempotency] = useState<boolean>(true);
  const [idempotencyKey, setIdempotencyKey] = useState<string>(`idemp_${Date.now().toString(36)}`);
  const [simulateConflict, setSimulateConflict] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<{
    transaction?: Transaction;
    isCached?: boolean;
    error?: string;
  } | null>(null);

  const generateNewKey = () => {
    setIdempotencyKey(`idemp_${Math.random().toString(36).substring(2, 10)}`);
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLastResult(null);

    try {
      const req: TransferRequest = {
        sourceAccountId: sourceId,
        destinationAccountId: destId,
        amount: Number(amount),
        reference,
        description,
        idempotencyKey: enableIdempotency ? idempotencyKey : undefined,
      };

      // If user checked simulateConflict, send a divergent payload with the same key
      const options = simulateConflict
        ? {
            customPayloadForIdempotency: {
              source: sourceId,
              destination: destId,
              amount: Number(amount) + 99999, // Intentional mismatch
              reference: 'ALTERED_PAYLOAD_TAMPER_ATTEMPT',
            },
          }
        : undefined;

      const res = await onExecuteTransfer(req, options);
      setLastResult({ transaction: res.transaction, isCached: res.isCached });
    } catch (err: any) {
      setLastResult({ error: err.message || 'Transfer failed.' });
    } finally {
      setLoading(false);
    }
  };

  const sourceAccount = accounts.find(a => a.id === sourceId);
  const destAccount = accounts.find(a => a.id === destId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Transfer Form */}
      <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-5">
          <div>
            <h3 className="font-semibold text-sm text-white">Transfer & Settlement Studio</h3>
            <p className="text-xs text-slate-400">Post balanced journal entries with automated idempotency deduplication</p>
          </div>
          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono">
            ACID Safe
          </span>
        </div>

        <form onSubmit={handleTransfer} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Source Account (Debit)</label>
              <select
                value={sourceId}
                onChange={e => setSourceId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-mono"
              >
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} (₹{acc.balance.toLocaleString('en-IN')})
                  </option>
                ))}
              </select>
              {sourceAccount && (
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Current Balance: ₹{sourceAccount.balance.toLocaleString('en-IN')} | {sourceAccount.type}
                </span>
              )}
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Destination Account (Credit)</label>
              <select
                value={destId}
                onChange={e => setDestId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-mono"
              >
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} (₹{acc.balance.toLocaleString('en-IN')})
                  </option>
                ))}
              </select>
              {destAccount && (
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Current Balance: ₹{destAccount.balance.toLocaleString('en-IN')} | {destAccount.type}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Amount (INR ₹)</label>
              <input
                type="number"
                min="1"
                step="0.01"
                value={amount}
                onChange={e => setAmount(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-mono font-semibold"
                required
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Transfer Reference</label>
              <input
                type="text"
                value={reference}
                onChange={e => setReference(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-mono"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">Narration / Memo</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              required
            />
          </div>

          {/* Idempotency Controls */}
          <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Key className="w-4 h-4 text-indigo-400" />
                <span className="font-semibold text-white">Idempotency Guarantee</span>
              </div>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableIdempotency}
                  onChange={e => setEnableIdempotency(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0"
                />
                <span className="text-[11px] text-slate-400">Enable Idempotency-Key</span>
              </label>
            </div>

            {enableIdempotency && (
              <div className="space-y-2">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={idempotencyKey}
                    onChange={e => setIdempotencyKey(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-md px-2.5 py-1.5 text-xs text-indigo-300 font-mono focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={generateNewKey}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md flex items-center space-x-1"
                    title="Generate new UUID/Key"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>New Key</span>
                  </button>
                </div>

                <div className="flex items-center space-x-2 pt-1 text-[11px]">
                  <label className="flex items-center space-x-1.5 text-amber-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={simulateConflict}
                      onChange={e => setSimulateConflict(e.target.checked)}
                      className="rounded bg-slate-900 border-amber-600/50 text-amber-500 focus:ring-0"
                    />
                    <span>Simulate 409 Conflict (Replay with altered payload)</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold py-2.5 px-4 rounded-lg flex items-center justify-center space-x-2 transition-colors shadow-lg shadow-emerald-950"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Execute Ledger Settlement</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Execution Diagnostics */}
      <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <h3 className="font-semibold text-sm text-white">Settlement Response & Cache State</h3>
            <span className="text-[10px] text-slate-400 font-mono">Engine Diagnostics</span>
          </div>

          {!lastResult && (
            <div className="py-16 text-center text-slate-500 text-xs">
              Execute a transfer to view the HTTP response, idempotency fingerprint verification, and double-entry postings.
            </div>
          )}

          {lastResult?.error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-300 text-xs space-y-2">
              <div className="flex items-center space-x-2 font-semibold text-rose-400">
                <AlertCircle className="w-4 h-4" />
                <span>Execution Rejected</span>
              </div>
              <p className="font-mono text-[11px] leading-relaxed">{lastResult.error}</p>
            </div>
          )}

          {lastResult?.transaction && (
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950/80 border border-slate-800">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="font-semibold text-white">Status: 200 OK</span>
                </div>
                {lastResult.isCached ? (
                  <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono text-[10px] font-semibold">
                    X-Cache-Lookup: HIT (Idempotent Replay)
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-[10px] font-semibold">
                    X-Cache-Lookup: MISS (Fresh Commit)
                  </span>
                )}
              </div>

              <div className="bg-slate-950 p-3 rounded-lg font-mono text-[11px] space-y-1 border border-slate-800/80 text-slate-300 overflow-x-auto">
                <div><span className="text-slate-500">Transaction ID:</span> {lastResult.transaction.id}</div>
                <div><span className="text-slate-500">Reference:</span> {lastResult.transaction.reference}</div>
                <div><span className="text-slate-500">Committed At:</span> {new Date(lastResult.transaction.timestamp).toISOString()}</div>
                <div><span className="text-slate-500">Entries:</span> {lastResult.transaction.entries.length} postings</div>
              </div>

              <div className="space-y-1.5">
                <span className="text-slate-400 text-[11px] font-medium">Postings Applied:</span>
                {lastResult.transaction.entries.map((e, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-slate-950/60 p-2 rounded border border-slate-800 font-mono text-[11px]">
                    <span className="text-slate-300">{e.accountId}</span>
                    <span className={e.direction === 'DEBIT' ? 'text-rose-400' : 'text-emerald-400'}>
                      {e.direction} ₹{e.amount.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-500 leading-relaxed">
          <span className="text-slate-400 font-medium">Idempotency Tip:</span> Submitting with the same Idempotency-Key and payload returns the cached result without duplicate debiting. Checking "Simulate 409 Conflict" will trigger a hash mismatch and return HTTP 409.
        </div>
      </div>
    </div>
  );
};
