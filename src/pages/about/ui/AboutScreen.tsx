import { Asset } from 'expo-asset'
import { openURL } from 'expo-linking'
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native'
import {
  APP_NAME,
  APP_VERSION,
  COPYRIGHT_HOLDER,
  COPYRIGHT_YEAR,
  LICENSE_NAME,
  LICENSE_URL,
  PROJECT_URL,
} from 'shared/config'
import { FONT_SIZES, INDENTS, useTheme } from 'shared/ui/themed'
import { LinkButton } from './LinkButton'

// eslint-disable-next-line @typescript-eslint/no-require-imports -- Metro bundler requires require() for static assets
const appIconAsset = Asset.fromModule(require('../../../../assets/icon.png'))

export const AboutScreen = () => {
  const handleOpenSourceLink = () => void openURL(PROJECT_URL)
  const handleOpenLicenseLink = () => void openURL(LICENSE_URL)
  const { currentTheme } = useTheme()

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      style={[styles.container, { backgroundColor: currentTheme.background }]}
    >
      <View style={styles.content}>
        <View style={styles.section}>
          <Image resizeMode='contain' style={styles.appIcon} source={{ uri: appIconAsset.uri }} />

          <Text style={[styles.appName, { color: currentTheme.text }]}>{APP_NAME}</Text>
          <Text style={[styles.appVersion, { color: currentTheme.textMuted }]}>
            Версия {APP_VERSION}
          </Text>
        </View>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>Информация</Text>
          <Text style={[styles.text, { color: currentTheme.textMuted }]}>
            {APP_NAME} — бесплатное приложение с открытым исходным кодом. Приложение предназначено
            для прослушивания и чтения проповедей в удобном формате.
          </Text>
        </View>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>Исходный код</Text>
          <Text style={[styles.text, { color: currentTheme.textMuted }]}>
            Исходный код приложения доступен на Forgejo. Вы можете ознакомиться с кодом, внести свой
            вклад или использовать его в своих проектах.
          </Text>

          <LinkButton
            icon='git-branch-outline'
            testID='source-code-link'
            onPress={handleOpenSourceLink}
            title='Исходный код на Forgejo'
          />
        </View>
        <View style={styles.section}>
          <LinkButton
            testID='license-link'
            icon='document-text-outline'
            onPress={handleOpenLicenseLink}
            title={`Лицензия ${LICENSE_NAME}`}
          />
        </View>
        <View style={styles.footerSection}>
          <Text style={[styles.copyright, { color: currentTheme.textMuted }]}>
            © {COPYRIGHT_YEAR} {COPYRIGHT_HOLDER}
          </Text>
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  appIcon: { alignSelf: 'center', height: 120, marginBottom: INDENTS.high, width: 120 },
  appName: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    marginBottom: INDENTS.low,
    textAlign: 'center',
  },
  appVersion: {
    fontSize: FONT_SIZES.base,
    marginBottom: INDENTS.low,
    textAlign: 'center',
  },
  container: { flex: 1 },
  content: { padding: INDENTS.high },
  copyright: { fontSize: FONT_SIZES.sm, marginTop: INDENTS.high },
  footerSection: { alignItems: 'center' },
  scrollContent: { flexGrow: 1 },
  section: { marginBottom: INDENTS.high },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    marginBottom: INDENTS.low,
  },
  text: {
    fontSize: FONT_SIZES.base,
    lineHeight: 22,
    marginBottom: INDENTS.medium,
  },
})
