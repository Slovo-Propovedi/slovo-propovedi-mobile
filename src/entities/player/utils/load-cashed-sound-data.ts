import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

interface DownloadAndCacheAudioProps {
  fileUri: string;
  remoteUri: string;
}

const downloadAndCacheAudio = async ({ fileUri, remoteUri }: DownloadAndCacheAudioProps) => {
  const fileName = remoteUri.split('/').at(-1);

  if (!fileName) {
    return;
  }

  const tempUri = await FileSystem.downloadAsync(remoteUri, fileUri, {
    sessionType: FileSystem.FileSystemSessionType.BACKGROUND,
  });

  try {
    await FileSystem.copyAsync({ from: tempUri.uri, to: fileUri });
  } catch (error) {
    console.log('Error copying file to cache directory:', error);
  }
};

export const loadCachedSoundData = async ({
  initialPosition,
  remoteUri,
}: {
  initialPosition: number;
  remoteUri: string;
}) => {
  const fileName = remoteUri.split('/').at(-1);

  if (!fileName) {
    return;
  }

  const fileUri = FileSystem.cacheDirectory + fileName;

  const { exists, uri } = await FileSystem.getInfoAsync(fileUri);

  if (!exists) {
    downloadAndCacheAudio({ fileUri, remoteUri });
  }

  const audio = new Audio.Sound();
  const status = await audio.loadAsync(
    { uri: uri || fileUri },
    { positionMillis: initialPosition },
    false,
  );

  return { audio, status };
};
