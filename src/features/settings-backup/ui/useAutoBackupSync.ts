import { useAtom } from '@reatom/npm-react'
import { useEffect, useRef } from 'react'
import { AppState } from 'react-native'
import { historyAtom } from 'entities/listening-history'
import { sermonCachingEnabledAtom } from 'entities/offline-cache'
import {
  balanceAtom,
  eqEnabledAtom,
  eqGainsAtom,
  pitchAtom,
  playbackRateAtom,
  repeatModeAtom,
} from 'entities/player'
import { myPlaylistsAtom, sectionSettingsAtom } from 'entities/playlist'
import { useDebounce } from 'shared/lib/hooks/useDebounce'
import { hapticsEnabledAtom, serverUrlAtom } from 'shared/model'
import { dynamicColorsEnabledAtom, themeModeAtom } from 'shared/ui/theme'
import { writeAutoBackup } from '../lib/autoSync'
import { backupAutosyncEnabledAtom, backupFolderUriAtom } from '../model/backupFolder'

const AUTO_BACKUP_DEBOUNCE_MS = 30_000

/**
 * Триггер автосохранения копии с trailing-дебаунсом (30 c).
 *
 * Возвращает debounced-функцию: её вызывают уход приложения в фон и ручной
 * экспорт/импорт, а также изменение отслеживаемых данных (подписки на атомы
 * настроек, истории и плейлистов). Первичный прогон на монтировании пропускается.
 * Очередь, платформенная поддержка и гейт «автосинхрон включён + папка выбрана»
 * живут в `writeAutoBackup`/эффекте.
 */
export const useAutoBackupSync = (): (() => void) => {
  const [themeMode] = useAtom(themeModeAtom)
  const [dynamicColors] = useAtom(dynamicColorsEnabledAtom)
  const [hapticsEnabled] = useAtom(hapticsEnabledAtom)
  const [serverUrl] = useAtom(serverUrlAtom)
  const [sermonCachingEnabled] = useAtom(sermonCachingEnabledAtom)
  const [playbackRate] = useAtom(playbackRateAtom)
  const [repeatMode] = useAtom(repeatModeAtom)
  const [balance] = useAtom(balanceAtom)
  const [pitch] = useAtom(pitchAtom)
  const [eqEnabled] = useAtom(eqEnabledAtom)
  const [eqGains] = useAtom(eqGainsAtom)
  const [history] = useAtom(historyAtom)
  const [myPlaylists] = useAtom(myPlaylistsAtom)
  const [sectionSettings] = useAtom(sectionSettingsAtom)
  const [autosyncEnabled] = useAtom(backupAutosyncEnabledAtom)
  const [folderUri] = useAtom(backupFolderUriAtom)

  const scheduleAutoBackup = useDebounce(
    () => {
      void writeAutoBackup()
    },
    AUTO_BACKUP_DEBOUNCE_MS,
    [],
    { flushOnUnmount: true },
  )

  const isFirstRun = useRef(true)

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false
      return
    }
    if (!autosyncEnabled || !folderUri) return

    scheduleAutoBackup()
  }, [
    themeMode,
    dynamicColors,
    hapticsEnabled,
    serverUrl,
    sermonCachingEnabled,
    playbackRate,
    repeatMode,
    balance,
    pitch,
    eqEnabled,
    eqGains,
    history,
    myPlaylists,
    sectionSettings,
    autosyncEnabled,
    folderUri,
    scheduleAutoBackup,
  ])

  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'background') scheduleAutoBackup()
    })

    return () => subscription.remove()
  }, [scheduleAutoBackup])

  return scheduleAutoBackup
}
