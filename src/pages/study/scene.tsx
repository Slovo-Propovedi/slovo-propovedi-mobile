import React from 'react';
import { View } from 'react-native';
import { SceneMap } from 'react-native-tab-view';

const FirstRoute = () => <View style={{ backgroundColor: 'gray', flex: 1 }} />;

const SecondRoute = () => <View style={{ backgroundColor: '#673ab7', flex: 1 }} />;

export const renderScene = SceneMap({
  first: FirstRoute,
  second: SecondRoute,
});
