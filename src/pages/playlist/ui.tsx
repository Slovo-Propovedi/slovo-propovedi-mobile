import { useNavigation } from '@react-navigation/native';
import React, { FC } from 'react';
import { StyleSheet } from 'react-native';
import { SermonsStackScreenProps, SermonsStackParamName, SermonsStackNavProp } from 'routing';
import { ListGroupList, Playlist } from 'features';

export const PlaylistScreen: FC<SermonsStackScreenProps<SermonsStackParamName.Playlist>> = ({
  route,
}) => {
  const { title, list, previewUrl, description } = route.params;

  const { navigate } = useNavigation<SermonsStackNavProp<SermonsStackParamName.Playlist>>();

  const getOnPressPlaylistItem = () => () => {
    console.log('navigate: ', navigate);
    // navigate(SermonsStackParamName.Sermon);

    console.log('sdfsd');
  };

  return (
    <Playlist
      style={styles.container}
      title={title}
      previewUrl={previewUrl}
      description={description}
    >
      <ListGroupList
        style={styles.list}
        groupList={list}
        onPressListItemGroup={getOnPressPlaylistItem()}
      />
    </Playlist>
  );
};

const styles = StyleSheet.create({ container: {}, list: {} });
