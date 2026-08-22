import { Text, View } from 'react-native'
import { ConfirmDialogButton } from 'shared/ui/confirm-dialog'
import { COLORS } from 'shared/ui/theme'
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
}: UpdateDialogConfirmProps) => (
  <>
    <Text style={styles.message}>Версия {latestVersion ?? ''} доступна для установки</Text>
    <View style={styles.buttons}>
      <ConfirmDialogButton
        isConfirm
        text={CONFIRM_TEXT}
        onPress={onConfirm}
        color={COLORS.success}
      />
      <ConfirmDialogButton text={CANCEL_TEXT} onPress={onCancel} />
    </View>
    <Text style={styles.link} accessibilityRole='link' onPress={onOpenReleases}>
      {RELEASES_LINK_TEXT}
    </Text>
  </>
)
