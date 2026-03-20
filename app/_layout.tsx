import { reatomContext } from '@reatom/npm-react'
import React from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { ctx } from './_ctx'
import RootLayout from './_RootLayout'

const RootLayoutWithProvider = () => (
  <reatomContext.Provider value={ctx}>
    <GestureHandlerRootView style={{ flex: 1 }}>
      <RootLayout />
    </GestureHandlerRootView>
  </reatomContext.Provider>
)

export default RootLayoutWithProvider
