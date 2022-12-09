# Extending the Redux Store
If you want to customize your application by adding reducers to the Redux store, you can use the [ReducersManager](../../src/store/ReducersManager.ts) from `case-web-app-core`. First, import the provided instance of `ReducersManager`:

```
import { reducersManager } from 'case-web-app-core';
```

Then, create your custom reducer, possibly using the createSlice helper from [Redux Toolkit](https://redux-toolkit.js.org/):

```
const customSlice = createSlice({
  name: 'custom',
  initialState: { customState: true },
  reducers: {
    customReducer: (state) => {
      state = { ...initialState };
      return state;
    }
  },
});

const customReducersMap = {
  custom: customSlice
};

```

Finally, add your custom reducer to the `reducersManager` like this:

```
reducersManager.add(customReducersMap);
```

It's important to note that reducers should be pure functions with no side effects, and should never return `undefined`. If a reducer may receive undefined as input, such as when Redux is initialized, you should provide a default, non `undefined` value. Additionally, the `customReducersMap` should not contain any keys that are already present in the initial map when the reducersManager object is instantiated. You can get the keys already in use by calling the `getReducerMap()`method. 
