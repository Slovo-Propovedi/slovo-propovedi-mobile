import { MaterialCommunityIcons } from '@expo/vector-icons'
import { View } from 'react-native'
import { type ThemeColors } from '../theme'
import { COLORS } from '../theme/colors'
import { AnimatedSoundBars } from './AnimatedSoundBars'
import { createTracksListStyles } from './styles'

interface PlayingStatusOrCacheIconProps {
  isAudioPlaying: boolean
  isPlaying: boolean
  isQueued?: boolean
  theme: ThemeColors
}

export const PlayingStatusOrChacheIcon = ({
  isAudioPlaying,
  isPlaying,
  isQueued = false,
  theme,
}: PlayingStatusOrCacheIconProps) => {
  const tracksListStyles = createTracksListStyles(theme)
  const icon = (() => {
    if (isPlaying && isAudioPlaying) return <AnimatedSoundBars />
    if (isPlaying) return <MaterialCommunityIcons size={16} name='play' color={COLORS.white} />
    if (isQueued)
      return <MaterialCommunityIcons size={16} name='clock-outline' color={COLORS.white} />
    return <MaterialCommunityIcons size={16} color={COLORS.white} name='cloud-download-outline' />
  })()

  const style = isPlaying
    ? tracksListStyles.playOrSoundBarsIconContainer
    : tracksListStyles.cacheIconContainer

  return <View style={style}>{icon}</View>
}
