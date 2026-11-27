import { act, render } from '@testing-library/react-native'
import { useEffect } from 'react'
import { Text } from 'react-native'
import * as Reanimated from 'react-native-reanimated'
import { type SharedValue } from 'react-native-reanimated'
import { usePersistentSharedValue } from '../../mocks/usePersistentSharedValue'
import { useLayoutEffectSharedValue } from './useLayoutEffectSharedValue'

const Probe = ({
  onObserved,
  valueShared,
}: {
  onObserved: (value: number) => void
  valueShared: SharedValue<number>
}) => {
  // Passive effect on purpose: it runs BEFORE the parent's passive effects, so
  // whatever it observes here was already visible during the layout phase.
  useEffect(() => {
    onObserved(valueShared.value)
  })

  return <Text>probe</Text>
}

const Harness = ({ onObserved, value }: { onObserved: (value: number) => void; value: number }) => {
  const valueShared = useLayoutEffectSharedValue(value)

  return <Probe onObserved={onObserved} valueShared={valueShared} />
}

describe('useLayoutEffectSharedValue', () => {
  beforeEach(() => {
    jest
      .spyOn(Reanimated, 'useSharedValue')
      .mockImplementation(usePersistentSharedValue as unknown as typeof Reanimated.useSharedValue)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('mirrors the initial value on the first committed frame', async () => {
    const observed: number[] = []
    await render(<Harness value={400} onObserved={value => observed.push(value)} />)

    expect(observed[0]).toBe(400)
  })

  test('publishes a changed value before the passive phase', async () => {
    const observed: number[] = []
    const onObserved = (value: number) => observed.push(value)
    const { rerender } = await render(<Harness value={400} onObserved={onObserved} />)

    observed.length = 0
    await act(async () => {
      await rerender(<Harness value={844} onObserved={onObserved} />)
    })

    expect(observed[observed.length - 1]).toBe(844)
  })
})
