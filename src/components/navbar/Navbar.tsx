import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux'
import { useSelector } from 'react-redux'
import { RootState } from '../../store/rootReducer'
import { useTranslation } from 'react-i18next';
import { useIsAuthenticated } from '../../hooks/useIsAuthenticated';
import { useLogout } from '../../hooks/useLogout';
import { useHistory, useLocation } from 'react-router-dom';
import { NavbarConfig } from '../../types/navbarConfig';
import { Profile } from '../../api/types/user';
import { LoadingPlaceholder } from 'case-web-ui';
import { useAuthTokenCheck } from '../../hooks/useAuthTokenCheck';
import { dialogActions } from '../../store/dialogSlice';
import SurveyModeNavbar from './NavbarComponents/SurveyModeNavbar';
import NormalNavbar, { NavbarBreakpoints } from './NavbarComponents/NormalNavbar';


interface NavbarProps {
  loading?: boolean;
  content?: NavbarConfig;
  onOpenExternalPage: (url: string) => void;
}

const signupDisabled = process.env.REACT_APP_DISABLE_SIGNUP === 'true';

const Navbar: React.FC<NavbarProps> = (props) => {
  const { t, i18n } = useTranslation(['navbar']);
  const history = useHistory();
  const location = useLocation();
  const dispatch = useDispatch();

  const hasAuthTokens = useAuthTokenCheck();
  const isLoggedIn = useIsAuthenticated();
  const logout = useLogout();

  const surveyMode = useSelector((state: RootState) => state.app.surveyMode);
  const profileList = useSelector((state: RootState) => state.user.currentUser.profiles);
  const avatars = useSelector((state: RootState) => state.config.avatars);
  const mainProfile: Profile | undefined = profileList.find((profile: Profile) => profile.mainProfile === true);

  const [localisedContent, setLocalisedContent] = useState<NavbarConfig | undefined>(props.content);

  useEffect(() => {
    if (!props.content) return;

    // right items
    const newRightItems = props.content.rightItems.map(item => {
      return {
        ...item,
        label: t(`rightMenu.${item.itemKey}`)
      }
    })

    const newUnauthRightItems = props.content.unauthRightItems?.map(item => {
      const newItem = {
        ...item,
      }
      if (item.type === 'dropdown') {
        newItem.dropdownItems = item.dropdownItems?.map(dItem => {
          return {
            ...dItem,
            label: t(`${item.itemKey}.${dItem.itemKey}`)
          }
        })
        newItem.label = t(`${item.itemKey}.title`)
      } else {
        newItem.label = t(`${item.itemKey}`)
      }
      return { ...newItem };
    })

    // left items
    const newLeftItems = props.content.leftItems.map(item => {
      const newItem = {
        ...item,
      }
      if (item.type === 'dropdown') {
        newItem.dropdownItems = item.dropdownItems?.map(dItem => {
          return {
            ...dItem,
            label: t(`${item.itemKey}.${dItem.itemKey}`)
          }
        })
        newItem.label = t(`${item.itemKey}.title`)
      } else {
        newItem.label = t(`${item.itemKey}`)
      }
      return { ...newItem };
    })

    setLocalisedContent({
      breakpoint: props.content.breakpoint,
      leftItems: newLeftItems.slice(),
      rightItems: newRightItems,
      unauthRightItems: newUnauthRightItems,
    });
  }, [i18n.language])

  useEffect(() => {
    if (hasAuthTokens && !isLoggedIn) {
      dispatch(dialogActions.openDialogWithoutPayload('signupSuccess'))
    }
  }, [location.pathname])

  const handleNavigation = (url: string) => {
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
          content={localisedContent}
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
          breakpoint={props.content?.breakpoint as NavbarBreakpoints}
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
