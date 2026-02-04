const mockSimplePrompt = jest.fn(() => Promise.resolve({ success: true }));
const mockIsSensorAvailable = jest.fn(() =>
  Promise.resolve({ available: true, biometryType: 'FaceID' }),
);

class ReactNativeBiometrics {
  simplePrompt = mockSimplePrompt;
  isSensorAvailable = mockIsSensorAvailable;
}

export default ReactNativeBiometrics;
