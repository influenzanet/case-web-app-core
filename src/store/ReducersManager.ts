import { AnyAction, Reducer, ReducersMapObject } from '@reduxjs/toolkit';

type Listener = Function;
type Nullable<T> = T | null;

/**
 * The `ReducersManager` class is used to manage and extend a map of reducers,
 * represented as an object of slice reducers.
 *
 * It provides methods for adding and removing reducers from the map, and it creates
 * a combined reducer function that can be passed to the Redux store.
 */
export class ReducersManager<S> {

  private reducers: ReducersMapObject;
  private combinedReducer: Reducer;
  private keysToRemove: string[] = [];
  private changeListener : Nullable<Listener> = null;

  /**
   * Creates a `ReducersManager` instance.
   *
   * @param initialReducers initial map of reducers
   */
  public constructor(initialReducers: ReducersMapObject) {
    this.reducers = { ...initialReducers };
    this.combinedReducer = this.combineReducers(this.reducers);
  }

  /**
   * Combines the map of `reducers` in a single `Reducer` function.
   *
   * @param reducers map of reducers.
   * @returns a `Reducer` function that invokes every reducer in the `reducers` map.
   */
  private combineReducers = (reducers: ReducersMapObject): Reducer => {
    return (state: any, action: AnyAction): any => {
      let hasChanged = false;
      const newState: any = {};

      for (const key of Object.keys(reducers)) {
        const reducer = reducers[key];
        const previousStateForKey = state[key];
        const nextStateForKey = reducer(previousStateForKey, action);

        if (typeof nextStateForKey === 'undefined') {
          throw new Error(
            `A reducer returned undefined when reducing key "${key}" with action type "${action.type}". ` +
            `This is explicitly prohibited by Redux, if you don't want to handle the action, just return the previous state.`
          );
        }

        newState[key] = nextStateForKey;

        if (previousStateForKey !== nextStateForKey) {
          hasChanged = true;
        }
      }

      return hasChanged ? newState : state;
    };
  };

  /**
   *
   * @returns the reducer map currently managed by the `ReducersManager`
   */
  public getReducerMap = () => {
    return this.reducers;
  };

  /**
   * The reducer function obtained as a combination of all reducers currently managed by
   * the `ReducersManager`.
   *
   * @param state a state object
   * @param action a Redux action
   * @returns the new state produced, as a result of the reducers applied to `state`
   * @throws If one of the reducers returns undefined, the returned `Reducer` function will throw an `Error` when executed.
   */
  public reduce = (state: any, action: AnyAction): S => {
    if (this.keysToRemove.length > 0) {
      state = { ...state };
      for (const key of this.keysToRemove) {
        delete state[key];
      }
      this.keysToRemove = [];
    }

    return this.combinedReducer(state, action);
  };

  /**
   * Add a new reducers map object to the map object already managed by
   * the `ReducersManager`.
   *
   * @param reducerMap a new reducer map to be added to the current reducer map.
   */
  public add = (reducerMap: ReducersMapObject) => {
    const intersectingKeys = intersect(this.reducers, reducerMap);

    if (intersectingKeys.length > 0) {
      throw new Error(`The map provided contains keys already associated to other reducers. This is not allowed.` +
        `Check the following key: ${intersectingKeys.join(', ')}`);
    }

    this.combinedReducer = this.combineReducers({ ...this.reducers, ...reducerMap });

    if (this.changeListener !== null) {
      this.changeListener();
    }

    function intersect(currentMap: ReducersMapObject, newMap: ReducersMapObject) {
      return Object
        .keys(currentMap)
        .filter((key) => { return newMap.hasOwnProperty(key); });
    }
  };

  /**
   * Removes the `Reducer`function associated to the given `key`from the reducers map.
   *
   * @param key key to be removed from the reducers map.
   */
  public remove = (key: string) => {
    if (!key || !this.reducers[key]) {
      return;
    }

    delete this.reducers[key];
    this.keysToRemove.push(key);
    this.combinedReducer = this.combineReducers(this.reducers);
  };

  /**
   * Add a listener to be execute after reducers are added.
   * This gives a chance to perform actions after adding reducers.
   * Most notably, sending a reserved event in order to initialize the newly
   * added reducers, like redux does after creating the store.
   *
   * @param listener
   */
  public setChangeListener(listener: Listener) {
    if (this.changeListener !== null) {
      throw new Error('Only one change listener is allowed');
    }

    this.changeListener = listener;
  }
}
