import React, { Suspense } from "react";
import AppCore from '../AppCore';
import footerConfig from '../../exampleContent/configs/footer.json'
import headerConfig from '../../exampleContent/configs/header.json'
import appConfig from '../../exampleContent/configs/general.json'
import pagesConfig from '../../exampleContent/configs/pages.json'
import navbarConfig from '../../exampleContent/configs/navbar.json'

import { Provider } from 'react-redux';
import store from '../store/store';
import { initI18n } from '../i18n';

import 'localStyles';
import { FooterConfig } from "../types/footerConfig";
import { storiesOf } from '@storybook/react';
import StoryRouter from 'storybook-react-router';
import { HeaderConfig } from "../types/headerConfig";
import { AppConfig } from "../types/appConfig";
import { NavbarConfig } from "../types/navbarConfig";
import { PagesConfig } from "../types/pagesConfig";

initI18n(
  process.env.REACT_APP_DEFAULT_LANGUAGE,
  process.env.REACT_APP_FALLBACK_LANGUAGE,
  process.env.REACT_APP_CONTENT_URL + '/locales',
)

const stories = storiesOf('Participant App', module)
stories.addDecorator(StoryRouter())

const Template = (args) => (
  <Provider store={store}>
    <Suspense fallback="loading">
      <AppCore {...args} />
    </Suspense>
  </Provider>
);

stories.add('Example1', () => Template({
  instanceID: process.env.REACT_APP_DEFAULT_INSTANCE,
  appConfig: appConfig as AppConfig,
  headerConfig: headerConfig as HeaderConfig,
  navbarConfig: navbarConfig as NavbarConfig,
  pagesConfig: pagesConfig as PagesConfig,
  footerConfig: footerConfig as FooterConfig,
}))

stories.add('With Custom', () => Template({
  appConfig: appConfig as AppConfig,
  headerConfig: undefined,
  hideDefaultHeader: true,
  footerConfig: undefined,
  hideDefaultFooter: true,
  customHeader: (<div className="bg-secondary p-3"> Custom Header</div>),
  customFooter: (<div className="bg-secondary p-3"> Custom Footer</div>)
}))
