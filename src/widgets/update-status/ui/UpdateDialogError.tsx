import { Text, View } from 'react-native'
import { type UpdateErrorKind } from 'shared/lib/update-service'
import { ConfirmDialogButton } from 'shared/ui/confirm-dialog'
import { useTheme } from 'shared/ui/theme'
import { updateDialogStyles as styles } from './updateDialogStyles'

const RETRY_TEXT = 'Повторить'
const OPEN_IN_BROWSER_TEXT = 'Открыть в браузере'
const CLOSE_TEXT = 'Закрыть'

const RETRY_PRIMARY_KINDS: UpdateErrorKind[] = [
  'download',
  'extract',
  'install-aborted',
  'install-generic',
  'offline',
  'unknown',
]

export const UpdateDialogError = ({
  errorKind,
  errorMessage,
  onClose,
  onOpenReleases,
  onRetry,
}: {
  errorKind: UpdateErrorKind
  errorMessage: string
  onClose: () => void
  onOpenReleases: () => void
  onRetry: () => void
}) => {
  const { currentTheme } = useTheme()
  const isRetryPrimary = RETRY_PRIMARY_KINDS.includes(errorKind)

  return (
    <>
      <Text style={[styles.message, { color: currentTheme.text }]}>{errorMessage}</Text>
      <View style={styles.buttons}>
        {isRetryPrimary ? (
          <ConfirmDialogButton
            isConfirm
            onPress={onRetry}
            text={RETRY_TEXT}
            color={currentTheme.primary}
          />
        ) : (
          <ConfirmDialogButton
            isConfirm
            onPress={onOpenReleases}
            text={OPEN_IN_BROWSER_TEXT}
            color={currentTheme.primary}
          />
        )}
        {isRetryPrimary ? (
          <ConfirmDialogButton onPress={onOpenReleases} text={OPEN_IN_BROWSER_TEXT} />
        ) : (
          <ConfirmDialogButton onPress={onRetry} text={RETRY_TEXT} />
        )}
        <ConfirmDialogButton onPress={onClose} text={CLOSE_TEXT} />
      </View>
    </>
  )
}
