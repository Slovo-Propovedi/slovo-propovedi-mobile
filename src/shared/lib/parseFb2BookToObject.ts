import { xml2js } from 'xml-js';

type MyElement = {
  elements?: MyElement[];
  name?: string;
  text?: boolean | number | string;
  type: string;
};

export const parseFb2BookToObject = (xml: string) =>
  xml2js(xml, {
    ignoreAttributes: true,
    ignoreCdata: true,
    ignoreComment: true,
    ignoreDeclaration: true,
    ignoreDoctype: true,
    ignoreInstruction: true,
    nativeType: true,
  }) as MyElement;
