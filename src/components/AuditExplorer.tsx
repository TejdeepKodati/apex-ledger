import React, { useState } from 'react';
import { AuditBlock } from '../types/ledger';
import { verifyAuditChain } from '../core/crypto';
import { GitCommit, ShieldAlert, ShieldCheck, RefreshCw, AlertTriangle, Hash } from 'lucide-react';

interface AuditExplorerProps {
  auditChain: AuditBlock[];
  onTamperWithBlock: (blockIndex: number, newAmount: number) => void;
  onResetChain: () => void;
}

export const AuditExplorer: React.FC<AuditExplorerProps> = ({
  auditChain,
  onTamperWithBlock,
  onResetChain,
}) => {
  const [verificationResult, setVerificationResult] = useState<{
    isValid: boolean;
    corruptedBlockIndex?: number;
    reason?: string;
  } | null>(null);
  const [verifying, setVerifying] = useState<boolean>(false);

  const handleVerify = async () => {
    setVerifying(true);
    const res = await verifyAuditChain(auditChain);
    setVerificationResult(res);
    setVerifying(false);
  };

  const handleSimulateTamper = (idx: number) => {
    onTamperWithBlock(idx, 999999999);
    handleVerify();
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <GitCommit className="w-5 h-5 text-emerald-400" />
              <h3 className="font-semibold text-sm text-white">Cryptographic Audit Chain (Merkle Hash-Chain)</h3>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Every committed financial journal is chained cryptographically using SHA-256 block hashes linked to the previous block tip. Any post-settlement database alteration immediately breaks the hash chain.
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={handleVerify}
              disabled={verifying}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-3.5 py-2 rounded-lg flex items-center space-x-1.5 transition-colors shadow-lg shadow-emerald-950"
            >
              {verifying ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ShieldCheck className="w-3.5 h-3.5" />
              )}
              <span>Verify Chain Integrity</span>
            </button>

            <button
              onClick={onResetChain}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs px-3 py-2 rounded-lg transition-colors"
            >
              Reset Seed
            </button>
          </div>
        </div>

        {/* Verification Alert Banner */}
        {verificationResult && (
          <div className="mt-4 pt-4 border-t border-slate-800">
            {verificationResult.isValid ? (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center space-x-3 text-xs text-emerald-400">
                <ShieldCheck className="w-5 h-5 shrink-0" />
                <div>
                  <span className="font-semibold">Cryptographic Audit Passed: 100% Chain Valid</span>
                  <p className="text-[11px] text-emerald-500 mt-0.5">
                    All {auditChain.length} blocks verified. Previous hash linkages and SHA-256 payload digests are tamper-free.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-start space-x-3 text-xs text-rose-300">
                <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-semibold text-rose-400">
                    CRITICAL: Tamper Detected at Block #{verificationResult.corruptedBlockIndex! + 1}
                  </span>
                  <p className="font-mono text-[11px] text-rose-300 leading-relaxed">
                    {verificationResult.reason}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Block Chain Visualizer */}
      <div className="space-y-4">
        {auditChain.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl py-12 text-center text-slate-500 text-xs">
            No audit blocks committed yet. Execute transfers to generate cryptographic blocks.
          </div>
        ) : (
          <div className="space-y-3">
            {auditChain.map((block, idx) => {
              const isCorrupted =
                verificationResult &&
                !verificationResult.isValid &&
                verificationResult.corruptedBlockIndex === idx;

              return (
                <div
                  key={block.blockNumber}
                  className={`border rounded-xl p-4 transition-colors font-mono text-xs ${
                    isCorrupted
                      ? 'bg-rose-950/30 border-rose-500/80'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2 mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-white bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                        Block #{block.blockNumber}
                      </span>
                      <span className="text-slate-400 text-[11px]">
                        Tx ID: <span className="text-indigo-300">{block.transactionId}</span>
                      </span>
                    </div>

                    <div className="flex items-center space-x-3 text-[11px]">
                      <span className="text-slate-400">
                        {new Date(block.timestamp).toLocaleTimeString()}
                      </span>
                      <button
                        onClick={() => handleSimulateTamper(idx)}
                        className="text-[10px] text-amber-400 hover:text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded flex items-center space-x-1"
                        title="Simulate modifying this block in database to test audit failure"
                      >
                        <AlertTriangle className="w-3 h-3" />
                        <span>Simulate Tampering</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                    <div className="space-y-1">
                      <div className="text-slate-500">Block SHA-256:</div>
                      <div className="text-emerald-400 break-all bg-slate-950 p-1.5 rounded border border-slate-800/80">
                        {block.blockHash}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="text-slate-500">Previous Block Hash:</div>
                      <div className="text-slate-400 break-all bg-slate-950 p-1.5 rounded border border-slate-800/80">
                        {block.prevHash}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                    <div className="flex items-center space-x-2 text-slate-400">
                      <Hash className="w-3.5 h-3.5 text-slate-500" />
                      <span>Entries Payload Digest:</span>
                      <span className="text-indigo-400 break-all">{block.entriesHash.slice(0, 24)}...</span>
                    </div>
                    <span className="text-slate-300">
                      Amount: ₹{block.transaction.entries[0]?.amount.toLocaleString('en-IN') || 0}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
