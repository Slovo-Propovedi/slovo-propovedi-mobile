import { forwardRef } from 'react'
import { ActivityIndicator, Platform, View, type ViewInstance, type ViewStyle } from 'react-native'
import { GestureDetector, type GestureType } from 'react-native-gesture-handler'
import Animated, { type AnimatedStyle } from 'react-native-reanimated'
import { OnboardingTarget } from 'features/onboarding'
import { PlayerControlButton, PlayerControlButtonType } from 'entities/player'
import { type PlaylistData } from 'entities/playlist'
import { type AudioPlayerData } from 'entities/sermon'
import { CoverImage, GlassSurface, MovingText, useMarqueeCycle } from 'shared/ui'
import { PressableButton } from 'shared/ui/pressable-button'
import { type ThemeColors } from 'shared/ui/theme'
import { getPlayerSubtitle } from '../../lib/getPlayerSubtitle'
import { MiniDownloadProgress } from './MiniDownloadProgress'
import { type createMiniStyles, MINI_PILL_RADIUS } from './miniStyles'

const AnimatedPressable = Animated.createAnimatedComponent(PressableButton)

// Web: the row renders as <div role="link" tabindex=0> (RNW maps 'link' to the
// role attribute, no <a> tag) so the inner play/pause <button> is not nested
// inside another <button> (validateDOMNesting error). Native keeps the button
// role. Same container pattern as TracksListItemBase ROW_ACCESSIBILITY_ROLE.
const ROW_ACCESSIBILITY_ROLE = Platform.OS === 'web' ? 'link' : 'button'

interface MiniPlayerProps {
  audio: AudioPlayerData
  currentTheme: ThemeColors
  // Theme flag for the shared glass layers; the pill must frost exactly like the
  // tab island and the search surfaces.
  isLight: boolean
  miniBarRestingStyle: ViewStyle
  miniBarStyle: AnimatedStyle<ViewStyle>
  miniPan: GestureType
  miniStyle: AnimatedStyle<ViewStyle>
  miniStyles: ReturnType<typeof createMiniStyles>
  onPlayPause: () => Promise<void>
  onPress: () => void
  playing: boolean
  playlist: null | PlaylistData
  showSpinner: boolean
}

export const MiniPlayer = forwardRef<ViewInstance, MiniPlayerProps>(
  (
    {
      audio,
      currentTheme,
      isLight,
      miniBarRestingStyle,
      miniBarStyle,
      miniPan,
      miniStyle,
      miniStyles,
      onPlayPause,
      onPress,
      playing,
      playlist,
      showSpinner,
    },
    ref,
  ) => {
    const subtitle = getPlayerSubtitle(audio, playlist)
    // The title owns the marquee cycle; the subtitle only follows it, so both
    // lines restart together and neither overruns the other's rhythm.
    const marqueeCycle = useMarqueeCycle()

    return (
      <GestureDetector gesture={miniPan}>
        <AnimatedPressable
          ref={ref}
          onPress={onPress}
          accessibilityRole={ROW_ACCESSIBILITY_ROLE}
          style={[
            miniStyles.miniContainer,
            miniStyle,
            // Animated geometry wins at the native level; the React resting style
            // last keeps the shadow tree on the current bar state's geometry (#63).
            miniBarStyle,
            miniBarRestingStyle,
          ]}
        >
          <GlassSurface isLight={isLight} radius={MINI_PILL_RADIUS} />
          <CoverImage eager uri={audio.artwork} style={miniStyles.miniCover} />
          <View style={miniStyles.miniTextContainer}>
            <MovingText
              fadeEdge
              autoStart
              text={audio.title || ''}
              publishCycle={marqueeCycle}
              style={miniStyles.miniTrackTitle}
            />
            <MovingText
              fadeEdge
              text={subtitle}
              followCycle={marqueeCycle}
              style={miniStyles.miniPlaylistName}
            />
          </View>
          <View style={miniStyles.miniControls}>
            {showSpinner ? (
              <ActivityIndicator size={36} color={currentTheme.text} testID='buffering-indicator' />
            ) : (
              <OnboardingTarget id='player.mini-play-pause'>
                <PlayerControlButton
                  size={36}
                  onPress={onPlayPause}
                  color={currentTheme.text}
                  type={playing ? PlayerControlButtonType.Pause : PlayerControlButtonType.Play}
                />
              </OnboardingTarget>
            )}
          </View>
          <MiniDownloadProgress miniStyles={miniStyles} audioUrl={audio.audioUrl} />
        </AnimatedPressable>
      </GestureDetector>
    )
  },
)
MiniPlayer.displayName = 'MiniPlayer'
