import { getDb } from '../index';
import { ServerEntitlement, ProType } from '../../types';

export function getServerEntitlement(appUserId: string): ServerEntitlement | undefined {
  const db = getDb();
  const row = db
    .prepare(
      'SELECT app_user_id, pro_active, pro_type, expires_at, verified_at FROM user_entitlements WHERE app_user_id = ?',
    )
    .get(appUserId) as
    | {
        app_user_id: string;
        pro_active: number;
        pro_type: string | null;
        expires_at: string | null;
        verified_at: string;
      }
    | undefined;

  if (!row) return undefined;

  return {
    appUserId: row.app_user_id,
    proActive: row.pro_active === 1,
    proType: (row.pro_type as ProType) ?? null,
    expiresAt: row.expires_at,
    verifiedAt: row.verified_at,
  };
}

export function setServerEntitlement(ent: ServerEntitlement): void {
  const db = getDb();
  db.prepare(
    `INSERT INTO user_entitlements (app_user_id, pro_active, pro_type, expires_at, verified_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(app_user_id) DO UPDATE SET
       pro_active = excluded.pro_active,
       pro_type = excluded.pro_type,
       expires_at = excluded.expires_at,
       verified_at = excluded.verified_at`,
  ).run(
    ent.appUserId,
    ent.proActive ? 1 : 0,
    ent.proType,
    ent.expiresAt,
    ent.verifiedAt,
  );
}

export function getEntitlementStoreSize(): number {
  const db = getDb();
  const row = db
    .prepare('SELECT COUNT(*) as count FROM user_entitlements')
    .get() as { count: number };
  return row.count;
}
