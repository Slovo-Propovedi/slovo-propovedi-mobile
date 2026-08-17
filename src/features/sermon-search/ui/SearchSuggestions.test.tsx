import { createCtx } from '@reatom/framework'
import { act, fireEvent, waitFor } from '@testing-library/react-native'
import { renderWithProviders } from 'shared/mocks'
import type { TestInstance } from 'test-renderer'
import { searchQueryAtom } from '../model'
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

const SEARCH_PLACEHOLDER = 'Поиск проповедей'
const IVAN_ZLATOUST = 'Иван Златоуст'
const DISTINCT_VALUES = {
  artists: [IVAN_ZLATOUST, 'Иоанн Кронштадтский'],
  books: ['Матфея', 'Иоанна'],
}

const focusAndType = async (input: TestInstance, text: string) => {
  await act(async () => {
    fireEvent(input, 'focus')
  })
  await fireEvent.changeText(input, text)
}

describe('<SearchBar> suggestions', () => {
  test('shows suggestions matching the typed query', async () => {
    const ctx = createCtx()
    distinctValuesAtom(ctx, DISTINCT_VALUES)
    const { getByPlaceholderText, getByText, queryByText } = await renderWithProviders(
      <SearchBar />,
      { ctx },
    )

    await focusAndType(getByPlaceholderText(SEARCH_PLACEHOLDER), 'иван')

    expect(getByText(IVAN_ZLATOUST)).toBeTruthy()
    expect(getByText('проповедник')).toBeTruthy()
    expect(queryByText('Иоанн Кронштадтский')).toBeNull()
  })

  test('hides suggestions when the query is cleared', async () => {
    const ctx = createCtx()
    distinctValuesAtom(ctx, DISTINCT_VALUES)
    const { getByPlaceholderText, getByText, queryByText } = await renderWithProviders(
      <SearchBar />,
      { ctx },
    )
    const input = getByPlaceholderText(SEARCH_PLACEHOLDER)

    await focusAndType(input, 'иван')
    expect(getByText(IVAN_ZLATOUST)).toBeTruthy()

    await fireEvent.changeText(input, '')
    expect(queryByText(IVAN_ZLATOUST)).toBeNull()
  })

  test('hides suggestions when nothing matches', async () => {
    const ctx = createCtx()
    distinctValuesAtom(ctx, DISTINCT_VALUES)
    const { getByPlaceholderText, queryByText } = await renderWithProviders(<SearchBar />, {
      ctx,
    })

    await focusAndType(getByPlaceholderText(SEARCH_PLACEHOLDER), 'zzz')

    expect(queryByText(IVAN_ZLATOUST)).toBeNull()
  })

  test('hides suggestions when the input loses focus', async () => {
    const ctx = createCtx()
    distinctValuesAtom(ctx, DISTINCT_VALUES)
    const { getByPlaceholderText, getByText, queryByText } = await renderWithProviders(
      <SearchBar />,
      { ctx },
    )
    const input = getByPlaceholderText(SEARCH_PLACEHOLDER)

    await focusAndType(input, 'иван')
    expect(getByText(IVAN_ZLATOUST)).toBeTruthy()

    await act(async () => {
      fireEvent(input, 'blur')
    })
    expect(queryByText(IVAN_ZLATOUST)).toBeNull()
  })

  test('tapping a suggestion fills the input and the query atom', async () => {
    const ctx = createCtx()
    distinctValuesAtom(ctx, DISTINCT_VALUES)
    const { getByPlaceholderText, getByRole } = await renderWithProviders(<SearchBar />, { ctx })
    const input = getByPlaceholderText(SEARCH_PLACEHOLDER)

    await focusAndType(input, 'иван')
    await fireEvent.press(getByRole('button', { name: /Иван Златоуст/ }))

    await waitFor(() => expect(input.props.value).toBe(IVAN_ZLATOUST))
    expect(ctx.get(searchQueryAtom)).toBe(IVAN_ZLATOUST)
  })

  test('hides the dropdown after a suggestion is selected', async () => {
    const ctx = createCtx()
    distinctValuesAtom(ctx, DISTINCT_VALUES)
    const { getByPlaceholderText, getByRole, queryByRole } = await renderWithProviders(
      <SearchBar />,
      { ctx },
    )
    const input = getByPlaceholderText(SEARCH_PLACEHOLDER)

    await focusAndType(input, 'иван')
    await fireEvent.press(getByRole('button', { name: /Иван Златоуст/ }))

    expect(queryByRole('button', { name: /Иван Златоуст/ })).toBeNull()
  })
})
