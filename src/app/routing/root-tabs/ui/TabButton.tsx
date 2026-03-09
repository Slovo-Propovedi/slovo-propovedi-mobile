import React from 'react'
import { Text, TouchableOpacity, View } from 'react-native'
import { type RootTabName } from 'shared/routing'
import type { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs'
import { styles } from '../custom-tab-bar.styles'

interface TabButtonProps {
  isActive: boolean
  name: RootTabName
  onLayout: (layout: { width: number; x: number }) => void
  onPress: () => void
  options: BottomTabNavigationOptions
}

export const TabButton = ({ isActive, name, onLayout, onPress, options }: TabButtonProps) => {
  const { tabBarActiveTintColor, tabBarIcon, tabBarInactiveTintColor } = options
  const color = (isActive ? tabBarActiveTintColor : tabBarInactiveTintColor) || 'gray'

  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.tabButton}
      onLayout={e =>
        onLayout({
          width: e.nativeEvent.layout.width,
          x: e.nativeEvent.layout.x,
        })
      }
    >
      <View style={styles.tabItem}>
        {tabBarIcon?.({
          color,
          focused: isActive,
          size: 22,
        })}
        {isActive && <Text style={[styles.tabText, { color }]}>{name}</Text>}
      </View>
    </TouchableOpacity>
  )
}
