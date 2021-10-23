import React, { useState } from 'react';
import { useDispatch } from 'react-redux'
import { useSelector } from 'react-redux'
import { RootState } from '../../store/rootReducer'
import { useTranslation } from 'react-i18next';
import { useIsAuthenticated } from '../../hooks/useIsAuthenticated';
import { useLogout } from '../../hooks/useLogout';
import { useHistory } from 'react-router-dom';
import { NavbarConfig } from '../../types/navbarConfig';
import { Profile } from '../../api/types/user';
import { Avatar, LoadingPlaceholder } from 'case-web-ui';
import { useAuthTokenCheck } from '../../hooks/useAuthTokenCheck';
import { dialogActions } from '../../store/dialogSlice';
import SurveyModeNavbar from './NavbarComponents/SurveyModeNavbar';
import NormalNavbar from './NavbarComponents/NormalNavbar';


interface NavbarProps {
  loading?: boolean;
  content?: NavbarConfig;
  onOpenExternalPage: (url: string) => void;
}

const signupDisabled = process.env.REACT_APP_DISABLE_SIGNUP === 'true';

const Navbar: React.FC<NavbarProps> = (props) => {
  const { t } = useTranslation(['navbar']);
  const history = useHistory();
  const dispatch = useDispatch();

  const hasAuthTokens = useAuthTokenCheck();
  const isLoggedIn = useIsAuthenticated();
  const logout = useLogout();

  const [drawerOpen, setDrawerOpen] = useState(false);

  const surveyMode = useSelector((state: RootState) => state.app.surveyMode);
  const profileList = useSelector((state: RootState) => state.user.currentUser.profiles);
  const avatars = useSelector((state: RootState) => state.config.avatars);
  const currentProfile: Profile | undefined = profileList.find((profile: Profile) => profile.mainProfile === true);


  const handleNavigation = (url: string, backdrop: boolean) => {
    history.push(url);
  }

  if (props.loading || !props.content) {
    return <LoadingPlaceholder color="primary" minHeight={44} iconSize="1rem" />
  }

  return (
    <React.Fragment>
      {surveyMode.active ?
        <SurveyModeNavbar
          onExit={() => history.replace('/')}
          avatars={avatars}
          currentProfile={surveyMode.profile}
          labels={{
            exitSurveyModeBtn: t('exitSurveyMode'),
            selectedProfilePrefix: t('selectedProfilePrefixInSurveyMode'),
          }}
        /> :
        <NormalNavbar
          isLoggedIn={isLoggedIn}
          labels={{
            toggleBtn: t('toggleBtn'),
            toggleBtnAriaLabel: t('toggleBtnAriaLabel'),
            loginBtn: t(`${'login'}`),
            signupBtn: t(`${'signup'}`),
          }}
          onOpenDialog={(dialog) => dispatch(dialogActions.openDialogWithoutPayload(dialog))}
        />
      }
    </React.Fragment>
  );
};

export default Navbar;
