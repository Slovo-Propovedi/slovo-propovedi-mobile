import { useEffect, useRef } from 'react'
import { Platform, Pressable, Modal as RNModal, StyleSheet, View } from 'react-native'
import { useTheme } from './theme/ThemeContext/useTheme'
import { INDENTS } from './theme/themed'

const BACKDROP_TEST_ID = 'modal-backdrop'
const ESCAPE_KEY = 'Escape'

type Props = React.PropsWithChildren<{
  onBackdropPress: () => void
  visible: boolean
}>

export const Modal = ({ children, onBackdropPress, visible }: Props) => {
  const { currentTheme } = useTheme()
  const onBackdropPressRef = useRef(onBackdropPress)

  useEffect(() => {
    onBackdropPressRef.current = onBackdropPress
  })

  useEffect(() => {
    if (Platform.OS !== 'web' || !visible) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== ESCAPE_KEY) return
      if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return
      // The fullscreen player already listens for Escape on window (bubble
      // phase) to collapse itself. A modal on top must win: document capture
      // runs before window bubble listeners, and stopPropagation keeps the
      // event from ever reaching the player's handler.
      event.stopPropagation()
      onBackdropPressRef.current()
    }

    document.addEventListener('keydown', handleKeyDown, { capture: true })

    return () => {
      document.removeEventListener('keydown', handleKeyDown, { capture: true })
    }
  }, [visible])

  return (
    <RNModal transparent visible={visible} animationType='fade' statusBarTranslucent>
      <View style={[styles.backdrop, { backgroundColor: currentTheme.backdrop }]}>
        {/* Backdrop is deliberately a role-less Pressable: it is not a button, and a
            button role would wrap the whole dialog in <button> on web (nested buttons,
            screen readers announce the dialog as one button). */}
        <Pressable
          onPress={onBackdropPress}
          testID={BACKDROP_TEST_ID}
          style={styles.backdropPressable}
        >
          <View style={[styles.contentContainer, { backgroundColor: currentTheme.surface }]}>
            {children}
          </View>
        </Pressable>
      </View>
    </RNModal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: INDENTS.high,
  },
  backdropPressable: {
    flex: 1,
    justifyContent: 'center',
  },
  contentContainer: {
    borderRadius: 16,
    elevation: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
})
