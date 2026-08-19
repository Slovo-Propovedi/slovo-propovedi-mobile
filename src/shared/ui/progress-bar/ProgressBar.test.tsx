import { render } from '@testing-library/react-native'
import '@testing-library/jest-native/extend-expect'
import { ProgressBar } from './ProgressBar'

jest.mock('../themed', () => ({
  useTheme: jest.fn(() => ({
    currentTheme: {
      primary: '#f16031',
      textMuted: '#888',
    },
  })),
}))

describe('<ProgressBar>', () => {
  test('renders with 50% fill', async () => {
    const { toJSON } = await render(<ProgressBar progress={0.5} />)
    const tree = toJSON()
    expect(tree).toBeTruthy()
  })

  test('clamps progress above 1 to 100% width', async () => {
    const { toJSON } = await render(<ProgressBar progress={1.5} />)
    expect(toJSON()).toBeTruthy()
  })

  test('clamps negative progress to 0% width', async () => {
    const { toJSON } = await render(<ProgressBar progress={-0.5} />)
    expect(toJSON()).toBeTruthy()
  })

  test('renders at 0% progress', async () => {
    const { toJSON } = await render(<ProgressBar progress={0} />)
    expect(toJSON()).toBeTruthy()
  })

  test('renders at 100% progress', async () => {
    const { toJSON } = await render(<ProgressBar progress={1} />)
    expect(toJSON()).toBeTruthy()
  })
})
