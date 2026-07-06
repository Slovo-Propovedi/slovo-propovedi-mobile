import { useAtom } from '@reatom/npm-react'
import { type SuspenseFallbackProps, Tabs } from 'expo-router'
import { useState } from 'react'
import { ActivityIndicator, Text, View } from 'react-native'
import { ExpandablePlayer } from 'widgets/expandable-player'
import { CustomTabBar } from 'widgets/tab-bar'
import { isPlayerExpandedAtom } from 'entities/player'
import { COLORS, INDENTS } from 'shared/ui/themed'

interface TabLayout {
  width: number
  x: number
}

/**
 * Fallback component shown while the tab layout's route content is loading via Suspense.
 * @param _props - Standard Suspense fallback props (unused).
 */
export function SuspenseFallback(_props: SuspenseFallbackProps) {
  return (
    <View style={styles.suspenseContainer}>
      <ActivityIndicator size='large' color={COLORS.primary} />
      <Text style={styles.suspenseText}>Загрузка...</Text>
    </View>
  )
}

const Layout = () => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [tabLayouts, setTabLayoutsState] = useState<Record<string, TabLayout>>({})
  const [isPlayerExpanded] = useAtom(isPlayerExpandedAtom)

  const setTabLayout = (key: string, layout: TabLayout) => {
    setTabLayoutsState(prev => ({ ...prev, [key]: layout }))
  }

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{ headerShown: false }}
        tabBar={props => (
          <CustomTabBar
            {...props}
            tabLayouts={tabLayouts}
            currentIndex={currentIndex}
            setTabLayout={setTabLayout}
            setCurrentIndex={setCurrentIndex}
            hideFloatingPlayer={isPlayerExpanded}
          />
        )}
      >
        <Tabs.Screen name='listen' options={{ title: 'Слушать' }} />
        <Tabs.Screen name='read' options={{ title: 'Читать' }} />
        <Tabs.Screen name='study' options={{ title: 'Учаться' }} />
        <Tabs.Screen name='more' options={{ title: 'Еще' }} />
      </Tabs>
      <ExpandablePlayer />
    </View>
  )
}
export default Layout

const styles = {
  suspenseContainer: {
    alignItems: 'center' as const,
    backgroundColor: COLORS.background,
    flex: 1,
    gap: INDENTS.medium,
    justifyContent: 'center' as const,
  },
  suspenseText: {
    color: COLORS.text,
    fontSize: 16,
  },
}
