import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { StyleSheet } from 'react-native';
import { SermonsStackScreenProps, SermonsStackParamName, SermonsStackNavProp } from 'routing';
import { ListGroupList, Playlist } from 'features';
import { OnPressListItemGroup } from 'entities';
import { SermonData } from 'shared';

export const PlaylistScreen: React.FC<SermonsStackScreenProps<SermonsStackParamName.Playlist>> = ({
  route,
}) => {
  const { title, list, previewUrl, description } = route.params;

  const { navigate } = useNavigation<SermonsStackNavProp<SermonsStackParamName.Playlist>>();

  const getOnPressPlaylistItem: OnPressListItemGroup<SermonData> = (options) => {
    navigate(SermonsStackParamName.SermonCard, options);
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
        onPressListItemGroup={getOnPressPlaylistItem}
      />
    </Playlist>
  );
};

const styles = StyleSheet.create({ container: {}, list: {} });
