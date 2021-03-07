import { useFetchTextFile } from "case-web-ui";
import { useTranslation } from "react-i18next";

export const getTranslatedMarkdownPath = (markdownName: string, language: string): string => {
  return `/locales/${language}/${markdownName}`;
}

export const useTranslatedMarkdown = (markdownPath: string) => {
  const { i18n } = useTranslation();

  const url = getTranslatedMarkdownPath(markdownPath, i18n.language);
  return useFetchTextFile(url);
}
