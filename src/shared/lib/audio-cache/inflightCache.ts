export interface InflightEntry {
  callbacks: Set<(progress: number) => void>
  emit: (progress: number) => void
  lastValue: number
  promise: Promise<string>
}

export const inflightCache = new Map<string, InflightEntry>()

export const resetInflightCache = (): void => {
  inflightCache.clear()
}
