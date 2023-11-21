import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { initializeDefaultStudies } from "./thunks/studiesThunks";
import { SurveyInfo } from "../api/types/studyAPI";
import { isEqual } from "lodash-es";
import { userActions } from "./userSlice";

export interface StudiesState {
  defaultStudies: string[];
  activeSurveyInfos: SurveyInfo[];
}

export const initialState: StudiesState = {
  defaultStudies: [],
  activeSurveyInfos: [],
};

const studiesSlice = createSlice({
  name: "studies",
  initialState: initialState,
  reducers: {
    initializeActiveSurveyInfos: (
      state,
      action: PayloadAction<SurveyInfo[]>
    ) => {
      if (!isEqual(state.activeSurveyInfos, action.payload)) {
        state.activeSurveyInfos = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(userActions.reset, () => {
      return initialState;
    });
    builder.addCase(initializeDefaultStudies.fulfilled, (state, action) => {
      if (!isEqual(state.defaultStudies, action.payload)) {
        state.defaultStudies = action.payload;
      }
    });
  },
});

export const studiesActions = studiesSlice.actions;

export default studiesSlice.reducer;
