import { screen } from '@testing-library/react-native'
import { renderWithProviders } from 'shared/mocks'
import { DarkTheme } from 'shared/ui/theme'
import { PasswordDialog } from './PasswordDialog'

const SUBMIT_LABEL = 'Сохранить'

const renderDialog = (isSubmitting = false) =>
  renderWithProviders(
    <PasswordDialog
      visible
      onClose={jest.fn()}
      isSubmitting={isSubmitting}
      onSubmit={jest.fn(async () => true)}
    />,
  )

describe('<PasswordDialog>', () => {
  test('renders the accent submit label in the themed onPrimary color', async () => {
    await renderDialog()

    // The Save button is filled with `currentTheme.primary`; its label must use
    // the themed onPrimary token (black in the dark theme), not a hardcoded
    // white.
    expect(screen.getByText(SUBMIT_LABEL)).toHaveStyle({ color: DarkTheme.onPrimary })
  })
})
