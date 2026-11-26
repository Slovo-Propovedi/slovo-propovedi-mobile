import { Platform } from 'react-native'
import { ensureIosWebShellClass } from './ensureIosWebShellClass'

const IOS_IPHONE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)'
const DESKTOP_UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'

const ORIGINAL_PLATFORM = Platform.OS
const originalNavigator = globalThis.navigator

const setNavigator = (userAgent: string, platform: string, maxTouchPoints = 0) => {
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: { maxTouchPoints, platform, userAgent },
  })
}

const installFakeDocument = () => {
  const classes = new Set<string>()
  const descriptor = Object.getOwnPropertyDescriptor(global, 'document')
  const documentStub = {
    documentElement: {
      classList: {
        add: (name: string) => {
          classes.add(name)
        },
      },
    },
  }

  Object.defineProperty(global, 'document', {
    configurable: true,
    value: documentStub,
    writable: true,
  })

  return {
    classes,
    restore: () => {
      if (descriptor) Object.defineProperty(global, 'document', descriptor)
      else Reflect.deleteProperty(global, 'document')
    },
  }
}

afterEach(() => {
  Platform.OS = ORIGINAL_PLATFORM
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: originalNavigator,
  })
})

describe('ensureIosWebShellClass', () => {
  test('web + iPhone UA adds the ios-web class to <html>', () => {
    Platform.OS = 'web'
    setNavigator(IOS_IPHONE_UA, 'iPhone')
    const fakeDocument = installFakeDocument()

    try {
      ensureIosWebShellClass()

      expect(fakeDocument.classes.has('ios-web')).toBe(true)
    } finally {
      fakeDocument.restore()
    }
  })

  test('web + desktop UA does not add the class', () => {
    Platform.OS = 'web'
    setNavigator(DESKTOP_UA, 'Linux x86_64')
    const fakeDocument = installFakeDocument()

    try {
      ensureIosWebShellClass()

      expect(fakeDocument.classes.has('ios-web')).toBe(false)
    } finally {
      fakeDocument.restore()
    }
  })

  test('native is a no-op even with an iPhone UA', () => {
    Platform.OS = 'android'
    setNavigator(IOS_IPHONE_UA, 'iPhone')
    const fakeDocument = installFakeDocument()

    try {
      ensureIosWebShellClass()

      expect(fakeDocument.classes.has('ios-web')).toBe(false)
    } finally {
      fakeDocument.restore()
    }
  })

  test('is idempotent: a second call does not duplicate the class', () => {
    Platform.OS = 'web'
    setNavigator(IOS_IPHONE_UA, 'iPhone')
    const fakeDocument = installFakeDocument()

    try {
      ensureIosWebShellClass()
      ensureIosWebShellClass()

      expect([...fakeDocument.classes]).toEqual(['ios-web'])
    } finally {
      fakeDocument.restore()
    }
  })

  test('does nothing when documentElement is unavailable', () => {
    Platform.OS = 'web'
    setNavigator(IOS_IPHONE_UA, 'iPhone')
    const descriptor = Object.getOwnPropertyDescriptor(global, 'document')

    Object.defineProperty(global, 'document', {
      configurable: true,
      value: {},
      writable: true,
    })

    try {
      expect(() => ensureIosWebShellClass()).not.toThrow()
    } finally {
      if (descriptor) Object.defineProperty(global, 'document', descriptor)
      else Reflect.deleteProperty(global, 'document')
    }
  })
})
