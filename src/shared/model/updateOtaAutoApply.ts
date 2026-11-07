export interface OtaAutoApplyDecisionInput {
  appliedUpdateId: null | string
  isPendingUpdate: boolean
  isPlayerBusy: boolean
  isReloading: boolean
  isUpdateFlowBusy: boolean
  pendingUpdateId: null | string
}

// Whether a downloaded OTA bundle may be silently applied right now.
export const decideOtaAutoApply = (input: OtaAutoApplyDecisionInput): boolean => {
  if (!input.isPendingUpdate) return false
  if (input.isPlayerBusy) return false
  if (input.isUpdateFlowBusy) return false
  if (input.isReloading) return false
  if (input.appliedUpdateId === input.pendingUpdateId) return false
  return true
}
