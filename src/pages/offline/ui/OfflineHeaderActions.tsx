import { StyleSheet, View } from 'react-native'
import { OnboardingHelpRow } from 'features/onboarding'
import { INDENTS } from 'shared/ui/theme'
import { OfflineHeaderMenu } from './OfflineHeaderMenu'
import { SermonCachingHeaderSwitch } from './SermonCachingHeaderSwitch'

export const OfflineHeaderActions = ({
  isPlayAllDisabled,
  onPlayAll,
}: {
  isPlayAllDisabled: boolean
  onPlayAll: () => void
}) => (
  <OnboardingHelpRow>
    <View style={styles.headerActions}>
      <SermonCachingHeaderSwitch onboardingTargetId='offline.caching-switch' />
      <OfflineHeaderMenu
        onPlayAll={onPlayAll}
        isPlayAllDisabled={isPlayAllDisabled}
        onboardingTargetId='offline.header-menu'
      />
    </View>
  </OnboardingHelpRow>
)

const styles = StyleSheet.create({
  headerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: INDENTS.lowest,
  },
})
