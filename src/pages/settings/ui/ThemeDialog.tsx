import { StyleSheet, Text, View } from 'react-native'
import { Modal } from 'shared/ui/modal'
import { INDENTS, useTheme } from 'shared/ui/theme'
import { ThemeSelector } from './ThemeSelector'

export const ThemeDialog = ({
  onDismiss,
  visible,
}: {
  onDismiss: () => void
  visible: boolean
}) => {
  const { currentTheme } = useTheme()

  return (
    <Modal visible={visible} onBackdropPress={onDismiss}>
      <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
        <Text style={[styles.title, { color: currentTheme.text }]}>Тема оформления</Text>
        <ThemeSelector onSelect={onDismiss} />
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: INDENTS.high,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: INDENTS.medium,
  },
})
