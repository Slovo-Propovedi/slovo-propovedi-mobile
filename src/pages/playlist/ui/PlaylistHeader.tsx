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
  return (
    <>
      <Animated.View
        style={[
          headerStyles.headerImageContainer,
          { height: headerImageHeight },
          imageOpacityStyle,
        ]}
      >
        <CoverImage eager uri={artwork} style={headerStyles.headerImage} />
        <View style={headerStyles.overlay} />
        <View style={headerStyles.titleContainer}>
          <Text style={headerStyles.title}>{title}</Text>
        </View>
      </Animated.View>

      <View style={headerStyles.contentSection}>
        {description && <Text style={headerStyles.description}>{description}</Text>}
        <QueueControls onPressPlayAll={onPressPlayAll} />
      </View>
    </>
  )
}
