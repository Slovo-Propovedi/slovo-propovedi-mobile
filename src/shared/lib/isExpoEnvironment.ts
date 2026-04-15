import Constants, { ExecutionEnvironment } from 'expo-constants'

/**
 * Check if the app is running in Expo Go (yarn start command)
 * Native audio services may not be properly initialized in this mode.
 */
export const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient

/**
 * Check if the app is running in a standalone build (yarn android, yarn ios, EAS build).
 */
export const isStandaloneBuild = Constants.executionEnvironment === ExecutionEnvironment.Standalone

/**
 * Check if the app is running in a bare workflow.
 */
export const isBareWorkflow = Constants.executionEnvironment === ExecutionEnvironment.Bare
