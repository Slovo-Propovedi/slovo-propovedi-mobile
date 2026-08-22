import { Text, View } from 'react-native'
import { ConfirmDialogButton } from 'shared/ui/confirm-dialog'
import { COLORS } from 'shared/ui/theme'
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
}: UpdateDialogPermissionProps) => (
  <>
    <Text style={styles.message}>{EXPLAINER_TEXT}</Text>
    <View style={styles.buttons}>
      <ConfirmDialogButton
        isConfirm
        color={COLORS.primary}
        onPress={onOpenSettings}
        text={OPEN_SETTINGS_TEXT}
      />
      <ConfirmDialogButton onPress={onClose} text={NOT_NOW_TEXT} />
    </View>
  </>
)
