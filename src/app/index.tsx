import * as Notifications from 'expo-notifications';
import React from 'react';
import { RootTabs } from './routing';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    allowAnnouncements: true,
    priority: Notifications.AndroidNotificationPriority.HIGH,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowAlert: true,
  }),
});

const App = () => <RootTabs />;

export default App;
