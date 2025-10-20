/**
 * Language Support Utilities
 * Handles language codes, flags, and display names for multi-language card support
 */

export type LanguageCode = 'en' | 'jp' | 'kr' | 'zh-tw' | 'zh-cn' | 'fr' | 'de' | 'it' | 'es' | 'pt';

export interface Language {
  code: LanguageCode;
  name: string;
  nativeName: string;
  flag: string;
}

export const LANGUAGES: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'jp', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'kr', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'zh-tw', name: 'Traditional Chinese', nativeName: '繁體中文', flag: '🇹🇼' },
  { code: 'zh-cn', name: 'Simplified Chinese', nativeName: '简体中文', flag: '🇨🇳' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷' },
];

export function getLanguage(code: LanguageCode): Language | undefined {
  return LANGUAGES.find(lang => lang.code === code);
}

export function getFlag(code: LanguageCode): string {
  const lang = getLanguage(code);
  return lang?.flag || '🌐';
}

export function getLanguageName(code: LanguageCode, native = false): string {
  const lang = getLanguage(code);
  if (!lang) return code.toUpperCase();
  return native ? lang.nativeName : lang.name;
}

export function formatLanguageDisplay(code: LanguageCode, format: 'code' | 'flag' | 'flag-code' | 'full' = 'flag-code'): string {
  const lang = getLanguage(code);
  if (!lang) return code.toUpperCase();

  switch (format) {
    case 'code':
      return code.toUpperCase();
    case 'flag':
      return lang.flag;
    case 'flag-code':
      return `${lang.flag} ${code.toUpperCase()}`;
    case 'full':
      return `${lang.flag} ${lang.nativeName}`;
    default:
      return code.toUpperCase();
  }
}



