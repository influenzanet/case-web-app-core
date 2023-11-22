import { createAction } from "@reduxjs/toolkit";
// TODO create a different type rather than use the one coming from API
import { AssignedSurvey } from "../../api/types/studyAPI";

export type ProfileStudiesMap = {
  [profileId: string]: string[];
};

export type ProfilesSurveysMap = {
  [profileId: string]: AssignedSurvey[];
};

export const initializeActiveSurveys = createAction<ProfilesSurveysMap>(
  "user/currentUser/profiles/activeSurveys/initialize"
);

export const initializeUserStudies = createAction<ProfileStudiesMap>(
  "user/currentUser/profiles/studies/initialize"
);
