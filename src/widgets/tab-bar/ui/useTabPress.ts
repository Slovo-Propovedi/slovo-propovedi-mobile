import { type Tabs } from 'expo-router'
import { useState } from 'react'

type TabBarNavigation = Parameters<
  NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>
>[0]['navigation']

interface TabRoute {
  key: string
  name: string
}

interface UseTabPressParams {
  navigation: TabBarNavigation
  setCurrentIndex: (index: number) => void
}

// Табы «Читать» и «Учиться» заблокированы до готовности разделов
export const isUnavailableTabRoute = (routeName: string) =>
  routeName === 'read' || routeName === 'study'

export const useTabPress = ({ navigation, setCurrentIndex }: UseTabPressParams) => {
  const [unavailableDialogVisible, setUnavailableDialogVisible] = useState(false)

  const hideUnavailableDialog = () => setUnavailableDialogVisible(false)

  const handleTabPress = (route: TabRoute, index: number, isActive: boolean) => {
    if (isUnavailableTabRoute(route.name)) {
      setUnavailableDialogVisible(true)
      return
    }

    const event = navigation.emit({
      canPreventDefault: true,
      target: route.key,
      type: 'tabPress',
    })

    if (!isActive && !event.defaultPrevented) navigation.navigate(route.name)

    setCurrentIndex(index)
  }

  return { handleTabPress, hideUnavailableDialog, unavailableDialogVisible }
}
