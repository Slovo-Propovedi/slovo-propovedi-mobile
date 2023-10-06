import { BottomTabBar, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import React from 'react';
import { View } from 'react-native';
import {
  SermonPlayerControls,
  useSermonPlayerControlsStore,
} from 'features/sermon-player-controls';
import { PlayerListenProgress } from 'entities/player';
import { RootTabName, useAppStore } from 'shared';

export const CustomTabBar = (props: BottomTabBarProps) => {
  const { currentAudio } = useSermonPlayerControlsStore(({ currentAudio }) => ({
    currentAudio,
  }));

  const { /* descriptors, navigation, */ state } = props;

  const currentTab = state.routes[state.index];

  const { isAudioPlayerMounted } = useAppStore(({ isAudioPlayerMounted }) => ({
    isAudioPlayerMounted,
  }));

  return (
    <View>
      {currentAudio && (currentTab.name === RootTabName.Listen ? !isAudioPlayerMounted : true) && (
        <View>
          <PlayerListenProgress />
          <SermonPlayerControls />
        </View>
      )}
      <BottomTabBar {...props} />

      {/* <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          borderTopWidth: 1,
          shadowColor: 'transparent',
          padding: 10,
        }}
      >
        {state.routes.map(({ name, key, params }) => {
          const { options } = descriptors[key];
          const { tabBarIcon, tabBarActiveTintColor, tabBarInactiveTintColor } = options;

          const isActive = key === currentTab.key;

          const color = (isActive ? tabBarActiveTintColor : tabBarInactiveTintColor) || 'gray';

          return (
            <TouchableOpacity key={key} onPress={() => navigation.navigate(name, params)}>
              <View style={{ alignItems: 'center' }}>
                {tabBarIcon?.({
                  size: 20,
                  focused: isActive,
                  color: color,
                })}
                <Text style={{ color: color }}>{name}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View> */}
    </View>
  );
};
