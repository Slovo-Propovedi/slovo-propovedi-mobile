import { Linking, Text } from 'react-native'
import QRCode from 'react-native-qrcode-svg'
import { PressableButton } from 'shared/ui/pressable-button'
import { useTheme } from 'shared/ui/theme'
import { CopyLinkButton } from './CopyLinkButton'
import { styles } from './styles'

const openUrl = (url: string) => {
  Linking.openURL(url).catch((error: unknown) => {
    console.error('[share] Failed to open URL:', error)
  })
}

export const ShareLinkCard = ({ url }: { url: string }) => {
  const { currentTheme } = useTheme()

  return (
    <>
      <PressableButton
        accessibilityRole='link'
        onPress={() => openUrl(url)}
        style={[styles.qrCard, { backgroundColor: '#ffffff' }]}
      >
        <QRCode size={220} value={url} color='#000000' backgroundColor='#ffffff' />
      </PressableButton>
      <PressableButton accessibilityRole='link' onPress={() => openUrl(url)}>
        <Text
          selectable
          style={[styles.releaseUrl, styles.releaseUrlLink, { color: currentTheme.primary }]}
        >
          {url}
        </Text>
      </PressableButton>
      <CopyLinkButton url={url} style={styles.copyButton} />
    </>
  )
}
