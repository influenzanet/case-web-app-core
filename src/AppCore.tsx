import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import FooterRenderer from './components/footer/FooterRenderer';
import { FooterConfig } from './types/footerConfig';

interface AppCoreProps {
  footerConfig?: FooterConfig;
  hideDefaultFooter?: boolean;
  customHeader?: React.ReactNode;
  customFooter?: React.ReactNode;
}

const AppCore: React.FC<AppCoreProps> = (props) => {

  return (
    <Router basename={process.env.NODE_ENV === 'production' ? process.env.PUBLIC_URL : undefined}>

      { !props.hideDefaultFooter ? <FooterRenderer
        footerConfig={props.footerConfig}
        onChangeLanguage={() => { }}
        onOpenExternalPage={() => { }}
      /> : null}
      {props.customFooter ? props.customFooter : null}
    </Router>
  );
};

export default AppCore;
