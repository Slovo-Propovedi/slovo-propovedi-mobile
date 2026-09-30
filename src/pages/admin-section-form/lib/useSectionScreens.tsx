import { type Href, Stack } from 'expo-router'
import { useMemo } from 'react'
import { type ColorValue } from 'react-native'
import { HeaderBackButton } from 'widgets/sub-screen-header-back'
import { useTheme } from 'shared/ui/theme'

const SECTIONS_FALLBACK_ROUTE: Href = '/admin/sections'

const SECTION_SCREENS = [
  { name: 'sections/create', title: 'Создать раздел' },
  { name: 'sections/[id]', title: 'Раздел' },
  { name: 'sections/[id]/edit', title: 'Редактировать раздел' },
] as const

// Стабильный рендерер: expo-router передаёт `options` в navigation.setOptions
// при каждом изменении. Свежая inline-функция на каждый рендер делает options
// «изменёнными» → setState → re-render → setState («Maximum update depth exceeded»).
const renderSectionsBack = (props: { tintColor?: ColorValue }) => (
  <HeaderBackButton tintColor={props.tintColor} fallbackRoute={SECTIONS_FALLBACK_ROUTE} />
)

/**
 * Экраны разделов (создание/деталь/редактирование) вне таб-группы, в стеке
 * /admin. Заголовок детали подставляется динамически из самого экрана.
 * Живёт в pages-слое (импортирует widget кнопки «Назад»), а `app/admin/_layout.tsx`
 * остаётся тонкой обвязкой.
 */
export const useSectionScreens = () => {
  const { currentTheme } = useTheme()

  return useMemo(
    () =>
      SECTION_SCREENS.map(({ name, title }) => (
        <Stack.Screen
          key={name}
          name={name}
          options={{
            headerLeft: renderSectionsBack,
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
