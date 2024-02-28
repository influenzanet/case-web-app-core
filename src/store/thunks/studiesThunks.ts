import { createAsyncThunk } from "@reduxjs/toolkit";
import { AssignedSurvey } from "../../api/types/studyAPI";
import { parseGRPCTimestamp } from "../../utils/parseGRPCTimestamp";
import {
  enterStudyReq,
  getAllAssignedSurveysReq,
  getAllAvailableStudiesReq,
} from "../../api/studyAPI";
import {
  EnterStudiesPayload,
  enterStudies,
  initializeActiveSurveyInfos,
  initializeDefaultStudies,
} from "../actions/studiesActions";
import {
  ProfilesSurveysMap,
  initializeActiveSurveys,
} from "../actions/userActions";
import { RootState } from "../rootReducer";

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

export type EnterStudiesRequest = {
  profileId: string;
  studyKeys: string[];
};

export const enterStudiesThunk = createAsyncThunk<
  EnterStudiesPayload,
  EnterStudiesRequest
>(enterStudies.type, async ({ profileId, studyKeys }, { dispatch }) => {
  const results = await Promise.allSettled(
    studyKeys.map((studyKey) => enterStudyReq(studyKey, profileId))
  );

  const succeeded = results.reduce((acc: string[], result, index) => {
    if (
      result.status === "fulfilled" ||
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
      (result.status === "rejected" &&
        result.reason.toJSON().response.data.error ===
          "participant already exists for this study")
    ) {
      acc.push(studyKeys[index]);
    }
    return acc;
  }, []);

  const payload = { profileId, studyKeys: succeeded };

  dispatch(enterStudies(payload));

  await dispatch(initializeActiveSurveysThunk());

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

export const enterDefaultStudiesThunk = createAsyncThunk<
  void,
  undefined,
  { state: RootState }
>("studies/enterDefaultStudies", async (_, { dispatch, getState }) => {
  const state = getState();
  const defaultStudies = state.studies.defaultStudies;

  const profiles = state.user.currentUser.profiles;
  if (!profiles || profiles.length === 0) {
    throw new Error("No profiles found for the current user");
  }

  const enterStudiesRequests = profiles
    .map((profile) => ({
      profileId: profile.id,
      studyKeys: defaultStudies.filter(
        (studyKey) => !profile.studies?.includes(studyKey)
      ),
    }))
    .filter((request) => request.studyKeys.length > 0);

  await Promise.allSettled(
    enterStudiesRequests.map((request) => dispatch(enterStudiesThunk(request)))
  );
});

export const {
  pending: initializeDefaultStudiesPending,
  fulfilled: initializeDefaultStudiesFulfilled,
  rejected: initializeDefaultStudiesRejected,
} = initializeDefaultStudiesThunk;

export const {
  pending: enterStudyPending,
  fulfilled: enterStudyFulfilled,
  rejected: enterStudyRejected,
} = enterStudiesThunk;

export const {
  pending: initializeActiveSurveysPending,
  fulfilled: initializeActiveSurveysFulfilled,
  rejected: initializeActiveSurveysRejected,
} = initializeActiveSurveysThunk;
