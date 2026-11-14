import { readdirSync } from 'node:fs'
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

  test('keeps the Metro fallback named index.tsx', () => {
    // Regression (web: mini-player text completely invisible). Metro resolves a
    // directory by iterating `sourceExts` in order — `ts` comes BEFORE `tsx`, so
    // a fallback `index.ts` was picked on web before `index.web.tsx` was ever
    // considered. The native MaskedView fallback then rendered its mask element
    // instead of the text (MaskedView.web.js does not mask). The fallback must
    // stay `.tsx` so the web implementation wins.
    const entries = readdirSync(__dirname)

    expect(entries).toContain('index.tsx')
    expect(entries).not.toContain('index.ts')
  })
})
