import { xml2js } from 'xml-js';
import type { XMLElementElement } from '../types';

export const parseFb2BookToObject = (xml: string) =>
  xml2js(xml, {
    ignoreAttributes: true,
    ignoreCdata: true,
    ignoreComment: true,
    ignoreDeclaration: true,
    ignoreDoctype: true,
    ignoreInstruction: true,
    nativeType: true,
  }).elements?.at(0) as XMLElementElement;
