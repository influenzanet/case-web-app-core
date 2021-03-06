import React, { useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import HeaderRenderer from './components/layout/HeaderRenderer';
import FooterRenderer from './components/layout/FooterRenderer';
import { FooterConfig } from './types/footerConfig';
import ScrollToTop from './components/misc/ScrollToTop';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { AppConfig } from './types/appConfig';
import { appConfig } from './store/configSlice';
import { handleOpenExternalPage } from 'case-web-ui';
import { HeaderConfig } from './types/headerConfig';
import Navbar from './components/navbar/Navbar';
import { NavbarConfig } from './types/navbar';

interface AppCoreProps {
  appConfig?: AppConfig;
  headerConfig?: HeaderConfig;
  navbarConfig?: NavbarConfig;
  footerConfig?: FooterConfig;
  hideDefaultHeader?: boolean;
  hideDefaultFooter?: boolean;
  customHeader?: React.ReactNode;
  customFooter?: React.ReactNode;
}

const AppCore: React.FC<AppCoreProps> = (props) => {
  const dispatch = useDispatch();
  const { i18n } = useTranslation();

  useEffect(() => {
    dispatch(appConfig.updateInstanceID(process.env.REACT_APP_DEFAULT_INSTANCE ? process.env.REACT_APP_DEFAULT_INSTANCE : 'default'));
  }, [])

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

      <p>TODO</p>
      { !props.hideDefaultFooter ? <FooterRenderer
        footerConfig={props.footerConfig}
        onChangeLanguage={handleLanguageChange}
        onOpenExternalPage={handleOpenExternalPage}
      /> : null}
      {props.customFooter ? props.customFooter : null}
    </Router>
  );
};

export default AppCore;
