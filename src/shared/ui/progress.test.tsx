import { act, render } from '@testing-library/react-native'
import { Animated } from 'react-native'
import { Progress } from './progress'
import { COLORS } from './themed'
import '@testing-library/jest-native/extend-expect'

const total = 100
const progress = 50

let loaderValue = new Animated.Value(50)

const progressBarInnerId = 'progress-bar-inner'

describe('<Progress/>', () => {
  beforeEach(() => {
    loaderValue = new Animated.Value(50)
  })

  it('renders correctly with progress 0', async () => {
    const { getByTestId } = await render(<Progress progress={0} total={total} />)

    expect(getByTestId(progressBarInnerId)).toHaveStyle({ width: '0%' })
  })

  it('renders correctly with progress 50', async () => {
    const { getByTestId } = await render(
      <Progress total={total} progress={progress} loaderValue={loaderValue} />,
    )
    expect(getByTestId(progressBarInnerId)).toHaveStyle({ width: '50%' })
  })

  it('renders correctly with progress 100', async () => {
    const { getByTestId } = await render(
      <Progress total={total} progress={total} loaderValue={new Animated.Value(100)} />,
    )
    expect(getByTestId(progressBarInnerId)).toHaveStyle({ width: '100%' })
  })

  it('updates width when progress prop changes', async () => {
    const { getByTestId, rerender } = await render(
      <Progress total={total} progress={progress} loaderValue={loaderValue} />,
    )
    expect(getByTestId(progressBarInnerId)).toHaveStyle({ width: '50%' })
    await act(async () => {
      rerender(<Progress progress={75} total={total} loaderValue={loaderValue} />)
    })
    expect(getByTestId(progressBarInnerId)).toHaveStyle({ width: '75%' })
  })

  it('renders a gray background progress bar', async () => {
    const { getByTestId } = await render(
      <Progress total={total} progress={progress} loaderValue={loaderValue} />,
    )
    expect(getByTestId('progress-bar')).toHaveStyle({ backgroundColor: COLORS.gray })
  })

  it('renders a primary colored progress bar', async () => {
    const { getByTestId } = await render(
      <Progress total={total} progress={progress} loaderValue={loaderValue} />,
    )
    expect(getByTestId(progressBarInnerId)).toHaveStyle({ backgroundColor: COLORS.primary })
  })
})
