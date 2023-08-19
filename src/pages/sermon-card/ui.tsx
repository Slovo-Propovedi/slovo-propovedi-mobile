import React from 'react';
import { StyleSheet } from 'react-native';
import { SermonsStackScreenProps, SermonsStackParamName } from 'routing';
import { SermonCard } from 'widgets';

export const SermonCardScreen: React.FC<
  SermonsStackScreenProps<SermonsStackParamName.SermonCard>
> = ({ route }) => {
  const { title, fragments, verse, chapter, description } = route.params;

  return (
    <SermonCard
      style={styles.card}
      title={title}
      fragments={fragments}
      verse={verse}
      chapter={chapter}
      description={description}
    />
  );
};

const styles = StyleSheet.create({ card: {} });
