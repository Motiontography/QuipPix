// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  }),
) as jest.Mock;

// Mock api client
jest.mock('../api/client', () => ({
  api: {
    setTier: jest.fn(),
    setAuthToken: jest.fn(),
    getBaseUrl: jest.fn(() => 'http://localhost:3000'),
    sendEvents: jest.fn(() => Promise.resolve({ received: 0 })),
  },
  ApiError: class ApiError extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
    }
  },
}));

// Mock purchases service
jest.mock('../services/purchases', () => ({
  getEntitlement: jest.fn(() =>
    Promise.resolve({ proActive: false, proType: null, expiresAt: null }),
  ),
}));

// Mock imageCache
jest.mock('../services/imageCache', () => ({
  cacheImage: jest.fn(() => Promise.resolve('/mock/documents/gallery/test.png')),
  deleteCachedImage: jest.fn(() => Promise.resolve()),
  clearImageCache: jest.fn(() => Promise.resolve()),
}));
