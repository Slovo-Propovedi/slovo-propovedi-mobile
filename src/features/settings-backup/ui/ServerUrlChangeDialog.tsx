import { useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Modal } from 'shared/ui/modal'
import { FONT_SIZES, INDENTS, useTheme } from 'shared/ui/theme'
import { TouchableItem } from 'shared/ui/touchable-item'

const SESSION_RESET_NOTICE =
  'Вход администратора будет сброшен: токены не передаются на другой сервер.'

export const ServerUrlChangeDialog = ({
  newUrl,
  onCancel,
  onConfirm,
  visible,
}: {
  newUrl: string
  onCancel: () => void
  onConfirm: () => void
  visible: boolean
}) => {
  const { currentTheme } = useTheme()
  const [lastShownUrl, setLastShownUrl] = useState(newUrl)

  // Keep the previous URL on screen while the dialog fades out: the parent clears
  // pendingServerUrl immediately, but the modal stays visible for the animation.
  if (newUrl !== '' && newUrl !== lastShownUrl) setLastShownUrl(newUrl)

  const shownUrl = newUrl !== '' ? newUrl : lastShownUrl

  return (
    <Modal visible={visible} onBackdropPress={onCancel}>
      <View style={styles.container}>
        <Text style={[styles.title, { color: currentTheme.text }]}>Смена URL сервера</Text>
        <Text style={[styles.message, { color: currentTheme.textMuted }]}>
          Импорт изменит адрес сервера API на:
        </Text>
        <Text style={[styles.url, { color: currentTheme.text }]}>{shownUrl}</Text>
        <Text style={[styles.message, { color: currentTheme.textMuted }]}>
          {SESSION_RESET_NOTICE}
        </Text>
        <TouchableItem
          onPress={onConfirm}
          style={[styles.choice, { backgroundColor: currentTheme.primary }]}
        >
          <Text style={[styles.primaryText, { color: currentTheme.onPrimary }]}>Применить</Text>
        </TouchableItem>
        <TouchableItem onPress={onCancel} style={styles.choice}>
          <Text style={[styles.choiceText, { color: currentTheme.text }]}>Отмена</Text>
        </TouchableItem>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  choice: {
    alignItems: 'center',
    borderRadius: 8,
    justifyContent: 'center',
    marginTop: INDENTS.medium,
    paddingVertical: INDENTS.middle,
  },
  choiceText: {
    fontSize: FONT_SIZES.base,
    fontWeight: 'bold',
  },
  container: {
    padding: INDENTS.high,
  },
  message: {
    fontSize: FONT_SIZES.sm,
    marginBottom: INDENTS.low,
  },
  primaryText: {
    fontSize: FONT_SIZES.base,
    fontWeight: 'bold',
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    marginBottom: INDENTS.low,
  },
  url: {
    fontSize: FONT_SIZES.base,
    fontWeight: 'bold',
    marginBottom: INDENTS.low,
  },
})
