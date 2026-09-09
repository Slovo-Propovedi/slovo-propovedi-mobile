import { screen } from '@testing-library/react-native'
import { buildHistoryMenuActions } from 'entities/listening-history'
import { renderWithProviders } from 'shared/mocks/renderWithProviders'
import type { SermonData } from 'shared/model'
import { SermonSearchRow } from './SermonSearchRow'

jest.mock('shared/ui/track-list', () => {
  const { Text, View } = jest.requireActual('react-native')
  return {
    TracksListItem: (props: {
      menuActions?: Array<{ text: string }>
      progress?: number
      subtitle?: string
      title: string
    }) => (
      <View testID='tracks-list-item'>
        <Text>{props.title}</Text>
        {props.subtitle && <Text>{props.subtitle}</Text>}
        {props.menuActions?.map(action => (
          <Text key={action.text}>{action.text}</Text>
        ))}
        {props.progress != null && props.progress > 0 && (
          <View
            testID='progress-bar'
            accessibilityLabel={`${Math.round(props.progress * 100)}% progress`}
          />
        )}
      </View>
    ),
  }
})

jest.mock('entities/listening-history', () => ({
  buildHistoryMenuActions: jest.fn(() => [
    { icon: 'checkmark-done', onPress: jest.fn(), text: 'Пометить прослушанной' },
  ]),
}))

const PROGRESS_BAR_TEST_ID = 'progress-bar'
const SERMON_ID = 'search-sermon-1'
const MARK_ACTION_TEXT = 'Пометить прослушанной'

const sermon: SermonData = {
  artist: 'Пастор',
  artwork: 'https://example.com/art.jpg',
  audioUrl: 'https://example.com/audio.mp3',
  id: SERMON_ID,
  title: 'Проповедь о вере',
}

const defaultProps = {
  onPress: jest.fn(),
  sermon,
}

const renderItem = (props?: Partial<React.ComponentProps<typeof SermonSearchRow>>) =>
  renderWithProviders(<SermonSearchRow {...defaultProps} {...props} />)

describe('<SermonSearchRow>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('forwards title and artist-only subtitle to TracksListItem', async () => {
    await renderItem()

    expect(screen.getByText('Проповедь о вере')).toBeTruthy()
    expect(screen.getByText('Пастор')).toBeTruthy()
  })

  test('composes subtitle with scripture when present', async () => {
    await renderItem({ sermon: { ...sermon, book: 'Матфея', chapter: 5, verse: 3 } })

    expect(screen.getByText('Пастор • Матфея 5:3')).toBeTruthy()
  })

  test('builds menuActions with mark item for not-in-history sermon', async () => {
    await renderItem()

    expect(buildHistoryMenuActions).toHaveBeenCalledWith({
      inHistory: false,
      isCompleted: false,
      playlist: undefined,
      sermon: expect.objectContaining({ id: SERMON_ID }),
    })
    expect(screen.getByText(MARK_ACTION_TEXT)).toBeTruthy()
  })

  test('builds menuActions with remove item for in-history sermon', async () => {
    await renderItem({ inHistory: true })

    expect(buildHistoryMenuActions).toHaveBeenCalledWith({
      inHistory: true,
      isCompleted: false,
      playlist: undefined,
      sermon: expect.objectContaining({ id: SERMON_ID }),
    })
  })

  test('forwards progress prop to TracksListItem', async () => {
    await renderItem({ progress: 0.5 })

    expect(screen.getByTestId(PROGRESS_BAR_TEST_ID)).toBeTruthy()
    expect(screen.getByLabelText('50% progress')).toBeTruthy()
  })
})
