import { configureStore, getDefaultMiddleware } from '@reduxjs/toolkit'
import { reset as resetAppSlice } from './appSlice'
import { loadState, saveState } from './localStorage'
import { throttle } from 'lodash-es'

import rootReducer from './rootReducer'
import { userActions } from './userSlice'


const middleWare = [...getDefaultMiddleware()];

const store = configureStore({
  reducer: rootReducer,
  middleware: middleWare,
  preloadedState: loadState(),
});

store.subscribe(throttle(() => {
  saveState(store.getState());
}, 2000));


export type AppDispatch = typeof store.dispatch

export default store


export const resetStore = () => {
  // let oldState = store.getState();
  store.dispatch(resetAppSlice());
  store.dispatch(userActions.reset());
}
