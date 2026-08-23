import { ActivityIndicator, ScrollView, Text, View } from 'react-native'
import QRCode from 'react-native-qrcode-svg'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTheme } from 'shared/ui/theme'
import { TouchableItem } from 'shared/ui/touchable-item'
import { useLatestReleaseUrl } from '../lib/useLatestReleaseUrl'
import { CopyLinkButton } from './CopyLinkButton'
import { styles } from './styles'

const ERROR_MESSAGE = 'Не удалось загрузить информацию о релизе'
const RETRY_BUTTON_TITLE = 'Повторить'

const LoadingState = () => {
  const { currentTheme } = useTheme()

  return <ActivityIndicator size='large' style={styles.loader} color={currentTheme.primary} />
}

interface ErrorStateProps {
  onRetry: () => void
}

const ErrorState = ({ onRetry }: ErrorStateProps) => {
  const { currentTheme } = useTheme()

  return (
    <View style={styles.centered}>
      <Text style={[styles.errorText, { color: currentTheme.textMuted }]}>{ERROR_MESSAGE}</Text>
      <TouchableItem onPress={onRetry}>
        <Text style={[styles.retryButton, { color: currentTheme.primary }]}>
          {RETRY_BUTTON_TITLE}
        </Text>
      </TouchableItem>
    </View>
  )
}

interface ReadyStateProps {
  htmlUrl: string
  name: string
  version: string
}

const ReadyState = ({ htmlUrl, name, version }: ReadyStateProps) => {
  const { currentTheme } = useTheme()

  return (
    <>
      <Text style={[styles.releaseName, { color: currentTheme.text }]}>{name}</Text>
      <Text style={[styles.releaseVersion, { color: currentTheme.textMuted }]}>
        Версия {version}
      </Text>
      <View style={[styles.qrCard, { backgroundColor: '#ffffff' }]}>
        <QRCode size={220} color='#000000' value={htmlUrl} backgroundColor='#ffffff' />
      </View>
      <Text selectable style={[styles.releaseUrl, { color: currentTheme.textMuted }]}>
        {htmlUrl}
      </Text>
      <CopyLinkButton url={htmlUrl} style={styles.copyButton} />
    </>
  )
}

export const ShareScreen = () => {
  const { currentTheme } = useTheme()
  const { retry, state } = useLatestReleaseUrl()

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        {state.status === 'loading' && <LoadingState />}
        {state.status === 'error' && <ErrorState onRetry={retry} />}
        {state.status === 'ready' && (
          <ReadyState
            name={state.release.name}
            htmlUrl={state.release.htmlUrl}
            version={state.release.version}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
