import { Text, View } from 'react-native'
import { ConfirmDialogButton } from 'shared/ui/confirm-dialog'
import { useTheme } from 'shared/ui/theme'
import { updateDialogStyles as styles } from './updateDialogStyles'

const OPEN_SETTINGS_TEXT = 'Открыть настройки'
const NOT_NOW_TEXT = 'Не сейчас'
const EXPLAINER_TEXT =
  'Чтобы приложение могло обновляться самостоятельно, разрешите установку из этого источника в настройках'

interface UpdateDialogPermissionProps {
  onClose: () => void
  onOpenSettings: () => void
}

export const UpdateDialogPermission = ({
  onClose,
  onOpenSettings,
}: UpdateDialogPermissionProps) => {
  const { currentTheme } = useTheme()

  return (
    <>
      <Text style={[styles.message, { color: currentTheme.textMuted }]}>{EXPLAINER_TEXT}</Text>
      <View style={styles.buttons}>
        <ConfirmDialogButton
          isConfirm
          onPress={onOpenSettings}
          text={OPEN_SETTINGS_TEXT}
          color={currentTheme.primary}
        />
        <ConfirmDialogButton onPress={onClose} text={NOT_NOW_TEXT} />
      </View>
    </>
  )
}
