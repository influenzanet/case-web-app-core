import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Profile } from '../api/types/user';


export interface AuthInfo {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface AppState {
  persistState: boolean;
  auth?: AuthInfo;
  surveyMode: {
    active: boolean;
    profile?: Profile;
  };
  lastAction?: {
    name: string;
    time: Date;
    info?: any;
  }
}

export const initialState: AppState = {
  persistState: false,
  auth: undefined,
  surveyMode: {
    active: false,
  },
  lastAction: undefined,
};

const appSlice = createSlice({
  name: 'app',
  initialState: initialState,
  reducers: {
    reset: (state) => {
      const persist = state.persistState;
      state = {
        ...initialState,
        persistState: persist,
      };
      return state;
    },
    setPersistState: (state, action: PayloadAction<boolean>) => {
      state.persistState = action.payload;
    },
    setAppAuth: (state, action: PayloadAction<AuthInfo>) => {
      state.auth = action.payload;
    },
    openSurveyMode: (state, action: PayloadAction<Profile>) => {
      state.surveyMode = {
        active: true,
        profile: action.payload
      }
    },
    closeSurveyMode: (state) => {
      state.surveyMode = {
        active: false
      }
    },
    updateLastAction: (state, action: PayloadAction<{ actionName: string, info?: any }>) => {
      state.lastAction = {
        name: action.payload.actionName,
        info: action.payload.info,
        time: new Date()
      }
    }
  },
});

export const {
  setPersistState,
  setAppAuth,
  reset,
  closeSurveyMode,
  openSurveyMode,
} = appSlice.actions;

export const appActions = appSlice.actions

export default appSlice.reducer;
