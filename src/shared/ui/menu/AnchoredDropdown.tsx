import { type ReactNode, type RefObject, useEffect, useState } from 'react'
import { Modal, Platform, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native'
import { useEscapeKey } from 'shared/lib/escape-key'
import { hapticLight } from 'shared/lib/haptics'
import type { LayoutChangeEvent, StyleProp, ViewStyle } from 'react-native'
import { computeMenuPosition } from './computeMenuPosition'

export interface AnchoredDropdownProps {
  anchor: AnchorRect | null
  anchorRef?: RefObject<null | View>
  children: ReactNode
  gap?: number
  menuStyle?: StyleProp<ViewStyle>
  onClose: () => void
  testID?: string
  visible: boolean
}

export interface AnchorRect {
  height: number
  width: number
  x: number
  y: number
}

const DEFAULT_GAP = 4
const BACKDROP_TEST_ID = 'anchored-dropdown-backdrop'

export const AnchoredDropdown = ({
  anchor,
  anchorRef,
  children,
  gap = DEFAULT_GAP,
  menuStyle,
  onClose,
  testID,
  visible,
}: AnchoredDropdownProps) => {
  const [menuSize, setMenuSize] = useState({ height: 0, width: 0 })
  const [anchorRect, setAnchorRect] = useState<AnchorRect | null>(anchor)
  const [prevAnchor, setPrevAnchor] = useState<AnchorRect | null>(anchor)
  const { height: windowHeight, width: windowWidth } = useWindowDimensions()

  // Adjust state during render (React-documented pattern): when the parent
  // re-measures the button (menu re-opened at a new position), adopt the fresh
  // rect immediately instead of syncing it in an effect.
  if (anchor !== prevAnchor) {
    setPrevAnchor(anchor)
    setAnchorRect(anchor)
  }

  useEscapeKey({
    enabled: Platform.OS === 'web' && visible,
    onEscape: onClose,
  })

  // The parent measures the trigger button once at open; on window resize the
  // button may move, so re-measure it while the menu is open to keep the menu
  // anchored to the button. The clamps in computeMenuPosition still guarantee
  // the menu never leaves the viewport.
  useEffect(() => {
    if (!visible || !anchorRef?.current) return
    anchorRef.current.measureInWindow((x: number, y: number, width: number, height: number) => {
      setAnchorRect({ height, width, x, y })
    })
  }, [anchorRef, visible, windowHeight, windowWidth])

  if (!visible || !anchorRect) return null

  const isMeasured = menuSize.height > 0
  const { right, top } = computeMenuPosition(
    anchorRect,
    menuSize,
    { height: windowHeight, width: windowWidth },
    gap,
  )

  const handleLayout = (event: LayoutChangeEvent) => {
    const { height, width } = event.nativeEvent.layout
    if (height !== menuSize.height || width !== menuSize.width) setMenuSize({ height, width })
  }

  return (
    <Modal transparent animationType='none' onRequestClose={onClose}>
      <Pressable
        tabIndex={-1}
        onPress={onClose}
        onPressIn={hapticLight}
        style={styles.backdrop}
        testID={BACKDROP_TEST_ID}
      >
        <View
          testID={testID}
          onLayout={handleLayout}
          style={[
            menuStyle,
            {
              opacity: isMeasured ? 1 : 0,
              pointerEvents: isMeasured ? 'auto' : 'none',
              position: 'absolute',
              right,
              top,
            },
          ]}
        >
          {children}
        </View>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: { flex: 1 },
})
