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
import { PageItem, PagesConfig } from "../types/pagesConfig";

initI18n(
  process.env.REACT_APP_DEFAULT_LANGUAGE,
  process.env.REACT_APP_FALLBACK_LANGUAGE,
  process.env.REACT_APP_CONTENT_URL + '/locales',
)

const stories = storiesOf('Participant App', module)
stories.addDecorator(StoryRouter())



interface Custom1Props {
  label: string;
  renderGenericItemFunc?: (item: PageItem) => React.ReactElement | null;
}

const Custom1: React.FC<Custom1Props> = (props) => {
  // console.log(props)
  return (
    <div>
      <p>{props.label}</p>
      {props.renderGenericItemFunc && props.renderGenericItemFunc({
        itemKey: 'test',
        config: {
          type: 'placeholder',
          label: props.label
        }
      })}
    </div>
  );
};


const myExtension = {
  name: 'custom1',
  component: Custom1
}


const Template = (args) => (
  <Provider store={store}>
    <Suspense fallback="loading">
      <AppCore {...args} />
    </Suspense>
  </Provider>
);

stories.add('ExampleExtension', () => Template({
  appConfig: appConfig as AppConfig,
  extensions: [myExtension],
  headerConfig: headerConfig as HeaderConfig,
  navbarConfig: navbarConfig as NavbarConfig,
  pagesConfig: pagesConfig as PagesConfig,
  footerConfig: footerConfig as FooterConfig,
}))




