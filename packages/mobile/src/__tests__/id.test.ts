import { nanoid } from '../utils/id';

describe('nanoid', () => {
  it('generates a string of default length 12', () => {
    const id = nanoid();
    expect(typeof id).toBe('string');
    expect(id.length).toBe(12);
  });

  it('generates a string of custom length', () => {
    expect(nanoid(6).length).toBe(6);
    expect(nanoid(20).length).toBe(20);
    expect(nanoid(1).length).toBe(1);
  });

  it('only contains alphanumeric characters', () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 50; i++) {
      const id = nanoid();
      for (const ch of id) {
        expect(chars).toContain(ch);
      }
    }
  });

  it('generates unique IDs', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 1000; i++) {
      ids.add(nanoid());
    }
    // With 12 chars from 62 options, collisions in 1000 samples should be virtually impossible
    expect(ids.size).toBe(1000);
  });

  it('returns empty string for length 0', () => {
    expect(nanoid(0)).toBe('');
  });
});
