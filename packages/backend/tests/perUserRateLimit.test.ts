import { FastifyRequest, FastifyReply } from 'fastify';

// Mock IORedis before importing the module
const mockIncr = jest.fn();
const mockExpire = jest.fn();
const mockTtl = jest.fn();

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    incr: mockIncr,
    expire: mockExpire,
    ttl: mockTtl,
  }));
});

import { perUserRateLimit } from '../src/middleware/perUserRateLimit';

function makeRequest(headers: Record<string, string>, tier: string = 'free'): FastifyRequest {
  return {
    headers,
    tier,
  } as unknown as FastifyRequest;
}

function makeReply(): FastifyReply & { sentStatus?: number; sentBody?: any; headers: Record<string, string> } {
  const reply: any = {
    headers: {},
    header(name: string, value: string) {
      reply.headers[name] = value;
      return reply;
    },
    status(code: number) {
      reply.sentStatus = code;
      return reply;
    },
    send(body: any) {
      reply.sentBody = body;
      return reply;
    },
  };
  return reply;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockTtl.mockResolvedValue(55);
});

describe('perUserRateLimit', () => {
  it('passes through when no X-QuipPix-User-Id header', async () => {
    const req = makeRequest({});
    const reply = makeReply();
    await perUserRateLimit(req, reply as any);
    expect(mockIncr).not.toHaveBeenCalled();
    expect(reply.sentStatus).toBeUndefined();
  });

  it('passes through when X-QuipPix-User-Id is empty', async () => {
    const req = makeRequest({ 'x-quippix-user-id': '' });
    const reply = makeReply();
    await perUserRateLimit(req, reply as any);
    expect(mockIncr).not.toHaveBeenCalled();
  });

  it('allows requests under the free limit', async () => {
    mockIncr.mockResolvedValue(5);
    const req = makeRequest({ 'x-quippix-user-id': 'user-1' }, 'free');
    const reply = makeReply();
    await perUserRateLimit(req, reply as any);
    expect(mockIncr).toHaveBeenCalledWith('ratelimit:user:user-1:generate');
    expect(reply.sentStatus).toBeUndefined();
  });

  it('sets TTL on first request (count === 1)', async () => {
    mockIncr.mockResolvedValue(1);
    const req = makeRequest({ 'x-quippix-user-id': 'user-new' }, 'free');
    const reply = makeReply();
    await perUserRateLimit(req, reply as any);
    expect(mockExpire).toHaveBeenCalledWith('ratelimit:user:user-new:generate', 60);
  });

  it('does not set TTL on subsequent requests', async () => {
    mockIncr.mockResolvedValue(3);
    const req = makeRequest({ 'x-quippix-user-id': 'user-2' }, 'free');
    const reply = makeReply();
    await perUserRateLimit(req, reply as any);
    expect(mockExpire).not.toHaveBeenCalled();
  });

  it('returns 429 when free user exceeds 10 requests', async () => {
    mockIncr.mockResolvedValue(11);
    const req = makeRequest({ 'x-quippix-user-id': 'user-3' }, 'free');
    const reply = makeReply();
    await perUserRateLimit(req, reply as any);
    expect(reply.sentStatus).toBe(429);
    expect(reply.sentBody.error).toBe('rate_limit');
    expect(reply.sentBody.message).toContain('10 requests per minute');
    expect(reply.sentBody.message).toContain('free');
  });

  it('includes Retry-After header on 429', async () => {
    mockIncr.mockResolvedValue(11);
    mockTtl.mockResolvedValue(42);
    const req = makeRequest({ 'x-quippix-user-id': 'user-4' }, 'free');
    const reply = makeReply();
    await perUserRateLimit(req, reply as any);
    expect(reply.headers['Retry-After']).toBe('42');
    expect(reply.sentBody.retryAfter).toBe(42);
  });

  it('allows pro user up to 30 requests', async () => {
    mockIncr.mockResolvedValue(30);
    const req = makeRequest({ 'x-quippix-user-id': 'pro-user' }, 'pro');
    const reply = makeReply();
    await perUserRateLimit(req, reply as any);
    expect(reply.sentStatus).toBeUndefined();
  });

  it('returns 429 when pro user exceeds 30 requests', async () => {
    mockIncr.mockResolvedValue(31);
    const req = makeRequest({ 'x-quippix-user-id': 'pro-user' }, 'pro');
    const reply = makeReply();
    await perUserRateLimit(req, reply as any);
    expect(reply.sentStatus).toBe(429);
    expect(reply.sentBody.message).toContain('30 requests per minute');
    expect(reply.sentBody.message).toContain('pro');
  });

  it('uses fallback window when ttl returns -1', async () => {
    mockIncr.mockResolvedValue(11);
    mockTtl.mockResolvedValue(-1);
    const req = makeRequest({ 'x-quippix-user-id': 'user-5' }, 'free');
    const reply = makeReply();
    await perUserRateLimit(req, reply as any);
    expect(reply.headers['Retry-After']).toBe('60');
  });
});
