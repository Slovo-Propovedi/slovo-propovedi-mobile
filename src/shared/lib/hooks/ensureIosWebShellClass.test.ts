import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Platform } from 'react-native'
import { ensureIosWebShellClass } from './ensureIosWebShellClass'

const IOS_IPHONE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)'
const DESKTOP_UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'

const SHELL_SOURCE = readFileSync(join(__dirname, 'ensureIosWebShellClass.ts'), 'utf8')
const WEB_SHELL = readFileSync(join(__dirname, '../../../../public/index.html'), 'utf8')
const IOS_WEB_CLASS = 'ios-web'

const ORIGINAL_PLATFORM = Platform.OS
const originalNavigator = globalThis.navigator
const originalDocument = Object.getOwnPropertyDescriptor(global, 'document')

const setNavigator = (userAgent: string, platform: string, maxTouchPoints = 0) => {
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: { maxTouchPoints, platform, userAgent },
  })
}

// Mirrors DOM classList semantics over a real class string (not a Set), so the
// assertions read the resulting className: a duplicated token would surface here
// instead of being swallowed by Set's structural identity.
const installFakeDocument = () => {
  const element = { className: '' }
  const classList = {
    add: (name: string) => {
      const classes = element.className.split(' ').filter(Boolean)
      if (!classes.includes(name)) classes.push(name)
      element.className = classes.join(' ')
    },
  }

  Object.assign(element, { classList })
  Object.defineProperty(global, 'document', {
    configurable: true,
    value: { documentElement: element },
    writable: true,
  })

  return element
}

let fakeElement: { className: string }

beforeEach(() => {
  fakeElement = installFakeDocument()
})

afterEach(() => {
  Platform.OS = ORIGINAL_PLATFORM
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: originalNavigator,
  })
  if (originalDocument) Object.defineProperty(global, 'document', originalDocument)
  else Reflect.deleteProperty(global, 'document')
})

describe('ensureIosWebShellClass', () => {
  test('web + iPhone UA adds the ios-web class to <html>', () => {
    Platform.OS = 'web'
    setNavigator(IOS_IPHONE_UA, 'iPhone')

    ensureIosWebShellClass()

    expect(fakeElement.className).toBe(IOS_WEB_CLASS)
  })

  test('web + desktop UA does not add the class', () => {
    Platform.OS = 'web'
    setNavigator(DESKTOP_UA, 'Linux x86_64')

    ensureIosWebShellClass()

    expect(fakeElement.className).toBe('')
  })

  test('native is a no-op even with an iPhone UA', () => {
    Platform.OS = 'android'
    setNavigator(IOS_IPHONE_UA, 'iPhone')

    ensureIosWebShellClass()

    expect(fakeElement.className).toBe('')
  })

  test('is idempotent: a second call does not duplicate the class', () => {
    Platform.OS = 'web'
    setNavigator(IOS_IPHONE_UA, 'iPhone')

    ensureIosWebShellClass()
    ensureIosWebShellClass()

    expect(fakeElement.className).toBe(IOS_WEB_CLASS)
  })

  test('does nothing when documentElement is unavailable', () => {
    Platform.OS = 'web'
    setNavigator(IOS_IPHONE_UA, 'iPhone')
    Object.defineProperty(global, 'document', { configurable: true, value: {}, writable: true })

    expect(() => ensureIosWebShellClass()).not.toThrow()
  })
})

describe('ios-web shell class contract', () => {
  test('the class the app sets is the one the shell sizes with 100lvh', () => {
    const shellClass = SHELL_SOURCE.match(/IOS_WEB_SHELL_CLASS = '([^']+)'/)?.[1]

    expect(shellClass).toBe(IOS_WEB_CLASS)
    expect(WEB_SHELL).toContain(`html.${shellClass},`)
    expect(WEB_SHELL).toContain('height: 100lvh')
  })
})
