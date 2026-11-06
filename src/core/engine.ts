import { Account, AuditBlock, Entry, Transaction } from '../types/ledger';
import { computeBlockHash } from './crypto';
import { IdempotencyStore } from './idempotency';

export interface TransferRequest {
  reference: string;
  description: string;
  sourceAccountId: string;
  destinationAccountId: string;
  amount: number;
  idempotencyKey?: string;
}

export class LedgerEngine {
  private accounts: Map<string, Account> = new Map();
  private transactions: Transaction[] = [];
  private auditChain: AuditBlock[] = [];
  private idempotencyStore: IdempotencyStore = new IdempotencyStore();

  constructor() {
    this.seedDefaultAccounts();
  }

  /**
   * Initializes standard banking chart of accounts with balanced equation
   * Assets (5,000,000) = Liabilities (710,000) + Equity (4,290,000)
   */
  public seedDefaultAccounts(): void {
    this.accounts.clear();
    this.transactions = [];
    this.auditChain = [];
    this.idempotencyStore.clear();

    const initialAccounts: Omit<Account, 'version' | 'createdAt'>[] = [
      { id: 'acc_central_clearing', name: 'Central Reserve & Vault Asset', type: 'ASSET', currency: 'INR', balance: 5000000 },
      { id: 'acc_cust_rohit', name: 'Rohit Sharma (Savings)', type: 'LIABILITY', currency: 'INR', balance: 150000 },
      { id: 'acc_cust_priya', name: 'Priya Sundaram (Salary A/c)', type: 'LIABILITY', currency: 'INR', balance: 85000 },
      { id: 'acc_cust_arjun', name: 'Arjun Verma (Current A/c)', type: 'LIABILITY', currency: 'INR', balance: 25000 },
      { id: 'acc_merchant_flipkart', name: 'E-Commerce Merchant Settlement', type: 'LIABILITY', currency: 'INR', balance: 450000 },
      { id: 'acc_bank_fee_income', name: 'Transaction & Service Fee Income', type: 'REVENUE', currency: 'INR', balance: 0 },
      { id: 'acc_retained_earnings', name: 'Retained Earnings / Bank Equity', type: 'EQUITY', currency: 'INR', balance: 4290000 },
    ];

    for (const acc of initialAccounts) {
      this.accounts.set(acc.id, {
        ...acc,
        version: 1,
        createdAt: Date.now(),
      });
    }
  }

  getAccounts(): Account[] {
    return Array.from(this.accounts.values());
  }

  getAccount(id: string): Account | undefined {
    return this.accounts.get(id);
  }

  getTransactions(): Transaction[] {
    return [...this.transactions];
  }

  getAuditChain(): AuditBlock[] {
    return [...this.auditChain];
  }

  getIdempotencyStore(): IdempotencyStore {
    return this.idempotencyStore;
  }

  /**
   * Executes a transfer between two accounts with strict double-entry and OCC
   */
  async executeTransfer(
    req: TransferRequest,
    options?: { simulateLatencyMs?: number; customPayloadForIdempotency?: any }
  ): Promise<{ transaction: Transaction; isCached: boolean }> {
    if (req.amount <= 0) {
      throw new Error(`Transfer amount must be strictly positive. Received: ₹${req.amount}`);
    }

    if (req.sourceAccountId === req.destinationAccountId) {
      throw new Error('Source and destination accounts must be distinct.');
    }

    // 1. Idempotency Check
    if (req.idempotencyKey) {
      const payloadToCheck = options?.customPayloadForIdempotency || {
        source: req.sourceAccountId,
        destination: req.destinationAccountId,
        amount: req.amount,
        reference: req.reference,
      };

      const idempCheck = await this.idempotencyStore.checkKey(req.idempotencyKey, payloadToCheck);

      if (idempCheck.action === 'CONFLICT_ERROR') {
        throw new Error(idempCheck.error || '409 Conflict: Idempotency payload mismatch.');
      }

      if (idempCheck.action === 'RETURN_CACHED' && idempCheck.cachedResponse) {
        return { transaction: idempCheck.cachedResponse, isCached: true };
      }
    }

    if (options?.simulateLatencyMs) {
      await new Promise(resolve => setTimeout(resolve, options.simulateLatencyMs));
    }

    // 2. Fetch Accounts
    const source = this.accounts.get(req.sourceAccountId);
    const dest = this.accounts.get(req.destinationAccountId);

    if (!source) throw new Error(`Source account "${req.sourceAccountId}" does not exist.`);
    if (!dest) throw new Error(`Destination account "${req.destinationAccountId}" does not exist.`);

    // 3. Balance & Concurrency Check
    // For liability customer accounts, a debit reduces their balance, so they must have sufficient funds
    if (source.type === 'LIABILITY' && source.balance < req.amount) {
      throw new Error(`Insufficient funds: Account "${source.name}" has balance ₹${source.balance.toFixed(2)}, cannot debit ₹${req.amount.toFixed(2)}.`);
    }

    // 4. Construct Balanced Entries (Debits == Credits)
    const entries: Entry[] = [
      { accountId: source.id, direction: 'DEBIT', amount: req.amount },
      { accountId: dest.id, direction: 'CREDIT', amount: req.amount },
    ];

    // Verify mathematical invariant
    const totalDebits = entries.filter(e => e.direction === 'DEBIT').reduce((s, e) => s + e.amount, 0);
    const totalCredits = entries.filter(e => e.direction === 'CREDIT').reduce((s, e) => s + e.amount, 0);

    if (Math.abs(totalDebits - totalCredits) > 0.0001) {
      throw new Error(`Double-entry invariant violated! Debits (${totalDebits}) != Credits (${totalCredits})`);
    }

    // 5. Apply postings according to standard GAAP accounting rules
    for (const entry of entries) {
      const acc = this.accounts.get(entry.accountId)!;
      const isDebit = entry.direction === 'DEBIT';

      if (acc.type === 'ASSET' || acc.type === 'EXPENSE') {
        // Debit increases Asset/Expense; Credit decreases Asset/Expense
        acc.balance += isDebit ? entry.amount : -entry.amount;
      } else {
        // LIABILITY, EQUITY, REVENUE
        // Debit decreases Liability/Equity/Revenue; Credit increases Liability/Equity/Revenue
        acc.balance += isDebit ? -entry.amount : entry.amount;
      }
      acc.version += 1;
    }

    // 6. Record Committed Transaction
    const tx: Transaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      timestamp: Date.now(),
      reference: req.reference,
      description: req.description,
      idempotencyKey: req.idempotencyKey,
      entries,
      status: 'COMMITTED',
    };

    this.transactions.unshift(tx);

    // 7. Append to Cryptographic Audit Block Chain
    const blockNumber = this.auditChain.length + 1;
    const prevHash = this.auditChain.length === 0 ? '0'.repeat(64) : this.auditChain[this.auditChain.length - 1].blockHash;

    const { blockHash, entriesHash } = await computeBlockHash(blockNumber, tx.timestamp, prevHash, tx);

    const auditBlock: AuditBlock = {
      blockNumber,
      timestamp: tx.timestamp,
      transactionId: tx.id,
      prevHash,
      blockHash,
      entriesHash,
      transaction: tx,
    };

    this.auditChain.push(auditBlock);

    // 8. Resolve Idempotency Key
    if (req.idempotencyKey) {
      this.idempotencyStore.resolveKey(req.idempotencyKey, tx);
    }

    return { transaction: tx, isCached: false };
  }

  /**
   * Simulates tampering with a block in the audit chain to demonstrate tamper evidence
   */
  tamperWithBlock(blockIndex: number, newAmount: number): void {
    if (blockIndex >= 0 && blockIndex < this.auditChain.length) {
      const block = this.auditChain[blockIndex];
      if (block.transaction.entries.length > 0) {
        block.transaction.entries[0].amount = newAmount;
      }
    }
  }
}
