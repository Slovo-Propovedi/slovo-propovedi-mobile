/**
 * FIFO concurrency limiter: at most `limit` holders run at once, the rest wait
 * in request order. `request` returns a release function that frees a granted
 * slot (letting the next waiter in) or cancels a still-waiting request; calling
 * it again is a no-op.
 * @param limit - Maximum number of simultaneously granted slots.
 */
export const createSlotQueue = (limit: number) => {
  let active = 0
  const waiting: (() => void)[] = []

  const pump = () => {
    while (active < limit) {
      const next = waiting.shift()
      if (!next) return
      active += 1
      next()
    }
  }

  const request = (onGrant: () => void): (() => void) => {
    let state: 'done' | 'granted' | 'waiting' = 'waiting'

    const grant = () => {
      state = 'granted'
      onGrant()
    }

    waiting.push(grant)
    pump()

    return () => {
      if (state === 'waiting') {
        const index = waiting.indexOf(grant)
        if (index >= 0) waiting.splice(index, 1)
      } else if (state === 'granted') {
        active -= 1
        pump()
      }
      state = 'done'
    }
  }

  return { request }
}
