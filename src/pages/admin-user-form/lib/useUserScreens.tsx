import { type Href, Stack } from 'expo-router'
import { useMemo } from 'react'
import { type ColorValue } from 'react-native'
import { HeaderBackButton } from 'widgets/sub-screen-header-back'
import { useTheme } from 'shared/ui/theme'

const USERS_FALLBACK_ROUTE: Href = '/admin/users'

const USER_SCREENS = [
  { name: 'users/create', title: 'Создать пользователя' },
  { name: 'users/[id]', title: 'Пользователь' },
  { name: 'users/[id]/edit', title: 'Редактировать пользователя' },
] as const

// Стабильный рендерер: expo-router передаёт `options` в navigation.setOptions
// при каждом изменении. Свежая inline-функция на каждый рендер делает options
// «изменёнными» → setState → re-render → setState («Maximum update depth exceeded»).
const renderUsersBack = (props: { tintColor?: ColorValue }) => (
  <HeaderBackButton tintColor={props.tintColor} fallbackRoute={USERS_FALLBACK_ROUTE} />
)

/**
 * Экраны пользователей (создание/деталь/редактирование) вне таб-группы, в стеке
 * /admin. Заголовок детали подставляется динамически из самого экрана.
 * Живёт в pages-слое (импортирует widget кнопки «Назад»), а `app/admin/_layout.tsx`
 * остаётся тонкой обвязкой.
 */
export const useUserScreens = () => {
  const { currentTheme } = useTheme()

  return useMemo(
    () =>
      USER_SCREENS.map(({ name, title }) => (
        <Stack.Screen
          key={name}
          name={name}
          options={{
            headerLeft: renderUsersBack,
            headerShown: true,
            headerStyle: { backgroundColor: currentTheme.background },
            headerTintColor: currentTheme.text,
            headerTitleStyle: { color: currentTheme.text },
            title,
          }}
        />
      )),
    [currentTheme],
  )
}
