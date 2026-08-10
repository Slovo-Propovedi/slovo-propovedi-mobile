import Constants from 'expo-constants'

const rawVersion = Constants.expoConfig?.version
if (!rawVersion)
  console.error(
    '[version] APP_VERSION is undefined — expoConfig.version missing. Update detection will not work correctly.',
  )
export const APP_VERSION = rawVersion ?? '0.0.0'
export const APP_NAME = 'Слово.Проповеди'
