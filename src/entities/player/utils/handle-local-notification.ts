import * as Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export const registerForPushNotificationsAsync = async () => {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('new-emails', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();

    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
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
  } else {
    alert('Must use physical device for Push Notifications');
  }

  return token;
};

const NOTIFICATION_ID = 'audio-player-notification';

export const schedulePushNotification = async <D extends object>({
  title,
  subtitle,
  body,
  data,
}: {
  title: string;
  subtitle?: string | null;
  body?: string | null;
  data?: D;
}) => {
  await Notifications.scheduleNotificationAsync({
    identifier: NOTIFICATION_ID,
    content: {
      title,
      subtitle,
      body,
      data,
      sticky: true,
      sound: true,
    },
    trigger: { seconds: 1, channelId: 'new-emails' },
  });
};

export const cancelScheduledNotificationAsync = async () => {
  await Notifications.cancelScheduledNotificationAsync(NOTIFICATION_ID);
  await Notifications.cancelAllScheduledNotificationsAsync();
};
