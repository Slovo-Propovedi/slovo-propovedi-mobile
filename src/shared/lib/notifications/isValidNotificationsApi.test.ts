import {
  getMissingNotificationsApiMethods,
  isValidNotificationsApi,
} from './isValidNotificationsApi'

const VALID_MODULE = {
  addNotificationResponseReceivedListener: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  setNotificationCategoryAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  setNotificationHandler: jest.fn(),
}

const INCOMPLETE_MODULE = {
  addNotificationResponseReceivedListener: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  setNotificationCategoryAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
}

describe('isValidNotificationsApi', () => {
  test('accepts a module with all required methods', () => {
    expect(isValidNotificationsApi(VALID_MODULE)).toBe(true)
  })

  test('rejects null and non-objects', () => {
    expect(isValidNotificationsApi(null)).toBe(false)
    expect(isValidNotificationsApi(undefined)).toBe(false)
    expect(isValidNotificationsApi('not-a-module')).toBe(false)
  })

  test('rejects a module missing a method', () => {
    expect(isValidNotificationsApi(INCOMPLETE_MODULE)).toBe(false)
  })

  test('rejects a module where a method is not a function', () => {
    expect(
      isValidNotificationsApi({ ...VALID_MODULE, scheduleNotificationAsync: 'not-a-function' }),
    ).toBe(false)
  })
})

describe('getMissingNotificationsApiMethods', () => {
  test('returns an empty list for a valid module', () => {
    expect(getMissingNotificationsApiMethods(VALID_MODULE)).toEqual([])
  })

  test('names the missing method', () => {
    expect(getMissingNotificationsApiMethods(INCOMPLETE_MODULE)).toEqual(['setNotificationHandler'])
  })

  test('returns all required methods for a non-object', () => {
    expect(getMissingNotificationsApiMethods(null)).toHaveLength(7)
  })
})
