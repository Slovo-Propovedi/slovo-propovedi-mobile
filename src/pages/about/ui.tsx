import { Ionicons } from '@expo/vector-icons'
import { Asset } from 'expo-asset'
import { Image, Linking, StyleSheet, Text, View } from 'react-native'
import { APP_NAME, APP_VERSION } from 'shared/config'
import { COLORS, FONT_SIZES, INDENTS } from 'shared/ui/themed'

const PROJECT_URL = 'https://git.lightnode.ru/Slovo_Propovedi/slovo-propovedi-mobile/'

// eslint-disable-next-line @typescript-eslint/no-require-imports -- Metro bundler requires require() for static assets
const appIconAsset = Asset.fromModule(require('../../../assets/icon.png'))

export const AboutScreen = () => {
  const handleOpenSourceLink = () => Linking.openURL(PROJECT_URL)

  return (
    <View style={styles.container}>
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
          <View style={styles.linkButton} onTouchEnd={handleOpenSourceLink}>
            <Text style={styles.linkButtonText}>Открыть исходный код</Text>
            <Ionicons size={20} name='open-outline' color={COLORS.primary} />
          </View>
        </View>
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Разработано с любовью для прослушивания слова Божьего
          </Text>
        </View>
      </View>
    </View>
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
  content: { flex: 1, padding: INDENTS.high },
  footer: { alignItems: 'center', marginTop: 'auto', paddingVertical: INDENTS.high },
  footerText: { color: COLORS.textMuted, fontSize: FONT_SIZES.sm, textAlign: 'center' },
  linkButton: {
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: INDENTS.medium,
    padding: INDENTS.medium,
  },
  linkButtonText: { color: COLORS.primary, fontSize: FONT_SIZES.base, fontWeight: 'bold' },
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
