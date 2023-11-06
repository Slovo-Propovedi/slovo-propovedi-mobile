import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

interface DownloadAndCacheAudioProps {
  fileUri: string;
  remoteUri: string;
}

const downloadAndCacheAudio = async ({ fileUri, remoteUri }: DownloadAndCacheAudioProps) => {
  const { exists } = await FileSystem.getInfoAsync(fileUri);

  if (exists) {
    return;
  }

  await FileSystem.downloadAsync(remoteUri, fileUri, {
    sessionType: FileSystem.FileSystemSessionType.BACKGROUND,
  });
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

  const audiosDir = `${FileSystem.cacheDirectory}Audios/`;
  const audiosDirInfo = await FileSystem.getInfoAsync(audiosDir);

  if (!audiosDirInfo.exists) {
    await FileSystem.makeDirectoryAsync(audiosDir);
  } else {
    const audiosInCache = await FileSystem.readDirectoryAsync(audiosDir);

    for (const fileNameInCache of audiosInCache) {
      if (fileName !== fileNameInCache) {
        await FileSystem.deleteAsync(`${audiosDir}${fileNameInCache}`, { idempotent: true });
      }
    }
  }

  const fileUri = `${audiosDir}${fileName}`;

  await downloadAndCacheAudio({ fileUri, remoteUri });

  const audio = new Audio.Sound();
  const status = await audio.loadAsync(
    { uri: fileUri },
    { positionMillis: initialPosition, progressUpdateIntervalMillis: 1000 },
    false,
  );

  return { audio, status };
};
