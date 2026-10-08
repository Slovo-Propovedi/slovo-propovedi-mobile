import { FolderPermissionLostError } from './folderErrors'
import { type WebDirectoryHandle } from './webFsTypes'
import { loadDirectoryHandle, saveDirectoryHandle } from './webIdb'

const WEB_FOLDER_PREFIX = 'web-dir:'

const webFolderUri = (name: string): string => `${WEB_FOLDER_PREFIX}${name}`

const isPermissionDenied = (error: unknown): boolean =>
  error instanceof DOMException &&
  (error.name === 'NotAllowedError' || error.name === 'SecurityError')

const toFolderAccessError = (error: unknown): Error => {
  if (isPermissionDenied(error)) return new FolderPermissionLostError()
  return error instanceof Error ? error : new Error(String(error))
}

export const isFolderPickerSupported = (): boolean =>
  typeof window !== 'undefined' && typeof window.showDirectoryPicker === 'function'

export const webFolderLabel = (folderUri: null | string): string => {
  if (!folderUri) return 'Папка не выбрана'
  return folderUri.startsWith(WEB_FOLDER_PREFIX)
    ? folderUri.slice(WEB_FOLDER_PREFIX.length)
    : folderUri
}

const requireHandle = async (): Promise<WebDirectoryHandle> => {
  const handle = await loadDirectoryHandle()
  if (!handle) throw new Error('Папка для резервных копий недоступна')
  return handle
}

export const pickWebFolder = async (): Promise<null | string> => {
  const picker = typeof window !== 'undefined' ? window.showDirectoryPicker : undefined
  if (!picker) return null

  try {
    // Явно просим readwrite: дефолт FSA — 'read', из-за чего последующая
    // проверка доступа (`queryPermission({ mode: 'readwrite' })`) не проходит.
    const handle = await picker({ mode: 'readwrite' })
    await saveDirectoryHandle(handle)
    return webFolderUri(handle.name)
  } catch (error) {
    console.warn('[settings-backup] folder pick cancelled or failed:', error)
    return null
  }
}

export const readWebFile = async (_folderUri: string, name: string): Promise<string> => {
  try {
    const handle = await requireHandle()
    const fileHandle = await handle.getFileHandle(name)
    const file = await fileHandle.getFile()

    return file.text()
  } catch (error) {
    throw toFolderAccessError(error)
  }
}

export const writeWebFile = async (
  _folderUri: string,
  name: string,
  json: string,
): Promise<void> => {
  try {
    const handle = await requireHandle()
    const fileHandle = await handle.getFileHandle(name, { create: true })
    const writable = await fileHandle.createWritable()

    await writable.write(json)
    await writable.close()
  } catch (error) {
    throw toFolderAccessError(error)
  }
}

export const listWebFiles = async (_folderUri: string): Promise<string[]> => {
  try {
    const handle = await requireHandle()
    const names: string[] = []

    for await (const entry of handle.values()) if (entry.kind === 'file') names.push(entry.name)

    return names
  } catch (error) {
    throw toFolderAccessError(error)
  }
}

export const webFolderExists = async (): Promise<boolean> => {
  try {
    const handle = await loadDirectoryHandle()
    if (!handle) return false
    if (!handle.queryPermission) return true

    // Chromium лениво синхронизирует persistent-разрешения и может отдавать
    // 'prompt' при фактически активном гранте (запись/чтение при этом работают).
    // Поэтому доступность оптимистична: недоступна только при явном 'denied'.
    // Реальная потеря доступа выясняется реактивно — `FolderPermissionLostError`
    // при операции переводит UI в состояние повторного выбора папки.
    const state = await handle.queryPermission({ mode: 'readwrite' })
    return state !== 'denied'
  } catch (error) {
    console.warn('[settings-backup] folder access check failed:', error)
    return false
  }
}
