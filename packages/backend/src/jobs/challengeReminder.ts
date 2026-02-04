import { Queue, Worker, Job } from 'bullmq';
import { logger } from '../utils/logger';
import { sendNotificationToAll } from '../services/notificationSender';
import { getChallengeForDate } from '../routes/challenge';
import { createRedisConnection } from '../lib/redisConnection';

const connection = createRedisConnection();

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
  challengeReminderQueue
    .add(
      'daily-reminder',
      {},
      {
        repeat: {
          pattern: '0 9 * * *', // 9 AM UTC daily
        },
        removeOnComplete: 10,
        removeOnFail: 10,
      },
    )
    .then(() => {
      logger.info('Challenge reminder scheduler started (9:00 AM UTC daily)');
    })
    .catch((err) => {
      logger.error({ error: err.message }, 'Failed to start challenge reminder scheduler');
    });
}

export function stopChallengeReminderScheduler(): void {
  challengeReminderWorker.close();
}
