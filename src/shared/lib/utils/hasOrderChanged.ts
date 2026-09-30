// True when two lists carry the same ids in a different order. Used by admin
// drag-and-drop lists to skip a no-op reorder request after a drag that ended
// where it started. A length mismatch counts as changed.
export const hasOrderChanged = (
  before: readonly { id: string }[],
  after: readonly { id: string }[],
) => {
  if (before.length !== after.length) return true

  return before.some((item, index) => item.id !== after[index]?.id)
}
