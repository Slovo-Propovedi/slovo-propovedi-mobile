import { useCallback, useEffect, useState } from 'react'
import { fetchLatestRelease, type LatestReleaseInfo } from 'shared/lib/version-check'

export type LatestReleaseState =
  { release: LatestReleaseInfo; status: 'ready' } | { status: 'error' } | { status: 'loading' }

export const useLatestReleaseUrl = (): { retry: () => void; state: LatestReleaseState } => {
  const [state, setState] = useState<LatestReleaseState>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setState({ status: 'loading' })

      const release = await fetchLatestRelease()
      if (cancelled) return

      if (!release) {
        setState({ status: 'error' })
        return
      }

      setState({ release, status: 'ready' })
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [attempt])

  const retry = useCallback(() => setAttempt(current => current + 1), [])

  return { retry, state }
}
