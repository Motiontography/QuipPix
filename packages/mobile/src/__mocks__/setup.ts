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

// Mock react-native-haptic-feedback
jest.mock('react-native-haptic-feedback', () => ({
  default: { trigger: jest.fn() },
  trigger: jest.fn(),
}));

// Mock react-native-fast-image
jest.mock('react-native-fast-image', () => ({
  preload: jest.fn(),
  priority: { low: 'low', normal: 'normal', high: 'high' },
}));

// Mock react-native-compressor
jest.mock('react-native-compressor', () => ({
  Image: {
    compress: jest.fn(() => Promise.resolve('/mock/compressed.png')),
  },
}));

// Mock react-native-share
jest.mock('react-native-share', () => ({
  default: { open: jest.fn(() => Promise.resolve()) },
}));

// Mock analytics
jest.mock('../services/analytics', () => ({
  trackEvent: jest.fn(),
}));

// Mock haptics
jest.mock('../services/haptics', () => ({
  triggerHaptic: jest.fn(),
}));

// Mock cameraRoll
jest.mock('../services/cameraRoll', () => ({
  saveToPhotoLibrary: jest.fn(() => Promise.resolve()),
  requestPhotoPermission: jest.fn(() => Promise.resolve(true)),
}));

// Mock appInfo
jest.mock('../services/appInfo', () => ({
  getAppVersion: jest.fn(() => '1.0.0'),
  getBuildNumber: jest.fn(() => '1'),
  getDeviceInfo: jest.fn(() => ({ model: 'iPhone', os: 'ios', version: '17.0' })),
}));
