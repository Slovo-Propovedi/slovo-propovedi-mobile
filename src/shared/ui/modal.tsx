import { useEffect, useRef } from 'react'
import { Platform, Pressable, Modal as RNModal, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useEscapeKey } from '../lib/escape-key/useEscapeKey'
import { hapticLight } from '../lib/haptics'
import { APP_MAX_CONTENT_WIDTH } from './layout/appMaxWidth'
import { useTheme } from './theme/ThemeContext/useTheme'
import { INDENTS } from './theme/themed'

const BACKDROP_TEST_ID = 'modal-backdrop'

// Небольшой зазор между системной безопасной зоной и содержимым модалки.
const SAFE_AREA_GAP = INDENTS.medium

export const Modal = ({
  children,
  onBackdropPress,
  visible,
}: React.PropsWithChildren<{
  onBackdropPress: () => void
  visible: boolean
}>) => {
  const { currentTheme } = useTheme()
  const insets = useSafeAreaInsets()
  const onBackdropPressRef = useRef(onBackdropPress)

  useEffect(() => {
    onBackdropPressRef.current = onBackdropPress
  })

  // The fullscreen player and search register their own Escape layers; a modal
  // on top must win — the shared stack dispatches to the topmost layer only.
  useEscapeKey({
    enabled: Platform.OS === 'web' && visible,
    onEscape: () => onBackdropPressRef.current(),
  })

  return (
    // onRequestClose closes the modal on Android hardware back (RN requires it
    // when visible on Android). On web the same effect comes from onBackdropPress.
    <RNModal
      transparent
      visible={visible}
      animationType='fade'
      statusBarTranslucent
      onRequestClose={onBackdropPress}
    >
      <View
        style={[
          styles.backdrop,
          {
            backgroundColor: currentTheme.backdrop,
            paddingBottom: insets.bottom + SAFE_AREA_GAP,
            paddingTop: insets.top + SAFE_AREA_GAP,
          },
        ]}
      >
        {/* Backdrop is deliberately a role-less Pressable: it is not a button, and a
            button role would wrap the whole dialog in <button> on web (nested buttons,
            screen readers announce the dialog as one button). */}
        <Pressable
          tabIndex={-1}
          onPressIn={hapticLight}
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
    paddingHorizontal: INDENTS.high,
  },
  backdropPressable: {
    flex: 1,
    justifyContent: 'center',
  },
  contentContainer: {
    // Desktop-web: cap the dialog to the same centered column as the rest of
    // the UI (APP_MAX_CONTENT_WIDTH, web-only → undefined on native, so phones
    // are unchanged). alignSelf centers it inside the full-width backdrop.
    alignSelf: 'center',
    borderRadius: 16,
    boxShadow: '0px 4px 8px rgba(0,0,0,0.3)',
    elevation: 8,
    // On web leave a visible margin around the dialog instead of filling the
    // whole viewport; native keeps the safe-area gap from the backdrop padding.
    maxHeight: Platform.select({ default: '100%', web: '90%' }),
    maxWidth: APP_MAX_CONTENT_WIDTH,
    overflow: 'hidden',
    width: '100%',
  },
})
