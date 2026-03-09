import { createNativeStackNavigator } from '@react-navigation/native-stack'
import React from 'react'
import { StudyScreen } from 'pages/study'
import { StudyStackParamName } from 'shared/routing'
import type { RootTabName, RootTabsScreenProps, StudyStackParamList } from 'shared/routing'

const StudyStack = createNativeStackNavigator<StudyStackParamList>()

export const StudyRouting: React.FC<RootTabsScreenProps<RootTabName.Study>> = () => (
  <StudyStack.Navigator
    initialRouteName={StudyStackParamName.Home}
    screenOptions={{
      headerShown: false,
    }}
  >
    <StudyStack.Screen component={StudyScreen} name={StudyStackParamName.Home} />
  </StudyStack.Navigator>
)
