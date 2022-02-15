import AppCore from './AppCore';
import { initI18n } from './i18n';
import store from './store/store';
import * as studyAPI from './api/studyAPI';
import { dialogActions } from './store/dialogSlice';
import { appActions } from './store/appSlice';
import { useAuthTokenCheck } from "./hooks/useAuthTokenCheck";
import PreventAccidentalNavigationPrompt from './components/misc/PreventAccidentalNavigationPrompt';
import InternalNavigator from './components/misc/InternalNavigator';

const coreReduxActions = {
  appActions,
  dialogActions,
}

export {
  AppCore,
  initI18n,
  store,
  studyAPI,
  coreReduxActions,
  useAuthTokenCheck,
  PreventAccidentalNavigationPrompt,
  InternalNavigator,
}
