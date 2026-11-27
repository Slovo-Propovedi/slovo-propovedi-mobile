import { useAction, useAtom } from '@reatom/npm-react'
import { useFeatureFlag } from 'entities/feature-flags'
import { showInfo } from 'shared/model/info-dialog'
import { isBarCollapsedAtom, setBarCollapsed } from 'shared/ui/layout'
import { type TabBarProps } from '../lib/tabBarTypes'

type NavigateToTab = TabBarProps['navigateToTab']

type TabBarEmitter = TabBarProps['emitter']

interface TabRoute {
  key: string
  name: string
}

interface UseTabPressParams {
  emitter: TabBarEmitter
  /** Whether the filtered `/search` route currently owns the tabs navigator. */
  isSearchFocused: boolean
  navigateToTab: NavigateToTab
  /** Starts the capsule's glide on the press tick, before the route re-render. */
  onTabTravel?: (routeKey: string) => void
}

export const UNAVAILABLE_TAB_TITLE = 'Скоро будет доступно'
export const UNAVAILABLE_TAB_MESSAGE = 'Этот раздел будет реализован в будущих обновлениях'

export const useTabPress = ({
  emitter,
  isSearchFocused,
  navigateToTab,
  onTabTravel,
}: UseTabPressParams) => {
  // Таб «Читать» открывается по фича-флагу. Пока флаги не загружены, доступ
  // закрыт (useFeatureFlag → false), то есть поведение сохраняется прежним.
  const isReadEnabled = useFeatureFlag('read')
  const [isBarCollapsed] = useAtom(isBarCollapsedAtom)
  const applyBarCollapsed = useAction(setBarCollapsed)

  const isTabAvailable = (routeName: string) => {
    if (routeName === 'read') return isReadEnabled

    return true
  }

  const handleTabPress = (route: TabRoute, isActive: boolean) => {
    if (!isTabAvailable(route.name)) {
      showInfo(UNAVAILABLE_TAB_MESSAGE, UNAVAILABLE_TAB_TITLE)
      return
    }

    // While `/search` owns the navigator the rendered "active" tab is only the
    // remembered pre-search tab — the search route itself is focused. Pressing
    // any tab (including that one) must change the route so the leave effect
    // closes the session; the usual active-tab no-op would trap the user.
    if (isSearchFocused) {
      const searchEvent = emitter.emit({
        canPreventDefault: true,
        target: route.key,
        type: 'tabPress',
      })

      if (!searchEvent.defaultPrevented) {
        onTabTravel?.(route.key)
        navigateToTab(route.key)
      }

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
      onTabTravel?.(route.key)
      navigateToTab(route.key)
    }
  }

  return { handleTabPress, isTabAvailable }
}
