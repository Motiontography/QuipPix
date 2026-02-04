import { ApiError } from '../api/client';

export type ErrorCategory = 'network' | 'server' | 'timeout' | 'limit' | 'unknown';

export function classifyError(err: unknown): ErrorCategory {
  if (err instanceof ApiError) {
    if (err.status === 408) return 'timeout';
    if (err.status === 429) return 'limit';
    if (err.body?.message?.toLowerCase().includes('limit')) return 'limit';
    if (err.status >= 500) return 'server';
  }

  if (err instanceof TypeError) {
    const msg = err.message.toLowerCase();
    if (msg.includes('network') || msg.includes('fetch')) return 'network';
  }

  if (err && typeof err === 'object' && 'status' in err) {
    const status = (err as any).status;
    if (status === 0 || status === undefined) return 'network';
  }

  return 'unknown';
}
