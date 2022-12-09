# Interacting with the LocalStorage

By default, all the Redux State is persisted to the `LocalStorage`. If you need to extended the store ([Extending the Store](./ExtendingTheStore.md)) you might also want to have a fine grained control on which part of the state managed by you is added to the LocalStorage. 

In order to customize how your extended Redux store is persisted to the `LocalStorage`, you can use the instance of `LocalStorageManager` provided by `case-web-app-core`. This allows you to register callbacks that can manipulate the state before it is written to the `LocalStorage`. To use the `LocalStorageManager`, follow these steps:

```
import { localStorageManager } from 'case-web-app-core';
```

Register a callback function using the `onSave` method. This callback will be called before the state is written to the `LocalStorage`. It should accept the state as an argument and return the modified state. You can register more than one such callbacks, each one receiving the state modified by the previous callbacks.

```
localStorageManager.onSave((state) => {
  state.myCustomState: initialValue;

  return state;
});
```

It's important to note that each callback will receive the full state, containing the slices managed by 'case-web-app-core'. You should not attempt to modify those values unless you are absolutely sure of what you are doing.

The callbacks should be pure function, should have no side effects and should not throw any error. 
