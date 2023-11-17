import { createAsyncThunk } from "@reduxjs/toolkit";
import { studiesActions } from "../store/studiesSlice";
import { AssignedSurvey } from "../api/types/studyAPI";
import { parseGRPCTimestamp } from "../utils/parseGRPCTimestamp";
import { userActions } from "../store/userSlice";
import {
  enterStudyReq,
  getAllAssignedSurveysReq,
  getAllAvailableStudiesReq,
} from "../api/studyAPI";

export const initializeDefaultStudies = createAsyncThunk<string[]>(
  "studies/defaultStudies/initialize",
  async () => {
    const response = await getAllAvailableStudiesReq();

    const defaultStudies = response.data.studies
      .filter((study) => study.props.systemDefaultStudy)
      .map((study) => study.key);

    return defaultStudies;
  }
);

export type EnterStudyRequest = {
  profileId: string;
  studyKey: string;
};

export type EnterStudyPayload = {
  profileId: string;
  studyKey: string;
};

export const enterStudy = createAsyncThunk<
  EnterStudyPayload,
  EnterStudyRequest
>("studies/enterStudy", async ({ profileId, studyKey }, thunkAPI) => {
  await enterStudyReq(studyKey, profileId).catch((error) => {
    const errorJson = error.toJSON();
    if (
      errorJson.response &&
      errorJson.response.data.error !==
        "participant already exists for this study"
    ) {
      throw error;
    }
  });
  await thunkAPI.dispatch(initializeActiveSurveys());

  return { profileId, studyKey };
});

export type GetActiveSurveysRequest = {
  studyKey: string;
};

export type ProfilesSurveysMap = {
  [profileId: string]: AssignedSurvey[];
};

export const initializeActiveSurveys = createAsyncThunk(
  "studies/initializeActiveSurveys",
  async (_, { dispatch }) => {
    const response = await getAllAssignedSurveysReq();

    const currentTimeInSeconds = Date.now() / 1000;

    const surveys = response.data.surveys || [];

    const profilesToActiveSurveysMap = surveys
      .map((survey) => ({
        ...survey,
        validFrom: parseGRPCTimestamp(survey.validFrom),
        validUntil: parseGRPCTimestamp(survey.validUntil),
      }))
      .filter(
        (s) =>
          !(s.validFrom && s.validFrom > currentTimeInSeconds) &&
          !(s.validUntil && s.validUntil < currentTimeInSeconds)
      )
      .reduce((result: ProfilesSurveysMap, survey: AssignedSurvey) => {
        const { profileId } = survey;
        result[profileId] = result[profileId] || [];
        result[profileId].push(survey);
        return result;
      }, {});

    dispatch(userActions.initializeActiveSurveys(profilesToActiveSurveysMap));
    dispatch(
      studiesActions.initializeActiveSurveyInfos(response.data.surveyInfos)
    );
  }
);
