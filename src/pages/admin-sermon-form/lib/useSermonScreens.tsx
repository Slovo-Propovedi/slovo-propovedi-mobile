import { Stack } from 'expo-router'
import { useMemo } from 'react'
import { type ColorValue } from 'react-native'
import { HeaderBackButton } from 'widgets/sub-screen-header-back'
import { useTheme } from 'shared/ui/theme'
import { goBackToAdmin } from './goBackToAdmin'

const SERMON_SCREENS = [
  { name: 'sermons/create', title: 'Загрузить проповедь' },
  { name: 'sermons/[id]', title: 'Проповедь' },
  { name: 'sermons/[id]/edit', title: 'Редактировать проповедь' },
] as const

// Стабильный рендерер: expo-router передаёт `options` в navigation.setOptions
// при каждом изменении. Свежая inline-функция на каждый рендер делает options
// «изменёнными» → setState → re-render → setState («Maximum update depth exceeded»).
const renderSermonsBack = (props: { tintColor?: ColorValue }) => (
  <HeaderBackButton onPress={goBackToAdmin} tintColor={props.tintColor} />
)

/**
 * Экраны проповедей (создание/деталь/редактирование) вне таб-группы, в стеке
 * /admin. Заголовок детали подставляется динамически из самого экрана.
 * Живёт в pages-слое (импортирует widget кнопки «Назад»), а `app/admin/_layout.tsx`
 * остаётся тонкой обвязкой.
 */
export const useSermonScreens = () => {
  const { currentTheme } = useTheme()

  return useMemo(
    () =>
      SERMON_SCREENS.map(({ name, title }) => (
        <Stack.Screen
          key={name}
          name={name}
          options={{
            headerLeft: renderSermonsBack,
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
