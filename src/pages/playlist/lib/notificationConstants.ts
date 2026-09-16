export const FIXED_NOTIFICATION_ID = 'playlist-cache-notification'

export const CACHING_TITLE = 'Добавление в офлайн...'

export const COMPLETION_TITLE = 'Добавление в офлайн завершено'

export const ERROR_TITLE = 'Ошибка добавления в офлайн'

export const SILENT_CHANNEL_ID = 'playlist-cache-progress'

export const SILENT_CHANNEL_NAME = 'Добавление плейлиста в офлайн (прогресс)'

export const ALERT_CHANNEL_ID = 'playlist-cache-alert'

export const ALERT_CHANNEL_NAME = 'Добавление плейлиста в офлайн (завершение)'

// expo-notifications JS importance enum is offset from Android's native values:
// UNKNOWN=0, UNSPECIFIED=1, NONE=2, MIN=3, LOW=4, DEFAULT=5, HIGH=6, MAX=7.
// Passing the raw Android value (e.g. 2 = IMPORTANCE_NONE) would silently block
// the channel — always use the expo JS values below.
export const NOTIFICATION_IMPORTANCE_LOW = 4

export const NOTIFICATION_IMPORTANCE_HIGH = 6
