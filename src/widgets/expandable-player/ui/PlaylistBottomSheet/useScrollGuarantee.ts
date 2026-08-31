import { useEffect, useRef, useState } from 'react'
import type { LayoutChangeEvent } from 'react-native'

// One row minimum guarantee: row ≈ albumArt(50) + paddingVertical(12×2) + 10 ≈ 84.
const MIN_GUARANTEE = 84

// Dynamic scroll guarantee for the queue sheet (issue #69).
//
// Root cause: the sheet's FlatList viewport is sized by the MAX-snap content
// mask (~757px). For short playlists content ≤ viewport ⇒ Android ScrollView
// physically cannot start a drag ⇒ zero scroll events ⇒ touches fall through
// to row Pressables ⇒ fast flicks fire onPress on release (often the current
// track's row, auto-scrolled to top) ⇒ handlePressItem closes the sheet.
//
// 70%-snap clipping: at the 70% snap the sheet clips 0.3·window − topInset
// pixels from the bottom of the list frame. The footer compensates by growing
// an additional hiddenBelowSheetEdge so the last row scrolls above the edge.
//
// Fix: a footer spacer BELOW all rows that grows until content exceeds the
// frame by ≥ one row, so the ScrollView can always start a drag. The raw
// content height (h - footer) is invariant under footer changes, so the
// computation converges to a fixed point — no oscillation.
export const useScrollGuarantee = ({
  hiddenBelowSheetEdge = 0,
}: { hiddenBelowSheetEdge?: number } = {}) => {
  const [footerHeight, setFooterHeight] = useState(MIN_GUARANTEE)
  const frameHeightRef = useRef(0)
  const footerHeightRef = useRef(MIN_GUARANTEE)
  const rawContentHeightRef = useRef(0)

  const recompute = (hidden: number) => {
    if (frameHeightRef.current === 0) return

    const raw = rawContentHeightRef.current
    const needed = frameHeightRef.current - raw + MIN_GUARANTEE + hidden
    const next = Math.max(MIN_GUARANTEE, Math.ceil(needed))

    if (Math.abs(next - footerHeightRef.current) > 1) {
      footerHeightRef.current = next
      setFooterHeight(next)
    }
  }

  const handleListLayout = (event: LayoutChangeEvent) => {
    frameHeightRef.current = event.nativeEvent.layout.height
  }

  const handleContentSizeChange = (_width: number, height: number) => {
    // Layout not yet measured — nothing to size against yet.
    if (frameHeightRef.current === 0) return

    rawContentHeightRef.current = height - footerHeightRef.current
    recompute(hiddenBelowSheetEdge)
  }

  // Recompute footer when the snap changes (e.g., 70% ↔ full).
  useEffect(() => {
    recompute(hiddenBelowSheetEdge)
  }, [hiddenBelowSheetEdge])

  return { footerHeight, handleContentSizeChange, handleListLayout }
}
