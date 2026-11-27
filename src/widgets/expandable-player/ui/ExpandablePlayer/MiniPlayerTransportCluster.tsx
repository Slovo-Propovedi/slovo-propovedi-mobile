import { Ionicons } from '@expo/vector-icons'
import { View } from 'react-native'
import { PlayerControlsSize, PlayerRepeatToggle, SermonPlayerControls } from 'entities/player'
import { useFavoriteSermon } from 'entities/playlist'
import { type AudioPlayerData } from 'entities/sermon'
import { IconButton } from 'shared/ui/icon-button'
import { useTheme } from 'shared/ui/theme'
import { MINI_PLAY_HIT_SLOP } from './miniStyles'
import { type createWideMiniStyles, MINI_WIDE_ICON_SIZE } from './miniWideStyles'

const ADD_TO_FAVORITES_LABEL = 'Добавить в избранное'
const REMOVE_FROM_FAVORITES_LABEL = 'Убрать из избранного'
const TRANSPORT_CLUSTER_TEST_ID = 'mini-transport-cluster'

/**
 * Transport cluster of the wide pill: repeat, the prev/play/next slot and the
 * favorite heart, always in full. It leads the row, left of the artwork and
 * title, and never changes composition with the window width.
 * @param root0 - Cluster props.
 * @param root0.audio - Current sermon (favorite target).
 * @param root0.styles - Wide-pill styles built for the active theme.
 */
export const MiniPlayerTransportCluster = ({
  audio,
  styles,
}: {
  audio: AudioPlayerData
  styles: ReturnType<typeof createWideMiniStyles>
}) => {
  const { currentTheme } = useTheme()
  const { isFavorite, toggleFavorite } = useFavoriteSermon(audio)

  return (
    <View style={styles.transportCluster} testID={TRANSPORT_CLUSTER_TEST_ID}>
      <PlayerRepeatToggle inactiveColor={currentTheme.text} />
      <SermonPlayerControls
        color={currentTheme.text}
        size={PlayerControlsSize.Small}
        style={styles.transportControls}
      />
      <IconButton
        onPress={toggleFavorite}
        style={styles.iconButton}
        hitSlop={MINI_PLAY_HIT_SLOP}
        accessibilityLabel={isFavorite ? REMOVE_FROM_FAVORITES_LABEL : ADD_TO_FAVORITES_LABEL}
        Icon={
          <Ionicons
            size={MINI_WIDE_ICON_SIZE}
            name={isFavorite ? 'heart' : 'heart-outline'}
            style={[styles.icon, isFavorite && { color: currentTheme.primary }]}
          />
        }
      />
    </View>
  )
}
