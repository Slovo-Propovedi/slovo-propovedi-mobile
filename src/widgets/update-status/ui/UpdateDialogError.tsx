import { Text, View } from 'react-native'
import { ConfirmDialogButton } from 'shared/ui/confirm-dialog'
import { COLORS } from 'shared/ui/theme'
import { updateDialogStyles as styles } from './updateDialogStyles'

const OPEN_IN_BROWSER_TEXT = 'Открыть в браузере'
const CLOSE_TEXT = 'Закрыть'

interface UpdateDialogErrorProps {
  errorMessage: null | string
  onClose: () => void
  onOpenReleases: () => void
}

export const UpdateDialogError = ({
  errorMessage,
  onClose,
  onOpenReleases,
}: UpdateDialogErrorProps) => (
  <>
    <Text style={styles.message}>{errorMessage}</Text>
    <View style={styles.buttons}>
      <ConfirmDialogButton
        isConfirm
        color={COLORS.primary}
        onPress={onOpenReleases}
        text={OPEN_IN_BROWSER_TEXT}
      />
      <ConfirmDialogButton text={CLOSE_TEXT} onPress={onClose} />
    </View>
  </>
)
