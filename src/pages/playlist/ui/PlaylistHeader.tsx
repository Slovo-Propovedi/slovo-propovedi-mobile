import { BlurTargetView, BlurView } from 'expo-blur'
import { useRef } from 'react'
import { Text, View } from 'react-native'
import Animated, { type useAnimatedStyle } from 'react-native-reanimated'
import { CoverImage } from 'shared/ui'
import { type ThemeColors } from 'shared/ui/theme'
import { createHeaderStyles } from './headerStyles'
import { QueueControls } from './QueueControls'

interface PlaylistHeaderProps {
  artwork: null | string | undefined
  description?: string
  headerImageHeight: number
  imageOpacityStyle: ReturnType<typeof useAnimatedStyle>
  onPressPlayAll: () => void
  theme: ThemeColors
  title: string
}

export const PlaylistHeader = ({
  artwork,
  description,
  headerImageHeight,
  imageOpacityStyle,
  onPressPlayAll,
  theme,
  title,
}: PlaylistHeaderProps) => {
  const headerStyles = createHeaderStyles(theme)
  const blurTargetRef = useRef<View>(null)

  return (
    <>
      <Animated.View
        style={[
          headerStyles.headerImageContainer,
          { height: headerImageHeight },
          imageOpacityStyle,
        ]}
      >
        <BlurTargetView ref={blurTargetRef} style={headerStyles.blur}>
          <CoverImage eager uri={artwork} style={headerStyles.headerImage} />
        </BlurTargetView>
        <BlurView
          tint='dark'
          intensity={70}
          style={headerStyles.blur}
          blurTarget={blurTargetRef}
          blurMethod='dimezisBlurViewSdk31Plus'
        />
        <View style={headerStyles.overlay} />
        <View style={headerStyles.titleContainer}>
          <Text style={headerStyles.title}>{title}</Text>
        </View>
      </Animated.View>

      <View style={headerStyles.contentSection}>
        {description ? <Text style={headerStyles.description}>{description}</Text> : null}
        <QueueControls onPressPlayAll={onPressPlayAll} />
      </View>
    </>
  )
}
