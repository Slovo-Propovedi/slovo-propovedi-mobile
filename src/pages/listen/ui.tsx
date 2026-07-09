import { ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { DynamicSectionsSlider } from 'widgets/dynamic-sections-slider'
import { PLAYER_SIZES, useTheme } from 'shared/ui/themed'

export const ListenScreen = () => {
  const { currentTheme } = useTheme()

  return (
    <SafeAreaView style={{ backgroundColor: currentTheme.background, flex: 1 }}>
      <ScrollView
        style={{ backgroundColor: currentTheme.background, flex: 1 }}
        contentContainerStyle={{
          paddingBottom: PLAYER_SIZES.tabBarHeight + PLAYER_SIZES.miniPlayerHeight,
        }}
      >
        <DynamicSectionsSlider />
      </ScrollView>
    </SafeAreaView>
  )
}
