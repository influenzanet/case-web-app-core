import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { User, ContactPreferences } from "../api/types/user";
import { TokenResponse } from "../api/types/authAPI";
import { merge, union } from "lodash-es";
import {
  initializeActiveSurveys,
  initializeUserStudies,
  ProfilesSurveysMap,
  ProfileStudiesMap,
} from "./actions/userActions";
import { enterStudy } from "./actions/studiesActions";

export interface UserState {
  currentUser: User;
  selectedProfileId: string;
}

export const initialState: UserState = {
  currentUser: {
    id: "",
    account: {
      type: "",
      accountId: "",
      accountConfirmedAt: 0,
      preferredLanguage: "",
    },
    roles: [],
    timestamps: {
      createdAt: 0,
      updatedAt: 0,
      lastLogin: 0,
      lastTokenRefresh: 0,
    },
    profiles: [],
    contactPreferences: {
      subscribedToNewsletter: false,
      sendNewsletterTo: [],
      subscribedToWeekly: true,
      receiveWeeklyMessageDayOfWeek: -1,
    } as ContactPreferences,
    contactInfos: [],
  },
  selectedProfileId: "",
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    reset: () => initialState,
    initializeLanguage: (state, action: PayloadAction<string>) => {
      if (state.currentUser.account.preferredLanguage === "") {
        state.currentUser.account.preferredLanguage = action.payload;
      }
    },
    setFromTokenResponse: (state, action: PayloadAction<TokenResponse>) => {
      state.currentUser.profiles = action.payload.profiles;
      state.currentUser.account.preferredLanguage =
        action.payload.preferredLanguage;
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.currentUser = {
        ...action.payload,
        profiles: action.payload.profiles.map((profile) => {
          const existingProfile = state.currentUser.profiles.find(
            (p) => p.id === profile.id
          );

          return merge({}, existingProfile ?? {}, profile);
        }),
      };
    },
    setUserID: (state, action: PayloadAction<string>) => {
      state.currentUser.account.accountId = action.payload;
    },
    setPreferredLanguage: (state, action: PayloadAction<string>) => {
      state.currentUser.account.preferredLanguage = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(
      initializeUserStudies,
      (state, action: PayloadAction<ProfileStudiesMap>) => {
        const updatedProfiles = state.currentUser.profiles.map((profile) => {
          profile.studies = action.payload[profile.id];
          return profile;
        });

        state.currentUser.profiles = updatedProfiles;
      }
    );

    builder.addCase(
      initializeActiveSurveys,
      (state, action: PayloadAction<ProfilesSurveysMap>) => {
        const updatedProfiles = state.currentUser.profiles.map((profile) => {
          const surveysForProfile = action.payload[profile.id] || [];
          profile.activeSurveys = surveysForProfile;
          return profile;
        });

        state.currentUser.profiles = updatedProfiles;
      }
    );

    builder.addCase(enterStudy, (state, action) => {
      const { profileId, studyKey } = action.payload;

      const updatedProfiles = state.currentUser.profiles.map((profile) =>
        profile.id === profileId
          ? { ...profile, studies: union(profile.studies, [studyKey]) }
          : profile
      );

      state.currentUser.profiles = updatedProfiles;
    });
  },
});

export const userActions = userSlice.actions;

export default userSlice.reducer;
