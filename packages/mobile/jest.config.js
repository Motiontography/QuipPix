module.exports = {
  preset: 'react-native',
  setupFiles: ['./src/__mocks__/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^react-native-fs$': '<rootDir>/src/__mocks__/react-native-fs.ts',
    '^@react-native-async-storage/async-storage$': '<rootDir>/src/__mocks__/@react-native-async-storage/async-storage.ts',
    '^@react-native-community/netinfo$': '<rootDir>/src/__mocks__/@react-native-community/netinfo.ts',
    '^react-native-biometrics$': '<rootDir>/src/__mocks__/react-native-biometrics.ts',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|react-native-.*|zustand)/)',
  ],
  testMatch: ['<rootDir>/src/__tests__/**/*.test.ts', '<rootDir>/src/__tests__/**/*.test.tsx'],
};
