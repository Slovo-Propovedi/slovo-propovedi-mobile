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
})
