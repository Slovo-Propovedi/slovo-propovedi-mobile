import { type ReactNode, useState } from 'react'
import { Dimensions, Modal, Pressable, StyleSheet, View } from 'react-native'
import type { LayoutChangeEvent, StyleProp, ViewStyle } from 'react-native'

export interface AnchoredDropdownProps {
  anchor: AnchorRect | null
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
  children,
  gap = DEFAULT_GAP,
  menuStyle,
  onClose,
  testID,
  visible,
}: AnchoredDropdownProps) => {
  const [menuHeight, setMenuHeight] = useState(0)

  if (!visible || !anchor) return null

  const { width: windowWidth } = Dimensions.get('window')
  const isMeasured = menuHeight > 0
  const fitsAbove = anchor.y >= menuHeight + gap
  const top = fitsAbove ? anchor.y - menuHeight - gap : anchor.y + anchor.height + gap
  const right = windowWidth - anchor.x - anchor.width

  const handleLayout = (event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout
    if (height !== menuHeight) setMenuHeight(height)
  }

  return (
    <Modal transparent animationType='none' onRequestClose={onClose}>
      <Pressable onPress={onClose} style={styles.backdrop} testID={BACKDROP_TEST_ID}>
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
