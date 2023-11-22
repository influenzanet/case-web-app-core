import { createAsyncThunk } from "@reduxjs/toolkit";
import { getStudiesForUserReq } from "../../api/studyAPI";
import { flatMap, groupBy, mapValues } from "lodash-es";
import { StudyInfoForUser } from "../../api/types/studyAPI";
import {
  ProfileStudiesMap,
  initializeUserStudies,
} from "../actions/userActions";

export const initializeUserStudiesThunk = createAsyncThunk<ProfileStudiesMap>(
  initializeUserStudies.type,
  async (_, { dispatch }) => {
    const response = await getStudiesForUserReq();

    const profileStudiesMap = mapValues(
      groupBy(
        flatMap(response.data.studies, (studyInfoForUser: StudyInfoForUser) =>
          studyInfoForUser.profileIds.map((profileId) => ({
            profileId,
            studyKey: studyInfoForUser.key,
          }))
        ),
        "profileId"
      ),
      (profileStudies) => profileStudies.map((study) => study.studyKey)
    );

    dispatch(initializeUserStudies(profileStudiesMap));

    return profileStudiesMap;
  }
);

export const {
  pending: initializeUserStudiesPending,
  fulfilled: initializeUserStudiesFulfilled,
  rejected: initializeUserStudiesRejected,
} = initializeUserStudiesThunk;
