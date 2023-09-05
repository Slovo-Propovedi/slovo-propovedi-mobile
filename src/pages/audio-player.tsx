import React from 'react';
import { ListenStackScreenProps, ListenStackParamName } from 'routing';
import { AudioPlayer } from 'features';

export const AudioPlayerScreen: React.FC<
  ListenStackScreenProps<ListenStackParamName.AudioPlayer>
> = ({ route: { params } }) => <AudioPlayer data={params} />;
