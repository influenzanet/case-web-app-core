import React, { useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import HeaderRenderer from './components/layout/HeaderRenderer';
import FooterRenderer from './components/layout/FooterRenderer';
import { FooterConfig } from './types/footerConfig';
import ScrollToTop from './components/misc/ScrollToTop';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { AppConfig } from './types/appConfig';
import { appConfig } from './store/configSlice';
import { handleOpenExternalPage } from 'case-web-ui';
import { HeaderConfig } from './types/headerConfig';
import Navbar from './components/navbar/Navbar';
import { NavbarConfig } from './types/navbarConfig';
import GlobalDialogs from './components/dialogs/GlobalDialogs';
import Pages from './components/pages/Pages';
import { PagesConfig } from './types/pagesConfig';
import { RootState } from './store/rootReducer';
import { setDefaultAccessTokenHeader } from './api/instances/authenticatedApi';
import { loadLastSelectedLanguage, saveLanguageSelection } from './i18n';
import { CustomSurveyResponseComponent } from 'case-web-ui/build/components/survey/SurveySingleItemView/ResponseComponent/ResponseComponent';

export interface Extension {
  name: string;
  component: React.FunctionComponent<any>;
}

interface AppCoreProps {
  appConfig?: AppConfig;
  headerConfig?: HeaderConfig;
  navbarConfig?: NavbarConfig;
  footerConfig?: FooterConfig;
  pagesConfig?: PagesConfig;
  hideDefaultHeader?: boolean;
  hideDefaultFooter?: boolean;
  customHeader?: React.ReactNode;
  customFooter?: React.ReactNode;
  extensions?: Extension[];
  customSurveyResponseComponents?: CustomSurveyResponseComponent[];
}

const AppCore: React.FC<AppCoreProps> = (props) => {
  const dispatch = useDispatch();
  const { i18n } = useTranslation();
  const accessToken = useSelector((state: RootState) => state.app.auth?.accessToken);

  useEffect(() => {
    if (accessToken) {
      setDefaultAccessTokenHeader(accessToken);
    }
    const language = loadLastSelectedLanguage(process.env.REACT_APP_DEFAULT_LANGUAGE ? process.env.REACT_APP_DEFAULT_LANGUAGE : 'en');
    i18n.changeLanguage(language);
  }, []);

  useEffect(() => {
    saveLanguageSelection(i18n.language);
  }, [i18n.language]);

  useEffect(() => {
    dispatch(appConfig.updateInstanceID(props.appConfig?.instanceId ? props.appConfig?.instanceId : 'default'));
  }, [props.appConfig?.instanceId])

  useEffect(() => {
    if (props.appConfig) {
      dispatch(appConfig.updateLanguages(props.appConfig.languages));
      dispatch(appConfig.updateAvatars(props.appConfig.avatars));
    }
  }, [props.appConfig])

  const handleLanguageChange = (code: string) => {
    console.log(`Changing language to: ${code}`);
    i18n.changeLanguage(code);
  }

  return (
    <Router basename={process.env.NODE_ENV === 'production' ? process.env.PUBLIC_URL : undefined}>
      <ScrollToTop />

      {props.customHeader ? props.customHeader : null}
      {
        !props.hideDefaultHeader ? <HeaderRenderer
          config={props.headerConfig}
          onChangeLanguage={handleLanguageChange}
          onOpenExternalPage={handleOpenExternalPage}
        /> : null
      }

      <Navbar
        loading={props.navbarConfig === undefined}
        content={props.navbarConfig}
        onOpenExternalPage={handleOpenExternalPage}
      />

      <Pages
        config={props.pagesConfig}
        onOpenExternalPage={handleOpenExternalPage}
        extensions={props.extensions}
        customResponseComponents={props.customSurveyResponseComponents}
      />

      {!props.hideDefaultFooter ? <FooterRenderer
        footerConfig={props.footerConfig}
        onChangeLanguage={handleLanguageChange}
        onOpenExternalPage={handleOpenExternalPage}
      /> : null}
      {props.customFooter ? props.customFooter : null}

      <GlobalDialogs
        onChangeLanguage={handleLanguageChange}
      />
    </Router>
  );
};

export default AppCore;
