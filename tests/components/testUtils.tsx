import React from 'react';
import { render } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';

import dialogReducer from '../../src/store/dialogSlice';
import userReducer from '../../src/store/userSlice';
import configReducer from '../../src/store/configSlice';
import studiesReducer from '../../src/store/studiesSlice';

export const createTestStore = (preloadedState?: Record<string, unknown>) =>
  configureStore({
    reducer: {
      dialog: dialogReducer,
      user: userReducer,
      // The profile dialogs read the avatar list and the default studies, so those slices are
      // part of the store every component test renders against.
      config: configReducer,
      studies: studiesReducer,
    },
    preloadedState,
  });

export const renderWithProviders = (
  ui: React.ReactElement,
  preloadedState?: Record<string, unknown>,
) => {
  const store = createTestStore(preloadedState);
  return {
    store,
    ...render(<Provider store={store}>{ui}</Provider>),
  };
};
