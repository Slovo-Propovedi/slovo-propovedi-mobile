import { WebPlayerService } from './webPlayerService'
import { createWebStubControls } from './webPlayerStubControls'

const webPlayer = new WebPlayerService()
// Web fills for controls with no browser equivalent; lock-screen metadata handled by class-level MediaSession controller.
export const playerService = Object.assign(webPlayer, createWebStubControls(webPlayer.getState))
