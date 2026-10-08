import { createCtx } from '@reatom/framework'
import { reatomContext } from '@reatom/npm-react'
import { act, renderHook } from '@testing-library/react-native'
import { type ReactNode } from 'react'
import { AppState, type AppStateStatus } from 'react-native'
import { serverUrlAtom } from 'shared/model'
import { writeAutoBackup } from '../lib/autoSync'
import { backupAutosyncEnabledAtom, backupFolderUriAtom } from '../model/backupFolder'
import { useAutoBackupSync } from './useAutoBackupSync'

// entities/player тянет нативный expo-audio, который падает при импорте в Jest.
jest.mock('expo-audio', () => ({
  createAudioPlayer: jest.fn(),
  setAudioModeAsync: jest.fn(),
}))

jest.mock('../lib/autoSync', () => ({
  writeAutoBackup: jest.fn(async () => undefined),
}))

const mockWriteAutoBackup = jest.mocked(writeAutoBackup)
const FOLDER_URI = 'content://com.android.externalstorage.documents/tree/primary%3ADocuments'
const CHANGED_URL = 'https://changed.example.com'
const appStateListeners: Array<(state: AppStateStatus) => void> = []

jest
  .spyOn(AppState, 'addEventListener')
  .mockImplementation((_event: string, listener: (state: AppStateStatus) => void) => {
    appStateListeners.push(listener)
    return { remove: jest.fn() }
  })

const emitAppState = (state: AppStateStatus) => {
  for (const listener of appStateListeners) listener(state)
}

const renderAutoBackup = async (ctx: ReturnType<typeof createCtx>) =>
  renderHook(() => useAutoBackupSync(), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <reatomContext.Provider value={ctx}>{children}</reatomContext.Provider>
    ),
  })

describe('useAutoBackupSync', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    appStateListeners.length = 0
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  test('flushes the auto backup after the app goes to background', async () => {
    await renderAutoBackup(createCtx())

    await act(async () => {
      emitAppState('background')
      jest.advanceTimersByTime(30_000)
    })

    expect(mockWriteAutoBackup).toHaveBeenCalled()
  })

  test('ignores non-background transitions', async () => {
    await renderAutoBackup(createCtx())

    await act(async () => {
      emitAppState('active')
      jest.advanceTimersByTime(30_000)
    })

    expect(mockWriteAutoBackup).not.toHaveBeenCalled()
  })

  test('debounces a flush after a watched atom changes', async () => {
    const ctx = createCtx()
    backupAutosyncEnabledAtom(ctx, true)
    backupFolderUriAtom(ctx, FOLDER_URI)

    await renderAutoBackup(ctx)

    // Первичный прогон на монтировании ничего не планирует.
    await act(async () => {
      jest.advanceTimersByTime(30_000)
    })
    expect(mockWriteAutoBackup).not.toHaveBeenCalled()

    await act(async () => {
      serverUrlAtom(ctx, CHANGED_URL)
    })
    await act(async () => {
      jest.advanceTimersByTime(30_000)
    })

    expect(mockWriteAutoBackup).toHaveBeenCalledTimes(1)
  })

  test('does not flush on a data change while autosync is disabled', async () => {
    const ctx = createCtx()
    backupFolderUriAtom(ctx, FOLDER_URI)

    await renderAutoBackup(ctx)

    await act(async () => {
      serverUrlAtom(ctx, CHANGED_URL)
      jest.advanceTimersByTime(30_000)
    })

    expect(mockWriteAutoBackup).not.toHaveBeenCalled()
  })
})
