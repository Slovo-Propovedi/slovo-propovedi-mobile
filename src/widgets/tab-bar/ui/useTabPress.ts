import { useAction, useAtom } from '@reatom/npm-react'
import { type Tabs } from 'expo-router'
import { closeSearch, isSearchOpenAtom } from 'features/sermon-search'
import { useFeatureFlag } from 'entities/feature-flags'
import { showInfo } from 'shared/model/info-dialog'
import { isBarCollapsedAtom, setBarCollapsed } from 'shared/ui/layout'

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
  const [isBarCollapsed] = useAtom(isBarCollapsedAtom)
  const [isSearchOpen] = useAtom(isSearchOpenAtom)
  const applyBarCollapsed = useAction(setBarCollapsed)
  const closeSearchAction = useAction(closeSearch)

  const isTabAvailable = (routeName: string) => {
    if (routeName === 'read') return isReadEnabled

    return true
  }

  const handleTabPress = (route: TabRoute, isActive: boolean) => {
    if (!isTabAvailable(route.name)) {
      showInfo(UNAVAILABLE_TAB_MESSAGE, UNAVAILABLE_TAB_TITLE)
      return
    }

    // Collapsed, the island shows only the active tab's circle: pressing it
    // expands the bar instead of the fully silent no-op it is when expanded.
    if (isActive && isBarCollapsed) {
      applyBarCollapsed(false)
      return
    }

    const event = emitter.emit({
      canPreventDefault: true,
      target: route.key,
      type: 'tabPress',
    })

    if (!isActive && !event.defaultPrevented) {
      // The search field only exists on the listen screen: leaving the tab
      // closes it instead of leaking the open state to the next screen.
      if (isSearchOpen) void closeSearchAction()
      navigateToTab(route.key)
    }
  }

  return { handleTabPress, isTabAvailable }
}
