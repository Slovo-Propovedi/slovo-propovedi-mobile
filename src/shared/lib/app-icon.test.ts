const APP_ICON_MODULE = './app-icon'
const FILE_URI = 'file:///cache/icon.png'
const PROTOCOL_LESS_URI = 'assets_fallbackartwork'

interface AppIconModule {
  APP_ICON_URI: string
  getLocalAppIconUri: () => null | string
  hasUriProtocol: (value: null | string | undefined) => value is string
}

const mockAssetState = {
  localUri: null as null | string,
  uri: PROTOCOL_LESS_URI,
}

jest.mock('expo-asset', () => ({
  Asset: {
    fromModule: jest.fn(() => ({
      downloadAsync: jest.fn().mockResolvedValue({ localUri: mockAssetState.localUri }),
      uri: mockAssetState.uri,
    })),
  },
}))

describe('app-icon', () => {
  beforeEach(() => {
    jest.resetModules()
  })

  test('hasUriProtocol accepts valid URI protocols', () => {
    const { hasUriProtocol } = jest.requireActual<AppIconModule>(APP_ICON_MODULE)

    expect(hasUriProtocol('https://example.com/cover.jpg')).toBe(true)
    expect(hasUriProtocol('http://example.com/cover.jpg')).toBe(true)
    expect(hasUriProtocol(FILE_URI)).toBe(true)
    expect(hasUriProtocol('asset:///icon.png')).toBe(true)
    expect(hasUriProtocol('content://media/icon.png')).toBe(true)
  })

  test('hasUriProtocol rejects protocol-less values', () => {
    const { hasUriProtocol } = jest.requireActual<AppIconModule>(APP_ICON_MODULE)

    expect(hasUriProtocol(PROTOCOL_LESS_URI)).toBe(false)
    expect(hasUriProtocol('')).toBe(false)
    expect(hasUriProtocol(null)).toBe(false)
    expect(hasUriProtocol(undefined)).toBe(false)
  })

  test('keeps the local icon null when downloadAsync returns a protocol-less localUri', async () => {
    mockAssetState.localUri = PROTOCOL_LESS_URI

    const module = jest.requireActual<AppIconModule>(APP_ICON_MODULE)

    await Promise.resolve()

    expect(module.getLocalAppIconUri()).toBeNull()
    expect(module.APP_ICON_URI).toBe(PROTOCOL_LESS_URI)
  })

  test('returns the local icon when downloadAsync returns a file:// localUri', async () => {
    mockAssetState.localUri = FILE_URI

    const module = jest.requireActual<AppIconModule>(APP_ICON_MODULE)

    await Promise.resolve()

    expect(module.getLocalAppIconUri()).toBe(FILE_URI)
    expect(module.APP_ICON_URI).toBe(FILE_URI)
  })
})
