import { WebPlayerService } from './web/playerService'

// Volume and getStatus are real WebPlayerService methods (HTMLMediaElement
// volume; status projected from web state). Audio effects go through the
// audio-effects module's web branch, fed by registerWebAudioElement in
// loadAudio/unload.
export const playerService = new WebPlayerService()
