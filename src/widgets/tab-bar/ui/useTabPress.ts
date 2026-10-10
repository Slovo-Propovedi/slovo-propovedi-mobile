import { type Tabs } from 'expo-router'
import { useFeatureFlag } from 'entities/feature-flags'
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
}

export const UNAVAILABLE_TAB_TITLE = 'Скоро будет доступно'
export const UNAVAILABLE_TAB_MESSAGE = 'Этот раздел будет реализован в будущих обновлениях'

export const useTabPress = ({ navigation }: UseTabPressParams) => {
  // Табы «Читать» и «Учиться» открываются по фича-флагу. Пока флаги не
  // загружены, доступ закрыт (useFeatureFlag → false), то есть поведение
  // сохраняется прежним.
  const isReadEnabled = useFeatureFlag('read')
  const isStudyEnabled = useFeatureFlag('study')

  const isTabAvailable = (routeName: string) => {
    if (routeName === 'read') return isReadEnabled
    if (routeName === 'study') return isStudyEnabled

    return true
  }

  const handleTabPress = (route: TabRoute, isActive: boolean) => {
    if (!isTabAvailable(route.name)) {
      showInfo(UNAVAILABLE_TAB_MESSAGE, UNAVAILABLE_TAB_TITLE)
      return
    }

    const event = navigation.emit({
      canPreventDefault: true,
      target: route.key,
      type: 'tabPress',
    })

    if (!isActive && !event.defaultPrevented) navigation.navigate(route.name)
  }

  return { handleTabPress, isTabAvailable }
}
