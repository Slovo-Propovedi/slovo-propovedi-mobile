import { ctx } from 'shared/lib/reatom-ctx'
import { isSeekingAtom, setIsSeekingAction, setSeekTargetAction } from '../../model'

/** If no fresh position event arrives within this window, unblock the guard. */
export const SEEK_SAFETY_TIMEOUT_MS = 2000

class SeekGuard {
  public arm = (): void => {
    this.clear()
    this.seekTimeoutId = setTimeout(() => {
      this.seekTimeoutId = null
      if (ctx.get(isSeekingAtom)) void setIsSeekingAction(ctx, false)
    }, SEEK_SAFETY_TIMEOUT_MS)
  }

  public clear = (): void => {
    if (this.seekTimeoutId) {
      clearTimeout(this.seekTimeoutId)
      this.seekTimeoutId = null
    }
  }

  public reset = (): void => {
    this.clear()
    void setIsSeekingAction(ctx, false)
    void setSeekTargetAction(ctx, null)
  }

  private seekTimeoutId: null | ReturnType<typeof setTimeout> = null
}

export const seekGuard = new SeekGuard()
