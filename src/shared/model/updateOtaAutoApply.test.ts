import { decideOtaAutoApply, type OtaAutoApplyDecisionInput } from './updateOtaAutoApply'

const PENDING_UPDATE_ID = 'update-1'
const APPLIED_UPDATE_ID = 'update-0'

const CLEAR_INPUT: OtaAutoApplyDecisionInput = {
  appliedUpdateId: null,
  isPendingUpdate: true,
  isPlayerBusy: false,
  isReloading: false,
  isUpdateFlowBusy: false,
  pendingUpdateId: PENDING_UPDATE_ID,
}

const withInput = (patch: Partial<OtaAutoApplyDecisionInput>): OtaAutoApplyDecisionInput => ({
  ...CLEAR_INPUT,
  ...patch,
})

describe('decideOtaAutoApply', () => {
  test.each([
    {
      expected: false,
      input: withInput({ isPendingUpdate: false, pendingUpdateId: null }),
      name: 'declines when no bundle is pending',
    },
    {
      expected: false,
      input: withInput({ isPlayerBusy: true }),
      name: 'declines while the player is playing',
    },
    {
      expected: false,
      input: withInput({ isUpdateFlowBusy: true }),
      name: 'declines while the APK update flow owns the screen',
    },
    {
      expected: false,
      input: withInput({ isReloading: true }),
      name: 'declines while a reload is already in flight',
    },
    {
      expected: false,
      input: withInput({ appliedUpdateId: PENDING_UPDATE_ID }),
      name: 'declines when this updateId was already applied in the session',
    },
    {
      expected: true,
      input: CLEAR_INPUT,
      name: 'applies on an idle player with a fresh pending bundle',
    },
    {
      expected: true,
      input: withInput({ appliedUpdateId: APPLIED_UPDATE_ID }),
      name: 'applies a newer pending bundle after an earlier one was applied',
    },
  ])('$name', ({ expected, input }) => {
    expect(decideOtaAutoApply(input)).toBe(expected)
  })
})
