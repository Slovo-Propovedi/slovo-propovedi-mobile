import { BottomTabBar, type BottomTabBarProps } from '@react-navigation/bottom-tabs'
import { useAtom } from '@reatom/npm-react'
import React from 'react'
import { Text, TouchableOpacity, View } from 'react-native'
import { MiniPlayer } from 'widgets/mini-player'
import { isAudioPlayerMountedAtom } from 'shared/model'
import { RootTabName } from 'shared/routing'

export const CustomTabBar = ({
  descriptors,
  insets,
  navigation,
  state,
  state: {
    routes: { [state.index]: currentTab },
  },
}: BottomTabBarProps) => {
  const [isAudioPlayerMounted] = useAtom(isAudioPlayerMountedAtom)

  return (
    <View>
      {!(currentTab.name === RootTabName.Listen && isAudioPlayerMounted) && <MiniPlayer />}
      <BottomTabBar
        state={state}
        insets={insets}
        navigation={navigation}
        descriptors={descriptors}
      />
      <View
        style={{
          borderTopWidth: 1,
          flexDirection: 'row',
          justifyContent: 'space-between',
          padding: 10,
          shadowColor: 'transparent',
        }}
      >
        {state.routes.map(({ key, name, params }) => {
          const { options } = descriptors[key]
          const { tabBarActiveTintColor, tabBarIcon, tabBarInactiveTintColor } = options

          const isActive = key === currentTab.key

          const color = (isActive ? tabBarActiveTintColor : tabBarInactiveTintColor) || 'gray'

          return (
            <TouchableOpacity key={key} onPress={() => navigation.navigate(name, params)}>
              <View style={{ alignItems: 'center' }}>
                {tabBarIcon?.({
                  color: color,
                  focused: isActive,
                  size: 20,
                })}
                <Text style={{ color: color }}>{name}</Text>
              </View>
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}
