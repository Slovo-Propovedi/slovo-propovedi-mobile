import { Image, Text, View } from 'react-native'
import Animated, { type useAnimatedStyle } from 'react-native-reanimated'
import { IMAGE_PLACEHOLDER } from 'shared/ui/images'
import { type ThemeColors } from 'shared/ui/theme'
import { createHeaderStyles } from './headerStyles'
import { QueueControls } from './QueueControls'

interface PlaylistHeaderProps {
  artwork: string | undefined
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
        <Image style={headerStyles.headerImage} source={{ uri: artwork || IMAGE_PLACEHOLDER }} />
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
