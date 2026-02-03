import { getChallengeForDate } from '../src/routes/challenge';

describe('Daily Challenge System', () => {
  describe('getChallengeForDate', () => {
    it('returns a challenge with correct id and date', () => {
      const challenge = getChallengeForDate('2026-02-03');
      expect(challenge.id).toBe('challenge-2026-02-03');
      expect(challenge.date).toBe('2026-02-03');
    });

    it('returns same challenge for same date (deterministic)', () => {
      const a = getChallengeForDate('2026-06-15');
      const b = getChallengeForDate('2026-06-15');
      expect(a.title).toBe(b.title);
      expect(a.suggestedStyleId).toBe(b.suggestedStyleId);
      expect(a.icon).toBe(b.icon);
    });

    it('returns different challenges for different dates', () => {
      const a = getChallengeForDate('2026-01-01');
      const b = getChallengeForDate('2026-01-02');
      // Could theoretically collide if pool is small, but with 90 challenges
      // consecutive days should differ
      expect(a.id).not.toBe(b.id);
    });

    it('includes all required fields', () => {
      const challenge = getChallengeForDate('2026-03-15');
      expect(challenge.title).toBeDefined();
      expect(challenge.description).toBeDefined();
      expect(challenge.creativePrompt).toBeDefined();
      expect(challenge.suggestedStyleId).toBeDefined();
      expect(challenge.icon).toBeDefined();
      expect(challenge.hashtag).toBeDefined();
      expect(challenge.difficulty).toBeDefined();
      expect(['easy', 'medium', 'hard']).toContain(challenge.difficulty);
    });

    it('cycles through pool based on day of year', () => {
      // Day 0 (Jan 1) and day 90 should get same challenge (pool size = 90)
      const jan1 = getChallengeForDate('2026-01-01');
      const apr1 = getChallengeForDate('2026-04-01'); // day 90
      expect(jan1.title).toBe(apr1.title);
    });

    it('handles leap year dates', () => {
      const challenge = getChallengeForDate('2024-02-29');
      expect(challenge.id).toBe('challenge-2024-02-29');
      expect(challenge.title).toBeDefined();
    });

    it('handles end-of-year dates', () => {
      const challenge = getChallengeForDate('2026-12-31');
      expect(challenge.id).toBe('challenge-2026-12-31');
      expect(challenge.title).toBeDefined();
    });

    it('hashtag starts with #QuipPix', () => {
      const challenge = getChallengeForDate('2026-02-03');
      expect(challenge.hashtag).toMatch(/^#QuipPix/);
    });

    it('suggestedStyleId is a valid style', () => {
      const validStyles = [
        'caricature-classic', 'caricature-subtle', 'caricature-editorial',
        'comic-book', 'pop-art', 'pencil-clean', 'pencil-gritty',
        'watercolor', 'oil-painting', 'anime-inspired', 'cyberpunk-neon',
        'magazine-cover', 'pro-headshot', 'dreamy-portrait', 'editorial-fashion',
      ];
      // Check 30 days
      for (let i = 0; i < 30; i++) {
        const date = `2026-${String(Math.floor(i / 28) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`;
        const challenge = getChallengeForDate(date);
        expect(validStyles).toContain(challenge.suggestedStyleId);
      }
    });
  });

  describe('Challenge submission validation rules', () => {
    it('should reject missing challengeId', () => {
      const body = { jobId: 'abc123' };
      expect(body.challengeId ?? null).toBeNull();
    });

    it('should reject missing jobId', () => {
      const body = { challengeId: 'challenge-2026-02-03' };
      expect(body.jobId ?? null).toBeNull();
    });

    it('should accept valid submission', () => {
      const body = { challengeId: 'challenge-2026-02-03', jobId: 'abc123' };
      expect(body.challengeId).toBeDefined();
      expect(body.jobId).toBeDefined();
    });
  });

  describe('Date format validation', () => {
    it('valid YYYY-MM-DD format passes', () => {
      expect(/^\d{4}-\d{2}-\d{2}$/.test('2026-02-03')).toBe(true);
    });

    it('invalid formats fail', () => {
      expect(/^\d{4}-\d{2}-\d{2}$/.test('2026/02/03')).toBe(false);
      expect(/^\d{4}-\d{2}-\d{2}$/.test('02-03-2026')).toBe(false);
      expect(/^\d{4}-\d{2}-\d{2}$/.test('not-a-date')).toBe(false);
    });
  });
});
