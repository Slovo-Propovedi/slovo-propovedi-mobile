import { useAction, useAtom } from '@reatom/npm-react'
import { type Href, Redirect, Stack, usePathname } from 'expo-router'
import { useEffect, useMemo } from 'react'
import { ActivityIndicator, type ColorValue, StyleSheet, View } from 'react-native'
import { usePlaylistScreens } from 'pages/admin-playlist-form'
import { useSectionScreens } from 'pages/admin-section-form'
import { HeaderBackButton } from 'widgets/sub-screen-header-back'
import { authStatusAtom, authUserAtom, restoreSession } from 'entities/auth'
import { COLORS, useTheme } from 'shared/ui/theme'

const LOGIN_ROUTE = '/admin/login'
const ADMIN_FALLBACK_ROUTE: Href = '/settings'

// Стабильный рендерер: expo-router передаёт `options` в navigation.setOptions
// при каждом изменении. Свежая inline-функция на каждый рендер делает options
// «изменёнными» → setState → re-render → setState («Maximum update depth exceeded»).
const renderLoginBack = (props: { tintColor?: ColorValue }) => (
  <HeaderBackButton tintColor={props.tintColor} fallbackRoute={ADMIN_FALLBACK_ROUTE} />
)

const AdminLayout = () => {
  const restore = useAction(restoreSession)
  const pathname = usePathname()
  const [status] = useAtom(authStatusAtom)
  const [user] = useAtom(authUserAtom)
  const { currentTheme } = useTheme()
  const sectionScreens = useSectionScreens()
  const playlistScreens = usePlaylistScreens()

  // Стабильный объект options для экрана входа: держим идентичность между
  // рендерами, чтобы expo-router не переустанавливал опции на каждый кадр.
  const loginOptions = useMemo(
    () => ({
      headerLeft: renderLoginBack,
      headerShown: true,
      headerStyle: { backgroundColor: currentTheme.background },
      headerTintColor: currentTheme.text,
      headerTitleStyle: { color: currentTheme.text },
      title: 'Вход',
    }),
    [currentTheme],
  )

  // Восстанавливаем сессию один раз при входе в /admin, только пока она ещё
  // не разрешена. Гвард по status не даёт эффекту повторно запускать restore()
  // на каждом рендере (иначе статус мигает в 'loading' → render loop).
  useEffect(() => {
    if (status !== 'idle') return

    void restore()
  }, [status, restore])

  // Пока сессия не разрешена и мы не на экране входа — показываем спиннер.
  // На /admin/login спиннер не подменяет форму во время входа (status='loading'),
  // иначе экран входа размонтировался бы прямо во время submit.
  const isOnLoginRoute = pathname === LOGIN_ROUTE
  if (status === 'idle' || (status === 'loading' && !isOnLoginRoute))
    return (
      <View style={[styles.loading, { backgroundColor: currentTheme.background }]}>
        <ActivityIndicator size='large' color={COLORS.primary} />
      </View>
    )

  // Аутентифицированного пользователя на /admin/login НЕ уводим в /admin:
  // после входа мы явно возвращаемся на «Еще» (см. AdminLoginScreen).
  if (!user && !isOnLoginRoute) return <Redirect href='/admin/login' />

  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: currentTheme.background },
        headerShown: false,
      }}
    >
      <Stack.Screen name='(tabs)' options={{ headerShown: false }} />
      <Stack.Screen name='login' options={loginOptions} />
      {sectionScreens}
      {playlistScreens}
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
