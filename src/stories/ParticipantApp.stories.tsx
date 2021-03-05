import React, { Suspense } from "react";
import AppCore from '../AppCore';
import footerConfig from '../../exampleContent/configs/footer.json'

import { Provider } from 'react-redux';
import store from '../store/store';
import '../i18n';

import 'localStyles';
import { FooterConfig } from "../types/footerConfig";
import { storiesOf } from '@storybook/react';
import StoryRouter from 'storybook-react-router';

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
  footerConfig: footerConfig as FooterConfig,
}))

stories.add('With Custom', () => Template({
  footerConfig: undefined,
  hideDefaultFooter: true,
  customFooter: (<div className="bg-secondary p-3"> Custom Footer</div>)
}))
