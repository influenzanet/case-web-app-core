import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import Backend from 'i18next-http-backend';


export const InterpolationKeys = {
  Date: "date",
}

/**
 * Initialize i18n - use this method at the start of the application, so that the translation files can be loaded
 * @param lng language code of the default language
 * @param fallbackLng language code for the fallback language (if a translation is not available)
 * @param localeUrl root url of the folder that contains the locale definitions (e.g.: https://example.com/static/locales)
 */
export const initI18n = (
  lng: string,
  fallbackLng: string,
  localeUrl: string,
) => {
  return i18n
    .use(Backend)
    .use(initReactI18next) // passes i18n down to react-i18next
    .init({
      lng: lng,
      fallbackLng: fallbackLng,
      lowerCaseLng: true,
      backend: {
        // for all available options read the backend's repository readme file
        loadPath: localeUrl + '/{{lng}}/{{ns}}.json',
        requestOptions: {
          cache: 'no-store'
        }
      },
      interpolation: {
        escapeValue: false, // react already safes from xss
        format: (value, format, lng) => {
          if (format === InterpolationKeys.Date) {
            return new Intl.DateTimeFormat(lng).format(value);
          }
          return value;
        }
      },
      react: {
        useSuspense: true
      }
    })
    .then(() => {
      // store.dispatch(userActions.initializeLanguage(i18n.language));
    });
}


const languageKey = 'language';

export const loadLastSelectedLanguage = (defaultLang: string): string => {
  const language = localStorage.getItem(languageKey);
  if (!language) {
    return defaultLang;
  }
  return language;
}

export const saveLanguageSelection = (lang: string) => {
  localStorage.setItem(languageKey, lang);
}
