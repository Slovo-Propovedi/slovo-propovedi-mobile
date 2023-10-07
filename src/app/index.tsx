import * as Notifications from 'expo-notifications';
import React from 'react';
import { RootTabs } from './routing';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    allowAnnouncements: true,
    priority: Notifications.AndroidNotificationPriority.HIGH,
  }),
});

const App = () => <RootTabs />;

export default App;
