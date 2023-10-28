import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

interface DownloadAndCacheAudioProps {
  fileUri: string;
  onProgress?: (progress: number) => void;
  remoteUri: string;
}

const downloadAndCacheAudio = async ({
  fileUri,
  onProgress,
  remoteUri,
}: DownloadAndCacheAudioProps) => {
  const { exists } = await FileSystem.getInfoAsync(fileUri);

  if (exists) {
    return;
  }

  const downloadResumable = FileSystem.createDownloadResumable(
    remoteUri,
    fileUri,
    {},
    ({ totalBytesExpectedToWrite, totalBytesWritten }) =>
      onProgress?.(Math.floor((totalBytesWritten / totalBytesExpectedToWrite) * 100)),
  );

  try {
    await downloadResumable.downloadAsync();
  } catch (e) {
    console.error(e);
  }
};

export const loadCashedSoundData = async ({
  initialPosition,
  onProgress,
  remoteUri,
}: {
  initialPosition: number;
  onProgress?: (progress: number) => void;
  remoteUri: string;
}) => {
  const fileName = remoteUri.split('/').at(-1);

  if (!fileName) {
    return;
  }

  const fileUri = FileSystem.cacheDirectory + fileName;

  await downloadAndCacheAudio({ fileUri, onProgress, remoteUri });
  const { uri } = await FileSystem.getInfoAsync(fileUri);
  const audio = new Audio.Sound();
  const status = await audio.loadAsync({ uri }, { positionMillis: initialPosition });

  return { audio, status };
};
