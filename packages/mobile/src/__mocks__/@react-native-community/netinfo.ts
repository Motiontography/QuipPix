export const useNetInfo = jest.fn(() => ({
  isConnected: true,
  isInternetReachable: true,
}));

export const addEventListener = jest.fn(() => jest.fn());

export default { useNetInfo, addEventListener };
