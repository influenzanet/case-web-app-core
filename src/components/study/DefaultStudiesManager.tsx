import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store/rootReducer";
import { Action, ThunkDispatch } from "@reduxjs/toolkit";
import {
  enterDefaultStudiesThunk,
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

      await dispatch(initializeDefaultStudiesThunk());

      await dispatch(initializeUserStudiesThunk());

      /**
       * This is for backward compatibility with a functionality
       * once present in the SurveyList component, and works
       * as a sort of poor man retry logic for joining the default studies.
       */
      await dispatch(enterDefaultStudiesThunk());

      await dispatch(initializeActiveSurveysThunk());
    };

    initialize();
  }, [currentUserId, dispatch]);

  return null;
};

export default DefaultStudiesManager;
