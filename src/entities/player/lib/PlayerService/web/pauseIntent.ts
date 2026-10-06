// Single-player web app: one module-level flag is the web counterpart of the
// native `wasPlayingBeforeInterruption` closure. It is armed only by a pause
// edge that hit while playback was actually running (audioHandlers.onPause),
// so the visibility watcher knows to auto-resume an OS interruption. An
// explicit user/system-media pause (transport.pause/stop) clears it, and the
// element 'play' event neither arms nor is required to clear it.

let wasPlayingBeforeInterruption = false

/** Arms the resume intent for an interruption that hit while actually playing. */
export const markInterruptedWhilePlaying = (): void => {
  wasPlayingBeforeInterruption = true
}

/** Clears the resume intent on an explicit user/system-media pause. */
export const markUserPause = (): void => {
  wasPlayingBeforeInterruption = false
}

/** Whether playback was running when the last interruption paused it. */
export const wasPlaying = (): boolean => wasPlayingBeforeInterruption
