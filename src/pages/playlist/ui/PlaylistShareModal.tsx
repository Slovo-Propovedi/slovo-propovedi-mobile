import { Ionicons } from '@expo/vector-icons'
import { StyleSheet, Text, View } from 'react-native'
import QRCode from 'react-native-qrcode-svg'
import { OnboardingTarget } from 'features/onboarding'
import { isShareSupported } from 'shared/lib/isShareSupported'
import { Modal } from 'shared/ui/modal'
import { FONT_SIZES, INDENTS, RADIUSES, useTheme } from 'shared/ui/theme'
import { PlaylistMenuRow } from './PlaylistMenuRow'
import { SHARE_TEXT } from './PlaylistShareMenuItem'

const ICON_SIZE = 18
const SEND_ICON = 'share-outline'
const COPY_ICON = 'copy-outline'
const SEND_TEXT = 'Отправить ссылку'
const COPY_TEXT = 'Копировать ссылку'
const QR_SIZE = 220
// Custom share URLs pack ~22 chars per sermon, so up to 200 sermons ≈ 4.4 KB. Past QR
// byte-mode capacity (~2953 bytes) the qrcode core throws during render — a crash on
// modal open. 1000 also keeps codes comfortably scannable; longer links fall back to
// the send/copy rows only.
const MAX_QR_URL_LENGTH = 1000

export const PlaylistShareModal = ({
  isVisible,
  onClose,
  onCopy,
  onShare,
  url,
}: {
  isVisible: boolean
  onClose: () => void
  onCopy: () => void
  onShare: () => void
  url: string
}) => {
  const { currentTheme } = useTheme()
  const isQrVisible = url.length <= MAX_QR_URL_LENGTH

  return (
    <Modal visible={isVisible} onBackdropPress={onClose}>
      <View style={styles.container}>
        <Text style={[styles.title, { color: currentTheme.text }]}>{SHARE_TEXT}</Text>

        {isQrVisible && (
          <OnboardingTarget id='playlist.share-modal-qr'>
            <View style={styles.qrCard}>
              <QRCode value={url} size={QR_SIZE} color='#000000' backgroundColor='#ffffff' />
            </View>
          </OnboardingTarget>
        )}

        {isShareSupported && (
          <PlaylistMenuRow
            text={SEND_TEXT}
            onPress={onShare}
            onboardingTargetId='playlist.share-modal-send'
            icon={<Ionicons size={ICON_SIZE} name={SEND_ICON} color={currentTheme.icon} />}
          />
        )}

        <PlaylistMenuRow
          text={COPY_TEXT}
          onPress={onCopy}
          onboardingTargetId='playlist.share-modal-copy'
          icon={<Ionicons size={ICON_SIZE} name={COPY_ICON} color={currentTheme.icon} />}
        />
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: INDENTS.medium,
    paddingTop: INDENTS.medium,
  },
  qrCard: {
    alignSelf: 'center',
    backgroundColor: '#ffffff',
    borderRadius: RADIUSES.high,
    marginBottom: INDENTS.medium,
    padding: INDENTS.medium,
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    paddingBottom: INDENTS.medium,
    paddingHorizontal: INDENTS.high,
    paddingTop: INDENTS.low,
  },
})
