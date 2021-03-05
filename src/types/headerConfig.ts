
export interface HeaderConfig {
  config: SimpleLogoHeaderConfig;
}

export interface SimpleLogoHeaderConfig {
  type: 'simpleLogo';
  image: {
    altKey?: string;
    sm: {
      url: string;
      className?: string;
      height?: number;
      width?: number;
    },
    lg: {
      url: string;
      className?: string;
      height?: number;
      width?: number;
    }
  };
  className?: string;
  useLanguageSelector?: boolean;
}
