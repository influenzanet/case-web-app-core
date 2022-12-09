import { AnyAction, ReducersMapObject } from '@reduxjs/toolkit';
import { ReducersManager } from '../../src/store/ReducersManager';

type ApplicationState = {
  slice1: {
    prop: boolean;
  },
  slice2: {
    prop: number;
  };
};

let reducersManager: ReducersManager<ApplicationState>;

describe('ReducersManager', () => {

  describe('if no reducers are provided', () => {
    beforeEach(() => {
      reducersManager = new ReducersManager({});
    });

    it('getReducerMap should return an empty map of reducers', () => {
      const reducerMap = reducersManager.getReducerMap();

      expect(reducerMap).toEqual({});
    });

    it('reduce should return the state given in input', () => {
      const action = { type: 'whatever/action' };
      const state = { prop1: "a", prop2: "b" };

      const result = reducersManager.reduce(state, action);

      expect(result).toBe(state);
    });
  });

  describe('if an initial map of reducers is provided', () => {
    let state: ApplicationState;
    let initialReducerMap: ReducersMapObject;
    let action1: AnyAction;
    let action2: AnyAction;

    beforeEach(() => {
      const slice1 = {
        prop: false
      };
      const slice2 = {
        prop: 4
      };
      const actionName1 = 'reducer1/prop';
      action1 = { type: actionName1 };
      const actionName2 = 'reducer2/prop';
      action2 = { type: actionName2 };

      state = {
        slice1: slice1,
        slice2: slice2
      };

      initialReducerMap = {
        slice1: (state: typeof slice1 = slice1, action) => {
          switch (action.type) {
            case actionName1:
              return {
                ...state,
                prop: true
              };
            default:
              return state;
          }
        },
        slice2: (state: typeof slice2 = slice2, action) => {
          switch (action.type) {
            case actionName2:
              return {
                ...state,
                prop: 5
              };
            default:
              return state;
          }
        }
      };

      reducersManager = new ReducersManager(initialReducerMap);
    });

    it('getReducerMap should return the map of reducers provided', () => {
      const reducerMap = reducersManager.getReducerMap();

      expect(reducerMap).toEqual(initialReducerMap);
    });

    it('reduce should return the state given as input if no reducers handle the dispatched action', () => {
      const action = { type: 'whatever/action' };

      const result = reducersManager.reduce(state, action);

      expect(result).toBe(state);
    });

    it('reduce should call the registered reducers and return the new state if at least one reducer handles the dispatched action', () => {
      const result = reducersManager.reduce(state, action1);

      expect(result).toEqual({
        ...state,
        slice1: {
          ...state.slice1,
          prop: true
        }
      });
    });

    describe('when a proper reducer is added', () => {

      let action3: AnyAction;

      beforeEach(() => {
        const slice3 = {
          prop: "init"
        };

        const actionName3 = "reducer3/prop";
        action3 = { type: actionName3 };

        const newReducerMap = {
          slice3: (state: typeof slice3 = slice3, action: AnyAction) => {
            switch (action.type) {
              case actionName3:
                return {
                  ...state,
                  prop: "new value"
                };
              default:
                return state;
            }
          }
        };

        reducersManager.add(newReducerMap);
      });

      it('reduce should call the newly added reducer when the appropriate action is dispatched and return the new state', () => {
        const result = reducersManager.reduce(state, action3);

        expect(result).toEqual({
          ...state,
          slice3: {
            prop: "new value"
          }
        });
      });
    });

    it('adding a reducer on an existing key should not be allowed', () => {
      expect(() => { reducersManager.add({ slice2: (state, action) => { } }); }).toThrow();
    });

    describe('when a key is removed', () => {
      beforeEach(() => {
        reducersManager.remove('slice2');
      });

      it('reduce should return a state without the removed key', () => {
        const result = reducersManager.reduce(state, { type: action2 });

        expect(result).toEqual({
          slice1: {
            ...state.slice1
          }
        });
      });
    });
  });

  describe('if it is initialized with a reducer that returns undefined', () => {
    beforeEach(() => {
      reducersManager = new ReducersManager({
        reducer: (state, action) => {
          return state;
        }
      });
    });

    it('reduce should throw an exception', () => {
      expect(() => { reducersManager.reduce({ reducer: undefined }, { type: 'whatever/action' }); }).toThrow(Error);
    });
  });
});
