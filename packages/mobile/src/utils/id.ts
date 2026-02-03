/**
 * Simple ID generator (no external dependency needed on mobile).
 */
export function nanoid(length: number = 12): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const randomValues = new Uint8Array(length);
  // Use Math.random as fallback for React Native
  for (let i = 0; i < length; i++) {
    randomValues[i] = Math.floor(Math.random() * 256);
  }
  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length];
  }
  return result;
}
