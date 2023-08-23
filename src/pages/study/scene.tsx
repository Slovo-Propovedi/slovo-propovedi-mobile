import React from 'react';
import { View } from 'react-native';
import { SceneMap } from 'react-native-tab-view';

const FirstRoute = () => <View style={{ flex: 1, backgroundColor: 'gray' }} />;

const SecondRoute = () => <View style={{ flex: 1, backgroundColor: '#673ab7' }} />;

export const renderScene = SceneMap({
  first: FirstRoute,
  second: SecondRoute,
});
