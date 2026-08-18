import { ActivityIndicator, Pressable, Text, View, type ViewStyle } from 'react-native'
import { GestureDetector } from 'react-native-gesture-handler'
import Animated, { type AnimatedStyle } from 'react-native-reanimated'
import { formatSermonReference } from 'shared/lib/format'
import { CoverImage, MovingText, PlayerControlButton, PlayerControlButtonType } from 'shared/ui'
import type { createMiniStyles } from './miniStyles'
import type { AudioPlayerData } from 'entities/player'
import type { GestureType } from 'react-native-gesture-handler'
import type { PlaylistData } from 'shared/model'
import type { ThemeColors } from 'shared/ui/theme'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

interface MiniPlayerProps {
  audio: AudioPlayerData
  currentTheme: ThemeColors
  downloadProgress: number
  isDownloading: boolean
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
  downloadProgress,
  isDownloading,
  miniPan,
  miniStyle,
  miniStyles,
  onPlayPause,
  onPress,
  playing,
  playlist,
  showSpinner,
}: MiniPlayerProps) => {
  const subtitle =
    formatSermonReference({ book: audio.book, chapter: audio.chapter, verse: audio.verse }) ??
    playlist?.title ??
    'Слово.Проповеди'

  return (
    <GestureDetector gesture={miniPan}>
      <AnimatedPressable
        onPress={onPress}
        style={[miniStyles.miniContainer, miniStyle, { backgroundColor: currentTheme.surface }]}
      >
        <CoverImage eager uri={audio.artwork} style={miniStyles.miniCover} />
        <View style={miniStyles.miniTextContainer}>
          <MovingText text={audio.title || ''} style={miniStyles.miniTrackTitle} />
          <Text numberOfLines={1} style={miniStyles.miniPlaylistName}>
            {subtitle}
          </Text>
        </View>
        <View style={miniStyles.miniControls}>
          {showSpinner ? (
            <ActivityIndicator size={36} color={currentTheme.text} testID='buffering-indicator' />
          ) : (
            <PlayerControlButton
              size={36}
              onPress={onPlayPause}
              color={currentTheme.text}
              type={playing ? PlayerControlButtonType.Pause : PlayerControlButtonType.Play}
            />
          )}
        </View>
        {isDownloading && (
          <View style={miniStyles.downloadTrack}>
            <View
              style={[
                miniStyles.downloadFill,
                {
                  backgroundColor: currentTheme.primary,
                  width: `${downloadProgress * 100}%`,
                },
              ]}
            />
          </View>
        )}
      </AnimatedPressable>
    </GestureDetector>
  )
}
