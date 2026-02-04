import { getDateFilterStart, DateRange } from '../components/DateFilter';

describe('getDateFilterStart', () => {
  it('returns null for "all"', () => {
    expect(getDateFilterStart('all')).toBeNull();
  });

  it('returns start of today for "today"', () => {
    const now = new Date();
    const result = getDateFilterStart('today')!;
    expect(result).toBeInstanceOf(Date);
    expect(result.getFullYear()).toBe(now.getFullYear());
    expect(result.getMonth()).toBe(now.getMonth());
    expect(result.getDate()).toBe(now.getDate());
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
    expect(result.getSeconds()).toBe(0);
  });

  it('returns 7 days ago for "week"', () => {
    const now = new Date();
    const result = getDateFilterStart('week')!;
    expect(result).toBeInstanceOf(Date);
    const diffMs = now.getTime() - result.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    // Should be approximately 7 days (within a few seconds tolerance)
    expect(diffDays).toBeGreaterThan(6.99);
    expect(diffDays).toBeLessThan(7.01);
  });

  it('returns 1 month ago for "month"', () => {
    const now = new Date();
    const result = getDateFilterStart('month')!;
    expect(result).toBeInstanceOf(Date);
    // Month should be one less (or wrapped around for January)
    const expectedMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
    expect(result.getMonth()).toBe(expectedMonth);
  });

  it('returns a date before now for all non-"all" ranges', () => {
    const ranges: DateRange[] = ['today', 'week', 'month'];
    const now = new Date();
    for (const range of ranges) {
      const result = getDateFilterStart(range)!;
      expect(result.getTime()).toBeLessThanOrEqual(now.getTime());
    }
  });
});
