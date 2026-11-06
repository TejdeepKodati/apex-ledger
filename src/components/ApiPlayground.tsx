import React, { useState } from 'react';
import { Code2, Copy, Check, Terminal } from 'lucide-react';

export const ApiPlayground: React.FC = () => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const snippets = [
    {
      title: 'Idempotent Transfer Settlement (cURL)',
      lang: 'bash',
      code: `curl -X POST https://api.apexledger.internal/v1/transfers \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer sec_tok_8f93a9e2" \\
  -H "Idempotency-Key: 9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d" \\
  -d '{
    "source_account_id": "acc_cust_rohit",
    "destination_account_id": "acc_cust_priya",
    "amount": 5000.00,
    "currency": "INR",
    "reference": "UPI-SETTLE-88392",
    "description": "P2P instant funds settlement"
  }'`,
    },
    {
      title: 'Ledger Audit Chain Verification (TypeScript)',
      lang: 'typescript',
      code: `import { verifyAuditChain } from '@apexledger/core';

// Retrieve cryptographic audit blocks from storage
const blocks = await ledgerStore.getAuditChain();

// Validate SHA-256 prevHash links and entries digests
const result = await verifyAuditChain(blocks);

if (!result.isValid) {
  console.error(\`Audit anomaly at block \${result.corruptedBlockIndex}: \${result.reason}\`);
} else {
  console.log('Cryptographic ledger integrity verified. Zero tampering detected.');
}`,
    },
    {
      title: 'Trial Balance & Invariant Verification (cURL)',
      lang: 'bash',
      code: `curl -X GET https://api.apexledger.internal/v1/reconciliation/trial-balance \\
  -H "Authorization: Bearer sec_tok_8f93a9e2"

# Response:
# {
#   "is_balanced": true,
#   "total_debits": 5760000.00,
#   "total_credits": 5760000.00,
#   "accounting_equation_satisfied": true
# }`,
    },
  ];

  const handleCopy = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center space-x-2">
          <Terminal className="w-5 h-5 text-indigo-400" />
          <h3 className="font-semibold text-sm text-white">Developer API & Integration Sandbox</h3>
        </div>
        <p className="text-xs text-slate-400 mt-1 max-w-2xl">
          REST API specifications for integrating high-throughput double-entry settlements with upstream banking services, payment gateways, and core banking ledgers.
        </p>
      </div>

      <div className="space-y-4">
        {snippets.map((snip, idx) => (
          <div key={idx} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
              <div className="flex items-center space-x-2">
                <Code2 className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-semibold text-white">{snip.title}</span>
              </div>
              <button
                onClick={() => handleCopy(snip.code, idx)}
                className="text-xs text-slate-400 hover:text-white flex items-center space-x-1 bg-slate-800 px-2.5 py-1 rounded transition-colors"
              >
                {copiedIndex === idx ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            <pre className="p-4 text-xs font-mono text-emerald-300 bg-slate-950 overflow-x-auto leading-relaxed">
              <code>{snip.code}</code>
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
};
