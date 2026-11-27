import { Ionicons } from '@expo/vector-icons'
import { useAction, useAtom } from '@reatom/npm-react'
import { useEffect, useState } from 'react'
import { CreateLocalPlaylistModal } from 'features/local-playlist-form'
import { OnboardingTarget } from 'features/onboarding'
import {
  loadMyPlaylists,
  loadSectionSettings,
  myPlaylistsAtom,
  myPlaylistsLoadedAtom,
  sectionSettingsAtom,
  sectionSettingsLoadedAtom,
} from 'entities/playlist'
import { mapItemsSize, mapTransform, mapWhereIsTitleLocated } from 'entities/section'
import {
  AVATAR_CONTENT_SIZE_RATIO,
  getSliderCardLayout,
  getSliderLayoutViewport,
  Slider,
} from 'shared/ui'
import { useLayoutBaseWidth } from 'shared/ui/layout'
import { useTheme } from 'shared/ui/theme'
import { useListenNavigation } from '../lib/useListenNavigation'
import { buildMyPlaylistsItems, type MyPlaylistsItem } from './myPlaylistsSliderItems'

const SECTION_TITLE = 'Мои плейлисты'
const CREATE_ICON = 'add'

// Завершающая секция экрана «Слушать»: карточка «Избранные», карточки
// локальных плейлистов и завершающая карточка «Создать». Только чтение —
// редактирование порядка живёт на отдельном экране «Мои плейлисты», куда ведёт
// тап по заголовку секции. Внешний вид берётся из настроек оформления
// (`sectionSettingsAtom`).
export const MyPlaylistsSlider = ({
  onboardingTargetId,
  titleOnboardingTargetId,
}: {
  onboardingTargetId?: string
  titleOnboardingTargetId?: string
}) => {
  const { currentTheme } = useTheme()
  const [playlists] = useAtom(myPlaylistsAtom)
  const [settings] = useAtom(sectionSettingsAtom)
  const [playlistsLoaded] = useAtom(myPlaylistsLoadedAtom)
  const [settingsLoaded] = useAtom(sectionSettingsLoadedAtom)
  const [isCreateVisible, setCreateVisible] = useState(false)
  const loadPlaylists = useAction(loadMyPlaylists)
  const loadSettings = useAction(loadSectionSettings)
  const { navigateToMyPlaylists, navigateToPlaylist } = useListenNavigation()

  // Guarded hydration: the section remounts when the search closes, so only an
  // unloaded store triggers a read. Pull-to-refresh and the import hook call the
  // actions directly and still force a reload.
  useEffect(() => {
    if (!playlistsLoaded) void loadPlaylists()
    if (!settingsLoaded) void loadSettings()
  }, [loadPlaylists, loadSettings, playlistsLoaded, settingsLoaded])

  const baseWidth = useLayoutBaseWidth()
  const cardWidth = getSliderCardLayout(
    mapItemsSize(settings.itemsSize),
    getSliderLayoutViewport(baseWidth),
  ).cardWidth
  const iconSize = cardWidth * AVATAR_CONTENT_SIZE_RATIO
  const heartIcon = <Ionicons name='heart' size={iconSize} color={currentTheme.primary} />
  const addIcon = <Ionicons size={iconSize} name={CREATE_ICON} color={currentTheme.primary} />

  const onPressItem = (item: MyPlaylistsItem) => {
    if (item.kind === 'create') {
      setCreateVisible(true)
      return
    }
    navigateToPlaylist({
      artwork: null,
      id: item.playlist.id,
      sermons: [],
      title: item.playlist.title,
    })
  }

  const items = buildMyPlaylistsItems(playlists, heartIcon, addIcon)

  return (
    <OnboardingTarget id={onboardingTargetId}>
      <Slider
        items={items}
        title={SECTION_TITLE}
        onPressItem={onPressItem}
        onPressTitle={navigateToMyPlaylists}
        borderRadius={settings.borderRadius}
        itemsRows={settings.itemsRows ?? undefined}
        itemsSize={mapItemsSize(settings.itemsSize)}
        transform={mapTransform(settings.transform)}
        isDescriptionTitleOnSlideLarge={settings.isDescriptionTitleOnSlideLarge}
        whereIsSlideTitleLocated={mapWhereIsTitleLocated(settings.whereIsSlideTitleLocated)}
        renderTitleWrapper={
          titleOnboardingTargetId === undefined
            ? undefined
            : title => <OnboardingTarget id={titleOnboardingTargetId}>{title}</OnboardingTarget>
        }
      />
      <CreateLocalPlaylistModal visible={isCreateVisible} onClose={() => setCreateVisible(false)} />
    </OnboardingTarget>
  )
}
