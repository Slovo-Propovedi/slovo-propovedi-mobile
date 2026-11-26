import { Ionicons } from '@expo/vector-icons'
import { View } from 'react-native'
import {
  PlayerControlButtonType,
  PlayerControlsSize,
  PlayerRepeatToggle,
  SermonPlayerControls,
} from 'entities/player'
import { useFavoriteSermon } from 'entities/playlist'
import { type AudioPlayerData } from 'entities/sermon'
import { IconButton } from 'shared/ui/icon-button'
import { FONT_SIZES, useTheme } from 'shared/ui/theme'
import { type MiniControlsVisibility } from '../../lib/getMiniControlsVisibility'
import { MINI_PLAY_HIT_SLOP, MINI_WIDE_TRANSPORT_BUTTON_WIDTH } from './miniStyles'
import { type createWideMiniStyles } from './miniWideStyles'

const ADD_TO_FAVORITES_LABEL = 'Добавить в избранное'
const REMOVE_FROM_FAVORITES_LABEL = 'Убрать из избранного'
const TRANSPORT_CLUSTER_TEST_ID = 'mini-transport-cluster'

// Only the transport's side buttons ever leave the cluster; play always stays.
type ExcludedTransportButton = PlayerControlButtonType.Next | PlayerControlButtonType.Prev

/**
 * Transport cluster of the wide pill: repeat, the prev/play/next slot and the
 * favorite heart. On the widest windows it leads the row (left of the artwork),
 * and once the menu cluster is gone it hugs the right edge after the title.
 * @param root0 - Cluster props.
 * @param root0.audio - Current sermon (favorite target).
 * @param root0.styles - Wide-pill styles built for the active theme.
 * @param root0.visibility - Which controls fit the current window width.
 */
export const MiniPlayerTransportCluster = ({
  audio,
  styles,
  visibility,
}: {
  audio: AudioPlayerData
  styles: ReturnType<typeof createWideMiniStyles>
  visibility: MiniControlsVisibility
}) => {
  const { currentTheme } = useTheme()
  const { isFavorite, toggleFavorite } = useFavoriteSermon(audio)
  // The transport always keeps play; prev/next hide through its own exclusion
  // contract, so the three-button slot narrows with them.
  const excludeButtons: ExcludedTransportButton[] = []

  if (!visibility.previous) excludeButtons.push(PlayerControlButtonType.Prev)

  if (!visibility.next) excludeButtons.push(PlayerControlButtonType.Next)

  const visibleTransportButtons = [true, visibility.previous, visibility.next].filter(
    Boolean,
  ).length

  return (
    <View
      testID={TRANSPORT_CLUSTER_TEST_ID}
      style={[
        styles.transportCluster,
        visibility.clusterSide === 'right' && styles.transportClusterRight,
      ]}
    >
      {visibility.repeat && <PlayerRepeatToggle inactiveColor={currentTheme.text} />}
      <SermonPlayerControls
        color={currentTheme.text}
        excludeButtons={excludeButtons}
        size={PlayerControlsSize.Small}
        style={{ width: MINI_WIDE_TRANSPORT_BUTTON_WIDTH * visibleTransportButtons }}
      />
      {visibility.favorite && (
        <IconButton
          onPress={toggleFavorite}
          style={styles.iconButton}
          hitSlop={MINI_PLAY_HIT_SLOP}
          accessibilityLabel={isFavorite ? REMOVE_FROM_FAVORITES_LABEL : ADD_TO_FAVORITES_LABEL}
          Icon={
            <Ionicons
              size={FONT_SIZES.xl}
              name={isFavorite ? 'heart' : 'heart-outline'}
              style={[styles.icon, isFavorite && { color: currentTheme.primary }]}
            />
          }
        />
      )}
    </View>
  )
}
