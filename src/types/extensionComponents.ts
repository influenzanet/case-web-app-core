import { PageItem } from "./pagesConfig";

export interface GenericPageItemProps {
  pageKey: string;
  itemKey: string;
  className?: string;
  dateLocales?: Array<{ code: string, locale: any, format: string }>;
  renderGenericItemFunc: (item: PageItem) => React.ReactElement | null;
  onNavigate: (url: string) => void;
}
