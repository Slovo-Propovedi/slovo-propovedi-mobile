import { type ReactElement } from 'react'
import { OnboardingTarget } from 'features/onboarding'

// Full width so the target rect matches the picker dialog inside the shared modal
// (the dialog container stretches to `minWidth: '100%'`).
const PICKER_TARGET_STYLE = { width: '100%' } as const

// Page-owned onboarding wrappers passed into the sermon-search feature as generic
// props, so the feature never imports features/onboarding (dependency inversion).
export const wrapSearchGroupHeader = (header: ReactElement) => (
  <OnboardingTarget id='search-results.group-sermons'>{header}</OnboardingTarget>
)

export const wrapFirstSearchRow = (row: ReactElement) => (
  <OnboardingTarget id='search-results.first-sermon'>{row}</OnboardingTarget>
)

export const wrapSearchRowMenuButton = (button: ReactElement) => (
  <OnboardingTarget id='search-results.first-sermon-menu'>{button}</OnboardingTarget>
)

export const wrapSearchPicker = (dialog: ReactElement) => (
  <OnboardingTarget id='search.picker-modal' style={PICKER_TARGET_STYLE}>
    {dialog}
  </OnboardingTarget>
)
