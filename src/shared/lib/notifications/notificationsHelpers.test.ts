import { Platform } from 'react-native'

const mockIsExpoGo = { isExpoGo: false }

jest.mock('shared/lib/isExpoEnvironment', () => ({
  get isExpoGo() {
    return mockIsExpoGo.isExpoGo
  },
}))

// The real ensureNotifications does `await import('expo-notifications')`, which
// fails in Jest's CommonJS VM (no --experimental-vm-modules). Mock it so the
// memoization invariants of notificationsHelpers can be tested in isolation.
jest.mock('./ensureNotifications', () => ({
  ensureNotifications: jest.fn(),
}))

const mockSetNotificationCategoryAsync = jest.fn()
const mockSetNotificationChannelAsync = jest.fn()
const mockScheduleNotificationAsync = jest.fn()
const mockCancelScheduledNotificationAsync = jest.fn()

const NOTIFICATION_CONTENT = { title: 'Доступна новая версия' }
const NOTIFICATION_ID = 'update-notification'
const NOTIFICATION_GROUP = 'app-update'

describe('notificationsHelpers memoization invariants', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.resetModules()
    mockIsExpoGo.isExpoGo = false
    jest.replaceProperty(Platform, 'OS', 'android')
    mockSetNotificationCategoryAsync.mockResolvedValue('app-update')
    mockSetNotificationChannelAsync.mockResolvedValue(undefined)
    mockScheduleNotificationAsync.mockResolvedValue(NOTIFICATION_ID)
    mockCancelScheduledNotificationAsync.mockResolvedValue(undefined)
  })

  const loadHelpers = () => {
    const { ensureNotifications } = jest.requireMock('./ensureNotifications')
    ensureNotifications.mockResolvedValue({
      cancelScheduledNotificationAsync: mockCancelScheduledNotificationAsync,
      scheduleNotificationAsync: mockScheduleNotificationAsync,
      setNotificationCategoryAsync: mockSetNotificationCategoryAsync,
      setNotificationChannelAsync: mockSetNotificationChannelAsync,
    })

    return jest.requireActual('./notificationsHelpers')
  }

  test('two concurrent scheduleNotification calls register the category exactly once', async () => {
    const { scheduleNotification } = loadHelpers()

    await Promise.all([
      scheduleNotification(NOTIFICATION_CONTENT, NOTIFICATION_ID, NOTIFICATION_GROUP),
      scheduleNotification(NOTIFICATION_CONTENT, NOTIFICATION_ID, NOTIFICATION_GROUP),
    ])

    expect(mockSetNotificationCategoryAsync).toHaveBeenCalledTimes(1)
    expect(mockScheduleNotificationAsync).toHaveBeenCalledTimes(2)
  })

  test('category setup is shared between scheduleNotification and hideNotification', async () => {
    const { hideNotification, scheduleNotification } = loadHelpers()

    await Promise.all([
      scheduleNotification(NOTIFICATION_CONTENT, NOTIFICATION_ID, NOTIFICATION_GROUP),
      hideNotification(NOTIFICATION_ID),
    ])

    expect(mockSetNotificationCategoryAsync).toHaveBeenCalledTimes(1)
  })

  test('channelId on Android produces channel trigger', async () => {
    const { scheduleNotification } = loadHelpers()

    await scheduleNotification(
      NOTIFICATION_CONTENT,
      NOTIFICATION_ID,
      NOTIFICATION_GROUP,
      'test-channel',
    )

    expect(mockScheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({ trigger: { channelId: 'test-channel', type: 'channel' } }),
    )
  })

  test('no channelId on Android produces null trigger', async () => {
    const { scheduleNotification } = loadHelpers()

    await scheduleNotification(NOTIFICATION_CONTENT, NOTIFICATION_ID, NOTIFICATION_GROUP)

    expect(mockScheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({ trigger: null }),
    )
  })

  test('channelId on iOS still produces null trigger', async () => {
    jest.replaceProperty(Platform, 'OS', 'ios')
    const { scheduleNotification } = loadHelpers()

    await scheduleNotification(
      NOTIFICATION_CONTENT,
      NOTIFICATION_ID,
      NOTIFICATION_GROUP,
      'test-channel',
    )

    expect(mockScheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({ trigger: null }),
    )
  })

  test('content sound defaults to null when not specified', async () => {
    const { scheduleNotification } = loadHelpers()

    await scheduleNotification(NOTIFICATION_CONTENT, NOTIFICATION_ID, NOTIFICATION_GROUP)

    expect(mockScheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({ content: expect.objectContaining({ sound: null }) }),
    )
  })

  test('content sound is passed through when specified', async () => {
    const { scheduleNotification } = loadHelpers()

    await scheduleNotification(
      { ...NOTIFICATION_CONTENT, sound: true },
      NOTIFICATION_ID,
      NOTIFICATION_GROUP,
    )

    expect(mockScheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({ content: expect.objectContaining({ sound: true }) }),
    )
  })

  test('content sound false is passed through (silent on iOS)', async () => {
    const { scheduleNotification } = loadHelpers()

    await scheduleNotification(
      { ...NOTIFICATION_CONTENT, sound: false },
      NOTIFICATION_ID,
      NOTIFICATION_GROUP,
    )

    expect(mockScheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({ content: expect.objectContaining({ sound: false }) }),
    )
  })
})
