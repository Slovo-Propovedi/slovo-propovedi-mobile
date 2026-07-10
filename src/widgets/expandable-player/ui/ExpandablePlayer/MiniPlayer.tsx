import { ActivityIndicator, Image, Pressable, Text, View, type ViewStyle } from 'react-native'
import { GestureDetector } from 'react-native-gesture-handler'
import Animated, { type AnimatedStyle } from 'react-native-reanimated'
import { MovingText, PlayerControlButton, PlayerControlButtonType } from 'shared/ui'
import { IMAGE_PLACEHOLDER } from 'shared/ui/images'
import type { createMiniStyles } from './miniStyles'
import type { AudioPlayerData } from 'entities/player'
import type { GestureType } from 'react-native-gesture-handler'
import type { PlaylistData } from 'shared/model'
import type { ThemeColors } from 'shared/ui/theme'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

interface MiniPlayerProps {
  audio: AudioPlayerData
  currentTheme: ThemeColors
  miniPan: GestureType
  miniStyle: AnimatedStyle<ViewStyle>
  miniStyles: ReturnType<typeof createMiniStyles>
  onPlayPause: () => Promise<void>
  onPress: () => void
  playing: boolean
  playlist: null | PlaylistData
  showSpinner: boolean
}

export const MiniPlayer = ({
  audio,
  currentTheme,
  miniPan,
  miniStyle,
  miniStyles,
  onPlayPause,
  onPress,
  playing,
  playlist,
  showSpinner,
}: MiniPlayerProps) => (
  <GestureDetector gesture={miniPan}>
    <AnimatedPressable
      onPress={onPress}
      style={[miniStyles.miniContainer, miniStyle, { backgroundColor: currentTheme.surface }]}
    >
      <Image style={miniStyles.miniCover} source={{ uri: audio.artwork || IMAGE_PLACEHOLDER }} />
      <View style={miniStyles.miniTextContainer}>
        <MovingText text={audio.title || ''} style={miniStyles.miniTrackTitle} />
        <Text numberOfLines={1} style={miniStyles.miniPlaylistName}>
          {playlist?.title || 'Слово.Проповеди'}
        </Text>
      </View>
      <View style={miniStyles.miniControls}>
        {showSpinner ? (
          <ActivityIndicator size={36} color={currentTheme.text} />
        ) : (
          <PlayerControlButton
            size={36}
            onPress={onPlayPause}
            color={currentTheme.text}
            type={playing ? PlayerControlButtonType.Pause : PlayerControlButtonType.Play}
          />
        )}
      </View>
    </AnimatedPressable>
  </GestureDetector>
)
