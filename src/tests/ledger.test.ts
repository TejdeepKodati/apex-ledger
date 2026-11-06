import { describe, it, expect, beforeEach } from 'vitest';
import { LedgerEngine } from '../core/engine';
import { verifyAuditChain } from '../core/crypto';
import { generateReconciliationReport } from '../core/reconciliation';

describe('ApexLedger Engine Core Test Suite', () => {
  let engine: LedgerEngine;

  beforeEach(() => {
    engine = new LedgerEngine();
  });

  it('enforces strict double-entry balance (Debits == Credits)', async () => {
    const res = await engine.executeTransfer({
      sourceAccountId: 'acc_central_clearing',
      destinationAccountId: 'acc_cust_rohit',
      amount: 10000,
      reference: 'TEST-DE-001',
      description: 'Double entry validation test',
    });

    expect(res.transaction.status).toBe('COMMITTED');
    expect(res.transaction.entries.length).toBe(2);

    const debits = res.transaction.entries
      .filter(e => e.direction === 'DEBIT')
      .reduce((s, e) => s + e.amount, 0);

    const credits = res.transaction.entries
      .filter(e => e.direction === 'CREDIT')
      .reduce((s, e) => s + e.amount, 0);

    expect(debits).toBe(10000);
    expect(credits).toBe(10000);
    expect(debits).toBe(credits);
  });

  it('guarantees idempotency on identical payload replay', async () => {
    const key = 'idemp_test_identical_99';
    const payload = {
      sourceAccountId: 'acc_central_clearing',
      destinationAccountId: 'acc_cust_priya',
      amount: 5000,
      reference: 'REF-IDEMP-01',
      description: 'Initial transfer',
      idempotencyKey: key,
    };

    const initialPriyaBal = engine.getAccount('acc_cust_priya')!.balance;

    // First call: fresh commit
    const firstCall = await engine.executeTransfer(payload);
    expect(firstCall.isCached).toBe(false);
    expect(engine.getAccount('acc_cust_priya')!.balance).toBe(initialPriyaBal + 5000);

    // Second call: duplicate replay with same key and payload
    const secondCall = await engine.executeTransfer(payload);
    expect(secondCall.isCached).toBe(true);
    expect(secondCall.transaction.id).toBe(firstCall.transaction.id);

    // Balance must NOT be debited or credited a second time!
    expect(engine.getAccount('acc_cust_priya')!.balance).toBe(initialPriyaBal + 5000);
  });

  it('rejects idempotency key reuse with conflicting payload (409 Conflict)', async () => {
    const key = 'idemp_test_conflict_88';

    await engine.executeTransfer({
      sourceAccountId: 'acc_central_clearing',
      destinationAccountId: 'acc_cust_arjun',
      amount: 2000,
      reference: 'REF-CONFLICT-01',
      description: 'First attempt',
      idempotencyKey: key,
    });

    // Attempt reuse with different payload
    await expect(
      engine.executeTransfer(
        {
          sourceAccountId: 'acc_central_clearing',
          destinationAccountId: 'acc_cust_arjun',
          amount: 2000,
          reference: 'REF-CONFLICT-01',
          description: 'First attempt',
          idempotencyKey: key,
        },
        {
          customPayloadForIdempotency: {
            sourceAccountId: 'acc_central_clearing',
            destinationAccountId: 'acc_cust_arjun',
            amount: 999999, // Conflicting payload
          },
        }
      )
    ).rejects.toThrow(/409 Conflict/);
  });

  it('prevents overdraft under concurrent debit strain', async () => {
    // Arjun has balance ₹25,000. Fire 5 concurrent requests of ₹10,000 each.
    // At most 2 requests can succeed (2 * 10,000 = 20,000). 3 must fail.
    const promises = [];
    for (let i = 0; i < 5; i++) {
      promises.push(
        engine.executeTransfer({
          sourceAccountId: 'acc_cust_arjun',
          destinationAccountId: 'acc_merchant_flipkart',
          amount: 10000,
          reference: `CONCURRENCY-TEST-${i}`,
          description: `Concurrent transfer #${i}`,
        })
      );
    }

    const settled = await Promise.allSettled(promises);
    const fulfilled = settled.filter(s => s.status === 'fulfilled');
    const rejected = settled.filter(s => s.status === 'rejected');

    expect(fulfilled.length).toBe(2);
    expect(rejected.length).toBe(3);

    const finalArjun = engine.getAccount('acc_cust_arjun')!;
    expect(finalArjun.balance).toBe(5000);
    expect(finalArjun.balance).toBeGreaterThanOrEqual(0);
  });

  it('validates cryptographic audit chain and detects tampering', async () => {
    await engine.executeTransfer({
      sourceAccountId: 'acc_central_clearing',
      destinationAccountId: 'acc_cust_rohit',
      amount: 1200,
      reference: 'TX-AUDIT-01',
      description: 'Audit test block 1',
    });

    await engine.executeTransfer({
      sourceAccountId: 'acc_cust_rohit',
      destinationAccountId: 'acc_merchant_flipkart',
      amount: 800,
      reference: 'TX-AUDIT-02',
      description: 'Audit test block 2',
    });

    const chain = engine.getAuditChain();
    expect(chain.length).toBe(2);

    // Initial integrity check should pass 100%
    const initialVerify = await verifyAuditChain(chain);
    expect(initialVerify.isValid).toBe(true);

    // Tamper with block 0
    engine.tamperWithBlock(0, 9999999);
    const tamperedVerify = await verifyAuditChain(chain);
    expect(tamperedVerify.isValid).toBe(false);
    expect(tamperedVerify.corruptedBlockIndex).toBe(0);
  });

  it('satisfies the accounting equation Assets = Liabilities + Equity in reconciliation', async () => {
    await engine.executeTransfer({
      sourceAccountId: 'acc_central_clearing',
      destinationAccountId: 'acc_cust_rohit',
      amount: 3000,
      reference: 'RECON-01',
      description: 'Reconciliation test',
    });

    const report = generateReconciliationReport(engine.getAccounts());
    expect(report.isBalanced).toBe(true);
    expect(report.accountingEquationSatisfied).toBe(true);
    expect(report.totalDebits).toBe(report.totalCredits);
  });
});
