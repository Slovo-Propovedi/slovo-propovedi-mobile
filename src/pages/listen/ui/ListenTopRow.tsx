import { StyleSheet, View } from 'react-native'
import { HelpHeaderButton, OnboardingTarget } from 'features/onboarding'
import { SearchToggleButton } from 'features/sermon-search'
import { useHasFinePointer } from 'shared/lib/hooks/useHasFinePointer'
import { RefreshButton } from 'shared/ui'
import { INDENTS } from 'shared/ui/theme'
import { AdminShieldButton } from './AdminShieldButton'

export const ListenTopRow = ({ showAdminButton }: { showAdminButton: boolean }) => {
  // The tour target wraps the button only when it is shown (mouse), so on touch
  // devices the «Что нового» step finds no target and is skipped.
  const hasFinePointer = useHasFinePointer()

  return (
    <View style={styles.topRow}>
      <OnboardingTarget id='listen.search-toggle'>
        <SearchToggleButton />
      </OnboardingTarget>
      <View style={styles.topRowRight}>
        {hasFinePointer && (
          <OnboardingTarget id='listen.refresh-button'>
            <RefreshButton />
          </OnboardingTarget>
        )}
        {showAdminButton && <AdminShieldButton />}
        <HelpHeaderButton />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingRight: INDENTS.low,
  },
  topRowRight: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: INDENTS.low,
  },
})
