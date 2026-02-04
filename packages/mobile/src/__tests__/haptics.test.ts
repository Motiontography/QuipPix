describe('haptics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('triggerHaptic does not throw', () => {
    // Re-import after resetting modules so mock is fresh
    const { triggerHaptic } = require('../services/haptics');
    expect(() => triggerHaptic('success')).not.toThrow();
    expect(() => triggerHaptic('light')).not.toThrow();
    expect(() => triggerHaptic('selection')).not.toThrow();
  });

  it('triggerHaptic is a function', () => {
    const { triggerHaptic } = require('../services/haptics');
    expect(typeof triggerHaptic).toBe('function');
  });
});
