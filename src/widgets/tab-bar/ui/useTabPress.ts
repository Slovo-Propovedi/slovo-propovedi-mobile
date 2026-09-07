import { type Tabs } from 'expo-router'
import { showInfo } from 'shared/model/info-dialog'

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

export const UNAVAILABLE_TAB_TITLE = 'Скоро будет доступно'
export const UNAVAILABLE_TAB_MESSAGE = 'Этот раздел будет реализован в будущих обновлениях'

// Табы «Читать» и «Учиться» заблокированы до готовности разделов
export const isUnavailableTabRoute = (routeName: string) =>
  routeName === 'read' || routeName === 'study'

export const useTabPress = ({ navigation, setCurrentIndex }: UseTabPressParams) => {
  const handleTabPress = (route: TabRoute, index: number, isActive: boolean) => {
    if (isUnavailableTabRoute(route.name)) {
      showInfo(UNAVAILABLE_TAB_MESSAGE, UNAVAILABLE_TAB_TITLE)
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

  return { handleTabPress }
}
