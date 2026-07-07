import { ScrollView, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { DynamicSectionsSlider } from 'widgets/dynamic-sections-slider'
import { INDENTS, PLAYER_SIZES, useTheme } from 'shared/ui/themed'

export const ListenScreen = () => {
  const { currentTheme } = useTheme()

  return (
    <SafeAreaView style={[styles.listen, { backgroundColor: currentTheme.background }]}>
      <ScrollView
        style={[styles.content, { backgroundColor: currentTheme.background }]}
        contentContainerStyle={{
          paddingBottom: PLAYER_SIZES.tabBarHeight + PLAYER_SIZES.miniPlayerHeight + INDENTS.low,
        }}
      >
        <DynamicSectionsSlider />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  listen: {
    flex: 1,
  },
})
