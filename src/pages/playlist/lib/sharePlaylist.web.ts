import { type SharePlaylistInput, type ShareResult } from './sharePlaylist'

export { type SharePlaylistInput, type ShareResult } from './sharePlaylist'

// Chromium maps a genuine user dismissal to an AbortError with this exact
// message; internal share failures reuse AbortError with a different message
// ("Share failed"), so only this message means "the user closed the sheet".
const CANCELLED_SHARE_MESSAGE = 'Share cancelled'

// Serializes share attempts for the page lifetime. On Android (notably Firefox)
// the previous navigator.share promise can stay pending for a long time, and a
// concurrent call throws InvalidStateError — later taps become no-ops instead
// of silently copying to the clipboard.
let isSharePending = false

interface NamedError {
  message?: unknown
  name?: unknown
}

const isNamedError = (error: unknown): error is NamedError =>
  typeof error === 'object' && error !== null

const describeError = (error: unknown): string =>
  isNamedError(error) ? `${String(error.name)}: ${String(error.message)}` : String(error)

const isUserCancellation = (error: unknown): boolean =>
  error instanceof DOMException &&
  error.name === 'AbortError' &&
  error.message === CANCELLED_SHARE_MESSAGE

const copyUrlToClipboard = async (url: string): Promise<ShareResult> => {
  try {
    await navigator.clipboard.writeText(url)
    return 'copied'
  } catch (error) {
    console.warn('sharePlaylist clipboard fallback failed:', describeError(error))
    return 'error'
  }
}

const shareViaWebShareApi = async ({ text, url }: SharePlaylistInput): Promise<ShareResult> => {
  try {
    await navigator.share({ text, url })
    return 'shared'
  } catch (error) {
    if (isUserCancellation(error)) return 'dismissed'

    console.warn('sharePlaylist share failed:', describeError(error))
    return 'error'
  }
}

export const sharePlaylist = async (input: SharePlaylistInput): Promise<ShareResult> => {
  if (isSharePending) return 'dismissed'

  if (typeof navigator.share !== 'function') return copyUrlToClipboard(input.url)

  isSharePending = true
  try {
    return await shareViaWebShareApi(input)
  } finally {
    isSharePending = false
  }
}
