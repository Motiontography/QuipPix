import admin from 'firebase-admin';
import { config } from '../config';
import { logger } from '../utils/logger';

let initialized = false;

export function initFirebase(): void {
  if (initialized) return;

  if (config.firebase.serviceAccountPath) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const serviceAccount = require(config.firebase.serviceAccountPath);
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  } else {
    admin.initializeApp();
  }

  initialized = true;
  logger.info('Firebase Admin initialized');
}

export function getMessaging(): admin.messaging.Messaging {
  if (!initialized) {
    throw new Error('Firebase not initialized. Call initFirebase() first.');
  }
  return admin.messaging();
}
