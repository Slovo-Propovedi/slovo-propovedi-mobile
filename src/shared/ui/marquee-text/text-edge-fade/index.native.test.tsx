import { render, screen } from '@testing-library/react-native'
import { processColor, StyleSheet, Text } from 'react-native'
import { EDGE_FADE_GRADIENT_TEST_ID, EDGE_FADE_WIDTH } from '../marquee-styles'
import { EdgeFadeContainer } from './index.native'

const TEST_ID = 'edge-fade-container'
const CHILD_TEXT = 'Очень длинный заголовок'

const renderContainer = (fading: boolean) =>
  render(
    <EdgeFadeContainer enabled fading={fading} testID={TEST_ID}>
      <Text>{CHILD_TEXT}</Text>
    </EdgeFadeContainer>,
  )

// The mask element is mounted by MaskedView as a non-interactive absolute overlay
// (`pointerEvents='none'`); reaching it from the gradient proves the ramp lives in
// the mask and not in the visible content as a painted rectangle.
const getMaskOverlay = () => {
  const gradient = screen.getByTestId(EDGE_FADE_GRADIENT_TEST_ID)

  return gradient.parent?.parent
}

describe('<EdgeFadeContainer /> (native)', () => {
  test('ramps the mask horizontally, right edge only', async () => {
    await renderContainer(true)

    const gradient = screen.getByTestId(EDGE_FADE_GRADIENT_TEST_ID)

    // Regression: without explicit start/end expo-linear-gradient draws its
    // default TOP-TO-BOTTOM ramp, so glyphs faded by line height and the trailing
    // strip read as a translucent rectangle instead of a right-edge fade.
    expect(gradient.props.startPoint).toEqual([0, 0])
    expect(gradient.props.endPoint).toEqual([1, 0])
  })

  test('keeps the mask ramp opaque in RGB and linear in alpha', async () => {
    await renderContainer(true)

    const gradient = screen.getByTestId(EDGE_FADE_GRADIENT_TEST_ID)

    // Android derives the mask from an ARGB bitmap and reads its alpha, so the
    // stops must differ in alpha only (opaque black -> transparent black).
    expect(gradient.props.colors).toEqual(['#000000', '#00000000'].map(processColor))
  })

  test('covers exactly the trailing strip of the text box', async () => {
    await renderContainer(true)

    const gradient = screen.getByTestId(EDGE_FADE_GRADIENT_TEST_ID)
    const gradientStyle = StyleSheet.flatten(gradient.props.style)
    const maskRootStyle = StyleSheet.flatten(gradient.parent?.props.style)

    expect(gradientStyle?.width).toBe(EDGE_FADE_WIDTH)
    expect(maskRootStyle).toMatchObject({
      bottom: 0,
      flexDirection: 'row',
      left: 0,
      position: 'absolute',
      right: 0,
      top: 0,
    })
  })

  test('renders the ramp only inside the mask, never over the content', async () => {
    await renderContainer(true)

    expect(screen.getAllByTestId(EDGE_FADE_GRADIENT_TEST_ID)).toHaveLength(1)
    expect(getMaskOverlay()?.props.pointerEvents).toBe('none')
  })

  test('uses a fully opaque mask when the text fits', async () => {
    await renderContainer(false)

    expect(screen.queryByTestId(EDGE_FADE_GRADIENT_TEST_ID)).toBeNull()
  })

  test('skips MaskedView entirely when the consumer does not opt in', async () => {
    await render(
      <EdgeFadeContainer fading enabled={false} testID={TEST_ID}>
        <Text>{CHILD_TEXT}</Text>
      </EdgeFadeContainer>,
    )

    expect(screen.getByTestId(TEST_ID).props.maskElement).toBeUndefined()
    expect(screen.queryByTestId(EDGE_FADE_GRADIENT_TEST_ID)).toBeNull()
  })

  test('renders the children inside the masked container', async () => {
    await renderContainer(true)

    expect(screen.getByText(CHILD_TEXT)).toBeTruthy()
  })
})
