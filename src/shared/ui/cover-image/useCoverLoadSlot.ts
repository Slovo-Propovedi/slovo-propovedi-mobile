import { useCallback, useEffect, useRef, useState } from 'react'
import { createSlotQueue } from '../../lib/concurrency/createSlotQueue'

// Covers are large originals (often 1–1.7 MB): loading all of them at once
// starves API requests and the device. At most this many covers load (from the
// network or the disk cache) at the same time; the rest wait their turn.
const MAX_CONCURRENT_COVERS = 5
// A load that never reports back (no onLoad/onError) must not hold its slot
// forever, or the queue would stall.
const SLOT_TIMEOUT_MS = 15_000

const coverQueue = createSlotQueue(MAX_CONCURRENT_COVERS)

/**
 * Waits for a cover-loading slot while `enabled`. Returns whether the image may
 * render and `release` to call from `onLoad`/`onError`. The slot is also freed
 * on unmount, when `uri` changes and after a timeout.
 * @param enabled - Whether the cover wants to load (e.g. It is near the viewport).
 * @param uri - Image uri; a new uri waits for a new slot.
 */
export const useCoverLoadSlot = (enabled: boolean, uri: string) => {
  const [grantedUri, setGrantedUri] = useState<null | string>(null)
  const releaseRef = useRef<() => void>(() => {})

  useEffect(() => {
    if (!enabled) return

    let timeoutId: ReturnType<typeof setTimeout> | undefined
    // `request` may grant synchronously, before it returns the release function.
    let releaseSlot = () => {}
    releaseSlot = coverQueue.request(() => {
      setGrantedUri(uri)
      timeoutId = setTimeout(() => releaseSlot(), SLOT_TIMEOUT_MS)
    })
    releaseRef.current = () => {
      clearTimeout(timeoutId)
      releaseSlot()
    }

    return releaseRef.current
  }, [enabled, uri])

  const release = useCallback(() => releaseRef.current(), [])

  return { isGranted: grantedUri === uri, release }
}
