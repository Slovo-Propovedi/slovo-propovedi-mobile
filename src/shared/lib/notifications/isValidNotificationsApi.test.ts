import {
  getMissingNotificationsApiMethods,
  isValidNotificationsApi,
} from './isValidNotificationsApi'

const REQUIRED_METHODS = [
  'addNotificationResponseReceivedListener',
  'cancelScheduledNotificationAsync',
  'requestPermissionsAsync',
  'scheduleNotificationAsync',
  'setNotificationCategoryAsync',
  'setNotificationChannelAsync',
  'setNotificationHandler',
] as const

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

/** Mirrors Metro's dev-mode ESM transform: every export is an own getter. */
const createGetterModule = (): Record<string, unknown> => {
  const mod: Record<string, unknown> = {}

  for (const method of REQUIRED_METHODS)
    Object.defineProperty(mod, method, {
      configurable: true,
      enumerable: true,
      get: () => jest.fn(),
    })

  return mod
}

const GETTER_MODULE = createGetterModule()

/** Methods live on the prototype, not as own properties (class-instance shape). */
const PROTOTYPE_MODULE: Record<string, unknown> = Object.create({
  addNotificationResponseReceivedListener: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  setNotificationCategoryAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  setNotificationHandler: jest.fn(),
})

describe('isValidNotificationsApi', () => {
  test('accepts a module with all required methods', () => {
    expect(isValidNotificationsApi(VALID_MODULE)).toBe(true)
  })

  test('accepts a module whose methods are own getters', () => {
    expect(isValidNotificationsApi(GETTER_MODULE)).toBe(true)
  })

  test('accepts a module whose methods live on the prototype', () => {
    expect(isValidNotificationsApi(PROTOTYPE_MODULE)).toBe(true)
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

  test('rejects a module where a getter returns a non-function', () => {
    const mod = createGetterModule()
    Object.defineProperty(mod, 'scheduleNotificationAsync', {
      enumerable: true,
      get: () => 'not-a-function',
    })

    expect(isValidNotificationsApi(mod)).toBe(false)
  })
})

describe('getMissingNotificationsApiMethods', () => {
  test('returns an empty list for a valid module', () => {
    expect(getMissingNotificationsApiMethods(VALID_MODULE)).toEqual([])
  })

  test('returns an empty list for a module with getter methods', () => {
    expect(getMissingNotificationsApiMethods(GETTER_MODULE)).toEqual([])
  })

  test('returns an empty list for a module with prototype methods', () => {
    expect(getMissingNotificationsApiMethods(PROTOTYPE_MODULE)).toEqual([])
  })

  test('names the missing method', () => {
    expect(getMissingNotificationsApiMethods(INCOMPLETE_MODULE)).toEqual(['setNotificationHandler'])
  })

  test('returns all required methods for a non-object', () => {
    expect(getMissingNotificationsApiMethods(null)).toHaveLength(7)
  })
})
