import { getMenuViewport } from './menuViewport'

const WEBKIT_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
const CHROME_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

const GLOBAL_KEYS = ['document', 'navigator', 'window'] as const

type GlobalKey = (typeof GLOBAL_KEYS)[number]

const setGlobal = (key: GlobalKey, value: unknown) => {
  Object.defineProperty(global, key, { configurable: true, value, writable: true })
}

const setDocument = (width: number, height: number) => {
  setGlobal('document', { documentElement: { clientHeight: height, clientWidth: width } })
}

const setUserAgent = (userAgent: string) => setGlobal('navigator', { userAgent })

const setVisualViewport = (offsetLeft: number, offsetTop: number) => {
  setGlobal('window', { visualViewport: { offsetLeft, offsetTop } })
}

describe('getMenuViewport', () => {
  const originalDescriptors = new Map<GlobalKey, PropertyDescriptor | undefined>(
    GLOBAL_KEYS.map(key => [key, Object.getOwnPropertyDescriptor(global, key)]),
  )

  afterEach(() => {
    originalDescriptors.forEach((descriptor, key) => {
      if (descriptor) {
        Object.defineProperty(global, key, descriptor)
        return
      }
      Reflect.deleteProperty(global, key)
    })
  })

  test('returns zeros when there is no window', () => {
    Reflect.deleteProperty(global, 'window')

    expect(getMenuViewport()).toEqual({ dx: 0, dy: 0, height: 0, width: 0 })
  })

  test('keeps visual offsets zero and reports the layout viewport on non-WebKit', () => {
    setDocument(800, 600)
    setUserAgent(CHROME_UA)
    setVisualViewport(12, 34)

    expect(getMenuViewport()).toEqual({ dx: 0, dy: 0, height: 600, width: 800 })
  })

  test('applies visual offsets and reports the layout viewport on WebKit', () => {
    setDocument(390, 844)
    setUserAgent(WEBKIT_UA)
    setVisualViewport(12, 34)

    expect(getMenuViewport()).toEqual({ dx: 12, dy: 34, height: 844, width: 390 })
  })

  test('keeps visual offsets zero on WebKit without a visual viewport', () => {
    setDocument(390, 844)
    setUserAgent(WEBKIT_UA)
    setGlobal('window', { visualViewport: null })

    expect(getMenuViewport()).toEqual({ dx: 0, dy: 0, height: 844, width: 390 })
  })
})
