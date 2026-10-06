import { useAtom } from '@reatom/npm-react'
import { type SuspenseFallbackProps, Tabs } from 'expo-router'
import { ActivityIndicator, Text, View } from 'react-native'
import { PlaylistSheetMenu } from 'pages/playlist'
import { ExpandablePlayer } from 'widgets/expandable-player'
import { CustomTabBar } from 'widgets/tab-bar'
import { isPlayerExpandedAtom } from 'entities/player'
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
  const [isPlayerExpanded] = useAtom(isPlayerExpandedAtom)

  return (
    <View style={{ backgroundColor: currentTheme.background, flex: 1 }}>
      <Tabs
        screenOptions={{ headerShown: false }}
        tabBar={props => <CustomTabBar {...props} hideFloatingPlayer={isPlayerExpanded} />}
      >
        <Tabs.Screen name='listen' options={{ title: 'Слушать' }} />
        <Tabs.Screen name='read' options={{ title: 'Читать' }} />
        <Tabs.Screen name='study' options={{ title: 'Учиться' }} />
        <Tabs.Screen name='more' options={{ title: 'Ещё' }} />
      </Tabs>
      <ExpandablePlayer playlistMenuComponent={PlaylistSheetMenu} />
    </View>
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
