import { screen } from '@testing-library/react-native'
import '@testing-library/jest-native/extend-expect'
import { renderWithProviders } from 'shared/mocks/renderWithProviders'
import { TabButton } from './TabButton'

const noop = () => {}

const renderTabButton = async (routeName: string) =>
  await renderWithProviders(
    <TabButton
      onPress={noop}
      onLayout={noop}
      isActive={false}
      routeKey={routeName}
      routeName={routeName}
    />,
  )

describe('<TabButton>', () => {
  test.each([
    ['listen', 'Слушать'],
    ['read', 'Читать'],
    ['study', 'Учиться'],
    ['more', 'Еще'],
  ])('renders single-line label for %s', async (routeName, displayName) => {
    await renderTabButton(routeName)

    const label = screen.getByText(displayName)

    expect(label.props.numberOfLines).toBe(1)
    expect(label.props.maxFontSizeMultiplier).toBe(1.2)
  })
})
