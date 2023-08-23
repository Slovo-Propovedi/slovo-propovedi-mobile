import { useNavigation } from '@react-navigation/native';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { SermonsStackNavProp, SermonsStackParamName } from 'routing';
import { FetchedPlaylist, TouchableTextItem } from 'shared';
import { useTopicalListStore } from './model';

export const TopicalList = () => {
  const { navigate } = useNavigation<SermonsStackNavProp<SermonsStackParamName.SermonsTabs>>();

  const { topicalList, getTopicalList } = useTopicalListStore((state) => ({
    topicalList: state.topicalList,
    getTopicalList: state.getTopicalList,
  }));

  const getOnBibleBooksListItemPress = (params: FetchedPlaylist) => () => {
    navigate(SermonsStackParamName.Playlist, params);
  };

  useEffect(() => {
    getTopicalList();
  }, []);

  // TODO здесь должен быть не список заголовков, а плитки с превью
  return (
    <View style={styles.list}>
      {topicalList.map((element) => (
        <TouchableTextItem
          key={element.title}
          onPress={getOnBibleBooksListItemPress(element)}
          title={element.title}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
});
