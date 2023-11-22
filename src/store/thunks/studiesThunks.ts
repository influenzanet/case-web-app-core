import { createAsyncThunk } from "@reduxjs/toolkit";
import { AssignedSurvey } from "../../api/types/studyAPI";
import { parseGRPCTimestamp } from "../../utils/parseGRPCTimestamp";
import {
  enterStudyReq,
  getAllAssignedSurveysReq,
  getAllAvailableStudiesReq,
} from "../../api/studyAPI";
import {
  EnterStudyPayload,
  enterStudy,
  initializeActiveSurveyInfos,
  initializeDefaultStudies,
} from "../actions/studiesActions";
import {
  ProfilesSurveysMap,
  initializeActiveSurveys,
} from "../actions/userActions";

export const initializeDefaultStudiesThunk = createAsyncThunk<string[]>(
  initializeDefaultStudies.type,
  async (_, { dispatch }) => {
    const response = await getAllAvailableStudiesReq();

    const defaultStudies = response.data.studies
      .filter((study) => study.props.systemDefaultStudy)
      .map((study) => study.key);

    dispatch(initializeDefaultStudies(defaultStudies));

    return defaultStudies;
  }
);

export type EnterStudyRequest = {
  profileId: string;
  studyKey: string;
};

export const enterStudyThunk = createAsyncThunk<
  EnterStudyPayload,
  EnterStudyRequest
>("studies/enterStudy", async ({ profileId, studyKey }, { dispatch }) => {
  await enterStudyReq(studyKey, profileId).catch((error) => {
    const errorJson = error.toJSON();

    /**
     * unfortunately the API returns 500 BAD RESPONSE
     * if the user is already in the study.
     * In this case tho, we want to treat the request
     * as if it was successful in order to cover some edge
     * cases where the request succeeded
     * but then the user navigated away from the page
     * before the reducer had the chance to set the state.
     * If the user then come back and this thunk is dispatched
     * again, the state would then be set correctly
     *
     */
    if (
      errorJson.response &&
      errorJson.response.data.error !==
        "participant already exists for this study"
    ) {
      throw error;
    }
  });
  await dispatch(initializeActiveSurveysThunk());

  const payload = { profileId, studyKey };
  dispatch(enterStudy(payload));

  return payload;
});

export type GetActiveSurveysRequest = {
  studyKey: string;
};

export const initializeActiveSurveysThunk = createAsyncThunk(
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

    dispatch(initializeActiveSurveys(profilesToActiveSurveysMap));
    dispatch(initializeActiveSurveyInfos(response.data.surveyInfos || []));
  }
);

export const {
  pending: initializeDefaultStudiesPending,
  fulfilled: initializeDefaultStudiesFulfilled,
  rejected: initializeDefaultStudiesRejected,
} = initializeDefaultStudiesThunk;

export const {
  pending: enterStudyPending,
  fulfilled: enterStudyFulfilled,
  rejected: enterStudyRejected,
} = enterStudyThunk;

export const {
  pending: initializeActiveSurveysPending,
  fulfilled: initializeActiveSurveysFulfilled,
  rejected: initializeActiveSurveysRejected,
} = initializeActiveSurveysThunk;
