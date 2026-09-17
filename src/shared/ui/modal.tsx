import { Pressable, Modal as RNModal, StyleSheet, View } from 'react-native'
import { useTheme } from './theme/ThemeContext/useTheme'
import { INDENTS } from './theme/themed'

const BACKDROP_TEST_ID = 'modal-backdrop'

type Props = React.PropsWithChildren<{
  onBackdropPress: () => void
  visible: boolean
}>

export const Modal = ({ children, onBackdropPress, visible }: Props) => {
  const { currentTheme } = useTheme()

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
