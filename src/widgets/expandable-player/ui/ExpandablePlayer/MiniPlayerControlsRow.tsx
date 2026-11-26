import { Ionicons } from '@expo/vector-icons'
import { Text, View } from 'react-native'
import { PlayerControlsSize, PlayerRepeatToggle, SermonPlayerControls } from 'entities/player'
import { useFavoriteSermon } from 'entities/playlist'
import { type AudioPlayerData } from 'entities/sermon'
import { IconButton } from 'shared/ui/icon-button'
import { PressableButton } from 'shared/ui/pressable-button'
import { FONT_SIZES, useTheme } from 'shared/ui/theme'
import { MiniPlayerMenuAnchor } from './MiniPlayerMenuAnchor'
import { MINI_PLAY_HIT_SLOP } from './miniStyles'
import { createWideMiniStyles } from './miniWideStyles'

const ADD_TO_FAVORITES_LABEL = 'Добавить в избранное'
const REMOVE_FROM_FAVORITES_LABEL = 'Убрать из избранного'
const TEXT_SERMON_LABEL = 'Текст проповеди'
const TEXT_SERMON_SHORT = 'Текст'

/**
 * Wide-layout control row of the mini pill: repeat + transport on the left,
 * favorite next to them, then the disabled text-sermon placeholder and the ⋮
 * menu. Compact phones keep the single play/pause transport.
 * @param root0 - Row props.
 * @param root0.audio - Current sermon (favorite target and menu source).
 */
export const MiniPlayerControlsRow = ({ audio }: { audio: AudioPlayerData }) => {
  const { currentTheme } = useTheme()
  const styles = createWideMiniStyles(currentTheme)
  const { isFavorite, toggleFavorite } = useFavoriteSermon(audio)

  return (
    <View style={styles.controlsRow}>
      <PlayerRepeatToggle />
      <SermonPlayerControls style={styles.transport} size={PlayerControlsSize.Small} />
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
      <View style={styles.rightCluster}>
        <PressableButton
          disabled
          style={styles.textButton}
          accessibilityLabel={TEXT_SERMON_LABEL}
          accessibilityState={{ disabled: true }}
        >
          <Text style={styles.textButtonLabel}>{TEXT_SERMON_SHORT}</Text>
        </PressableButton>
        <MiniPlayerMenuAnchor audio={audio} styles={styles} />
      </View>
    </View>
  )
}
