import { act } from '@testing-library/react-native'
import { Platform, StyleSheet } from 'react-native'
import { searchQueryAtom } from 'features/sermon-search/@x/barMorph'
import { createKeyDownEvent, installFakeDom } from 'shared/lib/testing'
import { getSharedTestCtx, renderWithProviders } from 'shared/mocks'
import { SearchPageField } from './SearchPageField'

const SEARCH_PLACEHOLDER = 'Проповеди, проповедники, название книги'

const mockBack = jest.fn()
const mockNavigate = jest.fn()
const mockCreateDistinctValuesResponse = {
  artists: [],
  books: [],
}
let mockPathname = '/listen'

jest.mock('expo-audio', () => ({
  createAudioPlayer: jest.fn(),
  setAudioModeAsync: jest.fn(),
}))

jest.mock('expo-router', () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({
    back: mockBack,
    canGoBack: () => true,
    navigate: mockNavigate,
  }),
}))

jest.mock('expo-intent-launcher', () => ({
  ResultCode: { Success: 0 },
  startActivityAsync: jest.fn(),
}))

jest.mock('shared/model/info-dialog', () => ({ showInfo: jest.fn() }))

jest.mock('shared/api', () => ({
  mapAllSermonsResponse: jest.fn(),
  sermonsApi: {
    getSermons: () => ({
      sermonControllerFindAll: jest.fn(),
      sermonControllerGetDistinctValues: jest
        .fn()
        .mockResolvedValue(mockCreateDistinctValuesResponse),
    }),
  },
}))

const renderField = async () => await renderWithProviders(<SearchPageField />)

describe('<SearchPageField>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPathname = '/listen'
    searchQueryAtom(getSharedTestCtx(), '')
  })

  test('the field container stacks above the sections that follow it', async () => {
    const { getByPlaceholderText } = await renderField()
    const input = getByPlaceholderText(SEARCH_PLACEHOLDER)
    const fieldContainer = input.parent?.parent

    expect(StyleSheet.flatten(fieldContainer?.props.style).zIndex).toBe(1)
  })

  test('does not leave the search route on Escape while another tab is active', async () => {
    const dom = installFakeDom()
    const restorePlatform = jest.replaceProperty(Platform, 'OS', 'web')
    try {
      await renderField()

      await act(async () => {
        dom.dispatchKeyDown(createKeyDownEvent('Escape'))
      })

      expect(mockBack).not.toHaveBeenCalled()
      expect(mockNavigate).not.toHaveBeenCalled()
    } finally {
      restorePlatform.restore()
      dom.restore()
    }
  })

  test('leaves the search route on Escape when the search route is active', async () => {
    mockPathname = '/search'
    const dom = installFakeDom()
    const restorePlatform = jest.replaceProperty(Platform, 'OS', 'web')
    try {
      await renderField()

      await act(async () => {
        dom.dispatchKeyDown(createKeyDownEvent('Escape'))
      })

      expect(mockBack).toHaveBeenCalledTimes(1)
    } finally {
      restorePlatform.restore()
      dom.restore()
    }
  })
})
