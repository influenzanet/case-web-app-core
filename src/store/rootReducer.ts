import { AnyAction, Reducer, ReducersMapObject } from '@reduxjs/toolkit';
import { default as appReducer, initialState as appInitialState } from './appSlice';
import { default as configReducer, initialState as configInitialState } from './configSlice';
import { default as dialogReducer, initialState as dialogInitialState } from './dialogSlice';
import { default as userReducer, initialState as userInitialState } from './userSlice';
import { cloneDeep } from 'lodash-es';

export const initialRootState = {
  app: cloneDeep(appInitialState),
  dialog: cloneDeep(dialogInitialState),
  user: cloneDeep(userInitialState),
  config: cloneDeep(configInitialState)
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
