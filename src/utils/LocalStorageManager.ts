import { cloneDeep } from 'lodash';

/**
 * Represent a function to be invoked before `state` is persisted
 * to the LocalStorage.
 *
 * The function needs to be pure and have no side effects. Should not throw any exception.
 */
export type OnSaveCallback<T> = (state: T) => T;

/**
 * The `LocalStorageManager` class is used for managing data persistence in the browser's LocalStorage.
 *
 * @template T - The type of the data being persisted.
 */
export class LocalStorageManager<T> {

  /**
   * Callbacks to be invoked before `state` is persisted to LocalStorage.
   * These functions should be pure and have no side effects. They should not throw any exceptions.
   */
  private onSaveStateCallbacks: Array<OnSaveCallback<T>> = [];

  /**
   * The key to use for storing data in the LocalStorage.
   */
  public storageKey: string;

  /**
  * Creates a new `LocalStorageManager` instance.
  *
  * @param storageKey - The key to use for storing data in the LocalStorage.
  */
  public constructor(storageKey: string) {
    this.storageKey = storageKey;
  }

  /**
   * Loads data from the LocalStorage.
   *
   * @returns The data stored in LocalStorage. If no data is found or an error occurs during the parsing of the data, `null` is returned instead.
   */
  public load = (): T | null => {
    const serializedState = localStorage.getItem(this.storageKey);
    if (!serializedState) {
      return null;
    }
    try {
      return JSON.parse(serializedState);
    } catch (error) {
      console.error(error);
      return null;
    }
  };

  /**
   * Saves data to the LocalStorage.
   *
   * Before saving the data, it executes the registered callbacks. @see `onSave`
   *
   * @param state - The data to save to the LocalStorage.
   */
  public save = (state: T) => {
    let stateCopy = cloneDeep(state);

    if (this.onSaveStateCallbacks.length > 0) {
      this.onSaveStateCallbacks.forEach((callback) => {
        stateCopy = callback(stateCopy);
      });
    }

    try {
      const serializedState = JSON.stringify(stateCopy);
      localStorage.setItem(this.storageKey, serializedState);
    }
    catch (error) {
      console.error(error);
    }
  };

  /**
   * Registers a callback to be invoked before `state` is persisted to the LocalStorage.
   *
   * @param callback - The callback function to be registered.
   */
  public onSave = (callback: OnSaveCallback<T>) => {
    this.onSaveStateCallbacks.push(callback);
  };

  /**
   * Removes the data associate with the `storageKey` from the LocalStorage.
   */
  public remove = () => {
    localStorage.removeItem(this.storageKey);
  };
}
