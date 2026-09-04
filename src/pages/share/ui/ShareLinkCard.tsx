import { Text, View } from 'react-native'
import QRCode from 'react-native-qrcode-svg'
import { useTheme } from 'shared/ui/theme'
import { CopyLinkButton } from './CopyLinkButton'
import { styles } from './styles'

interface ShareLinkCardProps {
  url: string
}

export const ShareLinkCard = ({ url }: ShareLinkCardProps) => {
  const { currentTheme } = useTheme()

  return (
    <>
      <View style={[styles.qrCard, { backgroundColor: '#ffffff' }]}>
        <QRCode size={220} value={url} color='#000000' backgroundColor='#ffffff' />
      </View>
      <Text selectable style={[styles.releaseUrl, { color: currentTheme.textMuted }]}>
        {url}
      </Text>
      <CopyLinkButton url={url} style={styles.copyButton} />
    </>
  )
}
