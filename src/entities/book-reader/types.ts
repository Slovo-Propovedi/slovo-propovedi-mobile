export enum XMLElementName {
  Author = 'author',
  Body = 'body',
  BookTitle = 'book-title',
  Date = 'date',
  Description = 'description',
  DocumentInfo = 'document-info',
  Emphasis = 'emphasis',
  FictionBook = 'FictionBook',
  FirstName = 'first-name',
  Genre = 'genre',
  Id = 'id',
  Lang = 'lang',
  LastName = 'last-name',
  MiddleName = 'middle-name',
  P = 'p',
  ProgramUsed = 'program-used',
  Section = 'section',
  Strong = 'strong',
  Subtitle = 'subtitle',
  Title = 'title',
  TitleInfo = 'title-info',
  Version = 'version',
}

export enum XMLElementType {
  Element = 'element',
  Text = 'text',
}

export interface XMLElementElement {
  elements: XMLElement[];
  name: XMLElementName;
  text?: undefined;
  type: XMLElementType.Element;
}
export interface XMLElementText {
  elements?: undefined;
  name?: undefined;
  text: boolean | number | string;
  type: XMLElementType.Text;
}

export type XMLElement = XMLElementElement | XMLElementText;
