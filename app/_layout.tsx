import { reatomContext } from '@reatom/npm-react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { initializePlayer } from 'entities/player'
import { ctx } from 'shared/lib/reatom-ctx'
import RootLayout from './_RootLayout'

const RootLayoutWithProvider = () => (
  <reatomContext.Provider value={ctx}>
    <GestureHandlerRootView style={{ flex: 1 }}>
      <RootLayout />
    </GestureHandlerRootView>
  </reatomContext.Provider>
)

void initializePlayer()

export default RootLayoutWithProvider
