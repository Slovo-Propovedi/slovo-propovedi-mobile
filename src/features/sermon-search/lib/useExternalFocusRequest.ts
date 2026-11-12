import { useEffect, useRef } from 'react'

interface FocusRequest {
  nonce: number
}

interface UseExternalFocusRequestParams {
  focusRequest: FocusRequest | null
  onFocus: () => void
}

/**
 * Applies an external focus request (search page) to the visible input once per
 * nonce. The current nonce is seeded so a stale request is not replayed when the
 * bar mounts.
 * @param params - Request atom value and the focus callback.
 * @param params.focusRequest - Latest external focus request, if any.
 * @param params.onFocus - Focuses the visible input.
 */
export const useExternalFocusRequest = ({
  focusRequest,
  onFocus,
}: UseExternalFocusRequestParams) => {
  const handledNonceRef = useRef(focusRequest?.nonce ?? 0)

  useEffect(() => {
    if (focusRequest === null || focusRequest.nonce === handledNonceRef.current) return

    handledNonceRef.current = focusRequest.nonce
    onFocus()
  }, [focusRequest, onFocus])
}
