import { tierGate } from '../src/middleware/tierGate';

function makeRequest(tierHeader?: string) {
  return {
    headers: tierHeader !== undefined ? { 'x-quippix-tier': tierHeader } : {},
    tier: 'free' as 'free' | 'pro',
  } as any;
}

describe('tierGate', () => {
  const reply = {} as any;

  it('defaults to free when no header present', async () => {
    const req = makeRequest();
    await tierGate(req, reply);
    expect(req.tier).toBe('free');
  });

  it('sets tier to free for "free" header', async () => {
    const req = makeRequest('free');
    await tierGate(req, reply);
    expect(req.tier).toBe('free');
  });

  it('sets tier to pro for "pro" header', async () => {
    const req = makeRequest('pro');
    await tierGate(req, reply);
    expect(req.tier).toBe('pro');
  });

  it('handles uppercase header values', async () => {
    const req = makeRequest('PRO');
    await tierGate(req, reply);
    expect(req.tier).toBe('pro');
  });

  it('handles mixed case header values', async () => {
    const req = makeRequest('Pro');
    await tierGate(req, reply);
    expect(req.tier).toBe('pro');
  });

  it('defaults unknown values to free', async () => {
    const req = makeRequest('premium');
    await tierGate(req, reply);
    expect(req.tier).toBe('free');
  });

  it('defaults empty string to free', async () => {
    const req = makeRequest('');
    await tierGate(req, reply);
    expect(req.tier).toBe('free');
  });
});
