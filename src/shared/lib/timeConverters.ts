import { MILLIS_IN_MINUTE } from 'shared/constants';

export const millisToMinutes = (millis: number) => {
  const minutes = Math.round(millis / MILLIS_IN_MINUTE);

  return minutes;
};

export const millisToSeconds = (millis: number) => {
  const seconds = Math.round((millis % MILLIS_IN_MINUTE) / 1000);

  return seconds;
};

export const millisToMinutesAndSeconds = (millis: number) => {
  const minutes = millisToMinutes(millis);

  const seconds = millisToSeconds(millis);

  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

export const secondsToMinutesAndSeconds = (seconds: number) =>
  `${seconds / 60}:${seconds < 10 ? '0' : ''}${seconds}`;
