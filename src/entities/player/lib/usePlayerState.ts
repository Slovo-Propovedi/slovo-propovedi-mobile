import { useEffect, useState } from 'react'
import { playerService } from './PlayerService'

export const usePlayerState = () => {
  const [state, setState] = useState(playerService.getState())

  useEffect(() => {
    const unsubscribe = playerService.subscribe(() => {
      setState(playerService.getState())
    })
    return () => {
      unsubscribe()
    }
  }, [])

  return state
}
