import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Unsubscribe } from '@reduxjs/toolkit';
import { GlobalState } from '../../store/rootReducer';
import store, { localStorageManager } from '../../store/store';
import { DebouncedFunc, throttle } from 'lodash-es';

let throttling: DebouncedFunc<() => void>;
let storeUnsubscribe: Unsubscribe;

const LocalStorage: React.FC = () => {

  const persistState = useSelector((state: GlobalState) => state.app.persistState);

  useEffect(() => {
    if(persistState) {
      throttling = throttle(() => {
        localStorageManager.save(store.getState())
      }, 2000);

      storeUnsubscribe = store.subscribe(throttling);
    } else {
      if(storeUnsubscribe) {
        storeUnsubscribe();
      }
      if(throttling) {
        throttling.cancel();
      }

      localStorageManager.remove();
    }
  }, [persistState]);

  return null;
};

export default LocalStorage;
