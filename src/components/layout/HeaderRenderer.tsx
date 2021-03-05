import React from 'react';
import { HeaderConfig, SimpleLogoHeaderConfig } from '../../types/headerConfig';
import { LoadingPlaceholder, SimpleHeader } from 'case-web-ui';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/rootReducer';


interface HeaderRendererProps {
  config?: HeaderConfig;
  onChangeLanguage: (code: string) => void;
  onOpenExternalPage?: (url: string) => void;
}

const HeaderRenderer: React.FC<HeaderRendererProps> = (props) => {
  const { t, i18n } = useTranslation(['header']);
  const languages = useSelector((state: RootState) => state.config.languages);

  const simpleHeaderLocalization = (config?: SimpleLogoHeaderConfig) => {
    if (!config) { return undefined; }

    return {
      ...config,
      image: {
        ...config.image,
        altText: config.image.altKey ? t(config.image.altKey) : 'App Logo'
      }
    };
  }

  if (!props.config) {
    return <LoadingPlaceholder color="secondary" minHeight={100} />
  }
  switch (props.config.config.type) {
    case 'simpleLogo':
      const localizedConfig = simpleHeaderLocalization(props.config.config);
      return <SimpleHeader
        loading={!localizedConfig}
        config={localizedConfig}
        selectedLanguage={i18n.language}
        languages={languages.map(lng => {
          return {
            label: t(`languages.${lng.itemKey}`),
            code: lng.code
          }
        })}
        onChangeLanguage={props.onChangeLanguage}
        onOpenExternalPage={props.onOpenExternalPage}
      />
    default:
      return (
        <p>{`Unknown header layout: ${props.config.config.type}`}</p>
      );
  }
};

export default HeaderRenderer;
