import { useAction } from '@reatom/npm-react'
import { useRouter } from 'expo-router'
import { useRef, useState } from 'react'
import { ActivityIndicator, ScrollView, Text, type TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { signIn } from 'entities/auth'
import { getErrorMessage } from 'shared/lib/error-utils'
import { showToast } from 'shared/model'
import { COLORS, useTheme } from 'shared/ui/theme'
import { TouchableItem } from 'shared/ui/touchable-item'
import { AdminLoginField } from './AdminLoginField'
import { styles } from './styles'

const LOGIN_SUCCESS_MESSAGE = 'Вход выполнен'
const MORE_ROUTE = '/more'

export const AdminLoginScreen = () => {
  const router = useRouter()
  const signInAction = useAction(signIn)
  const setToast = useAction(showToast)
  const { currentTheme } = useTheme()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<null | string>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const passwordInputRef = useRef<TextInput>(null)

  const canSubmit = username.trim().length > 0 && password.length > 0 && !isSubmitting

  const handleSubmit = async () => {
    setError(null)
    setIsSubmitting(true)

    try {
      await signInAction({ password, username: username.trim() })
      setToast(LOGIN_SUCCESS_MESSAGE)
      router.replace(MORE_ROUTE)
    } catch (submitError) {
      setError(getErrorMessage(submitError))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <SafeAreaView
      edges={['bottom']}
      style={[styles.container, { backgroundColor: currentTheme.background }]}
    >
      <ScrollView keyboardShouldPersistTaps='handled' contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: currentTheme.text }]}>
          Вход в интерфейс администратора
        </Text>
        <Text style={[styles.subtitle, { color: currentTheme.textMuted }]}>
          Введите учётные данные, выданные администратором сервера.
        </Text>

        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <AdminLoginField
          autoFocus
          value={username}
          placeholder='admin'
          returnKeyType='next'
          autoComplete='username'
          label='Имя пользователя'
          importantForAutofill='yes'
          textContentType='username'
          onChangeText={setUsername}
          onSubmitEditing={() => passwordInputRef.current?.focus()}
        />
        <AdminLoginField
          label='Пароль'
          secureTextEntry
          value={password}
          returnKeyType='go'
          placeholder='••••••••'
          textContentType='password'
          importantForAutofill='yes'
          onChangeText={setPassword}
          inputRef={passwordInputRef}
          autoComplete='current-password'
          onSubmitEditing={() => {
            if (canSubmit) void handleSubmit()
          }}
        />

        <TouchableItem
          disabled={!canSubmit}
          onPress={() => {
            void handleSubmit()
          }}
          style={[
            styles.button,
            { backgroundColor: currentTheme.primary, opacity: canSubmit ? 1 : 0.5 },
          ]}
        >
          {isSubmitting ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.buttonText}>Войти</Text>
          )}
        </TouchableItem>
      </ScrollView>
    </SafeAreaView>
  )
}
