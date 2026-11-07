import { render, screen } from '@testing-library/react-native'
import { StyleSheet, Text } from 'react-native'
import { EDGE_FADE_WIDTH } from '../marquee-styles'
import { EdgeFadeContainer } from './index.web'

const TEST_ID = 'edge-fade-container'
const CHILD_TEXT = 'Очень длинный заголовок'

const renderContainer = (fading: boolean) =>
  render(
    <EdgeFadeContainer enabled fading={fading} testID={TEST_ID}>
      <Text>{CHILD_TEXT}</Text>
    </EdgeFadeContainer>,
  )

describe('<EdgeFadeContainer /> (web)', () => {
  test('applies a right-edge alpha mask while the text overflows', async () => {
    await renderContainer(true)

    const style = StyleSheet.flatten(screen.getByTestId(TEST_ID).props.style)

    expect(style?.maskImage).toContain('linear-gradient')
    expect(style?.maskImage).toContain(`calc(100% - ${EDGE_FADE_WIDTH}px)`)
  })

  test('leaves the container unmasked when the text fits', async () => {
    await renderContainer(false)

    const style = StyleSheet.flatten(screen.getByTestId(TEST_ID).props.style)

    expect(style?.maskImage).toBeUndefined()
  })

  test('renders the children inside the container', async () => {
    await renderContainer(true)

    expect(screen.getByText(CHILD_TEXT)).toBeTruthy()
  })
})
