import { useFetchTextFile } from "case-web-ui";
import { useTranslation } from "react-i18next";

export const useTranslatedMarkdown = (markdownPath: string) => {
  const { i18n } = useTranslation();

  const url = `/locales/${i18n.language}/${markdownPath}`;
  return useFetchTextFile(url);
}
