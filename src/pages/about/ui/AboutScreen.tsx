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
import { COLORS, FONT_SIZES, INDENTS } from 'shared/ui/themed'
import { LinkButton } from './LinkButton'

// eslint-disable-next-line @typescript-eslint/no-require-imports -- Metro bundler requires require() for static assets
const appIconAsset = Asset.fromModule(require('../../../../assets/icon.png'))

export const AboutScreen = () => {
  const handleOpenSourceLink = () => void openURL(PROJECT_URL)
  const handleOpenLicenseLink = () => void openURL(LICENSE_URL)

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.content}>
        <View style={styles.section}>
          <Image resizeMode='contain' style={styles.appIcon} source={{ uri: appIconAsset.uri }} />

          <Text style={styles.appName}>{APP_NAME}</Text>
          <Text style={styles.appVersion}>Версия {APP_VERSION}</Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Информация</Text>
          <Text style={styles.text}>
            {APP_NAME} — бесплатное приложение с открытым исходным кодом. Приложение предназначено
            для прослушивания и чтения проповедей в удобном формате.
          </Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Исходный код</Text>
          <Text style={styles.text}>
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
          <Text style={styles.copyright}>
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
    color: COLORS.text,
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    marginBottom: INDENTS.low,
    textAlign: 'center',
  },
  appVersion: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.base,
    marginBottom: INDENTS.low,
    textAlign: 'center',
  },
  container: { backgroundColor: COLORS.background, flex: 1 },
  content: { padding: INDENTS.high },
  copyright: { color: COLORS.textMuted, fontSize: FONT_SIZES.sm, marginTop: INDENTS.high },
  footerSection: { alignItems: 'center' },
  scrollContent: { flexGrow: 1 },
  section: { marginBottom: INDENTS.high },
  sectionTitle: {
    color: COLORS.text,
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    marginBottom: INDENTS.low,
  },
  text: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.base,
    lineHeight: 22,
    marginBottom: INDENTS.medium,
  },
})
