import { HelpHeaderButton, OnboardingTarget } from 'features/onboarding'
import { useHasFinePointer } from 'shared/lib/hooks/useHasFinePointer'
import { RefreshButton } from 'shared/ui'
import { AdminShieldButton } from './AdminShieldButton'

// The «Слушать» header actions, shared by the compact title row and the wide overlay.
export const ListenTopActions = ({ showAdminButton }: { showAdminButton: boolean }) => {
  // The tour target wraps the button only when it is shown (mouse), so on touch
  // devices the «Что нового» step finds no target and is skipped.
  const hasFinePointer = useHasFinePointer()

  return (
    <>
      {hasFinePointer && (
        <OnboardingTarget id='listen.refresh-button'>
          <RefreshButton />
        </OnboardingTarget>
      )}
      {showAdminButton && <AdminShieldButton />}
      <HelpHeaderButton />
    </>
  )
}
