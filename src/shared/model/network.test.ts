import { createCtx } from '@reatom/framework'
import {
  isOnlineAtom,
  reportServerReachable,
  reportServerUnreachable,
  serverUnreachableAtom,
  setOnlineStatus,
} from './network'

describe('network model', () => {
  let ctx: ReturnType<typeof createCtx>

  beforeEach(() => {
    ctx = createCtx()
  })

  describe('isOnlineAtom', () => {
    test('initial value is true', () => {
      expect(ctx.get(isOnlineAtom)).toBe(true)
    })

    test('setOnlineStatus updates atom to true', () => {
      setOnlineStatus(ctx, false)
      expect(ctx.get(isOnlineAtom)).toBe(false)

      setOnlineStatus(ctx, true)
      expect(ctx.get(isOnlineAtom)).toBe(true)
    })

    test('setOnlineStatus toggles between true and false', () => {
      expect(ctx.get(isOnlineAtom)).toBe(true)

      setOnlineStatus(ctx, false)
      expect(ctx.get(isOnlineAtom)).toBe(false)

      setOnlineStatus(ctx, false)
      expect(ctx.get(isOnlineAtom)).toBe(false)
    })
  })

  describe('serverUnreachableAtom', () => {
    test('initial value is false', () => {
      expect(ctx.get(serverUnreachableAtom)).toBe(false)
    })

    test('reportServerReachable clears server error', () => {
      setOnlineStatus(ctx, true)
      reportServerUnreachable(ctx)
      expect(ctx.get(serverUnreachableAtom)).toBe(true)

      reportServerReachable(ctx)
      expect(ctx.get(serverUnreachableAtom)).toBe(false)
    })
  })

  describe('reportServerUnreachable', () => {
    test('sets serverUnreachableAtom when online', () => {
      setOnlineStatus(ctx, true)
      reportServerUnreachable(ctx)

      expect(ctx.get(serverUnreachableAtom)).toBe(true)
    })

    test('does not set serverUnreachableAtom when offline', () => {
      setOnlineStatus(ctx, false)
      reportServerUnreachable(ctx)

      expect(ctx.get(serverUnreachableAtom)).toBe(false)
    })

    test('auto-dismisses after 4 seconds when online', () => {
      jest.useFakeTimers()

      setOnlineStatus(ctx, true)
      reportServerUnreachable(ctx)
      expect(ctx.get(serverUnreachableAtom)).toBe(true)

      jest.advanceTimersByTime(4000)
      expect(ctx.get(serverUnreachableAtom)).toBe(false)

      jest.useRealTimers()
    })

    test('does not auto-dismiss when offline', () => {
      jest.useFakeTimers()

      setOnlineStatus(ctx, false)
      reportServerUnreachable(ctx)
      expect(ctx.get(serverUnreachableAtom)).toBe(false)

      jest.advanceTimersByTime(4000)
      expect(ctx.get(serverUnreachableAtom)).toBe(false)

      jest.useRealTimers()
    })

    test('shows toast only once per outage until server is reachable again', () => {
      jest.useFakeTimers()

      setOnlineStatus(ctx, true)

      // First call — toast shows
      reportServerUnreachable(ctx)
      expect(ctx.get(serverUnreachableAtom)).toBe(true)

      // Auto-dismiss
      jest.advanceTimersByTime(4000)
      expect(ctx.get(serverUnreachableAtom)).toBe(false)

      // Second call during same outage — toast does NOT show again
      reportServerUnreachable(ctx)
      expect(ctx.get(serverUnreachableAtom)).toBe(false)

      // Server recovers — resets the "shown" flag
      reportServerReachable(ctx)

      // Next outage — toast shows again
      reportServerUnreachable(ctx)
      expect(ctx.get(serverUnreachableAtom)).toBe(true)

      jest.useRealTimers()
    })
  })
})
