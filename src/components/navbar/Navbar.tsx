import React, { useState } from 'react';
import { useDispatch } from 'react-redux'
import clsx from 'clsx';
import { useSelector } from 'react-redux'
import { RootState } from '../../store/rootReducer'
import { useTranslation } from 'react-i18next';
import { useIsAuthenticated } from '../../hooks/useIsAuthenticated';
import { useLogout } from '../../hooks/useLogout';
import { useHistory } from 'react-router-dom';
import { NavbarConfig } from '../../types/navbarConfig';
import NavbarItem from './NavbarComponents/NavbarItem';
import Drawer from './NavbarComponents/Drawer';
import { Profile } from '../../api/types/user';
import { Avatar, LoadingPlaceholder } from 'case-web-ui';
import { useAuthTokenCheck } from '../../hooks/useAuthTokenCheck';
import { containerClassName } from 'case-web-ui';
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

  const breakpoint = props.content.breakpoint ? props.content.breakpoint : 'md';


  const navbarLeft = () => {
    if (!props.content) { return null; }

    return <React.Fragment>
      <div className={clsx("nav nav-tabs", `d-block d-${breakpoint}-none`)}>

        <button className="btn btn-primary fs-btn nav-link nav-link-height text-nowrap" onClick={() => setDrawerOpen(true)}>
          <i className="fas fa-bars" ></i>
          <span className="navbar-text ps-1 text-white ">Menu</span>
        </button>

      </div>
      <div className="collapse navbar-collapse bg-primary no-transition" id="navbarSupportedContent" >
        <ul className="nav nav-tabs" >
          {props.content.leftItems.map(
            item =>
              <NavbarItem
                key={item.itemKey}
                itemkey={item.itemKey}
                title={t(`${item.itemKey}`)}
                iconClass={item.iconClass}
                url={item.url}
                onNavigate={handleNavigation}
                hideWhen={item.hideWhen}
                type={item.type}
                dropdownItems={item.dropdownItems}
              />)}
        </ul>
      </div>
    </React.Fragment>
  }

  const navbarRight = () => {
    if (hasAuthTokens) {
      return <div className="dropdown nav-tabs d-flex align-items-center">
        <button
          className="btn btn-primary dropdown-toggle fs-btn nav-link-height d-flex align-items-center"
          type="button"
          id="DropMenu"
          data-bs-toggle="dropdown"
          style={{
            outline: 'none',
            boxShadow: 'none',
            outlineWidth: 0,
            border: 'none',
          }}
          aria-expanded="false" >
          {currentProfile ? <Avatar
            avatars={avatars}
            className="me-1"
            avatarId={currentProfile.avatarId}
          /> : null}
          <span className="d-none d-sm-inline-block">
            {currentProfile?.alias}
          </span>
        </button >

        <div className="dropdown-menu shadow border-0 dropdown-menu-end text-end bg-secondary">
          <div className="d-block d-sm-none border-bottom-2 border-secondary">
            <span className="dropdown-item disabled">{currentProfile?.alias}</span>
          </div>
          {isLoggedIn ? <React.Fragment>
            {
              props.content?.rightItems.map(item =>
                <button
                  key={item.itemKey}
                  className="dropdown-item"
                  type="button"
                  onClick={() => {
                    if (item.type === 'dialog') {
                      dispatch(dialogActions.openDialogWithoutPayload(item.url))
                    } else {
                      history.push(item.url);
                    }
                  }}
                >
                  {t(`rightMenu.${item.itemKey}`)}
                  <i className={clsx(item.iconClass, 'ms-1')}></i>
                </button>
              )
            }
          </React.Fragment> : <button
            className="dropdown-item" type="button"
            onClick={() => {
              dispatch(dialogActions.openDialogWithoutPayload("signupSuccess"))
            }}
          >
            {t('rightMenu.verified')}
          </button>
          }
          <button
            className="dropdown-item"
            onClick={() => logout()} >
            {t(`rightMenu.logout`)}
            <i className={clsx('fas fa-sign-out-alt', 'ms-1')}></i>
          </button>
        </div>
      </div>
    }
    return <div className="row">
      <ul className="nav nav-tabs justify-content-end">
        <li className="nav-item">
          <button className="nav-link nav-link-height btn btn-primary" onClick={() => dispatch(dialogActions.openDialogWithoutPayload("login"))} >{t(`${'login'}`)}</button>
        </li>

        {!signupDisabled ?
          <li className="nav-item">
            <button className="nav-link nav-link-height btn btn-primary " onClick={() => dispatch(dialogActions.openDialogWithoutPayload("signup"))} >{t(`${'signup'}`)}</button>
          </li>
          : null}

      </ul>
    </div>
  }

  const normalModeHeader = () =>
    <div className="d-flex align-items-end w-100">
      <div className="flex-grow-1">
        {navbarLeft()}
      </div>

      {navbarRight()}
    </div>


  /*<div className={`d-block d-${breakpoint}-none`}>
          <Drawer
            isAuth={isLoggedIn}
            open={drawerOpen}
            items={props.content.leftItems}
            onClose={() => { setDrawerOpen(false) }}
          />
        </div>
        <nav className={`navbar navbar-expand-${breakpoint} bg-primary p-0`}>
          <div className={containerClassName}>

          </div>
        </nav>
        */

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
        <NormalNavbar />
      }
    </React.Fragment>
  );
};

export default Navbar;
