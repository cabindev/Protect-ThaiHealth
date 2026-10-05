import th from './th';
import en from './en';
import type { Locale } from '../config';

export type { Dictionary } from './th';
export const dictionaries = { th, en } as const;
export const getDictionaryFor = (locale: Locale) => dictionaries[locale];
