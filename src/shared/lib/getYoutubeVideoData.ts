import { youtubeApi } from 'shared/api';

export const getYoutubeVideoData = async (videoUrl: string) => {
  try {
    // Извлекаем идентификатор видео из URL
    const videoId = extractVideoId(videoUrl);

    // Формируем URL запроса к YouTube Data API
    const apiUrl = 'videos';
    // const apiUrl = `videos?part=snippet&id=${videoId}&key=${API_KEY}`;

    // Отправляем GET-запрос к API
    const response = await youtubeApi.get(apiUrl, { searchParams: { id: videoId ?? '' } });

    const json = await response.json();

    if (json && typeof json === 'object') {
      //Возвращаем данные о видео
      return (json as GetYoutubeVideosResponse).items[0];
    }

    return null;
  } catch (error) {
    console.error('Ошибка при получении данных о видео:', error);
    return null;
  }
};

// Функция для извлечения идентификатора видео из URL
const extractVideoId = (url: string) => {
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&]+)/,
  );

  return match ? match[1] : null;
};

export interface GetYoutubeVideosResponse {
  etag: string;
  items: GetYoutubeVideosResponseItem[];
  kind: string;
  pageInfo: GetYoutubeVideosResponsePageInfo;
}

export interface GetYoutubeVideosResponseItem {
  etag: string;
  id: string;
  kind: string;
  snippet: GetYoutubeVideosResponseItemSnippet;
}

export interface GetYoutubeVideosResponseItemSnippet {
  categoryId: string;
  channelId: string;
  channelTitle: string;
  description: string;
  liveBroadcastContent: string;
  localized: GetYoutubeVideosResponseItemSnippetLocalized;
  publishedAt: string;
  tags: string[];
  thumbnails: GetYoutubeVideosResponseItemSnippetThumbnails;
  title: string;
}

export interface GetYoutubeVideosResponseItemSnippetLocalized {
  description: string;
  title: string;
}

export interface GetYoutubeVideosResponseItemSnippetThumbnails {
  default: GetYoutubeVideosResponseItemSnippetThumbnailsDataItem;
  high: GetYoutubeVideosResponseItemSnippetThumbnailsDataItem;
  maxres: GetYoutubeVideosResponseItemSnippetThumbnailsDataItem;
  medium: GetYoutubeVideosResponseItemSnippetThumbnailsDataItem;
  standard: GetYoutubeVideosResponseItemSnippetThumbnailsDataItem;
}

export interface GetYoutubeVideosResponseItemSnippetThumbnailsDataItem {
  height: number;
  url: string;
  width: number;
}

export interface GetYoutubeVideosResponsePageInfo {
  resultsPerPage: number;
  totalResults: number;
}
