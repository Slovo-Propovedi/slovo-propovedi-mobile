import React, { FC } from 'react';
import { StyleSheet } from 'react-native';
import { SermonsStackScreenProps, SermonsStackParamName } from 'routing';
import { SermonCard } from 'features';

export const SermonCardScreen: FC<SermonsStackScreenProps<SermonsStackParamName.SermonCard>> = ({
  route,
}) => {
  const { title, audioUrl, description, textFileUrl, youtubeUrl } = route.params;

  return (
    <SermonCard
      style={styles.card}
      title={title}
      audioUrl={audioUrl}
      description={description}
      textFileUrl={textFileUrl}
      youtubeUrl={youtubeUrl}
    />
  );
};

const styles = StyleSheet.create({ card: {} });
