import * as Notifications from 'expo-notifications'
import { useEffect, useRef, useState } from 'react'
import { registerForPushNotificationsAsync } from '../utils'

export const useLocalNotification = () => {
  const [expoPushToken, setExpoPushToken] = useState('')
  const [notification, setNotification] = useState({} as Notifications.Notification)
  const notificationListener = useRef<Notifications.Subscription | undefined>(undefined)
  const responseListener = useRef<Notifications.Subscription | undefined>(undefined)

  useEffect(() => {
    void registerForPushNotificationsAsync().then(token => {
      if (token) setExpoPushToken(token)
    })

    notificationListener.current = Notifications.addNotificationReceivedListener(
      receivedNotification => {
        setNotification(receivedNotification)
      },
    )

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      setNotification(response.notification)
    })

    return () => {
      notificationListener.current?.remove?.()
      responseListener.current?.remove?.()
    }
  }, [])

  return { expoPushToken, notification }
}
