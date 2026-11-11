import { fireEvent, screen } from '@testing-library/react-native'
import { Text } from 'react-native'
import { renderWithProviders } from '../../mocks/renderWithProviders'
import { CollapsibleSection } from './CollapsibleSection'

const TITLE = 'Импорт аудио'
const BODY = 'Содержимое секции'
const TITLE_PATTERN = new RegExp(TITLE)

const renderSection = (isExpanded: boolean, onToggle = jest.fn()) =>
  renderWithProviders(
    <CollapsibleSection title={TITLE} onToggle={onToggle} isExpanded={isExpanded}>
      <Text>{BODY}</Text>
    </CollapsibleSection>,
  )

describe('<CollapsibleSection>', () => {
  test('hides the body while collapsed', async () => {
    await renderSection(false)

    expect(screen.queryByText(BODY)).toBeNull()
    expect(screen.getByRole('button', { name: TITLE_PATTERN })).not.toBeExpanded()
  })

  test('shows the body while expanded', async () => {
    await renderSection(true)

    expect(screen.getByText(BODY)).toBeTruthy()
    expect(screen.getByRole('button', { name: TITLE_PATTERN })).toBeExpanded()
  })

  test('reports the header press', async () => {
    const onToggle = jest.fn()
    await renderSection(false, onToggle)

    await fireEvent.press(screen.getByRole('button', { name: TITLE_PATTERN }))

    expect(onToggle).toHaveBeenCalledTimes(1)
  })
})
