import { createCtx } from '@reatom/framework'
import { act, fireEvent, waitFor } from '@testing-library/react-native'
import { Keyboard, TextInput } from 'react-native'
import { renderWithProviders } from 'shared/mocks'
import type { SermonData } from 'shared/model'
import { isSearchingAtom, isSearchOpenAtom, searchQueryAtom, searchResultsAtom } from '../model'
import { distinctValuesAtom } from '../model-distinctValues'
import { SearchBar } from './SearchBar'
import '@testing-library/jest-native/extend-expect'

jest.mock('shared/api', () => ({
  mapAllSermonsResponse: jest.fn(),
  sermonsApi: {
    getSermons: () => ({
      sermonControllerFindAll: jest.fn(),
      sermonControllerGetDistinctValues: jest.fn().mockResolvedValue({ artists: [], books: [] }),
    }),
  },
}))

const CLEAR_LABEL = 'Очистить поиск'
const SEARCH_PLACEHOLDER = 'Поиск проповедей'
const IVAN_ZLATOUST = 'Иван Златоуст'
const DISTINCT_VALUES = {
  artists: [IVAN_ZLATOUST, 'Иоанн Кронштадтский'],
  books: ['Матфея', 'Иоанна'],
}

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

  test('focuses the input on mount so the keyboard appears', async () => {
    const ctx = createCtx()
    const focusMock = (TextInput as unknown as { prototype: { focus: jest.Mock } }).prototype.focus
    focusMock.mockClear()

    await renderWithProviders(<SearchBar />, { ctx })
    await flushAnimationFrame()

    expect(focusMock).toHaveBeenCalledTimes(1)
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

  test('closes the search when the clear button is pressed with an empty query', async () => {
    const ctx = createCtx()
    isSearchOpenAtom(ctx, true)
    const { getByLabelText } = await renderWithProviders(<SearchBar />, { ctx })

    await fireEvent.press(getByLabelText(CLEAR_LABEL))

    await waitFor(() => expect(ctx.get(isSearchOpenAtom)).toBe(false))
    expect(ctx.get(searchQueryAtom)).toBe('')
  })

  test('shows the clear button even with an empty query so the search can be closed', async () => {
    const ctx = createCtx()
    const { getByLabelText } = await renderWithProviders(<SearchBar />, { ctx })

    expect(getByLabelText(CLEAR_LABEL)).toBeTruthy()
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
    await flushAnimationFrame()

    const hideCall = addListenerSpy.mock.calls.find(
      ([eventName]) => eventName === 'keyboardDidHide',
    )
    expect(hideCall).toBeDefined()

    act(() => {
      hideCall?.[1]()
    })

    expect(blurMock).toHaveBeenCalledTimes(1)
  })
})
