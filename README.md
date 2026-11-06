# ApexLedger

> **High-Throughput Double-Entry Ledger & Idempotent Settlement Engine**  
> *Engineered with strict double-entry invariants, atomic balance reservation, optimistic concurrency control (OCC), cryptographic audit chaining, and idempotent request deduplication.*

[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://reactjs.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8.svg)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Tests-Vitest%20Passing-brightgreen.svg)](https://vitest.dev/)

---

## Architecture Overview

ApexLedger is a financial-grade accounting and settlement engine built to process multi-account transactions with zero invariant violations, mathematically guaranteed balance conservation, and distributed replay protection.

```
+-------------------------------------------------------------------------------+
|                             Client Application                                |
|  - Idempotency-Key Header                                                     |
|  - Structured Transfer Payload (source, destination, amount, reference)       |
+-------------------------------------------------------------------------------+
                                      |
                                      v
+-------------------------------------------------------------------------------+
|                         Idempotency & Replay Layer                            |
|  - SHA-256 Request Payload Fingerprinting                                     |
|  - In-Memory / Distributed Key Cache with TTL                                 |
|  - Fast Cache HIT -> Returns committed result without re-debiting            |
|  - Key Reuse Conflict -> Rejects divergent payloads (HTTP 409)                |
+-------------------------------------------------------------------------------+
                                      | (Cache MISS)
                                      v
+-------------------------------------------------------------------------------+
|                         Double-Entry Ledger Core                              |
|  - Chart of Accounts (Assets, Liabilities, Equity, Revenue, Expense)          |
|  - Invariant Verification: SUM(Debits) == SUM(Credits)                        |
|  - Optimistic Concurrency Control (OCC) with atomic version counters          |
|  - Solvency Enforcement: Rejects overdrafts under parallel load               |
+-------------------------------------------------------------------------------+
                                      |
                                      v
+-------------------------------------------------------------------------------+
|                      Cryptographic Audit Chain (Merkle)                       |
|  - SHA-256 block hash = H(prev_hash || timestamp || tx_id || entries_digest)  |
|  - Continuous chain integrity verification                                     |
|  - Instant tamper-evidence alerting on data mutation                           |
+-------------------------------------------------------------------------------+
                                      |
                                      v
+-------------------------------------------------------------------------------+
|                       End-of-Period Financial Reports                        |
|  - General Ledger Trial Balance                                               |
|  - Balance Sheet Invariant: Assets == Liabilities + Equity                    |
+-------------------------------------------------------------------------------+
```

---

## Core Technical Capabilities

### 1. Strict Double-Entry Accounting
Every financial movement consists of balanced journal entries where debits equal credits. Accounts are partitioned into standard classifications:
- **Assets**: Central Bank reserves, clearing vaults. (Debit increases balance)
- **Liabilities**: Customer savings, merchant settlement escrows. (Credit increases balance)
- **Equity**: Retained earnings and bank paid-in capital.
- **Revenue & Expense**: Transaction fees, operational costs.

### 2. Idempotent Settlement Protocol
Clients supply an `Idempotency-Key` header with mutation requests:
- **Fingerprinting**: The engine computes a sorted JSON SHA-256 digest of the request body.
- **Identical Replay**: If a network timeout occurs and the client retries with the same key and payload, the engine intercepts the call and serves the original committed response (`X-Cache-Lookup: HIT`) without modifying balances.
- **Payload Divergence Protection**: If a client re-uses an existing key with altered amounts or accounts, the engine raises an explicit `409 Conflict` error.

### 3. Optimistic Concurrency Control (OCC) & Solvency Assurance
- Each account maintains an integer `version` incremented upon every commit.
- Transactions perform atomic balance checks against the target account balance.
- Under heavy concurrent strain (e.g. 50 parallel debit requests simultaneously racing to withdraw from an account), the engine serializes commits and cleanly rejects overdraft attempts, guaranteeing the account never drops below zero.

### 4. Cryptographic Audit Hash-Chain
- Every transaction block computes:
  $$\text{BlockHash}_n = \text{SHA256}(\text{BlockNumber}_n \parallel \text{Timestamp} \parallel \text{BlockHash}_{n-1} \parallel \text{TxID} \parallel \text{EntriesHash})$$
- The entire chain can be audited programmatically at any time. Any manual modification or tampering with a historic transaction breaks all subsequent hash linkages and is flagged with the exact corrupted block index.

---

## Directory Structure

```
apex-ledger/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── README.md
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css
    ├── types/
    │   └── ledger.ts
    ├── core/
    │   ├── crypto.ts             # SHA-256 and chain verification
    │   ├── idempotency.ts        # Replay cache and fingerprinting
    │   ├── engine.ts             # Double-entry core and OCC
    │   └── reconciliation.ts     # Trial balance and equation checks
    ├── components/
    │   ├── Navbar.tsx
    │   ├── LedgerMetrics.tsx     # Chart of accounts and recent journal
    │   ├── TransferStudio.tsx    # Interactive transfer execution
    │   ├── ConcurrencyLab.tsx    # Parallel burst stress test simulator
    │   ├── AuditExplorer.tsx     # Cryptographic block visualizer & tamper test
    │   ├── FinancialReports.tsx  # Trial balance and balance sheet
    │   ├── ApiPlayground.tsx     # cURL and SDK integration examples
    │   └── Footer.tsx            # Mandatory footer link
    └── tests/
        └── ledger.test.ts        # Comprehensive Vitest suite
```

---

## Local Setup & Run Instructions

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0

### Installation
```bash
# Clone the repository
git clone https://github.com/TejdeepKodati/apex-ledger.git
cd apex-ledger

# Install dependencies
npm install
```

### Running the Development Server
```bash
npm run dev
```
Navigate to `http://localhost:5173` to explore the live dashboard.

### Running Test Suite
```bash
npm test
```
Executes all unit tests verifying:
- Mathematical double-entry equality
- Idempotency cache hits and 409 conflict handling
- Multi-threaded OCC concurrency solvency
- Merkle audit block validation and tamper detection
- Trial balance equality

### Production Build
```bash
npm run build
```
Creates an optimized static bundle in `dist/`.

---

## License

MIT License. Designed and built by [Tejdeep Kodati](https://github.com/TejdeepKodati).
