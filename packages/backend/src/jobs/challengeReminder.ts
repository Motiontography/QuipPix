import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { config } from '../config';
import { logger } from '../utils/logger';
import { sendNotificationToAll } from '../services/notificationSender';
import { getChallengeForDate } from '../routes/challenge';

const connection = new IORedis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  maxRetriesPerRequest: null,
});

export const challengeReminderQueue = new Queue('challenge-reminder', {
  connection,
});

export const challengeReminderWorker = new Worker(
  'challenge-reminder',
  async (_job: Job) => {
    const today = new Date().toISOString().split('T')[0];
    const challenge = getChallengeForDate(today);

    const sent = await sendNotificationToAll({
      title: `Daily Challenge: ${challenge.title}`,
      body: challenge.description,
      data: {
        type: 'daily_challenge',
        challengeId: challenge.id,
        date: today,
      },
    });

    logger.info(
      { challengeId: challenge.id, sentTo: sent },
      'Challenge reminder sent',
    );
  },
  { connection },
);

export function startChallengeReminderScheduler(): void {
  challengeReminderQueue.add(
    'daily-reminder',
    {},
    {
      repeat: {
        pattern: '0 9 * * *', // 9 AM UTC daily
      },
      removeOnComplete: 10,
      removeOnFail: 10,
    },
  );
  logger.info('Challenge reminder scheduler started (9:00 AM UTC daily)');
}

export function stopChallengeReminderScheduler(): void {
  challengeReminderWorker.close();
}
