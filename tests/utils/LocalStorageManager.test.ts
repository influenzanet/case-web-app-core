/**
 * @jest-environment jsdom
 */

import { LocalStorageManager } from '../../src/utils/LocalStorageManager';

const testKey = 'testKey';
const testState = {
  testString: 'test',
  testNumber: 1,
  testObject: {
    objectString: 'objectTest',
    objectNumber: 2
  }
};

let localStorageManager: LocalStorageManager<typeof testState>;

describe('LocalStorageManager', () => {

  beforeEach(() => {
    jest.restoreAllMocks();
    localStorage.clear();

    localStorageManager = new LocalStorageManager(testKey);
  });

  describe('load', () => {

    it('should return null if there is no state in localStorage', () => {
      jest.spyOn(window.localStorage.__proto__, 'getItem').mockReturnValue(null);

      const state = localStorageManager.load();

      expect(state).toBe(null);
    });

    it('should return null if the localStorage returns an empty string', () => {
      jest.spyOn(window.localStorage.__proto__, 'getItem').mockReturnValue('');

      const state = localStorageManager.load();

      expect(state).toBe(null);
    });

    it('should return the parsed state if it exists in localStorage', () => {
      jest.spyOn(window.localStorage.__proto__, 'getItem').mockReturnValue(JSON.stringify(testState));

      const state = localStorageManager.load();

      expect(state).toEqual(testState);
    });

    it('should return null and log the error if JSON.parse throws a SyntaxError', () => {
      jest.spyOn(window.localStorage.__proto__, 'getItem').mockReturnValue(testState);
      jest.spyOn(JSON, 'parse').mockImplementation(() => {
        throw new SyntaxError();
      });
      const mockLog = jest.fn();
      global.console.error = mockLog;

      const state = localStorageManager.load();

      expect(state).toBe(null);
      expect(mockLog).toHaveBeenCalled();
    });
  });

  describe('save', () => {

    // here we want to make sure the object passed as input is being copied and not used directly
    it('should not serialize the same (reference) object it received as an argument', () => {
      const stringifyMock = jest.spyOn(JSON, 'stringify');

      localStorageManager.save(testState);

      const expected = {
        asymmetricMatch: (actual: typeof testState) => actual === testState
      };
      expect(stringifyMock).not.toHaveBeenCalledWith(expected);
    });

    it('should serialize the object and save it in the localStorage', () => {

      localStorageManager.save(testState);

      const actual = localStorage.getItem(testKey);
      const expected = JSON.stringify(testState);
      expect(actual).toEqual(expected);
    });

    it('should execute every onSave callbacks in order', () => {
      localStorageManager.onSave((state) => {
        return state;
      });
      localStorageManager.onSave((state) => {
        return {
          ...state,
          testString: "testString"
        };
      });
      localStorageManager.onSave((state) => {
        return {
          ...state,
          testObject: {
            ...state.testObject,
            objectString: "objectString",
            objectNumber: 5
          }
        };
      });

      localStorageManager.save(testState);

      const actual = localStorage.getItem(testKey);
      const expected = JSON.stringify({
        testString: "testString",
        testNumber: 1,
        testObject: {
          objectString: "objectString",
          objectNumber: 5
        }
      });
      expect(actual).toEqual(expected);
    });

    it('should log an error if JSON.stringify throws a TypeError', () => {
      jest.spyOn(JSON, 'stringify').mockImplementation(() => {
        throw new TypeError();
      });
      const mockLog = jest.fn();
      global.console.error = mockLog;

      localStorageManager.save(testState);

      expect(mockLog).toHaveBeenCalled();
    });

    it('should log an error if localStorage.setItem throws an Error', () => {
      jest.spyOn(window.localStorage.__proto__, 'setItem').mockImplementation(() => {
        throw new Error();
      });
      const mockLog = jest.fn();
      global.console.error = mockLog;

      localStorageManager.save(testState);

      expect(mockLog).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should remove only the owned key from the local storage', () => {
      const anotherKey = "anotherKey";
      const serializedState = JSON.stringify(testState);
      const removeItemMock = jest.spyOn(window.localStorage.__proto__, 'removeItem');
      localStorage.setItem(testKey, serializedState);
      localStorage.setItem(anotherKey, serializedState);

      localStorageManager.remove();

      expect(removeItemMock).toHaveBeenCalledWith(testKey);
      expect(localStorage.getItem(testKey)).toBe(null);
      expect(localStorage.getItem(anotherKey)).toEqual(serializedState);
    });
  });
});
