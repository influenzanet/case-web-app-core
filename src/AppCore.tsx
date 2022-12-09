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
import { BasicRoutes } from './types/routing';
import { HelmetProvider } from 'react-helmet-async';
import LocalStorage from './components/misc/LocalStorage';

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
  dateLocales?: Array<{ code: string, locale: any, format: string }>;
}

const AppCore: React.FC<AppCoreProps> = (props) => {
  const dispatch = useDispatch();
  const { i18n } = useTranslation();
  const accessToken = useSelector((state: RootState) => state.app.auth?.accessToken);

  /*
  * In order to solve the issue https://github.com/coneno/case-web-app-core/issues/5, now Dialogs also need to know the application level default routes,
  * but removing the defaultRoutes field from the PagesConfig interface and make it available at a higher level would be a breaking change for all the existing frontends.
  *
  * From now on, all components under AppCore that need to be aware of the application level default routes, can use a prop directly initialized with the const below.
  *
  * See how it is handled in the Pages and GlobalDialog components
  */

  const defaultRoutes = props.pagesConfig?.defaultRoutes ? props.pagesConfig.defaultRoutes : BasicRoutes

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
    <HelmetProvider>
      <LocalStorage />
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
          dateLocales={props.dateLocales}
          defaultRoutes={defaultRoutes}
        />

        {!props.hideDefaultFooter ? <FooterRenderer
          footerConfig={props.footerConfig}
          onChangeLanguage={handleLanguageChange}
          onOpenExternalPage={handleOpenExternalPage}
        /> : null}
        {props.customFooter ? props.customFooter : null}

        <GlobalDialogs
          defaultRoutes={defaultRoutes}
          onChangeLanguage={handleLanguageChange}
        />
      </Router>
    </HelmetProvider>
  );
};

export default AppCore;
