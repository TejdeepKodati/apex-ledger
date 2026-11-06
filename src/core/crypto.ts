import { AuditBlock, Transaction } from '../types/ledger';

/**
 * Computes standard SHA-256 hash using the Web Crypto API
 */
export async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Computes payload fingerprint for idempotency tracking
 */
export async function computePayloadHash(payload: any): Promise<string> {
  const serialized = JSON.stringify(payload, Object.keys(payload).sort());
  return sha256(serialized);
}

/**
 * Computes block hash chaining previous hash, timestamp, and transaction entries
 */
export async function computeBlockHash(
  blockNumber: number,
  timestamp: number,
  prevHash: string,
  transaction: Transaction
): Promise<{ blockHash: string; entriesHash: string }> {
  const entriesStr = JSON.stringify(transaction.entries);
  const entriesHash = await sha256(entriesStr);
  const rawBlock = `${blockNumber}|${timestamp}|${prevHash}|${transaction.id}|${entriesHash}`;
  const blockHash = await sha256(rawBlock);
  return { blockHash, entriesHash };
}

/**
 * Validates the entire cryptographic chain from genesis to tip
 */
export async function verifyAuditChain(chain: AuditBlock[]): Promise<{
  isValid: boolean;
  corruptedBlockIndex?: number;
  reason?: string;
}> {
  if (chain.length === 0) return { isValid: true };

  let expectedPrevHash = '0'.repeat(64); // Genesis hash

  for (let i = 0; i < chain.length; i++) {
    const block = chain[i];

    if (block.prevHash !== expectedPrevHash) {
      return {
        isValid: false,
        corruptedBlockIndex: i,
        reason: `Broken chain link at block #${block.blockNumber}: prevHash mismatch. Expected ${expectedPrevHash.slice(0, 10)}... got ${block.prevHash.slice(0, 10)}...`,
      };
    }

    const { blockHash, entriesHash } = await computeBlockHash(
      block.blockNumber,
      block.timestamp,
      block.prevHash,
      block.transaction
    );

    if (block.entriesHash !== entriesHash) {
      return {
        isValid: false,
        corruptedBlockIndex: i,
        reason: `Tampered entries detected inside block #${block.blockNumber}! Transaction payload was altered.`,
      };
    }

    if (block.blockHash !== blockHash) {
      return {
        isValid: false,
        corruptedBlockIndex: i,
        reason: `Cryptographic signature mismatch at block #${block.blockNumber}. Computed hash differs from block hash.`,
      };
    }

    expectedPrevHash = block.blockHash;
  }

  return { isValid: true };
}
