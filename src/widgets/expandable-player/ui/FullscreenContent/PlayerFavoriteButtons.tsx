import { Ionicons } from '@expo/vector-icons'
import { OnboardingTarget } from 'features/onboarding'
import { useFavoriteSermon } from 'entities/playlist'
import { type AudioPlayerData } from 'entities/sermon'
import { IconButton } from 'shared/ui/icon-button'
import { useTheme } from 'shared/ui/theme'
import { type createStyles } from '../ExpandablePlayer/styles'

const ADD_TO_FAVORITES_LABEL = 'Добавить в избранное'
const REMOVE_FROM_FAVORITES_LABEL = 'Убрать из избранного'
const ADD_TO_PLAYLIST_LABEL = 'Добавить в плейлист'
const FAVORITE_TARGET_ID = 'player-fullscreen.favorite'
const ADD_TO_PLAYLIST_TARGET_ID = 'player-fullscreen.add-to-playlist'

/**
 * Кластер [♥][＋] над заголовком трека полноэкранного плеера.
 *
 * Сердечко переключает избранное через `useFavoriteSermon` (то же
 * `togglePlaylistSermon` с `suppressPlayerReset: true`, что и у сердечек строк),
 * плюс открывает модалку «Добавить в плейлист». ⋮ живёт во втором ряду контролов
 * (`PlayerMenuAnchor`), поэтому кластер отвечает только за закладки.
 * @param root0 - Свойства кластера.
 * @param root0.audio - Текущая проповедь (уходит в обработчик добавления).
 * @param root0.onAddToPlaylist - Открывает модалку добавления в плейлист.
 * @param root0.styles - Стили полноэкранного плеера.
 */
export const PlayerFavoriteButtons = ({
  audio,
  onAddToPlaylist,
  styles,
}: {
  audio: AudioPlayerData
  onAddToPlaylist?: (sermon: AudioPlayerData) => void
  styles: ReturnType<typeof createStyles>
}) => {
  const { currentTheme } = useTheme()
  const { isFavorite, toggleFavorite } = useFavoriteSermon(audio)

  return (
    <>
      <OnboardingTarget id={FAVORITE_TARGET_ID}>
        <IconButton
          onPress={toggleFavorite}
          style={styles.menuButton}
          accessibilityLabel={isFavorite ? REMOVE_FROM_FAVORITES_LABEL : ADD_TO_FAVORITES_LABEL}
          Icon={
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              style={[styles.menuIcon, isFavorite && { color: currentTheme.primary }]}
            />
          }
        />
      </OnboardingTarget>
      <OnboardingTarget id={ADD_TO_PLAYLIST_TARGET_ID}>
        <IconButton
          style={styles.menuButton}
          onPress={() => onAddToPlaylist?.(audio)}
          accessibilityLabel={ADD_TO_PLAYLIST_LABEL}
          Icon={<Ionicons style={styles.menuIcon} name='add-circle-outline' />}
        />
      </OnboardingTarget>
    </>
  )
}
