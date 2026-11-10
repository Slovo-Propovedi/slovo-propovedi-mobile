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

  test('seeds the progress from the atom and animates nothing on mount', async () => {
    const targetAtom = atom(true, 'testMorphMountAtom')

    const { result } = await renderHookWithProviders(() => useAtomMorph(targetAtom, DURATION_MS))

    expect(result.current.value).toBe(1)
    expect(mockedWithTiming).not.toHaveBeenCalled()
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
