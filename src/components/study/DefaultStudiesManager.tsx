import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store/rootReducer";
import { initializeUserStudies } from "../../thunks/userThunks";
import { Action, ThunkDispatch, unwrapResult } from "@reduxjs/toolkit";
import {
  enterStudy,
  initializeActiveSurveys,
  initializeDefaultStudies,
} from "../../thunks/studiesThunks";

const DefaultStudiesManager: React.FC = () => {
  const dispatch = useDispatch<ThunkDispatch<RootState, void, Action>>();
  const currentUser = useSelector((state: RootState) => state.user.currentUser);

  useEffect(() => {
    const initialize = async () => {
      if (!currentUser.id) {
        return;
      }

      try {
        const defaultStudies = unwrapResult(
          await dispatch(initializeDefaultStudies())
        );
        const profilesStudiesMap = unwrapResult(
          await dispatch(initializeUserStudies())
        );

        /**
         * Backward compatibility with the functionality once present
         * in the SurveyList component
         *
         * We check whether all the default studies are assigned
         * to all profiles and if not, we try entering the study
         */

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
              dispatch(enterStudy({ profileId, studyKey }));
            });
          }
        });

        await dispatch(initializeActiveSurveys());
      } catch {
        /* empty */
      }
    };

    initialize();
  }, [currentUser.id, dispatch]);

  return <></>;
};

export default DefaultStudiesManager;
