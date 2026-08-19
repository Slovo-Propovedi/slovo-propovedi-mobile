jest.mock('expo-constants', () => {
  const ExecutionEnvironment = {
    Bare: 'bare',
    StoreClient: 'storeClient',
    Standalone: 'standalone',
  }

  return {
    __esModule: true,
    ExecutionEnvironment,
    default: {
      executionEnvironment: ExecutionEnvironment.StoreClient,
      expoConfig: {
        version: '0.0.0-test',
      },
    },
  }
})
