import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppConfig, AvatarConfig, LanguageConfig } from '../types/appConfig';

export interface ConfigState extends AppConfig {
  // False until the app has stored its instance id: until then instanceId holds the placeholder,
  // which nothing that asks the backend about the instance should use.
  instanceIdSet?: boolean;
}

export const initialState: ConfigState = {
  instanceId: 'default',
  instanceIdSet: false,
  languages: [],
  avatars: [],
};

const configSlice = createSlice({
  name: 'config',
  initialState: initialState,
  reducers: {
    reset: (state) => {
      state = { ...initialState };
      return state;
    },
    updateInstanceID: (state, action: PayloadAction<string>) => {
      state.instanceId = action.payload;
      state.instanceIdSet = true;
    },
    updateLanguages: (state, action: PayloadAction<Array<LanguageConfig>>) => {
      state.languages = action.payload;
    },
    updateAvatars: (state, action: PayloadAction<Array<AvatarConfig>>) => {
      state.avatars = action.payload;
    }
  },
});

export const appConfig = configSlice.actions;

export default configSlice.reducer;
