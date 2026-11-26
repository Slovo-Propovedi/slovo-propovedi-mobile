import { Ionicons } from '@expo/vector-icons'
import { useWindowDimensions, View } from 'react-native'
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
import { getMiniControlsVisibility } from '../../lib/getMiniControlsVisibility'
import { MiniPlayerMenuCluster } from './MiniPlayerMenuCluster'
import { MINI_PLAY_HIT_SLOP, MINI_WIDE_TRANSPORT_BUTTON_WIDTH } from './miniStyles'
import { createWideMiniStyles } from './miniWideStyles'

const ADD_TO_FAVORITES_LABEL = 'Добавить в избранное'
const REMOVE_FROM_FAVORITES_LABEL = 'Убрать из избранного'
const ROW_TEST_ID = 'mini-controls-row'

// Only the transport's side buttons ever leave the row; play always stays.
type ExcludedTransportButton = PlayerControlButtonType.Next | PlayerControlButtonType.Prev

/**
 * Wide-layout control row of the mini pill. On the widest windows it reads
 * repeat + transport + favorite + the menu cluster; as the window narrows it
 * sheds the right cluster button by button and then thins the transport cluster
 * (repeat, heart, prev, next), ending in the bare artwork/title/play row of the
 * phone layout. Compact phones keep the single play/pause transport.
 * @param root0 - Row props.
 * @param root0.audio - Current sermon (favorite target and menu source).
 */
export const MiniPlayerControlsRow = ({ audio }: { audio: AudioPlayerData }) => {
  const { width } = useWindowDimensions()
  const { currentTheme } = useTheme()
  const styles = createWideMiniStyles(currentTheme)
  const { isFavorite, toggleFavorite } = useFavoriteSermon(audio)
  const visibility = getMiniControlsVisibility(width)
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
      testID={ROW_TEST_ID}
      style={[styles.controlsRow, visibility.clusterSide === 'right' && styles.controlsRowRight]}
    >
      {visibility.repeat && <PlayerRepeatToggle />}
      <SermonPlayerControls
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
      <MiniPlayerMenuCluster audio={audio} styles={styles} visibility={visibility} />
    </View>
  )
}
