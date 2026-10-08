import { createCtx } from '@reatom/framework'
import { fireEvent } from '@testing-library/react-native'
import { Text } from 'react-native'
import { renderWithProviders } from '../../mocks/renderWithProviders'
import { CollapsibleGroup } from './CollapsibleGroup'

const TITLE = 'Заголовок'
const SUBTITLE = 'Подзаголовок'
const CHILD = 'Содержимое'
const TITLE_NAME = /Заголовок/

const renderGroup = (onToggle: () => void, expanded = false) =>
  renderWithProviders(
    <CollapsibleGroup title={TITLE} subtitle={SUBTITLE} expanded={expanded} onToggle={onToggle}>
      <Text>{CHILD}</Text>
    </CollapsibleGroup>,
    { ctx: createCtx() },
  )

describe('<CollapsibleGroup>', () => {
  test('renders the title and subtitle', async () => {
    const { getByText } = await renderGroup(() => {})

    expect(getByText(TITLE)).toBeTruthy()
    expect(getByText(SUBTITLE)).toBeTruthy()
  })

  test('hides the children while collapsed', async () => {
    const { getByRole, queryByText } = await renderGroup(() => {})

    expect(queryByText(CHILD)).toBeNull()
    expect(getByRole('button', { name: TITLE_NAME })).toBeCollapsed()
  })

  test('renders the children and marks the header expanded', async () => {
    const { getByRole, getByText } = await renderGroup(() => {}, true)

    expect(getByText(CHILD)).toBeTruthy()
    expect(getByRole('button', { name: TITLE_NAME })).toBeExpanded()
  })

  test('calls onToggle when the header is pressed', async () => {
    const onToggle = jest.fn()
    const { getByRole } = await renderGroup(onToggle)

    await fireEvent.press(getByRole('button', { name: TITLE_NAME }))

    expect(onToggle).toHaveBeenCalledTimes(1)
  })
})
