export const millisToMinutesAndSeconds = (millis: number) => {
  const millisInMinute = 60000;

  const minutes = Math.floor(millis / millisInMinute);

  const seconds = Math.floor((millis % millisInMinute) / 1000);

  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};
