import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store/rootReducer";
import { Action, ThunkDispatch, unwrapResult } from "@reduxjs/toolkit";
import {
  EnterStudyRequest,
  enterStudyThunk,
  initializeActiveSurveysThunk,
  initializeDefaultStudiesThunk,
} from "../../store/thunks/studiesThunks";

import { initializeUserStudiesThunk } from "../../store/thunks/userThunks";

const DefaultStudiesManager: React.FC = () => {
  const dispatch = useDispatch<ThunkDispatch<RootState, void, Action>>();
  const currentUserId = useSelector(
    (state: RootState) => state.user.currentUser.id
  );

  useEffect(() => {
    const initialize = async () => {
      if (!currentUserId) {
        return;
      }

      try {
        const defaultStudies = unwrapResult(
          await dispatch(initializeDefaultStudiesThunk())
        );
        const profilesStudiesMap = unwrapResult(
          await dispatch(initializeUserStudiesThunk())
        );

        /**
         * Backward compatibility with the functionality once present
         * in the SurveyList component
         *
         * We check whether all the default studies are assigned
         * to all profiles and if not, we try entering the study
         */

        const enterStudyReqs: EnterStudyRequest[] = [];

        Object.keys(profilesStudiesMap).forEach((profileId) => {
          const profileStudies = profilesStudiesMap[profileId];

          if (!profileStudies) {
            return;
          }

          const missingDefaultStudies = defaultStudies.filter(
            (study) => !profileStudies.includes(study)
          );

          if (missingDefaultStudies.length > 0) {
            missingDefaultStudies.forEach((studyKey) => {
              enterStudyReqs.push({ profileId, studyKey });
            });
          }
        });

        if (enterStudyReqs.length > 0) {
          await Promise.all(
            enterStudyReqs.map(async (req) => {
              await dispatch(enterStudyThunk(req));
            })
          );

          await dispatch(initializeActiveSurveysThunk());
        }
      } catch {
        /* empty */
      }
    };

    initialize();
  }, [currentUserId, dispatch]);

  return null;
};

export default DefaultStudiesManager;
