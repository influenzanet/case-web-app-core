import { configureStore } from '@reduxjs/toolkit';
import rootReducers, { GlobalState, initialRootState } from './rootReducer';
import { LocalStorageManager } from '../utils/LocalStorageManager';
import { reset as resetAppSlice } from './appSlice';
import { userActions } from './userSlice';
import { initialState as configInitialState } from './configSlice';
import { initialState as dialogInitialState } from './dialogSlice';
import { ReducersManager } from './ReducersManager';
import { cloneDeep } from 'lodash-es';

export const reducersManager = new ReducersManager<GlobalState>(rootReducers);
export const localStorageManager = new LocalStorageManager<GlobalState>('state');

localStorageManager.onSave((state) => {
  state.config = cloneDeep(configInitialState);
  state.dialog = cloneDeep(dialogInitialState);

  state.app.surveyMode = {
    active: false,
  };

  return state;
});

const store = configureStore({
  reducer: reducersManager.reduce,
  preloadedState: localStorageManager.load() || initialRootState
});

reducersManager.setChangeListener(() => store.dispatch({ type: 'reducersManager/reducersAdded' }));

export type AppDispatch = typeof store.dispatch;

export default store;

export const resetStore = () => {
  // let oldState = store.getState();
  store.dispatch(resetAppSlice());
  store.dispatch(userActions.reset());
};
