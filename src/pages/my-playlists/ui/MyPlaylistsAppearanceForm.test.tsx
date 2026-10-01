import AsyncStorage from '@react-native-async-storage/async-storage'
import { useAction, useAtom } from '@reatom/npm-react'
import { act, fireEvent, type RenderResult } from '@testing-library/react-native'
import {
  DEFAULT_SECTION_SETTINGS,
  type LocalSectionSettings,
  MY_PLAYLISTS_SECTION_SETTINGS,
  sectionSettingsAtom,
  updateSectionSettings,
} from 'entities/playlist'
import { renderWithProviders } from 'shared/mocks'
import { MyPlaylistsAppearanceForm } from './MyPlaylistsAppearanceForm'

const ITEMS_ROWS_LABEL = 'Строк'
const PERSIST_DEBOUNCE_MS = 500

type TestInstance = ReturnType<RenderResult['getByLabelText']>

// Mirrors MyPlaylistsScreen: subscribe to the atom, commit patches immediately.
// The form itself owns the debounced storage write.
const FormHarness = () => {
  const [settings] = useAtom(sectionSettingsAtom)
  const updateSettings = useAction(updateSectionSettings)

  return (
    <MyPlaylistsAppearanceForm settings={settings} onChange={patch => void updateSettings(patch)} />
  )
}

const renderForm = async () => {
  const result = await renderWithProviders(<FormHarness />)
  // Faking after the async render: RNTL flushes with setImmediate, which faking
  // would deadlock.
  jest.useFakeTimers({ doNotFake: ['setImmediate'] })
  return result
}

const type = async (input: TestInstance, text: string) => {
  await act(async () => {
    fireEvent.changeText(input, text)
  })
}

const blur = async (input: TestInstance) => {
  await act(async () => {
    fireEvent(input, 'blur')
  })
}

const advanceDebounce = async (ms: number = PERSIST_DEBOUNCE_MS) => {
  await act(async () => {
    jest.advanceTimersByTime(ms)
  })
}

const persistedItemsRows = () => {
  const calls = jest.mocked(AsyncStorage.setItem).mock.calls
  const [key, raw] = calls.at(-1) ?? []

  if (key !== MY_PLAYLISTS_SECTION_SETTINGS || raw === undefined) return null

  return (JSON.parse(raw) as LocalSectionSettings).itemsRows
}

describe('<MyPlaylistsAppearanceForm>', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    await AsyncStorage.clear()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  test('commits every keystroke to the atom but debounces the storage write', async () => {
    const { ctx, getByLabelText } = await renderForm()
    const input = getByLabelText(ITEMS_ROWS_LABEL)

    await type(input, '1')
    await type(input, '12')

    // The atom follows the keys immediately; storage has not been touched yet.
    expect(ctx.get(sectionSettingsAtom).itemsRows).toBe(12)
    expect(AsyncStorage.setItem).not.toHaveBeenCalled()

    await advanceDebounce()

    expect(AsyncStorage.setItem).toHaveBeenCalledTimes(1)
    expect(persistedItemsRows()).toBe(12)
  })

  test('rapid keystrokes collapse into a single trailing write', async () => {
    const { getByLabelText } = await renderForm()
    const input = getByLabelText(ITEMS_ROWS_LABEL)

    await type(input, '2')
    await type(input, '23')
    await type(input, '234')

    await advanceDebounce()

    expect(AsyncStorage.setItem).toHaveBeenCalledTimes(1)
    expect(persistedItemsRows()).toBe(234)
  })

  test('blurring the field flushes the pending write', async () => {
    const { getByLabelText } = await renderForm()
    const input = getByLabelText(ITEMS_ROWS_LABEL)

    await type(input, '7')
    await blur(input)

    expect(AsyncStorage.setItem).toHaveBeenCalledTimes(1)
    expect(persistedItemsRows()).toBe(7)
  })

  test('unmounting the form flushes the pending write', async () => {
    const { getByLabelText, unmount } = await renderForm()

    await type(getByLabelText(ITEMS_ROWS_LABEL), '9')
    expect(AsyncStorage.setItem).not.toHaveBeenCalled()

    await unmount()

    expect(AsyncStorage.setItem).toHaveBeenCalledTimes(1)
    expect(persistedItemsRows()).toBe(9)
  })

  test('resyncs the local text when itemsRows changes externally', async () => {
    const { ctx, getByLabelText } = await renderForm()

    await act(async () => {
      sectionSettingsAtom(ctx, { ...DEFAULT_SECTION_SETTINGS, itemsRows: 4 })
    })

    expect(getByLabelText(ITEMS_ROWS_LABEL)).toHaveProp('value', '4')
  })

  test('keeps the typed text when the external value matches it', async () => {
    const { ctx, getByLabelText } = await renderForm()
    const input = getByLabelText(ITEMS_ROWS_LABEL)

    await type(input, '05')

    // The atom already holds 5 from the form's own commit; an external echo of
    // the same value must not rewrite the text to '5'.
    await act(async () => {
      sectionSettingsAtom(ctx, { ...DEFAULT_SECTION_SETTINGS, itemsRows: 5 })
    })

    expect(getByLabelText(ITEMS_ROWS_LABEL)).toHaveProp('value', '05')
  })
})
