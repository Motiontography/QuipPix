import { getDb } from '../index';
import { ChallengeSubmission } from '../../types';

export function addSubmission(submission: ChallengeSubmission): void {
  const db = getDb();
  db.prepare(
    'INSERT INTO challenge_submissions (challenge_id, job_id, submitted_at) VALUES (?, ?, ?)',
  ).run(submission.challengeId, submission.jobId, submission.submittedAt);
}

export function getSubmissionCount(challengeId: string): number {
  const db = getDb();
  const row = db
    .prepare('SELECT COUNT(*) as count FROM challenge_submissions WHERE challenge_id = ?')
    .get(challengeId) as { count: number };
  return row.count;
}

export function getSubmissions(challengeId: string): ChallengeSubmission[] {
  const db = getDb();
  const rows = db
    .prepare(
      'SELECT challenge_id, job_id, submitted_at FROM challenge_submissions WHERE challenge_id = ?',
    )
    .all(challengeId) as { challenge_id: string; job_id: string; submitted_at: string }[];

  return rows.map((r) => ({
    challengeId: r.challenge_id,
    jobId: r.job_id,
    submittedAt: r.submitted_at,
  }));
}
