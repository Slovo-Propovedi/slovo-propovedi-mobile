import { type Href, Stack } from 'expo-router'
import { useMemo } from 'react'
import { type ColorValue } from 'react-native'
import { HeaderBackButton } from 'widgets/sub-screen-header-back'
import { useTheme } from 'shared/ui/theme'

const PLAYLISTS_FALLBACK_ROUTE: Href = '/admin/playlists'

const PLAYLIST_SCREENS = [
  { name: 'playlists/create', title: 'Создать плейлист' },
  { name: 'playlists/[id]', title: 'Плейлист' },
  { name: 'playlists/[id]/edit', title: 'Редактировать' },
] as const

// Стабильный рендерер: expo-router передаёт `options` в navigation.setOptions
// при каждом изменении. Свежая inline-функция на каждый рендер делает options
// «изменёнными» → setState → re-render → setState («Maximum update depth exceeded»).
const renderPlaylistsBack = (props: { tintColor?: ColorValue }) => (
  <HeaderBackButton tintColor={props.tintColor} fallbackRoute={PLAYLISTS_FALLBACK_ROUTE} />
)

/**
 * Экраны плейлистов (создание/деталь/редактирование) вне таб-группы, в стеке
 * /admin. Заголовок детали подставляется динамически из самого экрана.
 * Живёт в pages-слое (импортирует widget кнопки «Назад»), а `app/admin/_layout.tsx`
 * остаётся тонкой обвязкой.
 */
export const usePlaylistScreens = () => {
  const { currentTheme } = useTheme()

  return useMemo(
    () =>
      PLAYLIST_SCREENS.map(({ name, title }) => (
        <Stack.Screen
          key={name}
          name={name}
          options={{
            headerLeft: renderPlaylistsBack,
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
