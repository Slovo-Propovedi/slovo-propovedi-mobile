import '@testing-library/jest-native/extend-expect'
import { act, fireEvent } from '@testing-library/react-native'
import { renderWithProviders } from 'shared/mocks/renderWithProviders'
import type { createStyles } from '../ExpandablePlayer/styles'
import { AUTO_COLLAPSE_DELAY_MS, NextSermonPlate } from './NextSermonPlate'

const LABEL = 'следующая проповедь'
const TITLE = 'Следующая проповедь о вере'
const ACCESSIBLE_NAME = 'Следующая проповедь'
const EXPANDED_NAME = `${ACCESSIBLE_NAME}. ${TITLE}`

const styles = {
  nextSermonAnchor: {},
  nextSermonChevron: {},
  nextSermonContainer: {},
  nextSermonLabel: {},
  nextSermonRow: {},
  nextSermonTitle: {},
  nextSermonTitleWrapper: {},
} as unknown as ReturnType<typeof createStyles>

const renderPlate = (currentAudioId = 'audio-1') =>
  renderWithProviders(
    <NextSermonPlate
      insetsTop={8}
      styles={styles}
      nextSermonTitle={TITLE}
      currentAudioId={currentAudioId}
    />,
  )

describe('<NextSermonPlate>', () => {
  afterEach(() => {
    jest.useRealTimers()
  })

  test('renders the label and hides the title initially', async () => {
    const { getByText, queryByText } = await renderPlate()

    expect(getByText(LABEL)).toBeTruthy()
    expect(queryByText(TITLE)).toBeNull()
  })

  test('expands on press and reveals the title', async () => {
    const { getByRole, getByText } = await renderPlate()
    const plate = getByRole('button', { name: ACCESSIBLE_NAME })

    await fireEvent.press(plate)

    expect(getByText(TITLE)).toBeTruthy()
    expect(getByRole('button', { name: EXPANDED_NAME })).toHaveAccessibilityState({
      expanded: true,
    })
  })

  test('collapses on second press and hides the title', async () => {
    const { getByRole, queryByText } = await renderPlate()
    const plate = getByRole('button', { name: ACCESSIBLE_NAME })

    await fireEvent.press(plate)
    expect(queryByText(TITLE)).toBeTruthy()

    await fireEvent.press(getByRole('button', { name: EXPANDED_NAME }))
    expect(queryByText(TITLE)).toBeNull()
  })

  test('auto-collapses when the current audio changes', async () => {
    const { getByRole, queryByText, rerender } = await renderPlate('audio-1')

    await fireEvent.press(getByRole('button', { name: ACCESSIBLE_NAME }))
    expect(queryByText(TITLE)).toBeTruthy()

    await rerender(
      <NextSermonPlate
        insetsTop={8}
        styles={styles}
        nextSermonTitle={TITLE}
        currentAudioId='audio-2'
      />,
    )

    expect(queryByText(TITLE)).toBeNull()
  })

  test('auto-collapses after 10 seconds of being expanded', async () => {
    const { getByRole, queryByText } = await renderPlate()
    jest.useFakeTimers({ doNotFake: ['setImmediate'] })
    const plate = getByRole('button', { name: ACCESSIBLE_NAME })

    await fireEvent.press(plate)
    expect(queryByText(TITLE)).toBeTruthy()

    await act(async () => {
      jest.advanceTimersByTime(AUTO_COLLAPSE_DELAY_MS)
    })

    expect(queryByText(TITLE)).toBeNull()
    expect(getByRole('button', { name: ACCESSIBLE_NAME })).toHaveAccessibilityState({
      expanded: false,
    })
  })

  test('does not auto-collapse before 10 seconds', async () => {
    const { getByRole, queryByText } = await renderPlate()
    jest.useFakeTimers({ doNotFake: ['setImmediate'] })
    const plate = getByRole('button', { name: ACCESSIBLE_NAME })

    await fireEvent.press(plate)
    expect(queryByText(TITLE)).toBeTruthy()

    await act(async () => {
      jest.advanceTimersByTime(AUTO_COLLAPSE_DELAY_MS - 1)
    })

    expect(queryByText(TITLE)).toBeTruthy()
    expect(getByRole('button', { name: EXPANDED_NAME })).toHaveAccessibilityState({
      expanded: true,
    })
  })

  test('manual collapse clears the auto-collapse timer', async () => {
    const { getByRole, queryByText } = await renderPlate()
    jest.useFakeTimers({ doNotFake: ['setImmediate'] })
    const plate = getByRole('button', { name: ACCESSIBLE_NAME })

    await fireEvent.press(plate)
    expect(queryByText(TITLE)).toBeTruthy()

    await act(async () => {
      jest.advanceTimersByTime(AUTO_COLLAPSE_DELAY_MS / 2)
    })

    await fireEvent.press(getByRole('button', { name: EXPANDED_NAME }))
    expect(queryByText(TITLE)).toBeNull()

    await fireEvent.press(getByRole('button', { name: ACCESSIBLE_NAME }))
    expect(queryByText(TITLE)).toBeTruthy()

    await act(async () => {
      jest.advanceTimersByTime(AUTO_COLLAPSE_DELAY_MS / 2)
    })

    // A leaked timer from the first expansion would have collapsed the plate here.
    expect(queryByText(TITLE)).toBeTruthy()
    expect(getByRole('button', { name: EXPANDED_NAME })).toHaveAccessibilityState({
      expanded: true,
    })

    await act(async () => {
      jest.advanceTimersByTime(AUTO_COLLAPSE_DELAY_MS / 2)
    })

    expect(queryByText(TITLE)).toBeNull()
    expect(getByRole('button', { name: ACCESSIBLE_NAME })).toHaveAccessibilityState({
      expanded: false,
    })
  })
})
