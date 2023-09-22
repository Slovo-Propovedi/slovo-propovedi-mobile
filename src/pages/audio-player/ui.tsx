import React from 'react';
import { ListenStackParamName, ListenStackScreenProps } from 'routing';
import { AudioPlayerFullscreen } from 'widgets';

// Не тестируется также из-за ошибки в библиотеке expo-av

export const AudioPlayerScreen: React.FC<
  ListenStackScreenProps<ListenStackParamName.AudioPlayer>
> = () => <AudioPlayerFullscreen />;
