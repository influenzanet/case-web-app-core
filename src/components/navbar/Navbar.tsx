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
import { LoadingPlaceholder } from 'case-web-ui';
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

  const surveyMode = useSelector((state: RootState) => state.app.surveyMode);
  const profileList = useSelector((state: RootState) => state.user.currentUser.profiles);
  const avatars = useSelector((state: RootState) => state.config.avatars);
  const mainProfile: Profile | undefined = profileList.find((profile: Profile) => profile.mainProfile === true);

  const handleNavigation = (url: string) => {
    history.push(url);
  }

  if (props.loading || !props.content) {
    return <LoadingPlaceholder color="primary" minHeight={44} iconSize="1rem" />
  }

  const getLocalizedConfig = () => {
    if (!props.content) return;
    const config = { ...props.content };

    // right items
    config.rightItems = config.rightItems.map(item => {
      return {
        ...item,
        label: t(`rightMenu.${item.itemKey}`)
      }
    })

    // left items
    config.leftItems = config.leftItems.map(item => {
      const newItem = {
        ...item,
      }
      if (item.type === 'dropdown') {
        item.dropdownItems = item.dropdownItems?.map(dItem => {
          return {
            ...dItem,
            label: t(`leftMenu.${item.itemKey}.${dItem.itemKey}`)
          }
        })
        newItem.label = t(`leftMenu.${item.itemKey}.title`)
      } else {
        newItem.label = t(`leftMenu.${item.itemKey}`)
      }
      return newItem;
    })

    return config;
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
          content={getLocalizedConfig()}
          isLoggedIn={isLoggedIn}
          isNotVerifiedUser={hasAuthTokens && !isLoggedIn}
          avatars={avatars}
          currentProfile={mainProfile}
          labels={{
            toggleBtn: t('toggleBtn'),
            toggleBtnAriaLabel: t('toggleBtnAriaLabel'),
            loginBtn: t('login'),
            signupBtn: t('signup'),
            logoutBtn: t('rightMenu.logout'),
            openSingupSuccessDialogBtn: t('rightMenu.verified'),
          }}
          disableSignup={signupDisabled}
          onOpenUrl={props.onOpenExternalPage}
          onNavigate={handleNavigation}
          onOpenDialog={(dialog) => dispatch(dialogActions.openDialogWithoutPayload(dialog))}
          onLogout={() => logout()}
        />
      }
    </React.Fragment>
  );
};

export default Navbar;
