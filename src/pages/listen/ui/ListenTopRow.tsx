import { HelpHeaderButton, OnboardingTarget } from 'features/onboarding'
import { useHasFinePointer } from 'shared/lib/hooks/useHasFinePointer'
import { RefreshButton, ScreenTitleRow } from 'shared/ui'
import { AdminShieldButton } from './AdminShieldButton'

export const ListenTopRow = ({
  hideTitle,
  showAdminButton,
}: {
  hideTitle: boolean
  showAdminButton: boolean
}) => {
  // The tour target wraps the button only when it is shown (mouse), so on touch
  // devices the «Что нового» step finds no target and is skipped.
  const hasFinePointer = useHasFinePointer()

  return (
    <ScreenTitleRow title='Слушать' hideTitle={hideTitle}>
      {hasFinePointer && (
        <OnboardingTarget id='listen.refresh-button'>
          <RefreshButton />
        </OnboardingTarget>
      )}
      {showAdminButton && <AdminShieldButton />}
      <HelpHeaderButton />
    </ScreenTitleRow>
  )
}
