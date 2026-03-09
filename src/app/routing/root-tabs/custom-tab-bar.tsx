import { type BottomTabBarProps } from '@react-navigation/bottom-tabs'
import { useAtom } from '@reatom/npm-react'
import React from 'react'
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { MiniPlayer } from 'widgets/mini-player'
import { isAudioPlayerMountedAtom } from 'shared/model'
import { RootTabName } from 'shared/routing'

const BORDER_RADIUS = 30

export const CustomTabBar = ({
  descriptors,
  navigation,
  state,
  state: {
    routes: { [state.index]: currentTab },
  },
}: BottomTabBarProps) => {
  const [isAudioPlayerMounted] = useAtom(isAudioPlayerMountedAtom)

  const showMiniPlayer = !(currentTab.name === RootTabName.Listen && isAudioPlayerMounted)

  return (
    <View style={styles.floatingContainer}>
      <View style={styles.floatingIsland}>
        {showMiniPlayer && (
          <View style={styles.miniPlayerWrapper}>
            <MiniPlayer />
          </View>
        )}
        <View style={styles.tabBar}>
          {state.routes.map(({ key, name, params }) => {
            const { options } = descriptors[key]
            const { tabBarActiveTintColor, tabBarIcon, tabBarInactiveTintColor } = options

            const isActive = key === currentTab.key

            const color = (isActive ? tabBarActiveTintColor : tabBarInactiveTintColor) || 'gray'

            return (
              <TouchableOpacity key={key} onPress={() => navigation.navigate(name, params)}>
                <View style={styles.tabItem}>
                  {tabBarIcon?.({
                    color: color,
                    focused: isActive,
                    size: 22,
                  })}
                  <Text style={[styles.tabText, { color: color }]}>{name}</Text>
                </View>
              </TouchableOpacity>
            )
          })}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  floatingContainer: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  floatingIsland: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: BORDER_RADIUS,
    borderWidth: 1,
    bottom: 10,
    elevation: 12,
    left: 10,
    marginHorizontal: Platform.OS === 'web' ? 0 : 10,
    overflow: 'hidden',
    position: 'absolute',
    right: 10,
    shadowColor: '#000',
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    ...(Platform.OS === 'web'
      ? {
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        }
      : {}),
  },
  miniPlayerWrapper: {
    borderTopLeftRadius: BORDER_RADIUS,
    borderTopRightRadius: BORDER_RADIUS,
    overflow: 'hidden',
  },
  tabBar: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderBottomLeftRadius: BORDER_RADIUS,
    borderBottomRightRadius: BORDER_RADIUS,
    borderTopColor: 'rgba(255, 255, 255, 0.5)',
    borderTopLeftRadius: BORDER_RADIUS,
    borderTopRightRadius: BORDER_RADIUS,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: -BORDER_RADIUS / 2,
    paddingTop: BORDER_RADIUS / 2 + 8,
    paddingVertical: 8,
  },
  tabItem: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  tabText: {
    fontSize: 11,
    marginTop: 4,
  },
})
