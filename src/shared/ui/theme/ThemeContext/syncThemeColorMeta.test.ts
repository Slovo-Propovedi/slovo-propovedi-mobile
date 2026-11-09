import { syncThemeColorMeta } from './syncThemeColorMeta'

interface FakeMeta {
  setAttribute: jest.Mock
}

// jest-expo runs in a node environment: stub the single DOM API the helper
// touches and restore the previous global afterwards so the stub cannot leak.
const installFakeDocument = (documentStub: object) => {
  const descriptor = Object.getOwnPropertyDescriptor(global, 'document')
  Object.defineProperty(global, 'document', {
    configurable: true,
    value: documentStub,
    writable: true,
  })

  return () =>
    descriptor
      ? Object.defineProperty(global, 'document', descriptor)
      : Reflect.deleteProperty(global, 'document')
}

describe('syncThemeColorMeta', () => {
  test('paints every theme-color meta with the theme background', () => {
    const metas: FakeMeta[] = [{ setAttribute: jest.fn() }, { setAttribute: jest.fn() }]
    const querySelectorAll = jest.fn(() => metas)
    const restore = installFakeDocument({ querySelectorAll })

    try {
      syncThemeColorMeta('#000')

      expect(querySelectorAll).toHaveBeenCalledWith('meta[name="theme-color"]')
      metas.forEach(meta => expect(meta.setAttribute).toHaveBeenCalledWith('content', '#000'))
    } finally {
      restore()
    }
  })

  test('does nothing when the DOM query API is unavailable', () => {
    const restore = installFakeDocument({})

    try {
      expect(() => syncThemeColorMeta('#000')).not.toThrow()
    } finally {
      restore()
    }
  })

  test('does nothing when document is entirely undefined', () => {
    const descriptor = Object.getOwnPropertyDescriptor(global, 'document')
    Reflect.deleteProperty(global, 'document')

    try {
      expect(() => syncThemeColorMeta('#000')).not.toThrow()
    } finally {
      if (descriptor) Object.defineProperty(global, 'document', descriptor)
    }
  })
})
