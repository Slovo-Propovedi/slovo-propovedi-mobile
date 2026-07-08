import { Image, Linking, StyleSheet } from 'react-native'
import { type StyleProp, type ViewStyle } from 'react-native'
import { TouchableImageBackground } from '../touchable-image-background'

interface YoutubePreviewProps {
  previewSrc: string
  style?: StyleProp<ViewStyle>
  url: string
}

export const YoutubePreview = ({ previewSrc, style, url }: YoutubePreviewProps) => (
  <TouchableImageBackground
    previewSrc={previewSrc}
    style={[styles.item, style]}
    onPress={() => {
      void Linking.openURL(url)
    }}
  >
    <Image
      resizeMode='contain'
      style={styles.youtubeButton}
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- Static asset import
      source={require('./assets/youtube-logo-png-2069.png')}
    />
  </TouchableImageBackground>
)

const styles = StyleSheet.create({
  item: { minHeight: 50, minWidth: 50 },
  youtubeButton: { height: '100%', width: '100%' },
})
