import { useAction, useAtom } from '@reatom/npm-react'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { authUserAtom, signIn } from 'entities/auth'
import { getErrorMessage } from 'shared/lib/error-utils'
import { COLORS, useTheme } from 'shared/ui/theme'
import { TouchableItem } from 'shared/ui/touchable-item'
import { AdminLoginField } from './AdminLoginField'
import { styles } from './styles'

export const AdminLoginScreen = () => {
  const router = useRouter()
  const signInAction = useAction(signIn)
  const [user] = useAtom(authUserAtom)
  const { currentTheme } = useTheme()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<null | string>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (user) router.replace('/admin')
  }, [user, router])

  const canSubmit = username.trim().length > 0 && password.length > 0 && !isSubmitting

  const handleSubmit = async () => {
    setError(null)
    setIsSubmitting(true)

    try {
      await signInAction({ password, username: username.trim() })
      router.replace('/admin')
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
          value={username}
          placeholder='admin'
          label='Имя пользователя'
          onChangeText={setUsername}
        />
        <AdminLoginField
          label='Пароль'
          secureTextEntry
          value={password}
          placeholder='••••••••'
          onChangeText={setPassword}
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
