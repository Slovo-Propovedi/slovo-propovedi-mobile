import { ScrollView, StatusBar, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { DynamicSectionsSlider } from 'widgets/dynamic-sections-slider'
import { COLORS } from 'shared/ui/themed'

export const ListenScreen = () => (
  <SafeAreaView style={styles.listen}>
    <StatusBar translucent barStyle='light-content' backgroundColor='transparent' />
    <ScrollView style={styles.content}>
      <DynamicSectionsSlider />
    </ScrollView>
  </SafeAreaView>
)

const styles = StyleSheet.create({
  content: {
    backgroundColor: COLORS.background,
    marginBottom: 100, // Keep padding for mini player
  },
  listen: {
    backgroundColor: COLORS.background,
    flex: 1,
  },
})
