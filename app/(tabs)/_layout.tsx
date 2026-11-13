import { type SuspenseFallbackProps, Tabs } from 'expo-router'
import { ActivityIndicator, Text, View } from 'react-native'
import { PlaylistSheetMenu } from 'pages/playlist'
import { SearchGate } from 'pages/search'
import { ExpandablePlayer } from 'widgets/expandable-player'
import { CustomTabBar } from 'widgets/tab-bar'
import { BlurTargetProvider } from 'shared/ui'
import { COLORS, INDENTS, useTheme } from 'shared/ui/theme'

/**
 * Fallback component shown while the tab layout's route content is loading via Suspense.
 * @param _props - Standard Suspense fallback props (unused).
 */
export function SuspenseFallback(_props: SuspenseFallbackProps) {
  const { currentTheme } = useTheme()
  return (
    <View style={[styles.suspenseContainer, { backgroundColor: currentTheme.background }]}>
      <ActivityIndicator size='large' color={COLORS.primary} />
      <Text style={[styles.suspenseText, { color: currentTheme.text }]}>Загрузка...</Text>
    </View>
  )
}

const Layout = () => {
  const { currentTheme } = useTheme()

  return (
    <BlurTargetProvider>
      <View style={{ backgroundColor: currentTheme.background, flex: 1 }}>
        <Tabs
          screenOptions={{ headerShown: false }}
          tabBar={props => (
            <>
              <SearchGate />
              <CustomTabBar {...props} hasMiniPlayer />
            </>
          )}
        >
          <Tabs.Screen name='listen' options={{ title: 'Слушать' }} />
          <Tabs.Screen name='read' options={{ title: 'Читать' }} />
          <Tabs.Screen name='more' options={{ title: 'Ещё' }} />
        </Tabs>
        {/* Search overlay lives INSIDE the tabBar element, before the bar: on web
            every RN View is a stacking context, so a layout-level zIndex 5 could
            never beat the bar nested in the navigator wrapper. Sharing the
            tabBar element gives screens (-1/0) < gate (5) < bar (10) in one
            context; native flattening preserves that order. The player stays a
            layout-level sibling so its zIndex 20 covers everything. */}
        <ExpandablePlayer playlistMenuComponent={PlaylistSheetMenu} />
      </View>
    </BlurTargetProvider>
  )
}
export default Layout

const styles = {
  suspenseContainer: {
    alignItems: 'center' as const,
    flex: 1,
    gap: INDENTS.medium,
    justifyContent: 'center' as const,
  },
  suspenseText: {
    fontSize: 16,
  },
}
