export type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  currency: string;
  balance: number;
  version: number;
  createdAt: number;
}

export type EntryDirection = 'DEBIT' | 'CREDIT';

export interface Entry {
  accountId: string;
  direction: EntryDirection;
  amount: number;
}

export interface Transaction {
  id: string;
  timestamp: number;
  reference: string;
  description: string;
  idempotencyKey?: string;
  entries: Entry[];
  status: 'COMMITTED' | 'REJECTED';
  metadata?: Record<string, any>;
}

export interface IdempotencyRecord {
  key: string;
  payloadHash: string;
  status: 'PENDING' | 'RESOLVED' | 'FAILED';
  response?: Transaction;
  error?: string;
  createdAt: number;
}

export interface AuditBlock {
  blockNumber: number;
  timestamp: number;
  transactionId: string;
  prevHash: string;
  blockHash: string;
  entriesHash: string;
  transaction: Transaction;
}

export interface TrialBalanceRow {
  accountId: string;
  accountName: string;
  accountType: AccountType;
  debit: number;
  credit: number;
}

export interface ReconciliationReport {
  timestamp: number;
  totalDebits: number;
  totalCredits: number;
  isBalanced: boolean;
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  accountingEquationSatisfied: boolean; // Assets = Liabilities + Equity
  rows: TrialBalanceRow[];
}
