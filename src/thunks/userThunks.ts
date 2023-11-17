import { createAsyncThunk } from "@reduxjs/toolkit";
import { getStudiesForUserReq } from "../api/studyAPI";
import { flatMap, groupBy, mapValues } from "lodash-es";
import { StudyInfoForUser } from "../api/types/studyAPI";

export type ProfileStudiesMap = {
  [profileId: string]: string[];
};

export const initializeStudiesForUser = createAsyncThunk<ProfileStudiesMap>(
  "user/currentUser/profiles/studies/initialize",
  async () => {
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

    return profileStudiesMap;
  }
);

export const {
  pending: fetchStudiesForUserPending,
  fulfilled: fetchStudiesForUserFulfilled,
  rejected: fetchStudiesForUserRejected,
} = initializeStudiesForUser;
