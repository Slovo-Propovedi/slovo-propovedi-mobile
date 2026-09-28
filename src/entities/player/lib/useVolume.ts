import { useAtom } from '@reatom/npm-react'
import { volumeAtom } from '../model'

/** Read-only accessor for the persisted playback volume (0..1). */
export const useVolume = () => {
  const [volume] = useAtom(volumeAtom)

  return volume
}
