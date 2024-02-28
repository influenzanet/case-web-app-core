import { createAction } from "@reduxjs/toolkit";
// TODO create a different type rather than use the one coming from API
import { SurveyInfo } from "../../api/types/studyAPI";

export const initializeDefaultStudies = createAction<string[]>(
  "studies/defaultStudies/initialize"
);

export const initializeActiveSurveyInfos = createAction<SurveyInfo[]>(
  "studies/activeSurveyInfos/initialize"
);

export type EnterStudiesPayload = {
  profileId: string;
  studyKeys: string[];
};

export const enterStudies = createAction<EnterStudiesPayload>(
  "studies/enterStudies"
);
