import * as FileSystem from 'expo-file-system';
import { ActivityAction, startActivityAsync } from 'expo-intent-launcher';
import { Linking, Platform } from 'react-native';
import { MimeType } from 'shared/types';

type DownloadFileArgs = {
  url: string;
  filename: string;
  mimeType: MimeType;
};

export const downloadFile = async ({ url, filename, mimeType }: DownloadFileArgs) => {
  // Скачивание пока не работает

  if (Platform.OS === 'android') {
    try {
      const fileUri = FileSystem.documentDirectory + filename;
      const { uri: downloadedFileUri } = await FileSystem.downloadAsync(url, fileUri);
      console.log('downloadedFileUri: ', downloadedFileUri);
      if (downloadedFileUri) {
        //открываем загруженный файл
        await startActivityAsync(ActivityAction.APPLICATION_DETAILS_SETTINGS, {
          data: downloadedFileUri,
          type: mimeType,
        });
      }
    } catch (error) {
      console.error('Ошибка при скачивании файла:', error);
    }
  } else {
    await Linking.openURL(url);
  }
};
