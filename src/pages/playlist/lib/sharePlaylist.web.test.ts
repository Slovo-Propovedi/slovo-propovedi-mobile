import { sharePlaylist } from './sharePlaylist.web'

const SHARE_TEXT = 'Плейлист — ссылка'
const SHARE_URL = 'https://example.test/listen/playlist?playlist=pl-1'
const PENDING_STALE_MS = 30_000

const defineNavigatorValue = (key: 'clipboard' | 'share', value: unknown) => {
  Object.defineProperty(navigator, key, { configurable: true, value })
}

const makeClipboard = () => ({ writeText: jest.fn().mockResolvedValue(undefined) })

const makeDomException = (name: string, message: string) => new DOMException(message, name)

const makeCancelledError = () => makeDomException('AbortError', 'Share cancelled')

describe('sharePlaylist (web)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    defineNavigatorValue('share', undefined)
    defineNavigatorValue('clipboard', undefined)
  })

  afterEach(() => {
    jest.restoreAllMocks()
    jest.useRealTimers()
  })

  test('returns "shared" and forwards text/url to navigator.share when available', async () => {
    const share = jest.fn().mockResolvedValue(undefined)
    defineNavigatorValue('share', share)

    const result = await sharePlaylist({ text: SHARE_TEXT, url: SHARE_URL })

    expect(result).toBe('shared')
    expect(share).toHaveBeenCalledWith({ text: SHARE_TEXT, url: SHARE_URL })
  })

  test('maps a "Share cancelled" AbortError to "dismissed" without using the clipboard', async () => {
    const clipboard = makeClipboard()
    defineNavigatorValue('clipboard', clipboard)
    defineNavigatorValue('share', jest.fn().mockRejectedValue(makeCancelledError()))

    const result = await sharePlaylist({ text: SHARE_TEXT, url: SHARE_URL })

    expect(result).toBe('dismissed')
    expect(clipboard.writeText).not.toHaveBeenCalled()
  })

  test('maps an AbortError with an unknown message to "dismissed" (WebKit cancellation)', async () => {
    const clipboard = makeClipboard()
    defineNavigatorValue('clipboard', clipboard)
    defineNavigatorValue(
      'share',
      jest.fn().mockRejectedValue(makeDomException('AbortError', 'The user aborted a request')),
    )

    const result = await sharePlaylist({ text: SHARE_TEXT, url: SHARE_URL })

    expect(result).toBe('dismissed')
    expect(clipboard.writeText).not.toHaveBeenCalled()
  })

  test('maps an AbortError with an empty message to "dismissed"', async () => {
    const clipboard = makeClipboard()
    defineNavigatorValue('clipboard', clipboard)
    defineNavigatorValue('share', jest.fn().mockRejectedValue(makeDomException('AbortError', '')))

    const result = await sharePlaylist({ text: SHARE_TEXT, url: SHARE_URL })

    expect(result).toBe('dismissed')
    expect(clipboard.writeText).not.toHaveBeenCalled()
  })

  test('returns "error" without a clipboard fallback on a Chromium internal AbortError', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {})
    const clipboard = makeClipboard()
    defineNavigatorValue('clipboard', clipboard)
    defineNavigatorValue(
      'share',
      jest.fn().mockRejectedValue(makeDomException('AbortError', 'Share failed')),
    )

    const result = await sharePlaylist({ text: SHARE_TEXT, url: SHARE_URL })

    expect(result).toBe('error')
    expect(clipboard.writeText).not.toHaveBeenCalled()
  })

  test('returns "error" on a Chromium "Permission denied" AbortError', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {})
    const clipboard = makeClipboard()
    defineNavigatorValue('clipboard', clipboard)
    defineNavigatorValue(
      'share',
      jest.fn().mockRejectedValue(makeDomException('AbortError', 'Permission denied')),
    )

    const result = await sharePlaylist({ text: SHARE_TEXT, url: SHARE_URL })

    expect(result).toBe('error')
    expect(clipboard.writeText).not.toHaveBeenCalled()
  })

  test('returns "error" without a clipboard fallback on InvalidStateError (concurrent share)', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})
    const clipboard = makeClipboard()
    defineNavigatorValue('clipboard', clipboard)
    defineNavigatorValue(
      'share',
      jest
        .fn()
        .mockRejectedValue(
          makeDomException('InvalidStateError', 'An earlier share has not yet completed'),
        ),
    )

    const result = await sharePlaylist({ text: SHARE_TEXT, url: SHARE_URL })

    expect(result).toBe('error')
    expect(clipboard.writeText).not.toHaveBeenCalled()
    expect(warn).toHaveBeenCalled()
  })

  test('falls back to copying the url when navigator.share is unavailable', async () => {
    const clipboard = makeClipboard()
    defineNavigatorValue('clipboard', clipboard)

    const result = await sharePlaylist({ text: SHARE_TEXT, url: SHARE_URL })

    expect(result).toBe('copied')
    expect(clipboard.writeText).toHaveBeenCalledWith(SHARE_URL)
  })

  test('returns "error" when the clipboard fallback itself fails', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {})
    defineNavigatorValue('clipboard', {
      writeText: jest.fn().mockRejectedValue(new Error('denied')),
    })

    const result = await sharePlaylist({ text: SHARE_TEXT, url: SHARE_URL })

    expect(result).toBe('error')
  })

  test('serializes share attempts: while one is pending a second call returns "dismissed"', async () => {
    let resolveFirstShare: () => void = () => {}
    const share = jest.fn(
      () =>
        new Promise<void>(resolve => {
          resolveFirstShare = resolve
        }),
    )
    defineNavigatorValue('share', share)

    const firstAttempt = sharePlaylist({ text: SHARE_TEXT, url: SHARE_URL })
    const secondResult = await sharePlaylist({ text: SHARE_TEXT, url: SHARE_URL })

    expect(secondResult).toBe('dismissed')
    expect(share).toHaveBeenCalledTimes(1)

    resolveFirstShare()
    await expect(firstAttempt).resolves.toBe('shared')
  })

  test('retries after the pending guard goes stale (never-settling share promise)', async () => {
    jest.useFakeTimers()
    const resolvers: Array<() => void> = []
    const share = jest.fn(
      () =>
        new Promise<void>(resolve => {
          resolvers.push(resolve)
        }),
    )
    defineNavigatorValue('share', share)

    const firstAttempt = sharePlaylist({ text: SHARE_TEXT, url: SHARE_URL })

    await jest.advanceTimersByTimeAsync(PENDING_STALE_MS)

    const retryAttempt = sharePlaylist({ text: SHARE_TEXT, url: SHARE_URL })

    expect(share).toHaveBeenCalledTimes(2)

    resolvers[1]()
    await expect(retryAttempt).resolves.toBe('shared')

    resolvers[0]()
    await expect(firstAttempt).resolves.toBe('shared')
  })
})
