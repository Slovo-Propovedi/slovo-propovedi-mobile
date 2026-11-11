import { render } from '@testing-library/react-native'
import { Text } from 'react-native'
import { ScreenTitleRow } from './ScreenTitleRow'

jest.mock('../theme/ThemeContext/useTheme', () => ({
  useTheme: () => ({ currentTheme: { text: '#000' } }),
}))

describe('<ScreenTitleRow>', () => {
  test('renders the title as a header', async () => {
    const { getByRole } = await render(<ScreenTitleRow title='Слушать' />)

    expect(getByRole('header', { name: 'Слушать' })).toBeTruthy()
  })

  test('renders the actions slot next to the title', async () => {
    const { getByText } = await render(
      <ScreenTitleRow title='Ещё'>
        <Text>action</Text>
      </ScreenTitleRow>,
    )

    expect(getByText('action')).toBeTruthy()
  })
})
