import { useAction, useAtom } from '@reatom/npm-react'
import { type Href, Redirect, Stack, usePathname } from 'expo-router'
import { useEffect } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { HeaderBackButton } from 'widgets/sub-screen-header-back'
import { authStatusAtom, authUserAtom, restoreSession } from 'entities/auth'
import { COLORS, useTheme } from 'shared/ui/theme'

const LOGIN_ROUTE = '/admin/login'
const ADMIN_FALLBACK_ROUTE: Href = '/settings'

const AdminLayout = () => {
  const restore = useAction(restoreSession)
  const pathname = usePathname()
  const [status] = useAtom(authStatusAtom)
  const [user] = useAtom(authUserAtom)
  const { currentTheme } = useTheme()

  // Восстанавливаем сессию один раз при входе в /admin, как ProtectedRoute.
  useEffect(() => {
    void restore()
  }, [restore])

  if (status === 'idle' || status === 'loading')
    return (
      <View style={[styles.loading, { backgroundColor: currentTheme.background }]}>
        <ActivityIndicator size='large' color={COLORS.primary} />
      </View>
    )

  if (!user && pathname !== LOGIN_ROUTE) return <Redirect href='/admin/login' />
  if (user && pathname === LOGIN_ROUTE) return <Redirect href='/admin' />

  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: currentTheme.background },
        headerShown: false,
      }}
    >
      <Stack.Screen name='(tabs)' options={{ headerShown: false }} />
      <Stack.Screen
        name='login'
        options={{
          headerLeft: props => (
            <HeaderBackButton tintColor={props.tintColor} fallbackRoute={ADMIN_FALLBACK_ROUTE} />
          ),
          headerShown: true,
          headerStyle: { backgroundColor: currentTheme.background },
          headerTintColor: currentTheme.text,
          headerTitleStyle: { color: currentTheme.text },
          title: 'Вход',
        }}
      />
    </Stack>
  )
}

export default AdminLayout

const styles = StyleSheet.create({
  loading: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
})
