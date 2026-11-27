import { screen } from '@testing-library/react-native'
import { type ReactNode } from 'react'
import { renderWithProviders } from 'shared/mocks'
import { ListenTopRow } from './ListenTopRow'

jest.mock('features/onboarding', () => ({
  HelpHeaderButton: () => null,
  OnboardingTarget: ({ children }: { children: ReactNode }) => children,
}))

jest.mock('shared/lib/hooks/useHasFinePointer', () => ({
  useHasFinePointer: () => false,
}))

jest.mock('./AdminShieldButton', () => ({ AdminShieldButton: () => null }))

describe('<ListenTopRow>', () => {
  test('renders the large screen title', async () => {
    await renderWithProviders(<ListenTopRow isWide={false} showAdminButton={false} />)

    expect(screen.getByRole('header', { name: 'Слушать' })).toBeTruthy()
  })

  test('renders the spacer instead of the title in the wide layout', async () => {
    await renderWithProviders(<ListenTopRow isWide showAdminButton={false} />)

    expect(screen.queryByRole('header', { name: 'Слушать' })).toBeNull()
  })
})
