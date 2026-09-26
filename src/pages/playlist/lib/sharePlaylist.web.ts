import { type SharePlaylistInput, type ShareResult } from './sharePlaylist'

export { type SharePlaylistInput, type ShareResult } from './sharePlaylist'

// Chromium maps both a genuine user dismissal ("Share cancelled") and internal
// share failures ("Share failed", "Permission denied") to AbortError; WebKit
// rejects a dismissal with AbortError and a varying or empty message. So every
// AbortError means "the user closed the sheet" except these two known Chromium
// internal-failure messages.
const CHROMIUM_INTERNAL_ABORT_MESSAGES = ['Share failed', 'Permission denied']

// Serializes share attempts for the page lifetime. On Android (notably Firefox)
// the previous navigator.share promise can stay pending for a long time, and a
// concurrent call throws InvalidStateError — later taps become no-ops instead
// of silently copying to the clipboard. The guard is time-boxed because that
// promise can also never settle (Firefox Android), which would otherwise wedge
// sharing for the whole page session.
const PENDING_STALE_MS = 30_000

let isSharePending = false
let pendingSince = 0

interface NamedError {
  message?: unknown
  name?: unknown
}

const isNamedError = (error: unknown): error is NamedError =>
  typeof error === 'object' && error !== null

const describeError = (error: unknown): string =>
  isNamedError(error) ? `${String(error.name)}: ${String(error.message)}` : String(error)

const isChromiumInternalAbort = (error: DOMException): boolean =>
  CHROMIUM_INTERNAL_ABORT_MESSAGES.some(message => message === error.message)

const isUserCancellation = (error: unknown): boolean =>
  error instanceof DOMException && error.name === 'AbortError' && !isChromiumInternalAbort(error)

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
  const isPendingFresh = isSharePending && Date.now() - pendingSince < PENDING_STALE_MS
  if (isPendingFresh) return 'dismissed'

  if (typeof navigator.share !== 'function') return copyUrlToClipboard(input.url)

  isSharePending = true
  pendingSince = Date.now()
  try {
    return await shareViaWebShareApi(input)
  } finally {
    isSharePending = false
    pendingSince = 0
  }
}
