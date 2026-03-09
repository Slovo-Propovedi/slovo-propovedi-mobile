import { SceneMap } from 'react-native-tab-view'
import { FirstRoute, SecondRoute } from './scene-routes'

export const renderScene = SceneMap({
  first: FirstRoute,
  second: SecondRoute,
})
