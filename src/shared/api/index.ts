import { sermonsAPI } from './sermons';

export { Sermon } from './db';

export * from './sermons';

export const API = {
  sermons: sermonsAPI,
};
