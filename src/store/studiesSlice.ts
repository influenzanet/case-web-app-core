import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { SurveyInfo } from "../api/types/studyAPI";
import { userActions } from "./userSlice";
import {
  initializeActiveSurveyInfos,
  initializeDefaultStudies,
} from "./actions/studiesActions";

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
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(userActions.reset, () => {
      return initialState;
    });

    builder.addCase(
      initializeActiveSurveyInfos,
      (state, action: PayloadAction<SurveyInfo[]>) => {
        state.activeSurveyInfos = action.payload;
      }
    );

    builder.addCase(initializeDefaultStudies, (state, action) => {
      state.defaultStudies = action.payload;
    });
  },
});

export const studiesActions = studiesSlice.actions;

export default studiesSlice.reducer;
