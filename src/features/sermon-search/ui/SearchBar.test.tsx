import { createCtx } from '@reatom/framework'
import { act, fireEvent, waitFor } from '@testing-library/react-native'
import * as IntentLauncher from 'expo-intent-launcher'
import { Keyboard, Platform, StyleSheet, TextInput } from 'react-native'
import { type SermonData } from 'entities/sermon'
import { sermonsMocks } from 'shared/api/generated'
import { createKeyDownEvent, installFakeDom } from 'shared/lib/testing'
import { renderWithProviders } from 'shared/mocks'
import { showInfo } from 'shared/model/info-dialog'
import {
  isSearchingAtom,
  isSearchOpenAtom,
  searchQueryAtom,
  searchResultsAtom,
  typeSearchInput,
} from '../model'
import { distinctValuesAtom } from '../model-distinctValues'
import { SearchBar } from './SearchBar'

// Jest hoists mock factories above imports, so the factory may only reference
// `mock`-prefixed bindings. This alias keeps the namespace import intact.
const mockCreateDistinctValuesResponse =
  sermonsMocks.getSermonControllerGetDistinctValuesResponseMock

jest.mock('shared/api', () => ({
  mapAllSermonsResponse: jest.fn(),
  sermonsApi: {
    getSermons: () => ({
      sermonControllerFindAll: jest.fn(),
      sermonControllerGetDistinctValues: jest
        .fn()
        .mockResolvedValue(mockCreateDistinctValuesResponse()),
    }),
  },
}))

jest.mock('expo-intent-launcher', () => ({
  ResultCode: { Success: 0 },
  startActivityAsync: jest.fn(),
}))

jest.mock('shared/model/info-dialog', () => ({ showInfo: jest.fn() }))

const CLEAR_LABEL = 'Очистить'
const MIC_LABEL = 'Голосовой ввод'
const VOICE_UNAVAILABLE_MESSAGE = 'Голосовой ввод недоступен на этом устройстве'
const mockedShowInfo = showInfo as jest.MockedFunction<typeof showInfo>
const mockedStartActivityAsync = IntentLauncher.startActivityAsync as jest.MockedFunction<
  typeof IntentLauncher.startActivityAsync
>
const SEARCH_PLACEHOLDER = 'Поиск проповедей'
const IVAN_ZLATOUST = 'Иван Златоуст'
const DISTINCT_VALUES = sermonsMocks.getSermonControllerGetDistinctValuesResponseMock({
  artists: [IVAN_ZLATOUST, 'Иоанн Кронштадтский'],
  books: ['Матфея', 'Иоанна'],
})

const flushAnimationFrame = async () => {
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 0))
  })
}

const sermon: SermonData = {
  artist: 'Иван',
  artwork: 'https://example.com/a.jpg',
  audioUrl: 'https://example.com/a.mp3',
  id: '1',
  title: 'Проповедь о вере',
}

let addListenerSpy: jest.SpyInstance

describe('<SearchBar>', () => {
  beforeEach(() => {
    addListenerSpy = jest.spyOn(Keyboard, 'addListener')
  })

  afterEach(() => {
    addListenerSpy.mockRestore()
  })

  test('renders the input and updates the query while typing', async () => {
    const ctx = createCtx()
    const { getByPlaceholderText } = await renderWithProviders(<SearchBar />, { ctx })

    await fireEvent.changeText(getByPlaceholderText(SEARCH_PLACEHOLDER), 'вера')

    expect(ctx.get(searchQueryAtom)).toBe('вера')
  })

  test('keeps the latest typed text when the query atom lags behind an async render', async () => {
    const ctx = createCtx()
    const { getByPlaceholderText } = await renderWithProviders(<SearchBar />, { ctx })
    const input = getByPlaceholderText(SEARCH_PLACEHOLDER)

    await fireEvent.changeText(input, 'ве')
    await fireEvent.changeText(input, 'вер')
    await waitFor(() => expect(input.props.value).toBe('вер'))

    // Simulate the async race: the atom still holds the old query while a
    // response-driven re-render happens. The visible text must not follow it.
    searchQueryAtom(ctx, 'ве')
    await act(async () => {})
    expect(input.props.value).toBe('вер')
  })

  test('initializes the input from the saved query when it mounts', async () => {
    const ctx = createCtx()
    searchQueryAtom(ctx, 'вера')
    const { getByPlaceholderText } = await renderWithProviders(<SearchBar />, { ctx })

    expect(getByPlaceholderText(SEARCH_PLACEHOLDER).props.value).toBe('вера')
  })

  test('shows externally typed text (onboarding tour) in the visible input', async () => {
    const ctx = createCtx()
    const { getByPlaceholderText } = await renderWithProviders(<SearchBar />, { ctx })
    const input = getByPlaceholderText(SEARCH_PLACEHOLDER)

    await act(async () => {
      typeSearchInput(ctx, 'л')
    })
    await waitFor(() => expect(input.props.value).toBe('л'))

    await act(async () => {
      typeSearchInput(ctx, 'ли')
    })
    await waitFor(() => expect(input.props.value).toBe('ли'))
  })

  test('does not replay an earlier external typing request when it mounts', async () => {
    const ctx = createCtx()
    typeSearchInput(ctx, 'лицемерие')
    searchQueryAtom(ctx, '')
    const { getByPlaceholderText } = await renderWithProviders(<SearchBar />, { ctx })

    expect(getByPlaceholderText(SEARCH_PLACEHOLDER).props.value).toBe('')
  })

  test('clearing resets both the visible input and the query atom', async () => {
    const ctx = createCtx()
    const { getByLabelText, getByPlaceholderText } = await renderWithProviders(<SearchBar />, {
      ctx,
    })
    const input = getByPlaceholderText(SEARCH_PLACEHOLDER)

    await fireEvent.changeText(input, 'вера')
    await waitFor(() => expect(input.props.value).toBe('вера'))

    await fireEvent.press(getByLabelText(CLEAR_LABEL))

    await waitFor(() => expect(input.props.value).toBe(''))
    expect(ctx.get(searchQueryAtom)).toBe('')
  })

  test('does not focus the input on mount so the keyboard waits for a tap', async () => {
    const ctx = createCtx()
    isSearchOpenAtom(ctx, true)
    const focusMock = (TextInput as unknown as { prototype: { focus: jest.Mock } }).prototype.focus
    focusMock.mockClear()

    await renderWithProviders(<SearchBar />, { ctx })
    await flushAnimationFrame()

    expect(focusMock).not.toHaveBeenCalled()
  })

  test('does not steal focus while search is closed', async () => {
    const ctx = createCtx()
    const focusMock = (TextInput as unknown as { prototype: { focus: jest.Mock } }).prototype.focus
    focusMock.mockClear()

    await renderWithProviders(<SearchBar />, { ctx })
    await flushAnimationFrame()

    expect(focusMock).not.toHaveBeenCalled()
  })

  test('clearing the query keeps the input focused for continued typing', async () => {
    const ctx = createCtx()
    const focusMock = (TextInput as unknown as { prototype: { focus: jest.Mock } }).prototype.focus
    const { getByLabelText, getByPlaceholderText } = await renderWithProviders(<SearchBar />, {
      ctx,
    })

    await fireEvent.changeText(getByPlaceholderText(SEARCH_PLACEHOLDER), 'вера')
    focusMock.mockClear()

    await fireEvent.press(getByLabelText(CLEAR_LABEL))

    expect(focusMock).toHaveBeenCalledTimes(1)
  })

  test('suppresses the browser focus outline on web', async () => {
    const restorePlatform = jest.replaceProperty(Platform, 'OS', 'web')
    try {
      const { getByPlaceholderText } = await renderWithProviders(<SearchBar />)
      const style = StyleSheet.flatten(getByPlaceholderText(SEARCH_PLACEHOLDER).props.style)

      expect(style.outlineWidth).toBe(0)
      expect(style.outlineColor).toBe('transparent')
    } finally {
      restorePlatform.restore()
    }
  })

  test('stretches across the header so the input fills the row', async () => {
    const ctx = createCtx()
    const { getByPlaceholderText } = await renderWithProviders(<SearchBar />, { ctx })

    expect(getByPlaceholderText(SEARCH_PLACEHOLDER).parent).toHaveStyle({ flex: 1 })
  })

  test('clears the query via the clear button, resets results and keeps the search open', async () => {
    const ctx = createCtx()
    isSearchOpenAtom(ctx, true)
    searchQueryAtom(ctx, 'вера')
    searchResultsAtom(ctx, [sermon])
    isSearchingAtom(ctx, true)
    const { getByLabelText } = await renderWithProviders(<SearchBar />, { ctx })

    await fireEvent.press(getByLabelText(CLEAR_LABEL))

    expect(ctx.get(searchQueryAtom)).toBe('')
    expect(ctx.get(searchResultsAtom)).toEqual([])
    expect(ctx.get(isSearchingAtom)).toBe(false)
    expect(ctx.get(isSearchOpenAtom)).toBe(true)
  })

  test('hides the inline clear chip while the query is empty', async () => {
    const ctx = createCtx()
    const { queryByLabelText } = await renderWithProviders(<SearchBar />, { ctx })

    expect(queryByLabelText(CLEAR_LABEL)).toBeNull()
  })

  test('shows the mic while the query is empty and swaps it for the clear chip once text is typed', async () => {
    const restorePlatform = jest.replaceProperty(Platform, 'OS', 'android')
    try {
      const ctx = createCtx()
      const { getByLabelText, getByPlaceholderText, queryByLabelText } = await renderWithProviders(
        <SearchBar />,
        { ctx },
      )

      expect(getByLabelText(MIC_LABEL)).toBeTruthy()

      await fireEvent.changeText(getByPlaceholderText(SEARCH_PLACEHOLDER), 'вера')

      expect(queryByLabelText(MIC_LABEL)).toBeNull()
      expect(getByLabelText(CLEAR_LABEL)).toBeTruthy()
    } finally {
      restorePlatform.restore()
    }
  })

  test('reports focus changes so the island can show its external close circle', async () => {
    const ctx = createCtx()
    const onFocusChange = jest.fn()
    const { getByPlaceholderText } = await renderWithProviders(
      <SearchBar onFocusChange={onFocusChange} />,
      { ctx },
    )
    const input = getByPlaceholderText(SEARCH_PLACEHOLDER)

    await act(async () => {
      fireEvent(input, 'focus')
    })
    expect(onFocusChange).toHaveBeenLastCalledWith(true)

    await act(async () => {
      fireEvent(input, 'blur')
    })
    expect(onFocusChange).toHaveBeenLastCalledWith(false)
  })

  test('Escape on web clears the query and keeps the search open when the query is non-empty', async () => {
    const { dispatchKeyDown, restore } = installFakeDom()
    const restorePlatform = jest.replaceProperty(Platform, 'OS', 'web')
    try {
      const ctx = createCtx()
      isSearchOpenAtom(ctx, true)
      searchQueryAtom(ctx, 'вера')
      await renderWithProviders(<SearchBar />, { ctx })

      await act(async () => {
        dispatchKeyDown(createKeyDownEvent('Escape'))
      })

      expect(ctx.get(searchQueryAtom)).toBe('')
      expect(ctx.get(isSearchOpenAtom)).toBe(true)
    } finally {
      restorePlatform.restore()
      restore()
    }
  })

  test('Escape on web closes the search when the query is empty', async () => {
    const { dispatchKeyDown, restore } = installFakeDom()
    const restorePlatform = jest.replaceProperty(Platform, 'OS', 'web')
    try {
      const ctx = createCtx()
      isSearchOpenAtom(ctx, true)
      await renderWithProviders(<SearchBar />, { ctx })

      await act(async () => {
        dispatchKeyDown(createKeyDownEvent('Escape'))
      })

      await waitFor(() => expect(ctx.get(isSearchOpenAtom)).toBe(false))
      expect(ctx.get(searchQueryAtom)).toBe('')
    } finally {
      restorePlatform.restore()
      restore()
    }
  })

  test('Escape with a modifier held does not clear or close the search', async () => {
    const { dispatchKeyDown, restore } = installFakeDom()
    const restorePlatform = jest.replaceProperty(Platform, 'OS', 'web')
    try {
      const ctx = createCtx()
      isSearchOpenAtom(ctx, true)
      searchQueryAtom(ctx, 'вера')
      await renderWithProviders(<SearchBar />, { ctx })

      await act(async () => {
        dispatchKeyDown(createKeyDownEvent('Escape', { ctrlKey: true }))
      })

      expect(ctx.get(searchQueryAtom)).toBe('вера')
      expect(ctx.get(isSearchOpenAtom)).toBe(true)
    } finally {
      restorePlatform.restore()
      restore()
    }
  })

  test('Escape on native does not clear or close the search', async () => {
    const { dispatchKeyDown, restore } = installFakeDom()
    try {
      const ctx = createCtx()
      isSearchOpenAtom(ctx, true)
      searchQueryAtom(ctx, 'вера')
      await renderWithProviders(<SearchBar />, { ctx })

      await act(async () => {
        dispatchKeyDown(createKeyDownEvent('Escape'))
      })

      expect(ctx.get(searchQueryAtom)).toBe('вера')
      expect(ctx.get(isSearchOpenAtom)).toBe(true)
    } finally {
      restore()
    }
  })

  test('shows suggestions again after typing a new query following a selection', async () => {
    const ctx = createCtx()
    distinctValuesAtom(ctx, DISTINCT_VALUES)
    const { getByPlaceholderText, getByRole, queryByRole } = await renderWithProviders(
      <SearchBar />,
      { ctx },
    )
    const input = getByPlaceholderText(SEARCH_PLACEHOLDER)

    await act(async () => {
      fireEvent(input, 'focus')
    })
    await fireEvent.changeText(input, 'иван')
    await fireEvent.press(getByRole('button', { name: /Иван Златоуст/ }))
    expect(queryByRole('button', { name: /Иван Златоуст/ })).toBeNull()

    await fireEvent.changeText(input, 'мат')
    expect(getByRole('button', { name: /Матфея/ })).toBeTruthy()
  })

  test('blurs the input when the keyboard hides', async () => {
    const ctx = createCtx()
    const blurMock = (TextInput as unknown as { prototype: { blur: jest.Mock } }).prototype.blur
    blurMock.mockClear()

    await renderWithProviders(<SearchBar />, { ctx })

    const hideCall = addListenerSpy.mock.calls.find(
      ([eventName]) => eventName === 'keyboardDidHide',
    )
    expect(hideCall).toBeDefined()

    blurMock.mockClear()
    await act(async () => {
      hideCall?.[1]()
    })

    expect(blurMock).toHaveBeenCalledTimes(1)
  })
})

describe('<SearchBar> voice input availability', () => {
  beforeEach(() => {
    mockedShowInfo.mockClear()
    mockedStartActivityAsync.mockClear()
  })

  test('renders the mic while the query is empty on web without the Speech Recognition API', async () => {
    const dom = installFakeDom()
    const restorePlatform = jest.replaceProperty(Platform, 'OS', 'web')
    try {
      Reflect.deleteProperty(global, 'SpeechRecognition')
      Reflect.deleteProperty(global, 'webkitSpeechRecognition')
      const { getByLabelText } = await renderWithProviders(<SearchBar />)

      expect(getByLabelText(MIC_LABEL)).toBeTruthy()
    } finally {
      restorePlatform.restore()
      dom.restore()
    }
  })

  test('shows the info dialog instead of starting recognition when voice input is unsupported', async () => {
    const dom = installFakeDom()
    const restorePlatform = jest.replaceProperty(Platform, 'OS', 'ios')
    try {
      const { getByLabelText } = await renderWithProviders(<SearchBar />)

      await fireEvent.press(getByLabelText(MIC_LABEL))

      expect(mockedShowInfo).toHaveBeenCalledWith(VOICE_UNAVAILABLE_MESSAGE)
      expect(mockedStartActivityAsync).not.toHaveBeenCalled()
    } finally {
      restorePlatform.restore()
      dom.restore()
    }
  })

  test('starts Web Speech recognition when the browser supports it', async () => {
    const dom = installFakeDom()
    const restorePlatform = jest.replaceProperty(Platform, 'OS', 'web')
    try {
      const start = jest.fn()
      class FakeRecognition {
        public abort = jest.fn()
        public continuous = false
        public interimResults = false
        public lang = ''
        public maxAlternatives = 1
        public onend: (() => void) | null = null
        public onerror: ((event: { error?: string }) => void) | null = null
        public onresult: ((event: { results: unknown }) => void) | null = null
        public start = start
        public stop = jest.fn()
      }
      Reflect.set(dom.window, 'SpeechRecognition', FakeRecognition)

      const { getByLabelText } = await renderWithProviders(<SearchBar />)

      await fireEvent.press(getByLabelText(MIC_LABEL))

      expect(start).toHaveBeenCalledTimes(1)
      expect(mockedShowInfo).not.toHaveBeenCalled()
    } finally {
      restorePlatform.restore()
      dom.restore()
    }
  })
})

describe('<SearchBar> web Escape without input focus', () => {
  test('Escape on document clears the query and keeps the search open when the query is non-empty', async () => {
    const { dispatchKeyDown, restore } = installFakeDom()
    const restorePlatform = jest.replaceProperty(Platform, 'OS', 'web')
    try {
      const ctx = createCtx()
      isSearchOpenAtom(ctx, true)
      searchQueryAtom(ctx, 'вера')
      await renderWithProviders(<SearchBar />, { ctx })

      await act(async () => {
        dispatchKeyDown(createKeyDownEvent('Escape'))
      })

      expect(ctx.get(searchQueryAtom)).toBe('')
      expect(ctx.get(isSearchOpenAtom)).toBe(true)
    } finally {
      restorePlatform.restore()
      restore()
    }
  })

  test('Escape on document closes the search when the query is empty', async () => {
    const { dispatchKeyDown, restore } = installFakeDom()
    const restorePlatform = jest.replaceProperty(Platform, 'OS', 'web')
    try {
      const ctx = createCtx()
      isSearchOpenAtom(ctx, true)
      await renderWithProviders(<SearchBar />, { ctx })

      await act(async () => {
        dispatchKeyDown(createKeyDownEvent('Escape'))
      })

      await waitFor(() => expect(ctx.get(isSearchOpenAtom)).toBe(false))
      expect(ctx.get(searchQueryAtom)).toBe('')
    } finally {
      restorePlatform.restore()
      restore()
    }
  })

  test('Escape with a modifier held on document does not clear or close the search', async () => {
    const { dispatchKeyDown, restore } = installFakeDom()
    const restorePlatform = jest.replaceProperty(Platform, 'OS', 'web')
    try {
      const ctx = createCtx()
      isSearchOpenAtom(ctx, true)
      searchQueryAtom(ctx, 'вера')
      await renderWithProviders(<SearchBar />, { ctx })

      await act(async () => {
        dispatchKeyDown(createKeyDownEvent('Escape', { ctrlKey: true }))
      })

      expect(ctx.get(searchQueryAtom)).toBe('вера')
      expect(ctx.get(isSearchOpenAtom)).toBe(true)
    } finally {
      restorePlatform.restore()
      restore()
    }
  })
})
