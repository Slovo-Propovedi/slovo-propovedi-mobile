import { useRouter } from 'expo-router'
import { StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { SettingsItem } from 'features/settings'
import { COLORS, INDENTS } from 'shared/ui/themed'

export const MoreScreen = () => {
  const router = useRouter()

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <SettingsItem
          title='Настройки'
          testID='settings-item'
          icon='settings-outline'
          onPress={() => router.push('/more/settings')}
        />
        <SettingsItem
          onPress={() => {}}
          testID='about-item'
          title='О приложении'
          description='Версия и информация'
          icon='information-circle-outline'
        />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background,
    flex: 1,
  },
  content: {
    flex: 1,
    paddingTop: INDENTS.high,
  },
})
