import { useEffect } from 'react'
import { Linking } from 'react-native'
import { addNotificationResponseListener } from 'shared/lib/notifications'
import { ctx } from 'shared/lib/reatom-ctx'
import { startUpdateAction } from 'shared/model'

export const useUpdateNotificationResponse = (): void => {
  useEffect(
    () =>
      addNotificationResponseListener(response => {
        if (response.actionIdentifier === 'start-in-app-update') {
          void startUpdateAction(ctx)
          return
        }

        if (response.actionIdentifier !== 'open-release-url') return

        const releaseUrl = response.notification.request.content.data?.releaseUrl
        if (typeof releaseUrl !== 'string') return
        if (!releaseUrl.startsWith('https://')) return

        Linking.openURL(releaseUrl).catch(error => {
          console.error('[update-notification] Failed to open release URL:', error)
        })
      }),
    [],
  )
}
