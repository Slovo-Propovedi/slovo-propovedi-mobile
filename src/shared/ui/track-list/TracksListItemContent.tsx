import { MaterialCommunityIcons } from '@expo/vector-icons'
import { forwardRef } from 'react'
import { Pressable, Text, View } from 'react-native'
import { CoverImage } from '../cover-image'
import { MovingText } from '../MovingText'
import { ProgressBar } from '../progress-bar/ProgressBar'
import { type ThemeColors } from '../theme'
import { TITLE_ANIMATION_THRESHOLD } from './constants'
import { PlayingStatusOrChacheIcon } from './PlayingStatusOrChacheIcon'
import { createTracksListStyles } from './styles'

interface TracksListItemContentProps {
  artwork?: null | string
  dotsOnPress: () => void
  isAudioPlaying: boolean
  isCached: boolean
  isDownloading: boolean
  isPlaying: boolean
  progress?: number
  progressValue: number
  subtitle?: string
  theme: ThemeColors
  title: string
}

export const TracksListItemContent = forwardRef<View, TracksListItemContentProps>(
  (
    {
      artwork,
      dotsOnPress,
      isAudioPlaying,
      isCached,
      isDownloading,
      isPlaying,
      progress,
      progressValue,
      subtitle,
      theme,
      title,
    },
    ref,
  ) => {
    const tracksListStyles = createTracksListStyles(theme)

    return (
      <>
        <View style={tracksListStyles.albumArtContainer}>
          <CoverImage
            uri={artwork}
            style={[tracksListStyles.albumArt, isPlaying && tracksListStyles.albumArtPlaying]}
          />
          {isDownloading && (
            <View style={tracksListStyles.progressBarBackground}>
              <View
                style={[tracksListStyles.progressBarFill, { width: `${progressValue * 100}%` }]}
              />
            </View>
          )}
          {!isDownloading && (!isCached || isPlaying) && (
            <PlayingStatusOrChacheIcon
              theme={theme}
              isPlaying={isPlaying}
              isAudioPlaying={isAudioPlaying}
            />
          )}
        </View>
        <View style={tracksListStyles.textContainer}>
          <MovingText
            text={title}
            animationThreshold={TITLE_ANIMATION_THRESHOLD}
            style={[tracksListStyles.title, isPlaying && tracksListStyles.titlePlaying]}
          />
          {subtitle ? <Text style={tracksListStyles.subtitle}>{subtitle}</Text> : null}
        </View>
        <Pressable
          ref={ref}
          onPress={dotsOnPress}
          accessibilityRole='button'
          testID='tracks-list-item-menu'
          style={tracksListStyles.dotsButton}
        >
          <MaterialCommunityIcons size={20} name='dots-vertical' color={theme.textMuted} />
        </Pressable>
        {progress != null && progress > 0 && <ProgressBar progress={progress} />}
      </>
    )
  },
)
