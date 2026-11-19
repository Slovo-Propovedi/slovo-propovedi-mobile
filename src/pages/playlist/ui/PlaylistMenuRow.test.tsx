import { screen } from '@testing-library/react-native'
import { StyleSheet, View } from 'react-native'
import { renderWithProviders } from 'shared/mocks'
import { PlaylistMenuRow } from './PlaylistMenuRow'

const ROW_TEXT = 'Копировать ссылку'
const MENU_ITEM_PADDING = 16
const onPressMock = jest.fn()

const renderRow = async ({ isFlush }: { isFlush?: boolean } = {}) =>
  renderWithProviders(
    <PlaylistMenuRow icon={<View />} text={ROW_TEXT} isFlush={isFlush} onPress={onPressMock} />,
  )

describe('<PlaylistMenuRow>', () => {
  beforeEach(() => {
    onPressMock.mockClear()
  })

  test('keeps the menu indent by default', async () => {
    await renderRow()

    const row = StyleSheet.flatten(screen.getByText(ROW_TEXT).parent?.props.style)

    expect(row.paddingHorizontal).toBe(MENU_ITEM_PADDING)
  })

  test('drops the horizontal indent when flush', async () => {
    await renderRow({ isFlush: true })

    const row = StyleSheet.flatten(screen.getByText(ROW_TEXT).parent?.props.style)

    expect(row.paddingHorizontal).toBe(0)
  })
})
