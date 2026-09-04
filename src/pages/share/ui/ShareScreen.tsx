import { useState } from 'react'
import { ActivityIndicator, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTheme } from 'shared/ui/theme'
import { TouchableItem } from 'shared/ui/touchable-item'
import { LANDING_URL, WEB_APP_URL } from '../lib/constants'
import { useLatestReleaseUrl } from '../lib/useLatestReleaseUrl'
import { CollapsibleSection } from './CollapsibleSection'
import { ShareLinkCard } from './ShareLinkCard'
import { styles } from './styles'

const LANDING_TITLE = 'Сайт'
const WEB_APP_TITLE = 'Веб-версия'
const RELEASE_TITLE = 'Приложение'

type SectionKey = 'landing' | 'release' | 'webApp'

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
      <ShareLinkCard url={htmlUrl} />
    </>
  )
}

export const ShareScreen = () => {
  const { currentTheme } = useTheme()
  const { retry, state } = useLatestReleaseUrl()
  const [expandedSection, setExpandedSection] = useState<null | SectionKey>('landing')

  const toggleSection = (section: SectionKey) => {
    setExpandedSection(current => (current === section ? null : section))
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <CollapsibleSection
          title={LANDING_TITLE}
          onToggle={() => toggleSection('landing')}
          isExpanded={expandedSection === 'landing'}
        >
          <ShareLinkCard url={LANDING_URL} />
        </CollapsibleSection>

        <CollapsibleSection
          title={WEB_APP_TITLE}
          onToggle={() => toggleSection('webApp')}
          isExpanded={expandedSection === 'webApp'}
        >
          <ShareLinkCard url={WEB_APP_URL} />
        </CollapsibleSection>

        <CollapsibleSection
          title={RELEASE_TITLE}
          onToggle={() => toggleSection('release')}
          isExpanded={expandedSection === 'release'}
        >
          {state.status === 'loading' && <LoadingState />}
          {state.status === 'error' && <ErrorState onRetry={retry} />}
          {state.status === 'ready' && (
            <ReadyState
              name={state.release.name}
              htmlUrl={state.release.htmlUrl}
              version={state.release.version}
            />
          )}
        </CollapsibleSection>
      </ScrollView>
    </SafeAreaView>
  )
}
