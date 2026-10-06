import { type Href, Stack } from 'expo-router'
import { useMemo } from 'react'
import { type ColorValue } from 'react-native'
import { HeaderBackButton } from 'widgets/sub-screen-header-back'
import { useTheme } from 'shared/ui/theme'

const INVIDIOUS_FALLBACK_ROUTE: Href = '/admin'

// Стабильный рендерер: expo-router передаёт `options` в navigation.setOptions
// при каждом изменении. Свежая inline-функция на каждый рендер делает options
// «изменёнными» → setState → re-render → setState («Maximum update depth exceeded»).
const renderInvidiousBack = (props: { tintColor?: ColorValue }) => (
  <HeaderBackButton tintColor={props.tintColor} fallbackRoute={INVIDIOUS_FALLBACK_ROUTE} />
)

/**
 * Экран «Источники импорта» вне таб-группы, в стеке /admin. Живёт в pages-слое
 * (импортирует widget кнопки «Назад»), а `app/admin/_layout.tsx` остаётся тонкой
 * обвязкой.
 */
export const useInvidiousScreens = () => {
  const { currentTheme } = useTheme()

  return useMemo(
    () => (
      <Stack.Screen
        name='invidious'
        options={{
          headerLeft: renderInvidiousBack,
          headerShown: true,
          headerStyle: { backgroundColor: currentTheme.background },
          headerTintColor: currentTheme.text,
          headerTitleStyle: { color: currentTheme.text },
          title: 'Источники импорта',
        }}
      />
    ),
    [currentTheme],
  )
}
