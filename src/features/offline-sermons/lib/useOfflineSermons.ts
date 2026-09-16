import { useAction, useAtom } from '@reatom/npm-react'
import { useFocusEffect } from 'expo-router'
import { useCallback } from 'react'
import { cacheUpdateTriggerAtom } from 'shared/lib/audio-cache'
import { isLoadingOfflineSermonsAtom, loadOfflineSermons, offlineSermonsAtom } from '../model'

export const useOfflineSermons = () => {
  const [items] = useAtom(offlineSermonsAtom)
  const [isLoading] = useAtom(isLoadingOfflineSermonsAtom)
  const [cacheTrigger] = useAtom(cacheUpdateTriggerAtom)
  const loadOffline = useAction(loadOfflineSermons)

  const load = useCallback(() => {
    void loadOffline()
  }, [loadOffline])

  useFocusEffect(
    useCallback(
      () => {
        void load()
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps -- cacheTrigger intentionally changes callback identity to re-run the effect on cache updates while focused
      [load, cacheTrigger],
    ),
  )

  return { isLoading, items }
}
