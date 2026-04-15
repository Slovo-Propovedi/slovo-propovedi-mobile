import axios from 'axios'

const MY_YOUTUBE_API_KEY = 'AIzaSyAu1XlvZAWKH5kmYHt79PrDqnG4h0lQjG4'

export const youtubeApi = axios.create({
  baseURL: 'https://www.googleapis.com/youtube/v3/',
  params: {
    key: MY_YOUTUBE_API_KEY,
    part: 'snippet',
    type: 'video',
  },
})
