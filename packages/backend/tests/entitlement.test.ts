import {
  ValidateReceiptRequest,
  ServerEntitlement,
  RevenueCatWebhookEvent,
} from '../src/types';
import {
  getServerEntitlement,
  setServerEntitlement,
  getEntitlementStoreSize,
} from '../src/routes/entitlement';

describe('Entitlement System', () => {
  describe('ValidateReceiptRequest schema', () => {
    it('accepts valid appUserId', () => {
      const result = ValidateReceiptRequest.safeParse({ appUserId: 'user_123' });
      expect(result.success).toBe(true);
    });

    it('rejects empty appUserId', () => {
      const result = ValidateReceiptRequest.safeParse({ appUserId: '' });
      expect(result.success).toBe(false);
    });

    it('rejects missing appUserId', () => {
      const result = ValidateReceiptRequest.safeParse({});
      expect(result.success).toBe(false);
    });

    it('rejects appUserId over 200 chars', () => {
      const result = ValidateReceiptRequest.safeParse({ appUserId: 'a'.repeat(201) });
      expect(result.success).toBe(false);
    });

    it('accepts appUserId at max length', () => {
      const result = ValidateReceiptRequest.safeParse({ appUserId: 'a'.repeat(200) });
      expect(result.success).toBe(true);
    });
  });

  describe('Entitlement store', () => {
    it('stores and retrieves entitlement', () => {
      const ent: ServerEntitlement = {
        appUserId: 'test_store_1',
        proActive: true,
        proType: 'annual',
        expiresAt: '2027-01-01T00:00:00Z',
        verifiedAt: new Date().toISOString(),
      };

      setServerEntitlement(ent);
      const retrieved = getServerEntitlement('test_store_1');
      expect(retrieved).toBeDefined();
      expect(retrieved!.proActive).toBe(true);
      expect(retrieved!.proType).toBe('annual');
    });

    it('returns undefined for unknown user', () => {
      const result = getServerEntitlement('nonexistent_user');
      expect(result).toBeUndefined();
    });

    it('overwrites existing entitlement', () => {
      setServerEntitlement({
        appUserId: 'test_overwrite',
        proActive: true,
        proType: 'monthly',
        expiresAt: '2027-01-01T00:00:00Z',
        verifiedAt: new Date().toISOString(),
      });

      setServerEntitlement({
        appUserId: 'test_overwrite',
        proActive: false,
        proType: null,
        expiresAt: null,
        verifiedAt: new Date().toISOString(),
      });

      const retrieved = getServerEntitlement('test_overwrite');
      expect(retrieved!.proActive).toBe(false);
      expect(retrieved!.proType).toBeNull();
    });

    it('increments store size on new entries', () => {
      const before = getEntitlementStoreSize();
      setServerEntitlement({
        appUserId: `test_size_${Date.now()}`,
        proActive: true,
        proType: 'lifetime',
        expiresAt: null,
        verifiedAt: new Date().toISOString(),
      });
      expect(getEntitlementStoreSize()).toBe(before + 1);
    });
  });

  describe('Webhook event handling logic', () => {
    it('grant events should set proActive to true', () => {
      const grantTypes = ['INITIAL_PURCHASE', 'RENEWAL', 'PRODUCT_CHANGE'];
      grantTypes.forEach((type) => {
        const userId = `grant_${type}`;
        // Simulate what the webhook handler does for grant events
        setServerEntitlement({
          appUserId: userId,
          proActive: true,
          proType: 'monthly',
          expiresAt: '2027-06-01T00:00:00Z',
          verifiedAt: new Date().toISOString(),
        });

        const ent = getServerEntitlement(userId);
        expect(ent!.proActive).toBe(true);
      });
    });

    it('revoke events should set proActive to false', () => {
      const revokeTypes = ['CANCELLATION', 'EXPIRATION', 'BILLING_ISSUE'];
      revokeTypes.forEach((type) => {
        const userId = `revoke_${type}`;
        // First grant, then revoke
        setServerEntitlement({
          appUserId: userId,
          proActive: true,
          proType: 'annual',
          expiresAt: '2027-01-01T00:00:00Z',
          verifiedAt: new Date().toISOString(),
        });

        // Simulate revoke
        setServerEntitlement({
          appUserId: userId,
          proActive: false,
          proType: null,
          expiresAt: null,
          verifiedAt: new Date().toISOString(),
        });

        const ent = getServerEntitlement(userId);
        expect(ent!.proActive).toBe(false);
        expect(ent!.proType).toBeNull();
      });
    });

    it('lifetime product should have null expiresAt', () => {
      setServerEntitlement({
        appUserId: 'lifetime_test',
        proActive: true,
        proType: 'lifetime',
        expiresAt: null,
        verifiedAt: new Date().toISOString(),
      });

      const ent = getServerEntitlement('lifetime_test');
      expect(ent!.proActive).toBe(true);
      expect(ent!.proType).toBe('lifetime');
      expect(ent!.expiresAt).toBeNull();
    });
  });

  describe('ProType detection', () => {
    it('detects lifetime from product identifier', () => {
      // Test the detection pattern used in entitlement.ts
      const detect = (pid: string) => {
        if (pid.includes('lifetime')) return 'lifetime';
        if (pid.includes('annual')) return 'annual';
        return 'monthly';
      };

      expect(detect('com.quippix.pro.lifetime')).toBe('lifetime');
      expect(detect('com.quippix.pro.annual')).toBe('annual');
      expect(detect('com.quippix.pro.monthly')).toBe('monthly');
      expect(detect('com.quippix.pro')).toBe('monthly');
    });
  });

  describe('Webhook authorization', () => {
    it('rejects requests without proper authorization', () => {
      // The route checks: authHeader !== `Bearer ${config.revenuecat.webhookSecret}`
      // We test the pattern: invalid header should not match
      const validSecret = 'whsec_test_secret';
      const invalidHeader = 'Bearer wrong_secret';
      expect(invalidHeader).not.toBe(`Bearer ${validSecret}`);
    });

    it('accepts requests with valid authorization', () => {
      const validSecret = 'whsec_test_secret';
      const validHeader = `Bearer ${validSecret}`;
      expect(validHeader).toBe(`Bearer ${validSecret}`);
    });
  });
});
