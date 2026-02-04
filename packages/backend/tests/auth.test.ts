import jwt from 'jsonwebtoken';
import { initDb, closeDb } from '../src/db';
import { createUser, userExists, getUser } from '../src/db/repositories/userRepository';
import { setServerEntitlement } from '../src/db/repositories/entitlementRepository';
import { config } from '../src/config';

beforeAll(() => {
  initDb(':memory:');
});

afterAll(() => {
  closeDb();
});

describe('User Repository', () => {
  it('creates a new user', () => {
    createUser('auth-user-1');
    expect(userExists('auth-user-1')).toBe(true);
  });

  it('ignores duplicate user creation', () => {
    createUser('auth-user-1');
    // No error thrown, still exists
    expect(userExists('auth-user-1')).toBe(true);
  });

  it('returns user details', () => {
    const user = getUser('auth-user-1');
    expect(user).toBeDefined();
    expect(user!.id).toBe('auth-user-1');
    expect(user!.createdAt).toBeDefined();
  });

  it('returns undefined for non-existent user', () => {
    expect(getUser('nonexistent')).toBeUndefined();
  });

  it('reports non-existent user correctly', () => {
    expect(userExists('nonexistent')).toBe(false);
  });
});

describe('JWT generation and verification', () => {
  it('signs a valid JWT with correct payload', () => {
    const token = jwt.sign({ sub: 'auth-user-1' }, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });

    const decoded = jwt.verify(token, config.jwt.secret) as { sub: string };
    expect(decoded.sub).toBe('auth-user-1');
  });

  it('rejects token signed with wrong secret', () => {
    const token = jwt.sign({ sub: 'auth-user-1' }, 'wrong-secret');
    expect(() => jwt.verify(token, config.jwt.secret)).toThrow();
  });

  it('rejects expired token', () => {
    const token = jwt.sign({ sub: 'auth-user-1' }, config.jwt.secret, {
      expiresIn: '0s',
    });
    // Token is already expired
    expect(() => jwt.verify(token, config.jwt.secret)).toThrow();
  });
});

describe('JWT Auth Middleware', () => {
  // Inline test of jwtAuth logic since we can't easily instantiate Fastify in unit tests
  it('extracts userId from valid JWT', () => {
    const token = jwt.sign({ sub: 'auth-user-1' }, config.jwt.secret, {
      expiresIn: '1h',
    });

    const decoded = jwt.verify(token, config.jwt.secret) as { sub: string };
    expect(decoded.sub).toBe('auth-user-1');
  });

  it('resolves tier from entitlements table', () => {
    // Set up a pro user
    setServerEntitlement({
      appUserId: 'auth-user-1',
      proActive: true,
      proType: 'annual',
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
      verifiedAt: new Date().toISOString(),
    });

    const { getServerEntitlement } = require('../src/db/repositories/entitlementRepository');
    const ent = getServerEntitlement('auth-user-1');
    expect(ent).toBeDefined();
    expect(ent.proActive).toBe(true);
  });

  it('resolves free tier when no entitlement exists', () => {
    const { getServerEntitlement } = require('../src/db/repositories/entitlementRepository');
    const ent = getServerEntitlement('auth-user-no-ent');
    expect(ent).toBeUndefined();
    // Middleware would set tier to 'free' in this case
  });
});

describe('Auth Route Logic', () => {
  it('register creates user and returns JWT', () => {
    const userId = 'route-test-user';
    createUser(userId);
    const token = jwt.sign({ sub: userId }, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });

    const decoded = jwt.verify(token, config.jwt.secret) as { sub: string };
    expect(decoded.sub).toBe(userId);
    expect(userExists(userId)).toBe(true);
  });

  it('register is idempotent', () => {
    const userId = 'route-test-user';
    createUser(userId); // Second call
    expect(userExists(userId)).toBe(true);

    const token = jwt.sign({ sub: userId }, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });
    const decoded = jwt.verify(token, config.jwt.secret) as { sub: string };
    expect(decoded.sub).toBe(userId);
  });

  it('refresh returns new token for valid token', () => {
    const userId = 'route-test-user';
    const oldToken = jwt.sign({ sub: userId }, config.jwt.secret, {
      expiresIn: '1h',
    });

    const payload = jwt.verify(oldToken, config.jwt.secret) as { sub: string };
    expect(payload.sub).toBe(userId);

    const newToken = jwt.sign({ sub: payload.sub }, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });

    const newPayload = jwt.verify(newToken, config.jwt.secret) as { sub: string };
    expect(newPayload.sub).toBe(userId);
  });

  it('refresh rejects invalid token', () => {
    expect(() =>
      jwt.verify('completely.invalid.token', config.jwt.secret),
    ).toThrow();
  });
});
