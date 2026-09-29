import Constants, { ExecutionEnvironment } from 'expo-constants'

/**
 * Check if the app is running in Expo Go (yarn start command)
 * Native audio services may not be properly initialized in this mode.
 */
export const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient
