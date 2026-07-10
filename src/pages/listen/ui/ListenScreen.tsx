import { ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { PLAYER_SIZES, useTheme } from 'shared/ui/themed'
import { DynamicSectionsSlider } from './DynamicSectionsSlider'

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
