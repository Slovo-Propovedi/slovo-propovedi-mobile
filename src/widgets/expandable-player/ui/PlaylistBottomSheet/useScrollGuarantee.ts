import { useCallback, useEffect, useRef, useState } from 'react'
import { useWindowDimensions } from 'react-native'
import type { LayoutChangeEvent, View } from 'react-native'
import { computeBelowScreenOffset, computeFooterHeight, MIN_GUARANTEE } from './scrollGuaranteeMath'

export const useScrollGuarantee = ({
  settleTick,
  sheetTop = 0,
}: {
  settleTick: number
  sheetTop?: number
}) => {
  const { height: windowHeight } = useWindowDimensions()
  const [footerHeight, setFooterHeight] = useState(MIN_GUARANTEE)
  const [chromeOffset, setChromeOffset] = useState<null | number>(null)
  const wrapperRef = useRef<null | View>(null)
  const frameHeightRef = useRef(0)
  const footerHeightRef = useRef(MIN_GUARANTEE)
  const rawContentHeightRef = useRef(0)
  const sheetTopRef = useRef(sheetTop)

  const recompute = useCallback(() => {
    if (frameHeightRef.current === 0) return

    const frameBottomBelowScreen = computeBelowScreenOffset(
      sheetTopRef.current,
      chromeOffset,
      frameHeightRef.current,
      windowHeight,
    )

    const next = computeFooterHeight(
      frameHeightRef.current,
      rawContentHeightRef.current,
      frameBottomBelowScreen,
    )

    if (Math.abs(next - footerHeightRef.current) > 1) {
      footerHeightRef.current = next
      setFooterHeight(next)
    }
  }, [chromeOffset, windowHeight])

  // Measure chromeOffset when the sheet settles (settleTick changes). The sheet
  // position is final only after the snap animation completes — measuring
  // mid-animation would yield a transient y. measureInWindow gives the wrapper's
  // top in screen coordinates; chromeOffset = max(0, y − sheetTop).
  // Skip settleTick=0 (mount-open): the sheet is mid-animation then, so the
  // measured y is transient. The first real settle bumps to 1.
  useEffect(() => {
    if (settleTick === 0) return
    const node = wrapperRef.current
    if (!node) return

    node.measureInWindow((_x, y) => {
      if (y <= 0) return
      setChromeOffset(Math.max(0, y - sheetTopRef.current))
    })
  }, [settleTick])

  const handleWrapperLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { height } = event.nativeEvent.layout
      frameHeightRef.current = height
      recompute()
    },
    [recompute],
  )

  const handleContentSizeChange = useCallback(
    (_width: number, height: number) => {
      if (frameHeightRef.current === 0) return

      rawContentHeightRef.current = height - footerHeightRef.current
      recompute()
    },
    [recompute],
  )

  // Recompute footer when the snap changes (sheetTop is reactive).
  useEffect(() => {
    sheetTopRef.current = sheetTop
    recompute()
  }, [sheetTop, recompute])

  // maxHeight = remaining screen height below the chrome. null when chromeOffset
  // is not yet measured → wrapper fills the mask (current behavior). After the
  // first settle (~300ms) maxHeight applies — a one-time transient.
  const maxListHeight =
    chromeOffset === null ? null : Math.max(0, windowHeight - sheetTop - chromeOffset)

  return {
    footerHeight,
    handleContentSizeChange,
    handleWrapperLayout,
    maxListHeight,
    wrapperRef,
  }
}
