import { sharePlaylist } from './sharePlaylist.web'

const SHARE_TEXT = 'Плейлист — ссылка'
const SHARE_URL = 'https://example.test/listen/playlist?playlist=pl-1'

const defineNavigatorValue = (key: 'clipboard' | 'share', value: unknown) => {
  Object.defineProperty(navigator, key, { configurable: true, value })
}

const makeClipboard = () => ({ writeText: jest.fn().mockResolvedValue(undefined) })

const makeAbortError = () => new DOMException('Aborted', 'AbortError')

describe('sharePlaylist (web)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    defineNavigatorValue('share', undefined)
    defineNavigatorValue('clipboard', undefined)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('returns "shared" and forwards text/url to navigator.share when available', async () => {
    const share = jest.fn().mockResolvedValue(undefined)
    defineNavigatorValue('share', share)

    const result = await sharePlaylist({ text: SHARE_TEXT, url: SHARE_URL })

    expect(result).toBe('shared')
    expect(share).toHaveBeenCalledWith({ text: SHARE_TEXT, url: SHARE_URL })
  })

  test('maps an AbortError from navigator.share to "dismissed" without using the clipboard', async () => {
    const clipboard = makeClipboard()
    defineNavigatorValue('clipboard', clipboard)
    defineNavigatorValue('share', jest.fn().mockRejectedValue(makeAbortError()))

    const result = await sharePlaylist({ text: SHARE_TEXT, url: SHARE_URL })

    expect(result).toBe('dismissed')
    expect(clipboard.writeText).not.toHaveBeenCalled()
  })

  test('falls back to copying the url when navigator.share is unavailable', async () => {
    const clipboard = makeClipboard()
    defineNavigatorValue('clipboard', clipboard)

    const result = await sharePlaylist({ text: SHARE_TEXT, url: SHARE_URL })

    expect(result).toBe('copied')
    expect(clipboard.writeText).toHaveBeenCalledWith(SHARE_URL)
  })

  test('falls back to the clipboard when navigator.share rejects with a non-abort error', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {})
    const clipboard = makeClipboard()
    defineNavigatorValue('clipboard', clipboard)
    defineNavigatorValue('share', jest.fn().mockRejectedValue(new Error('share failed')))

    const result = await sharePlaylist({ text: SHARE_TEXT, url: SHARE_URL })

    expect(result).toBe('copied')
    expect(clipboard.writeText).toHaveBeenCalledWith(SHARE_URL)
  })

  test('returns "error" when both navigator.share and the clipboard fail', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {})
    defineNavigatorValue('share', jest.fn().mockRejectedValue(new Error('share failed')))
    defineNavigatorValue('clipboard', {
      writeText: jest.fn().mockRejectedValue(new Error('denied')),
    })

    const result = await sharePlaylist({ text: SHARE_TEXT, url: SHARE_URL })

    expect(result).toBe('error')
  })
})
