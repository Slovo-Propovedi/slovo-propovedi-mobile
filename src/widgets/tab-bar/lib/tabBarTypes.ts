import { type Tabs } from 'expo-router'

// Props the tabs navigator hands to its `tabBar` render function. Shared by the
// bar and its press hook so both read the same navigator contract.
export type TabBarProps = Parameters<NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>>[0]
