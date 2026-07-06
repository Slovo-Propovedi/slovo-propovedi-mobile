import { action } from '@reatom/framework'
import { clearCache } from './lib/clearCache'

export const clearCacheAction = action(async () => {
  try {
    await clearCache()
    return { success: true }
  } catch (error) {
    return { error, success: false }
  }
}, 'clearCacheAction')
