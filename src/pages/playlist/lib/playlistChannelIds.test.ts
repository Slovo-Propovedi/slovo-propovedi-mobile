import { Platform } from 'react-native'
import type { ensurePlaylistNotificationChannels as EnsureChannels } from './playlistChannelIds'
import {
  ALERT_CHANNEL_ID,
  ALERT_CHANNEL_NAME,
  NOTIFICATION_IMPORTANCE_HIGH,
  NOTIFICATION_IMPORTANCE_LOW,
  SILENT_CHANNEL_ID,
  SILENT_CHANNEL_NAME,
} from './notificationConstants'

jest.mock('shared/lib/notifications', () => ({
  ensureNotifications: jest.fn(),
}))

const mockSetNotificationChannelAsync = jest.fn()

const loadModule = (): { ensurePlaylistNotificationChannels: typeof EnsureChannels } => {
  const { ensureNotifications } = jest.requireMock('shared/lib/notifications') as {
    ensureNotifications: jest.Mock
  }
  ensureNotifications.mockResolvedValue({
    setNotificationChannelAsync: mockSetNotificationChannelAsync,
  })

  return jest.requireActual('./playlistChannelIds') as {
    ensurePlaylistNotificationChannels: typeof EnsureChannels
  }
}

describe('ensurePlaylistNotificationChannels', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.resetModules()
    jest.replaceProperty(Platform, 'OS', 'android')
  })

  test('creates both channels with correct sound keys', async () => {
    const { ensurePlaylistNotificationChannels } = loadModule()

    await ensurePlaylistNotificationChannels()

    expect(mockSetNotificationChannelAsync).toHaveBeenCalledTimes(2)
    expect(mockSetNotificationChannelAsync).toHaveBeenCalledWith(SILENT_CHANNEL_ID, {
      importance: NOTIFICATION_IMPORTANCE_LOW,
      name: SILENT_CHANNEL_NAME,
      sound: null,
    })
    expect(mockSetNotificationChannelAsync).toHaveBeenCalledWith(ALERT_CHANNEL_ID, {
      importance: NOTIFICATION_IMPORTANCE_HIGH,
      name: ALERT_CHANNEL_NAME,
      sound: 'default',
    })
  })

  test('creates channels only once per session (memoized)', async () => {
    const { ensurePlaylistNotificationChannels } = loadModule()

    await Promise.all([ensurePlaylistNotificationChannels(), ensurePlaylistNotificationChannels()])

    expect(mockSetNotificationChannelAsync).toHaveBeenCalledTimes(2)
  })

  test('is a no-op when API is unavailable', async () => {
    const { ensurePlaylistNotificationChannels } = loadModule()

    // Override to return null AFTER loadModule set up the resolved value
    const { ensureNotifications } = jest.requireMock('shared/lib/notifications') as {
      ensureNotifications: jest.Mock
    }
    ensureNotifications.mockResolvedValue(null)

    await ensurePlaylistNotificationChannels()

    expect(mockSetNotificationChannelAsync).not.toHaveBeenCalled()
  })

  test('skips channel creation on iOS', async () => {
    jest.replaceProperty(Platform, 'OS', 'ios')
    const { ensurePlaylistNotificationChannels } = loadModule()

    await ensurePlaylistNotificationChannels()

    expect(mockSetNotificationChannelAsync).not.toHaveBeenCalled()
  })

  test('retries channel setup after a failure', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
    const { ensurePlaylistNotificationChannels } = loadModule()
    mockSetNotificationChannelAsync.mockRejectedValueOnce(new Error('setup failed'))

    await ensurePlaylistNotificationChannels()
    expect(mockSetNotificationChannelAsync).toHaveBeenCalledTimes(1)
    expect(warnSpy).toHaveBeenCalledWith(
      '[notifications] Failed to setup playlist cache channels:',
      expect.any(Error),
    )

    // The failed setup is not memoized: the next call retries both channels.
    await ensurePlaylistNotificationChannels()
    expect(mockSetNotificationChannelAsync).toHaveBeenCalledTimes(3)

    warnSpy.mockRestore()
  })
})
