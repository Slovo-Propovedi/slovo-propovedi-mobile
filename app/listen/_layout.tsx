import { AntDesign } from '@expo/vector-icons'
import { Stack } from 'expo-router'
import React from 'react'
import { TouchableOpacity } from 'react-native'
import { COLORS } from 'shared/themed'

const ListenLayout = () => (
  <Stack
    screenOptions={{
      headerLeft: ({ canGoBack, tintColor }) => {
        if (!canGoBack) return null
        return (
          <TouchableOpacity onPress={() => {}}>
            <AntDesign size={24} name='left-circle' color={tintColor ?? COLORS.primary} />
          </TouchableOpacity>
        )
      },
      headerTintColor: COLORS.primary,
      headerTitle: '',
      headerTransparent: true,
    }}
  >
    <Stack.Screen
      name='audio-player'
      options={{
        headerShown: false,
      }}
    />
    <Stack.Screen name='playlist-list' />
    <Stack.Screen name='playlist' />
  </Stack>
)

export default ListenLayout
