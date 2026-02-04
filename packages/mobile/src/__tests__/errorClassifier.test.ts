import { classifyError, ErrorCategory } from '../utils/errorClassifier';
import { ApiError } from '../api/client';

describe('classifyError', () => {
  it('returns "timeout" for ApiError with status 408', () => {
    const err = new ApiError(408, 'Request timeout');
    expect(classifyError(err)).toBe('timeout');
  });

  it('returns "limit" for ApiError with status 429', () => {
    const err = new ApiError(429, 'Rate limit exceeded');
    expect(classifyError(err)).toBe('limit');
  });

  it('returns "server" for ApiError with status 500', () => {
    const err = new ApiError(500, 'Internal server error');
    expect(classifyError(err)).toBe('server');
  });

  it('returns "server" for ApiError with status 502', () => {
    const err = new ApiError(502, 'Bad gateway');
    expect(classifyError(err)).toBe('server');
  });

  it('returns "server" for ApiError with status 503', () => {
    const err = new ApiError(503, 'Service unavailable');
    expect(classifyError(err)).toBe('server');
  });

  it('returns "network" for TypeError with "network" in message', () => {
    const err = new TypeError('Network request failed');
    expect(classifyError(err)).toBe('network');
  });

  it('returns "network" for TypeError with "fetch" in message', () => {
    const err = new TypeError('Failed to fetch');
    expect(classifyError(err)).toBe('network');
  });

  it('returns "network" for object with status 0', () => {
    const err = { status: 0, message: 'Something went wrong' };
    expect(classifyError(err)).toBe('network');
  });

  it('returns "unknown" for generic Error', () => {
    const err = new Error('Something broke');
    expect(classifyError(err)).toBe('unknown');
  });

  it('returns "unknown" for string', () => {
    expect(classifyError('oops')).toBe('unknown');
  });

  it('returns "unknown" for null', () => {
    expect(classifyError(null)).toBe('unknown');
  });

  it('returns "unknown" for undefined', () => {
    expect(classifyError(undefined)).toBe('unknown');
  });

  it('returns "unknown" for ApiError with status 400', () => {
    const err = new ApiError(400, 'Bad request');
    expect(classifyError(err)).toBe('unknown');
  });

  it('returns "unknown" for ApiError with status 401', () => {
    const err = new ApiError(401, 'Unauthorized');
    expect(classifyError(err)).toBe('unknown');
  });

  it('returns "unknown" for ApiError with status 404', () => {
    const err = new ApiError(404, 'Not found');
    expect(classifyError(err)).toBe('unknown');
  });
});
