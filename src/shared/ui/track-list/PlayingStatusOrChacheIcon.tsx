import { MaterialCommunityIcons } from '@expo/vector-icons'
import { View } from 'react-native'
import { type ThemeColors } from 'shared/ui/theme'
import { COLORS } from 'shared/ui/themed'
import { AnimatedSoundBars } from './AnimatedSoundBars'
import { createTracksListStyles } from './styles'

export const PlayingStatusOrChacheIcon = ({
  isAudioPlaying,
  isPlaying,
  theme,
}: {
  isAudioPlaying: boolean
  isPlaying: boolean
  theme: ThemeColors
}) => {
  const tracksListStyles = createTracksListStyles(theme)
  const icon = (() => {
    if (!isPlaying)
      return <MaterialCommunityIcons size={16} color={COLORS.white} name='cloud-download-outline' />
    if (isAudioPlaying) return <AnimatedSoundBars />
    return <MaterialCommunityIcons size={16} name='play' color={COLORS.white} />
  })()

  const style = isPlaying
    ? tracksListStyles.playOrSoundBarsIconContainer
    : tracksListStyles.cacheIconContainer

  return <View style={style}>{icon}</View>
}
