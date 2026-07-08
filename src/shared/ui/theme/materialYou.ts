import { Platform } from 'react-native'

// Android 12 (API 31) introduced Material You dynamic color.
// Platform.Version is the API level on Android.
export const isMaterialYouSupported = (): boolean =>
  Platform.OS === 'android' && typeof Platform.Version === 'number' && Platform.Version >= 31
