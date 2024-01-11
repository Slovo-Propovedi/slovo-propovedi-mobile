import * as Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export const registerForPushNotificationsAsync = async () => {
  let token;

  if (Platform.OS === 'android')
    await Notifications.setNotificationChannelAsync('new-emails', {
      importance: Notifications.AndroidImportance.MAX,
      lightColor: '#FF231F7C',
      name: 'default',
      vibrationPattern: [0, 250, 250, 250],
    });

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();

    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }

    const { data } = await Notifications.getExpoPushTokenAsync({
      projectId: Constants.default.easConfig?.projectId,
    });

    token = data;

    // await fetch('https://example.com/', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     userId,
    //     expoPushToken: token,
    //   }),
    // });
  } else console.log('Must use physical device for Push Notifications');

  return token;
};

const NOTIFICATION_ID = 'audio-player-notification';

export const schedulePushNotification = async <D extends object>({
  body,
  data,
  subtitle,
  title,
}: {
  body?: null | string;
  data?: D;
  subtitle?: null | string;
  title: string;
}) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      body,
      data,
      sound: true,
      sticky: true,
      subtitle,
      title,
    },
    identifier: NOTIFICATION_ID,
    trigger: { channelId: 'new-emails', seconds: 1 },
  });
};

export const cancelScheduledNotificationAsync = async () => {
  await Notifications.cancelScheduledNotificationAsync(NOTIFICATION_ID);
  await Notifications.cancelAllScheduledNotificationsAsync();
};
