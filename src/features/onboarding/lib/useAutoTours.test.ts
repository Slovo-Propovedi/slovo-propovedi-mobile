import AsyncStorage from '@react-native-async-storage/async-storage'
import { createCtx } from '@reatom/framework'
import { act, waitFor } from '@testing-library/react-native'
import { APP_VERSION } from 'shared/config'
import { renderHookWithProviders } from 'shared/mocks'
import { toursDisabledAtom } from 'shared/model'
import { onboardingTourAtom, startOnboardingTour } from '../model/tour'
import { useAutoTours } from './useAutoTours'

const mockPathname = jest.fn(() => '/listen')

jest.mock('expo-router', () => ({ usePathname: () => mockPathname() }))

jest.mock('shared/config', () => ({ APP_VERSION: '1.2.3' }))

jest.mock('../model/tour', () => {
  const actual = jest.requireActual('../model/tour')

  return { ...actual, startOnboardingTour: jest.fn(actual.startOnboardingTour) }
})

const DELAY_MS = 10
const SEEN_KEY = 'tours_seen_version'
const OLDER_VERSION = '1.1.0'
const NEWER_VERSION = '1.4.0'

const mockStartTour = jest.mocked(startOnboardingTour)
const mockGetItem = jest.mocked(AsyncStorage.getItem)
const mockSetItem = jest.mocked(AsyncStorage.setItem)

const renderAutoTours = (ctx = createCtx()) =>
  renderHookWithProviders(() => useAutoTours({ delayMs: DELAY_MS }), { ctx })

const flushDelay = async () => {
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, DELAY_MS * 5))
  })
}

describe('useAutoTours', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    mockPathname.mockReturnValue('/listen')
    await AsyncStorage.clear()
  })

  test('skips everything and does not write the seen version when tours are disabled', async () => {
    mockGetItem.mockResolvedValue(null)
    const ctx = createCtx()
    toursDisabledAtom(ctx, true)

    await renderAutoTours(ctx)
    await flushDelay()

    expect(mockSetItem).not.toHaveBeenCalled()
    expect(mockStartTour).not.toHaveBeenCalled()
    expect(ctx.get(onboardingTourAtom)).toBeNull()
  })

  test('starts welcome and writes the seen version before starting when nothing was seen', async () => {
    mockGetItem.mockResolvedValue(null)

    const { ctx } = await renderAutoTours()

    await waitFor(() =>
      expect(ctx.get(onboardingTourAtom)).toEqual({
        deckIndex: 0,
        scenarioId: 'welcome',
        skippedDeckIndexes: [],
      }),
    )

    expect(mockSetItem).toHaveBeenCalledWith(SEEN_KEY, APP_VERSION)
    expect(mockSetItem.mock.invocationCallOrder[0]).toBeLessThan(
      mockStartTour.mock.invocationCallOrder[0],
    )
    // The auto-start passes the current pathname for uniformity (a no-op: the
    // auto scenarios are global).
    expect(mockStartTour).toHaveBeenCalledWith(expect.anything(), 'welcome', '/listen')
  })

  test('does nothing when the current whats-new content was already seen', async () => {
    mockGetItem.mockResolvedValue(APP_VERSION)

    const { ctx } = await renderAutoTours()
    await flushDelay()

    expect(mockSetItem).not.toHaveBeenCalled()
    expect(mockStartTour).not.toHaveBeenCalled()
    expect(ctx.get(onboardingTourAtom)).toBeNull()
  })

  test('does nothing after an app update without new whats-new content', async () => {
    mockGetItem.mockResolvedValue(NEWER_VERSION)

    const { ctx } = await renderAutoTours()
    await flushDelay()

    expect(mockSetItem).not.toHaveBeenCalled()
    expect(mockStartTour).not.toHaveBeenCalled()
    expect(ctx.get(onboardingTourAtom)).toBeNull()
  })

  test('starts whatsNew once when the seen content is older than the current one', async () => {
    mockGetItem.mockResolvedValue(OLDER_VERSION)

    const { ctx } = await renderAutoTours()

    await waitFor(() =>
      expect(ctx.get(onboardingTourAtom)).toEqual({
        deckIndex: 0,
        scenarioId: 'whatsNew',
        skippedDeckIndexes: [],
      }),
    )

    expect(mockSetItem).toHaveBeenCalledWith(SEEN_KEY, APP_VERSION)
    expect(mockSetItem.mock.invocationCallOrder[0]).toBeLessThan(
      mockStartTour.mock.invocationCallOrder[0],
    )
  })

  test('still writes the seen version but skips start when a tour is already active', async () => {
    mockGetItem.mockResolvedValue(null)
    const ctx = createCtx()
    onboardingTourAtom(ctx, { deckIndex: 0, scenarioId: 'listen', skippedDeckIndexes: [] })

    await renderAutoTours(ctx)

    await waitFor(() => expect(mockSetItem).toHaveBeenCalledWith(SEEN_KEY, APP_VERSION))
    expect(mockStartTour).not.toHaveBeenCalled()
    expect(ctx.get(onboardingTourAtom)).toEqual({
      deckIndex: 0,
      scenarioId: 'listen',
      skippedDeckIndexes: [],
    })
  })
})
