import { AnyAction, Reducer, ReducersMapObject } from '@reduxjs/toolkit';
import clonedeep from 'lodash.clonedeep';
import { default as appReducer, initialState as appInitialState } from './appSlice';
import { default as configReducer, initialState as configInitialState } from './configSlice';
import { default as dialogReducer, initialState as dialogInitialState } from './dialogSlice';
import { default as userReducer, initialState as userInitialState } from './userSlice';

export const initialRootState = {
  app: clonedeep(appInitialState),
  dialog: clonedeep(dialogInitialState),
  user: clonedeep(userInitialState),
  config: clonedeep(configInitialState)
}

const rootReducers: RootReducerMap = {
  app: appReducer,
  dialog: dialogReducer,
  user: userReducer,
  config: configReducer
};

export type RootState = typeof initialRootState;
export type RootReducerMap = ReducersMapObject<RootState, AnyAction>;

export type GlobalState = RootState & Record<string, any>;
export type GlobalReducerMap = RootReducerMap & Record<string, Reducer<any, AnyAction>>

export default rootReducers;
