import { FontAwesome } from '@expo/vector-icons';
import React, { useState } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
// import systemSetting from 'react-native-system-setting';
import { COLORS, Progress } from 'shared';

export const PlayerSoundVolume = ({ style }: { style?: StyleProp<ViewStyle> }) => {
  // const { changeProgressPosition, duration, position } = usePlayer();

  const [volume, setVolume] = useState(0);

  const onChangeProgressValue = (newProgressValue: number) => {
    setVolume(newProgressValue);

    // for (const key in systemSetting) {
    //   console.log('key: ', key);
    // }

    // systemSetting.setVolume(newProgressValue);
    // console.log('systemSetting: ', systemSetting);
  };

  const iconsSize = 24;

  // useEffect(() => {
  //   const volumeListener = systemSetting.addVolumeListener((data) => {
  //     data.value;
  //     console.log(data.value);
  //   });

  //   return () => systemSetting.removeVolumeListener(volumeListener);
  // }, []);

  return (
    <View
      style={[styles.container, { paddingLeft: iconsSize, paddingRight: iconsSize * 1.5 }, style]}
    >
      <FontAwesome
        color={COLORS.black}
        name='volume-off'
        size={iconsSize}
        style={styles.volumeOff}
      />
      <Progress onChangeProgressValue={onChangeProgressValue} progress={volume} total={100} />
      <FontAwesome color={COLORS.black} name='volume-up' size={iconsSize} style={styles.volumeUp} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { justifyContent: 'center', width: '100%' },
  volumeOff: { left: 0, position: 'absolute' },
  volumeUp: { position: 'absolute', right: 0 },
});
