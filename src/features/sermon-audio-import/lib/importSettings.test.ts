import AsyncStorage from '@react-native-async-storage/async-storage'
import { act, waitFor } from '@testing-library/react-native'
import { renderHookWithProviders } from 'shared/mocks/renderWithProviders'
import { loadImportSettings, useImportSettings } from './importSettings'
import { type ImportSettings } from './importTypes'

const YOUTUBE_IMPORT_SETTINGS = 'youtube_import_settings'
const DEFAULT_INSTANCE = 'https://inv.phobos.observer'
const ALT_INSTANCE = 'https://invidious.f5.si'
const LOCAL_INSTANCE = 'http://192.168.1.10:8080'

const DEFAULT_SETTINGS: ImportSettings = {
  invidiousBaseUrl: DEFAULT_INSTANCE,
  source: 'invidious',
}

const writeStored = async (value: unknown) => {
  await AsyncStorage.setItem(YOUTUBE_IMPORT_SETTINGS, JSON.stringify(value))
}

describe('loadImportSettings', () => {
  beforeEach(async () => {
    await AsyncStorage.clear()
    jest.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('falls back to defaults when the key is absent', async () => {
    await expect(loadImportSettings()).resolves.toEqual(DEFAULT_SETTINGS)
  })

  test('falls back to defaults for garbage json', async () => {
    await AsyncStorage.setItem(YOUTUBE_IMPORT_SETTINGS, '{not json')

    await expect(loadImportSettings()).resolves.toEqual(DEFAULT_SETTINGS)
  })

  test('falls back to defaults for an unknown source', async () => {
    await writeStored({ invidiousBaseUrl: 'https://x.example', source: 'rutube' })

    await expect(loadImportSettings()).resolves.toEqual(DEFAULT_SETTINGS)
  })

  test('falls back to defaults for a non-url instance', async () => {
    await writeStored({ invidiousBaseUrl: 'not-a-url', source: 'invidious' })

    await expect(loadImportSettings()).resolves.toEqual(DEFAULT_SETTINGS)
  })

  test('reads a stored source and instance', async () => {
    await writeStored({ invidiousBaseUrl: ALT_INSTANCE, source: 'youtube' })

    await expect(loadImportSettings()).resolves.toEqual({
      invidiousBaseUrl: ALT_INSTANCE,
      source: 'youtube',
    })
  })

  test('accepts a plain http instance from the local network', async () => {
    await writeStored({ invidiousBaseUrl: LOCAL_INSTANCE, source: 'invidious' })

    await expect(loadImportSettings()).resolves.toEqual({
      invidiousBaseUrl: LOCAL_INSTANCE,
      source: 'invidious',
    })
  })
})

describe('useImportSettings', () => {
  beforeEach(async () => {
    await AsyncStorage.clear()
  })

  test('reads the stored settings on mount', async () => {
    await writeStored({ invidiousBaseUrl: ALT_INSTANCE, source: 'youtube' })

    const { result } = await renderHookWithProviders(() => useImportSettings())

    await waitFor(() => {
      expect(result.current.settings).toEqual({
        invidiousBaseUrl: ALT_INSTANCE,
        source: 'youtube',
      })
    })
  })

  test('persists an update to storage', async () => {
    const { result } = await renderHookWithProviders(() => useImportSettings())

    await act(async () => {
      result.current.updateSettings({ source: 'youtube' })
    })

    expect(result.current.settings.source).toBe('youtube')
    await waitFor(async () => {
      await expect(loadImportSettings()).resolves.toEqual({
        ...DEFAULT_SETTINGS,
        source: 'youtube',
      })
    })
  })
})
