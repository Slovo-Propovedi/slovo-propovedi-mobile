const MILLIS_IN_MINUTE = 60000

export const millisToMinutesAndSeconds = (millis: number) => {
  const sign = millis < 0 ? '-' : ''
  const abs = Math.abs(millis)
  const minutes = Math.floor(abs / MILLIS_IN_MINUTE)
  const seconds = Math.floor((abs % MILLIS_IN_MINUTE) / 1000)

  return `${sign}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
}
