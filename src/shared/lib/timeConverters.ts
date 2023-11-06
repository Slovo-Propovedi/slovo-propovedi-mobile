export const millisToMinutesAndSeconds = (millis: number) => {
  const MILLIS_IN_MINUTE = 60000;

  const minutes = Math.round(millis / MILLIS_IN_MINUTE);

  const seconds = Math.round((millis % MILLIS_IN_MINUTE) / 1000);

  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};
