import { type Href, Stack } from 'expo-router'
import { useMemo } from 'react'
import { type ColorValue } from 'react-native'
import { HeaderBackButton } from 'widgets/sub-screen-header-back'
import { useTheme } from 'shared/ui/theme'

const FLAGS_FALLBACK_ROUTE: Href = '/admin/flags'

const FLAG_SCREENS = [
  { name: 'flags/create', title: 'Создать флаг' },
  { name: 'flags/[id]', title: 'Флаг' },
  { name: 'flags/[id]/edit', title: 'Редактировать флаг' },
] as const

// Стабильный рендерер: expo-router передаёт `options` в navigation.setOptions
// при каждом изменении. Свежая inline-функция на каждый рендер делает options
// «изменёнными» → setState → re-render → setState («Maximum update depth exceeded»).
const renderFlagsBack = (props: { tintColor?: ColorValue }) => (
  <HeaderBackButton tintColor={props.tintColor} fallbackRoute={FLAGS_FALLBACK_ROUTE} />
)

/**
 * Экраны фича-флагов (создание/деталь/редактирование) вне таб-группы, в стеке
 * /admin. Заголовок детали подставляется динамически из самого экрана.
 */
export const useFlagScreens = () => {
  const { currentTheme } = useTheme()

  return useMemo(
    () =>
      FLAG_SCREENS.map(({ name, title }) => (
        <Stack.Screen
          key={name}
          name={name}
          options={{
            headerLeft: renderFlagsBack,
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
