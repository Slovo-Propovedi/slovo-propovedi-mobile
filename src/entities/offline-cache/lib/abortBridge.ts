/**
 * Bridges an external AbortSignal to an internal AbortController: aborts the
 * controller immediately when the signal is already aborted, otherwise forwards
 * future abort events. Returns an unsubscribe function that detaches the
 * listener (call it in `finally` / cleanup to avoid leaks).
 * @param externalSignal - Signal to bridge from; may be undefined.
 * @param controller - Controller to abort when the external signal fires.
 */
export const bridgeAbortSignal = (
  externalSignal: AbortSignal | undefined,
  controller: AbortController,
): (() => void) => {
  const handleAbort = (): void => {
    controller.abort()
  }
  if (externalSignal?.aborted) controller.abort()
  else externalSignal?.addEventListener('abort', handleAbort, { once: true })
  return () => externalSignal?.removeEventListener('abort', handleAbort)
}
