import { atom } from '@reatom/framework'
import { act } from '@testing-library/react-native'
import { withTiming } from 'react-native-reanimated'
import { renderHookWithProviders } from '../../mocks/renderWithProviders'
import { useAtomMorph } from './useAtomMorph'

const mockedWithTiming = withTiming as jest.Mock
const DURATION_MS = 300
const defaultWithTimingImpl = mockedWithTiming.getMockImplementation() as (
  toValue: number,
  config: unknown,
  callback?: (finished: boolean) => void,
) => number

describe('useAtomMorph', () => {
  afterEach(() => {
    mockedWithTiming.mockImplementation(defaultWithTimingImpl)
  })

  test('stays settled on mount and animates nothing', async () => {
    const targetAtom = atom(true, 'testMorphMountAtom')

    const { result } = await renderHookWithProviders(() => useAtomMorph(targetAtom, DURATION_MS))

    expect(result.current.progress.value).toBe(1)
    expect(result.current.isMorphing).toBe(false)
    expect(mockedWithTiming).not.toHaveBeenCalled()
  })

  test('flags the morph as in flight until the timing reports it settled', async () => {
    const completions: Array<(finished: boolean) => void> = []
    mockedWithTiming.mockImplementation((toValue, _config, callback) => {
      if (typeof callback === 'function') completions.push(callback)
      return toValue
    })
    const targetAtom = atom(false, 'testMorphFlightAtom')

    const { ctx, result } = await renderHookWithProviders(() =>
      useAtomMorph(targetAtom, DURATION_MS),
    )

    await act(async () => {
      targetAtom(ctx, true)
    })

    // The start commit and the animation share one subscription tick.
    expect(result.current.isMorphing).toBe(true)
    expect(result.current.progress.value).toBe(1)

    await act(async () => {
      completions[0](true)
    })

    expect(result.current.isMorphing).toBe(false)
  })

  test('stays in flight while an interrupted timing owns no settle', async () => {
    const completions: Array<(finished: boolean) => void> = []
    mockedWithTiming.mockImplementation((toValue, _config, callback) => {
      if (typeof callback === 'function') completions.push(callback)
      return toValue
    })
    const targetAtom = atom(false, 'testMorphInterruptAtom')

    const { ctx, result } = await renderHookWithProviders(() =>
      useAtomMorph(targetAtom, DURATION_MS),
    )

    await act(async () => {
      targetAtom(ctx, true)
    })
    await act(async () => {
      completions[0](false)
    })

    expect(result.current.isMorphing).toBe(true)
  })

  test('forwards the settle target to the extra handler', async () => {
    const completions: Array<(finished: boolean) => void> = []
    mockedWithTiming.mockImplementation((toValue, _config, callback) => {
      if (typeof callback === 'function') completions.push(callback)
      return toValue
    })
    const targetAtom = atom(false, 'testMorphExtraSettleAtom')
    const onSettled = jest.fn()

    const { ctx } = await renderHookWithProviders(() =>
      useAtomMorph(targetAtom, DURATION_MS, onSettled),
    )

    await act(async () => {
      targetAtom(ctx, true)
    })
    await act(async () => {
      completions[0](true)
    })

    expect(onSettled).toHaveBeenCalledWith(true)
  })
})
