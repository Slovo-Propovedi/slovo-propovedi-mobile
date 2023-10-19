import * as FileSystem from 'expo-file-system';
import { Linking, Platform } from 'react-native';
import type { MimeType } from 'shared/types';
import { processRequest } from './processRequest';

type DownloadFileArgs = {
  fileName: string;
  mimeType: MimeType;
  url: string;
};

export const downloadFile = async ({ fileName, mimeType, url }: DownloadFileArgs) => {
  // Скачивание пока не работает

  // const share = async (url: string) => {
  //   console.log('url: ', url);
  //   try {
  //     const result = await Share.share({
  //       url,
  //     });

  //     if (result.action === Share.sharedAction) {
  //       if (result.activityType) {
  //         console.log('result: ', result);
  //         // shared with activity type of result.activityType
  //       } else {
  //         console.log('result: ', result);
  //         // shared
  //       }
  //     } else if (result.action === Share.dismissedAction) {
  //       // dismissed
  //       console.log('result: ', result);
  //     }
  //   } catch (error) {
  //     alert((error as Error).message);
  //   }
  // };

  const { data } = await processRequest(
    FileSystem.downloadAsync(url, `${FileSystem.documentDirectory}${fileName}`),
  );

  if (!data) {
    return;
  }

  if (data.status === 200) {
    if (Platform.OS === 'android') {
      const permissions =
        await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();

      if (!permissions.granted) {
        return;
      }

      processRequest(
        FileSystem.StorageAccessFramework.createFileAsync(
          permissions.directoryUri,
          fileName,
          mimeType,
        ),
      );
    }
  }

  const { uri } = data;

  Linking.openURL(uri);

  console.log('Finished downloading to ', uri);
  // share(uri);
};
