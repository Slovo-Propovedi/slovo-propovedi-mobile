import ky from 'ky';

const MY_YOUTUBE_API_KEY = 'AIzaSyAu1XlvZAWKH5kmYHt79PrDqnG4h0lQjG4';

export const youtubeApi = ky.create({
  prefixUrl: 'https://www.googleapis.com/youtube/v3/',
  searchParams: {
    key: MY_YOUTUBE_API_KEY,
    part: 'snippet',
    type: 'video',
  },
});
