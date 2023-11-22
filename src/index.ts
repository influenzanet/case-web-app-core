import AppCore from "./AppCore";
import { initI18n } from "./i18n";
import store, { localStorageManager, reducersManager } from "./store/store";
import * as studyAPI from "./api/studyAPI";
import * as userAPI from "./api/userAPI";
import { dialogActions } from "./store/dialogSlice";
import { appActions } from "./store/appSlice";
import { userActions } from "./store/userSlice";
import { useAuthTokenCheck } from "./hooks/useAuthTokenCheck";
import PreventAccidentalNavigationPrompt from "./components/misc/PreventAccidentalNavigationPrompt";
import InternalNavigator from "./components/misc/InternalNavigator";
import { signupActions } from "./store/signupActions";
import { enterStudyThunk } from "./store/thunks/studiesThunks";
import { studiesActions } from "./store/studiesSlice";

const coreReduxActions = {
  appActions,
  dialogActions,
  userActions,
  signupActions,
  studiesActions,
};

const coreReduxThunks = {
  enterStudyThunk,
};

export {
  AppCore,
  initI18n,
  store,
  reducersManager,
  localStorageManager,
  studyAPI,
  userAPI,
  coreReduxActions,
  coreReduxThunks,
  useAuthTokenCheck,
  PreventAccidentalNavigationPrompt,
  InternalNavigator,
};
