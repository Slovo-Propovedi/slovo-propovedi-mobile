import { MaterialCommunityIcons } from '@expo/vector-icons'
import { View } from 'react-native'
import { type ThemeColors } from 'shared/ui/theme'
import { COLORS } from 'shared/ui/theme/colors'
import { AnimatedSoundBars } from './AnimatedSoundBars'
import { createTracksListStyles } from './styles'

export const PlayingStatusOrChacheIcon = ({
  isAudioPlaying,
  isPlaying,
  isQueued = false,
  isSermonCachingEnabled,
  theme,
}: {
  isAudioPlaying: boolean
  isPlaying: boolean
  isQueued?: boolean
  /** Global sermon-caching setting; when off, no cloud/clock indicator is drawn. */
  isSermonCachingEnabled: boolean
  theme: ThemeColors
}) => {
  const tracksListStyles = createTracksListStyles(theme)
  const icon = (() => {
    if (isPlaying && isAudioPlaying) return <AnimatedSoundBars />
    if (isPlaying) return <MaterialCommunityIcons size={16} name='play' color={COLORS.white} />
    // Caching off in settings: no cloud (download available) and no clock
    // (queued) indicator — nothing to offer and nothing in flight.
    if (!isSermonCachingEnabled) return null
    if (isQueued)
      return <MaterialCommunityIcons size={16} name='clock-outline' color={COLORS.white} />
    return <MaterialCommunityIcons size={16} color={COLORS.white} name='cloud-download-outline' />
  })()

  // The container paints a tinted square over the artwork corner, so with nothing
  // inside it must not render at all — an empty wrapper would still show the box.
  if (!icon) return null

  const style = isPlaying
    ? tracksListStyles.playOrSoundBarsIconContainer
    : tracksListStyles.cacheIconContainer

  return <View style={style}>{icon}</View>
}
