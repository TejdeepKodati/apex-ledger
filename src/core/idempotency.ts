import { IdempotencyRecord, Transaction } from '../types/ledger';
import { computePayloadHash } from './crypto';

export class IdempotencyStore {
  private cache: Map<string, IdempotencyRecord> = new Map();
  private ttlMs: number;

  constructor(ttlMinutes: number = 60) {
    this.ttlMs = ttlMinutes * 60 * 1000;
  }

  /**
   * Evaluates incoming request with idempotency key
   * Returns:
   *  - { action: 'EXECUTE', record }: Key is fresh, proceed to execute
   *  - { action: 'RETURN_CACHED', cachedResponse }: Key previously resolved with identical payload
   *  - { action: 'CONFLICT_ERROR', error }: Key reused with conflicting payload (HTTP 409)
   */
  async checkKey(
    key: string,
    payload: any
  ): Promise<{
    action: 'EXECUTE' | 'RETURN_CACHED' | 'CONFLICT_ERROR';
    payloadHash: string;
    cachedResponse?: Transaction;
    error?: string;
  }> {
    const payloadHash = await computePayloadHash(payload);
    const existing = this.cache.get(key);

    if (!existing) {
      // Record fresh key as pending
      this.cache.set(key, {
        key,
        payloadHash,
        status: 'PENDING',
        createdAt: Date.now(),
      });
      return { action: 'EXECUTE', payloadHash };
    }

    // Check TTL expiration
    if (Date.now() - existing.createdAt > this.ttlMs) {
      this.cache.delete(key);
      this.cache.set(key, {
        key,
        payloadHash,
        status: 'PENDING',
        createdAt: Date.now(),
      });
      return { action: 'EXECUTE', payloadHash };
    }

    // Key exists: check payload fingerprint
    if (existing.payloadHash !== payloadHash) {
      return {
        action: 'CONFLICT_ERROR',
        payloadHash,
        error: `409 Conflict: Idempotency-Key "${key}" was already used with a different request payload. Original hash: ${existing.payloadHash.slice(0, 12)}..., Current hash: ${payloadHash.slice(0, 12)}...`,
      };
    }

    if (existing.status === 'RESOLVED' && existing.response) {
      return {
        action: 'RETURN_CACHED',
        payloadHash,
        cachedResponse: existing.response,
      };
    }

    return { action: 'EXECUTE', payloadHash };
  }

  /**
   * Marks idempotency key as resolved with committed transaction
   */
  resolveKey(key: string, transaction: Transaction): void {
    const existing = this.cache.get(key);
    if (existing) {
      existing.status = 'RESOLVED';
      existing.response = transaction;
    }
  }

  /**
   * Cleans up expired keys
   */
  evictExpired(): void {
    const now = Date.now();
    for (const [key, record] of this.cache.entries()) {
      if (now - record.createdAt > this.ttlMs) {
        this.cache.delete(key);
      }
    }
  }

  getAllRecords(): IdempotencyRecord[] {
    return Array.from(this.cache.values());
  }

  clear(): void {
    this.cache.clear();
  }
}
