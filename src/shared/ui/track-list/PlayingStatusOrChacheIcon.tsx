import { MaterialCommunityIcons } from '@expo/vector-icons'
import { View } from 'react-native'
import { COLORS } from 'shared/ui/themed'
import { AnimatedSoundBars } from './AnimatedSoundBars'
import { tracksListStyles } from './styles'

export const PlayingStatusOrChacheIcon = ({
  isAudioPlaying,
  isPlaying,
}: {
  isAudioPlaying: boolean
  isPlaying: boolean
}) => {
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
