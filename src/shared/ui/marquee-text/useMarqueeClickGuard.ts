import { useCallback, useEffect, useState } from 'react'
import { Platform } from 'react-native'
import type { SharedValue } from 'react-native-reanimated'
import { shouldSwallowClick } from './marquee-utils'

const isDomNode = (node: unknown): node is HTMLElement =>
  typeof node === 'object' && node !== null && 'addEventListener' in node

// Web-only: after a marquee drag the browser still dispatches a `click` on the
// gesture view, which bubbles to the parent PressableButton and would navigate.
// Native RNGH cancels the parent press on activation; this hook restores that
// behavior on web by swallowing the click that follows a pan activation. The
// decision logic lives in `shouldSwallowClick` (unit-tested); this hook is a
// thin DOM adapter.
export const useMarqueeClickGuard = (didDrag: SharedValue<boolean>) => {
  const [node, setNode] = useState<HTMLElement | null>(null)

  // Callback ref instead of a plain ref: the consumer may render nothing while
  // its text is empty (MarqueeText returns null), so the effect must re-run
  // when the view actually mounts. The node is stored in state so the effect
  // can depend on it.
  const containerRef = useCallback((instance: unknown) => {
    setNode(isDomNode(instance) ? instance : null)
  }, [])

  useEffect(() => {
    if (Platform.OS !== 'web' || !node) return
    const handleClick = (e: Event) => {
      if (shouldSwallowClick(didDrag.value)) {
        e.stopPropagation()
        didDrag.value = false
      }
    }
    node.addEventListener('click', handleClick)
    return () => node.removeEventListener('click', handleClick)
  }, [didDrag, node])

  return containerRef
}
