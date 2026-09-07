import { Text, View } from 'react-native'
import { ConfirmDialogButton } from 'shared/ui/confirm-dialog'
import { useTheme } from 'shared/ui/theme'
import { updateDialogStyles as styles } from './updateDialogStyles'

const CONFIRM_TEXT = 'Обновить'
const CANCEL_TEXT = 'Не обновлять'
const RELEASES_LINK_TEXT = 'Все версии обновлений'

interface UpdateDialogConfirmProps {
  latestVersion: null | string
  onCancel: () => void
  onConfirm: () => void
  onOpenReleases: () => void
}

export const UpdateDialogConfirm = ({
  latestVersion,
  onCancel,
  onConfirm,
  onOpenReleases,
}: UpdateDialogConfirmProps) => {
  const { currentTheme } = useTheme()

  return (
    <>
      <Text style={[styles.message, { color: currentTheme.text }]}>
        Версия {latestVersion ?? ''} доступна для установки
      </Text>
      <View style={styles.buttons}>
        <ConfirmDialogButton
          isConfirm
          text={CONFIRM_TEXT}
          onPress={onConfirm}
          color={currentTheme.primary}
        />
        <ConfirmDialogButton text={CANCEL_TEXT} onPress={onCancel} />
      </View>
      <Text
        accessibilityRole='link'
        onPress={onOpenReleases}
        style={[styles.link, { color: currentTheme.primary }]}
      >
        {RELEASES_LINK_TEXT}
      </Text>
    </>
  )
}
