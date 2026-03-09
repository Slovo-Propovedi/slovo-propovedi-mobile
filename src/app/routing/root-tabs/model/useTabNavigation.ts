import { type BottomTabNavigationEventMap } from '@react-navigation/bottom-tabs'
import { CommonActions, type NavigationHelpers } from '@react-navigation/native'
import { useCallback } from 'react'
import {
  ListenStackParamName,
  ReadStackParamName,
  RootTabName,
  StudyStackParamName,
} from 'shared/routing'
import type { RootTabsParamList } from 'shared/routing'

const TAB_INITIAL_SCREENS: Partial<Record<RootTabName, string>> = {
  [RootTabName.Listen]: ListenStackParamName.ListenHome,
  [RootTabName.Read]: ReadStackParamName.Home,
  [RootTabName.Study]: StudyStackParamName.Home,
}

export const useTabNavigation = ({
  navigation,
}: {
  navigation: NavigationHelpers<RootTabsParamList, BottomTabNavigationEventMap>
}) =>
  useCallback(
    (name: RootTabName, params: unknown, isActive: boolean) => {
      if (isActive && TAB_INITIAL_SCREENS[name])
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name, params: { params, screen: TAB_INITIAL_SCREENS[name] } }],
          }),
        )
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- correct
      else navigation.navigate(name, params as any)
    },
    [navigation],
  )
