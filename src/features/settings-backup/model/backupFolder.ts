import AsyncStorage from '@react-native-async-storage/async-storage'
import { action, atom } from '@reatom/framework'

// Ключи принадлежат этой фиче: выбранная пользователем папка для копий и флаг
// автосинхронизации. Значения переживают обновления приложения, поэтому
// читаются защищённо (отсутствие/мусор трактуются как дефолт).
const BACKUP_DIR_URI_KEY = 'backup_dir_uri'
const BACKUP_AUTOSYNC_KEY = 'backup_autosync'

export const backupFolderUriAtom = atom<null | string>(null, 'backupFolderUriAtom')
export const backupAutosyncEnabledAtom = atom<boolean>(false, 'backupAutosyncEnabledAtom')

export const loadBackupFolder = action(async ctx => {
  try {
    const entries = await AsyncStorage.multiGet([BACKUP_DIR_URI_KEY, BACKUP_AUTOSYNC_KEY])
    const uri = entries[0]?.[1] ?? null
    const autosync = entries[1]?.[1] === 'true'

    await ctx.schedule(() => {
      backupFolderUriAtom(ctx, uri)
      backupAutosyncEnabledAtom(ctx, autosync)
    })
  } catch (error) {
    console.error('[settings-backup] failed to load folder settings:', error)
  }
}, 'loadBackupFolder')

export const setBackupFolder = action(async (ctx, uri: string) => {
  await AsyncStorage.setItem(BACKUP_DIR_URI_KEY, uri)
  await ctx.schedule(() => {
    backupFolderUriAtom(ctx, uri)
  })
  return uri
}, 'setBackupFolder')

export const clearBackupFolder = action(async ctx => {
  await AsyncStorage.multiRemove([BACKUP_DIR_URI_KEY, BACKUP_AUTOSYNC_KEY])
  await ctx.schedule(() => {
    backupFolderUriAtom(ctx, null)
    backupAutosyncEnabledAtom(ctx, false)
  })
}, 'clearBackupFolder')

export const setAutosyncEnabled = action(async (ctx, enabled: boolean) => {
  await AsyncStorage.setItem(BACKUP_AUTOSYNC_KEY, String(enabled))
  await ctx.schedule(() => {
    backupAutosyncEnabledAtom(ctx, enabled)
  })
  return enabled
}, 'setAutosyncEnabled')
