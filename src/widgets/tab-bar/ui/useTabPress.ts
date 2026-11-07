import { type Tabs } from 'expo-router'
import { useFeatureFlag } from 'entities/feature-flags'
import { showInfo } from 'shared/model/info-dialog'

type NavigateToTab = TabBarProps['navigateToTab']

type TabBarEmitter = TabBarProps['emitter']

type TabBarProps = Parameters<NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>>[0]

interface TabRoute {
  key: string
  name: string
}

interface UseTabPressParams {
  emitter: TabBarEmitter
  navigateToTab: NavigateToTab
}

export const UNAVAILABLE_TAB_TITLE = 'Скоро будет доступно'
export const UNAVAILABLE_TAB_MESSAGE = 'Этот раздел будет реализован в будущих обновлениях'

export const useTabPress = ({ emitter, navigateToTab }: UseTabPressParams) => {
  // Таб «Читать» открывается по фича-флагу. Пока флаги не загружены, доступ
  // закрыт (useFeatureFlag → false), то есть поведение сохраняется прежним.
  const isReadEnabled = useFeatureFlag('read')

  const isTabAvailable = (routeName: string) => {
    if (routeName === 'read') return isReadEnabled

    return true
  }

  const handleTabPress = (route: TabRoute, isActive: boolean) => {
    if (!isTabAvailable(route.name)) {
      showInfo(UNAVAILABLE_TAB_MESSAGE, UNAVAILABLE_TAB_TITLE)
      return
    }

    const event = emitter.emit({
      canPreventDefault: true,
      target: route.key,
      type: 'tabPress',
    })

    if (!isActive && !event.defaultPrevented) navigateToTab(route.key)
  }

  return { handleTabPress, isTabAvailable }
}
