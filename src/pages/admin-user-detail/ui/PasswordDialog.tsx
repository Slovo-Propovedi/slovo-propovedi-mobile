import { useState } from 'react'
import { ActivityIndicator, Text, View } from 'react-native'
import { passwordError } from 'shared/lib/validation/formValidation'
import { INPUT_LIMITS } from 'shared/lib/validation/inputLimits'
import { FormField } from 'shared/ui/form'
import { Modal } from 'shared/ui/modal'
import { COLORS, useTheme } from 'shared/ui/theme'
import { TouchableItem } from 'shared/ui/touchable-item'
import { styles } from './styles'

const TITLE = 'Смена пароля'
const LABEL = 'Новый пароль'
const SUBMIT_LABEL = 'Сохранить'
const CANCEL_LABEL = 'Отмена'
const EMPTY_ERROR = 'Введите новый пароль.'

// Модалка смены пароля: поле нового пароля и подтверждение. Пустой пароль и
// пароль вне границ спецификации блокируются на клиенте (сервер не должен
// получать заведомо неверный запрос).
export const PasswordDialog = ({
  isSubmitting,
  onClose,
  onSubmit,
  visible,
}: {
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (password: string) => Promise<boolean>
  visible: boolean
}) => {
  const { currentTheme } = useTheme()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const close = () => {
    setPassword('')
    setError('')
    onClose()
  }

  const submit = async () => {
    const value = password.trim()
    if (value === '') {
      setError(EMPTY_ERROR)
      return
    }

    const lengthError = passwordError(value)
    if (lengthError !== '') {
      setError(lengthError)
      return
    }

    if (await onSubmit(value)) close()
  }

  return (
    <Modal visible={visible} onBackdropPress={close}>
      <View style={styles.modalBody}>
        <Text style={[styles.modalTitle, { color: currentTheme.text }]}>{TITLE}</Text>
        <FormField
          label={LABEL}
          secureTextEntry
          value={password}
          maxLength={INPUT_LIMITS.user.passwordMax}
          onChangeText={text => {
            setPassword(text)
            setError('')
          }}
        />
        {error ? (
          <Text style={[styles.statLabel, { color: currentTheme.primary }]}>{error}</Text>
        ) : null}
        <View style={styles.modalActions}>
          <TouchableItem
            onPress={close}
            style={[styles.modalCancel, { backgroundColor: COLORS.disabled }]}
          >
            <Text style={[styles.actionText, { color: COLORS.black }]}>{CANCEL_LABEL}</Text>
          </TouchableItem>
          <TouchableItem
            disabled={isSubmitting}
            onPress={() => void submit()}
            style={[styles.modalConfirm, { backgroundColor: currentTheme.primary }]}
          >
            {isSubmitting ? (
              <ActivityIndicator color={currentTheme.onPrimary} />
            ) : (
              <Text style={[styles.modalConfirmText, { color: currentTheme.onPrimary }]}>
                {SUBMIT_LABEL}
              </Text>
            )}
          </TouchableItem>
        </View>
      </View>
    </Modal>
  )
}
