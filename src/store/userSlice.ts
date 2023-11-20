import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { User, ContactPreferences } from "../api/types/user";
import { TokenResponse } from "../api/types/authAPI";
import { initializeUserStudies } from "../thunks/userThunks";
import { enterStudy, ProfilesSurveysMap } from "../thunks/studiesThunks";
import { isEqual, union } from "lodash-es";

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
      state.currentUser = action.payload;
    },
    setUserID: (state, action: PayloadAction<string>) => {
      state.currentUser.account.accountId = action.payload;
    },
    setPreferredLanguage: (state, action: PayloadAction<string>) => {
      state.currentUser.account.preferredLanguage = action.payload;
    },
    initializeActiveSurveys: (
      state,
      action: PayloadAction<ProfilesSurveysMap>
    ) => {
      const updatedProfiles = state.currentUser.profiles.map((profile) => {
        const surveysForProfile = action.payload[profile.id] || [];
        return { ...profile, assignedSurveys: surveysForProfile };
      });

      if (!isEqual(state.currentUser.profiles, updatedProfiles)) {
        state.currentUser.profiles = updatedProfiles;
      }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(initializeUserStudies.fulfilled, (state, action) => {
      const updatedProfiles = state.currentUser.profiles.map((profile) => {
        return { ...profile, studies: action.payload[profile.id] };
      });

      if (!isEqual(updatedProfiles, state.currentUser.profiles)) {
        state.currentUser.profiles = updatedProfiles;
      }
    });
    builder.addCase(enterStudy.fulfilled, (state, action) => {
      const { profileId, studyKey } = action.payload;

      const updatedProfiles = state.currentUser.profiles.map((profile) =>
        profile.id === profileId
          ? { ...profile, studies: union(profile.studies, studyKey) }
          : profile
      );

      if (!isEqual(updatedProfiles, state.currentUser.profiles)) {
        state.currentUser.profiles = updatedProfiles;
      }
    });
  },
});

export const userActions = userSlice.actions;

export default userSlice.reducer;
