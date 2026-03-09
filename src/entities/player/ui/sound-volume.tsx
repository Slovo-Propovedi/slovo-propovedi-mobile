import { FontAwesome } from '@expo/vector-icons'
import React, { useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { COLORS } from 'shared/themed'
import { Progress } from 'shared/ui'
import type { StyleProp, ViewStyle } from 'react-native'

export const PlayerSoundVolume = ({ style }: { style?: StyleProp<ViewStyle> }) => {
  // const { changeProgressPosition, duration, position } = usePlayer();

  const [volume, setVolume] = useState(0)

  const onChangeProgressValue = (newProgressValue: number) => {
    setVolume(newProgressValue)

    // for (const key in systemSetting) {
    //   console.log('key: ', key);
    // }

    // systemSetting.setVolume(newProgressValue);
    // console.log('systemSetting: ', systemSetting);
  }

  const iconsSize = 24

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
        size={iconsSize}
        name='volume-off'
        color={COLORS.black}
        style={styles.volumeOff}
      />
      <Progress total={100} progress={volume} onChangeProgressValue={onChangeProgressValue} />
      <FontAwesome name='volume-up' size={iconsSize} color={COLORS.black} style={styles.volumeUp} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { justifyContent: 'center', width: '100%' },
  volumeOff: { left: 0, position: 'absolute' },
  volumeUp: { position: 'absolute', right: 0 },
})
