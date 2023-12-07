export type KeyofAny = number | string | symbol;

export type Unpacked<T> = T extends (infer U)[]
  ? U
  : T extends (...args: unknown[]) => infer U
    ? U
    : T extends Promise<infer U>
      ? U
      : T;

export type HOC<
  RequiredProps extends object,
  ProvidedProps extends RequiredProps = RequiredProps,
  InjectedKeys extends keyof ProvidedProps | void = void,
> = <Props extends object>(
  component: React.FC<ProvidedProps & Props>,
  injector: InjectedKeys extends keyof ProvidedProps ? Pick<ProvidedProps, InjectedKeys> : void,
) => React.FC<RequiredProps & Props>;

// Принимает тип (потенциально со всеми необязательными полями) и требует от него хотя бы одно поле.
export type RequireAtLeastOne<Obj extends object, ExcludeKeys extends keyof Obj = keyof Obj> = Pick<
  Obj,
  Exclude<keyof Obj, ExcludeKeys>
> &
  {
    [K in ExcludeKeys]-?: Required<Pick<Obj, K>> & Partial<Pick<Obj, Exclude<keyof Obj, K>>>;
  }[ExcludeKeys];

export enum MimeType {
  '3gp-audio' = 'audio/3gpp',
  '3gp-video' = 'video/3gpp',
  '3gp2-audio' = 'audio/3gpp2',
  '3gp2-video' = 'video/3gpp2',
  '7z' = 'application/x-7z-compressed',
  aac = 'audio/aac',
  abw = 'application/x-abiword',
  arc = 'application/x-freearc',
  avi = 'video/x-msvideo',
  avif = 'image/avif',
  azw = 'application/vnd.amazon.ebook',
  bin = 'application/octet-stream',
  bmp = 'image/bmp',
  bz = 'application/x-bzip',
  bz2 = 'application/x-bzip2',
  cda = 'application/x-cdf',
  csh = 'application/x-csh',
  css = 'text/css',
  csv = 'text/csv',
  doc = 'application/msword',
  docx = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  eot = 'application/vnd.ms-fontobject',
  epub = 'application/epub+zip',
  gif = 'image/gif',
  gz = 'application/gzip',
  html = 'text/html',
  ico = 'image/vnd.microsoft.icon',
  ics = 'text/calendar',
  jar = 'application/java-archive',
  jpg = 'image/jpeg',
  js = 'text/javascript',
  json = 'application/json',
  jsonld = 'application/ld+json',
  mid = 'audio/midi',
  midi = 'audio/x-midi',
  mka = 'audio/x-matroska',
  mkv = 'video/x-matroska',
  mov = 'video/quicktime',
  mp3 = 'audio/mpeg',
  mp4 = 'video/mp4',
  mpeg = 'video/mpeg',
  mpkg = 'application/vnd.apple.installer+xml',
  odp = 'application/vnd.oasis.opendocument.presentation',
  ods = 'application/vnd.oasis.opendocument.spreadsheet',
  odt = 'application/vnd.oasis.opendocument.text',
  oga = 'audio/ogg',
  ogg = 'application/ogg',
  ogv = 'video/ogg',
  opus = 'audio/opus',
  otf = 'font/otf',
  pdf = 'application/pdf',
  php = 'application/x-httpd-php',
  png = 'image/png',
  ppt = 'application/vnd.ms-powerpoint',
  pptx = 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  rar = 'application/vnd.rar',
  rtf = 'application/rtf',
  sh = 'application/x-sh',
  svg = 'image/svg+xml',
  tar = 'application/x-tar',
  tiff = 'image/tiff',
  ts = 'video/mp2t',
  ttf = 'font/ttf',
  txt = 'text/plain',
  vsd = 'application/vnd.visio',
  wav = 'audio/wav',
  'webm-audio' = 'audio/webm',
  'webm-video' = 'video/webm',
  webp = 'image/webp',
  woff = 'font/woff',
  woff2 = 'font/woff2',
  xhtml = 'application/xhtml+xml',
  xls = 'application/vnd.ms-excel',
  xlsx = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  xml = 'application/xml',
  xul = 'application/vnd.mozilla.xul+xml',
  zip = 'application/zip',
}

export enum BibleBookName {
  Acts = 'Деяния',
  Colossians = 'Колоссянам',
  Ephesians = 'Ефесянам',
  FirstCorinthians = '1 Коринфянам',
  FirstJohn = '1 Иоанна',
  FirstPeter = '1 Петра',
  FirstThessalonians = '1 Фессалоникийцам',
  FirstTimothy = '1 Тимофею',
  Galatians = 'Галатам',
  James = 'Иакова',
  Jews = 'Евреям',
  John = 'Иоанна',
  Judas = 'Иуды',
  Luke = 'Луки',
  Mark = 'Марка',
  Matthew = 'Матфея',
  Philemon = 'Филимону',
  Philippians = 'Филиппийцам',
  Revelation = 'Откровение',
  Romans = 'Римлянам',
  SecondCorinthians = '2 Коринфянам',
  SecondJohn = '2 Иоанна',
  SecondPeter = '2 Петра',
  SecondThessalonians = '2 Фессалоникийцам',
  SecondTimothy = '2 Тимофею',
  ThirdJohn = '3 Иоанна',
  Titus = 'Титу',
}

export type FetchedSermonData = {
  audioUrl?: string;
  description?: string;

  id: string;

  textFileUrl?: string;

  title: string;

  youtubeUrl?: string;
} & (
  | {
      chapter: number;

      verse?: [from: number, to: number] | number;
    }
  | {
      chapter?: undefined;

      verse?: undefined;
    }
);

export type FetchedBookData = {
  description?: string;

  id: string;

  textFileUrl?: string;

  title: string;
} & (
  | {
      chapter: number;

      verse?: [from: number, to: number] | number;
    }
  | {
      chapter?: undefined;

      verse?: undefined;
    }
);

export enum FetchedSermonsGroupName {
  New = 'new',
  OnBible = 'onBible',
  Topical = 'topical',
}
export enum FetchedBooksGroupName {
  NotesForPreachers = 'notesForPreachers',
  TopicalAndThematic = 'topicalAndThematic',
  VerseByVerse = 'verseByVerse',
}

export interface FetchedPlaylist {
  description?: string;
  list: FetchedSermonData[];
  previewUrl?: string;
  title: string;
}
export interface FetchedBookList {
  description?: string;
  list: FetchedBookData[];
  previewUrl?: string;
  title: string;
}

export type FetchedSermonsGroup = {
  groupName: FetchedSermonsGroupName;
  playlists: FetchedPlaylist[];
};

export type FetchedBooksGroup = {
  bookList: FetchedBookList[];
  groupName: FetchedBooksGroupName;
};

export interface DB {
  books: FetchedBooksGroup[];
  sermons: FetchedSermonsGroup[];
}

export interface SermonData {
  audioUrl?: string;

  description?: string;

  id: string;

  textFileUrl?: string;

  title: string;

  youtubeUrl?: string;
}

export interface PlaylistData {
  description?: string;
  list: SermonData[];
  previewUrl?: string;
  title: string;
}

export interface BookData {
  description?: string;

  id: string;

  textFileUrl?: string;

  title: string;
}

export interface BookListData {
  description?: string;
  list: BookData[];
  previewUrl?: string;
  title: string;
}
