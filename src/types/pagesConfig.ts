import { DefaultRoutes } from "./routing";

export interface PagesConfig {
  pages: Array<PageConfig>;
  defaultRoutes?: DefaultRoutes;
}

export interface PageConfig {
  path: string;
  pageKey: string;
  hideWhen?: 'auth' | 'unauth';
  rows: Array<PageRow>;
  subPages?: PagesConfig; // to use for sub-router components without wrapper
  hideTitleBar?: boolean;
}

export interface PageRow {
  key: string;
  containerClassName?: string;
  rowClassNameOverride?: string;
  fullWidth?: boolean;
  hideWhen?: 'auth' | 'unauth';
  columns: Array<PageColumn>;
}

export interface PageColumn {
  key?: string;
  className?: string;
  hideWhen?: 'auth' | 'unauth';
  items: Array<PageItem>;
}

export interface PageItem {
  itemKey: string;
  className?: string;
  hideWhen?: 'auth' | 'unauth';
  config: PageItemConfig;
}

type PageItemConfig = TeaserImageConfig | RouterComponentConfig |
  MarkdownComponentConfig | ImageCardConfig | LoginCardConfig | VideoConfig | ImageConfig |
  AccordionListConfig | SimpleCard | SystemInfoConfig | AccountSettingsConfig |
  CommunicationSettingsConfig | DeleteAccountConfig | LogoCreditsConfig |
  SurveyListConfig | LinkListConfig | MapDataSeriesConfig | LineWithScatterChartConfig | ContainerConfig | PlaceholderComponentConfig | ExtensionComponent |
  ActionCardConfig | ReportListConfig


export interface MarkdownComponentConfig {
  type: 'markdown';
  markdownUrl: string;
  flavor?: 'chart-renderer';
}

export interface ImageConfig {
  type: 'image';
  url?: string;
  urlKey?: string;
  altKey?: string;
  maxWidth?: number;
  maxHeight?: number;
}

export interface VideoConfig {
  type: 'video';
  minHeight?: number;
  posterUrlKey?: string;
  videoSources: Array<{
    urlKey: string;
    type: string;
  }>;
  tracks?: Array<{
    src: string;
    default?: boolean;
    srcLang: string;
    label: string;
    kind: string;
  }>;
  fallbackTextKey?: string;
}

export interface TeaserImageConfig {
  type: 'teaserImage',
  image: {
    url: string;
    height?: number;
    className?: string;
    backgroundPosition?: string;
  }
  textBox?: {
    className?: string;
  }
}

export interface ImageCardConfig {
  type: 'imageCard';
  action?: {
    type: 'navigate' | 'openDialog';
    value: string;
  };
  imageSrc?: string;
  className?: string;
  showActionBtn?: boolean;
}

export interface ActionCardConfig {
  type: 'actionCard';
  action?: {
    type: 'navigate' | 'openDialog';
    value: string;
  };
  image?: {
    url: string;
    as?: 'div' | 'img'; // defaults to 'div'
    alt?: string;
    className?: string;
    copyrightNotice?: string;
    copyrightNoticeXAlignment?: 'start' | 'end';
    backgroundPosition?: string;
    backgroundSize?: string;
    placement: 'top' | 'left';
    height?: string;
    width?: string;
    minWidth?: string | number;
    maxWidth?: string | number;
    minHeight?: string | number;
    maxHeight?: string | number;
  };
  bodyBgImage?: {
    url: string;
    backgroundPosition?: string;
    backgroundSize?: string;
    overlayOpacity?: number;
  };
  useFooterText?: boolean;
  className?: string;
}

interface LoginCardConfig {
  type: 'loginCard';
  showInfoText: boolean;
}

export interface AccordionListConfig {
  type: 'accordionList';
  accordionCtrlsKey: string;
}

export interface SimpleCard {
  type: 'simpleCard';
  variant?: 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

export interface LinkListConfig {
  type: 'linkList';
  links: Array<{
    linkKey: string;
    type: 'internal' | 'external' | 'language' | 'dialog';
    value: string;
  }>;
}

export interface SystemInfoConfig {
  type: 'systemInfo';
  showBrowserInfo: boolean;
}

export interface AccountSettingsConfig {
  type: 'accountSettings';
  hideProfileSettings?: boolean;
}

export interface CommunicationSettingsConfig {
  type: 'communicationSettings';
  hideLanguageSelector?: boolean;
}

export interface DeleteAccountConfig {
  type: 'deleteAccount';
  // TODO: delete only account, delete data as well
}

export interface LogoCreditsConfig {
  type: 'logoCredits';
  useTitle?: boolean;
  className?: string;
  images: Array<{
    key: string;
    url: string;
    altKey: string;
    width?: number | string;
    height?: number | string;
    className?: string;
  }>;
}

export interface MapDataSeriesConfig {
  type: 'mapDataSeries';
  mapUrl: string;
  dataUrl: string;
}

export interface LineWithScatterChartConfig {
  type: 'lineWithScatterChart';
  dataUrl: string;
}

export interface SurveyListConfig {
  type: 'surveyList';
}

export interface ReportListConfig {
  type: 'reportList';
  studyKeys?: string[];
  reportKey?: string;
  cardBgOverride?: string;
  hideStudyKey?: boolean;
  // dateLimit?
}

export interface ContainerConfig {
  type: 'container';
  items: PageItem[];
}

export interface PlaceholderComponentConfig {
  type: 'placeholder';
  label: string;
  height?: number;
}

export interface RouterComponentConfig {
  type: 'router';
  pagesConfig: PagesConfig;
}

export interface ExtensionComponent {
  type: 'extension';
  config: any;
}
