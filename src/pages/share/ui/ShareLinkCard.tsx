import { Linking, Pressable, Text } from 'react-native'
import QRCode from 'react-native-qrcode-svg'
import { useTheme } from 'shared/ui/theme'
import { CopyLinkButton } from './CopyLinkButton'
import { styles } from './styles'

interface ShareLinkCardProps {
  url: string
}

const openUrl = (url: string) => {
  Linking.openURL(url).catch((error: unknown) => {
    console.error('[share] Failed to open URL:', error)
  })
}

export const ShareLinkCard = ({ url }: ShareLinkCardProps) => {
  const { currentTheme } = useTheme()

  return (
    <>
      <Pressable
        accessibilityRole='link'
        onPress={() => openUrl(url)}
        style={[styles.qrCard, { backgroundColor: '#ffffff' }]}
      >
        <QRCode size={220} value={url} color='#000000' backgroundColor='#ffffff' />
      </Pressable>
      <Pressable accessibilityRole='link' onPress={() => openUrl(url)}>
        <Text
          selectable
          style={[styles.releaseUrl, styles.releaseUrlLink, { color: currentTheme.primary }]}
        >
          {url}
        </Text>
      </Pressable>
      <CopyLinkButton url={url} style={styles.copyButton} />
    </>
  )
}
