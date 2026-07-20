import React from 'react';
import { render } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';

import dialogReducer from '../../src/store/dialogSlice';
import userReducer from '../../src/store/userSlice';

export const createTestStore = (preloadedState?: Record<string, unknown>) =>
  configureStore({
    reducer: {
      dialog: dialogReducer,
      user: userReducer,
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
