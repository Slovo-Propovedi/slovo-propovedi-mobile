import { useEffect, useRef } from 'react'

interface InputRequest {
  nonce: number
  text: string
}

interface UseExternalInputRequestParams {
  inputRequest: InputRequest | null
  onApply: (text: string) => void
}

/**
 * Mirrors an external typing request (onboarding tour) into the visible input
 * once per nonce — the same path a manual keystroke takes. The current nonce is
 * seeded so a stale request is not replayed when the bar mounts.
 * @param params - Request atom value and the local-input apply callback.
 * @param params.inputRequest - Latest external typing request, if any.
 * @param params.onApply - Writes the requested text into the visible input.
 */
export const useExternalInputRequest = ({
  inputRequest,
  onApply,
}: UseExternalInputRequestParams) => {
  const handledNonceRef = useRef(inputRequest?.nonce ?? 0)

  useEffect(() => {
    if (inputRequest === null || inputRequest.nonce === handledNonceRef.current) return

    handledNonceRef.current = inputRequest.nonce
    onApply(inputRequest.text)
  }, [inputRequest, onApply])
}
