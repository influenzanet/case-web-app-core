import { Avatar, containerClassName } from 'case-web-ui';
import { AvatarConfig } from 'case-web-ui/build/types/avatars';
import { Profile } from 'case-web-ui/build/types/profile';
import clsx from 'clsx';
import React, { useState } from 'react';
import { Dropdown, Navbar, NavItem } from 'react-bootstrap';
import { NavbarConfig, NavbarItemConfig } from '../../../types/navbarConfig';
import Drawer from './Drawer';
import NavbarItem from './NavbarItem';

export type NavbarBreakpoints = "md" | "sm" | "lg" | "xl" | "xxl";

interface NormalNavbarProps {
  breakpoint?: NavbarBreakpoints;
  labels: {
    toggleBtn: string;
    toggleBtnAriaLabel?: string;
    loginBtn: string;
    signupBtn: string;
    logoutBtn: string;
    openSingupSuccessDialogBtn: string;
  };
  content?: NavbarConfig;
  isLoggedIn: boolean;
  isNotVerifiedUser?: boolean;
  disableSignup?: boolean;
  avatars: AvatarConfig[];
  currentProfile?: Profile;
  onOpenDialog: (dialog: string) => void;
  onOpenUrl: (url: string) => void;
  onNavigate: (url: string) => void;
  onLogout: () => void;
}

const NavbarToggle: React.FC<{
  label: string;
  ariaLabel?: string;
  hideFromBreakpoint: 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  onClick: () => void;
}> = (props) => {
  return (
    <div className={clsx("nav nav-tabs", `d-block d-${props.hideFromBreakpoint}-none`)}>
      <button className="btn btn-primary fs-btn nav-link nav-link-height text-nowrap" onClick={props.onClick}
        aria-label={props.ariaLabel}
      >
        <i className="fas fa-bars" ></i>
        <span className="navbar-text ps-1 text-white ">{props.label}</span>
      </button>
    </div>
  )
}

const NormalNavbar: React.FC<NormalNavbarProps> = (props) => {
  const breakpoint = props.breakpoint ? props.breakpoint : 'md';

  const [drawerOpen, setDrawerOpen] = useState(false);

  const shouldHideItem = (item: NavbarItemConfig): boolean => {
    if (props.isLoggedIn === false && item.hideWhen === 'unauth') {
      return true;
    }
    if (props.isLoggedIn === true && item.hideWhen === 'auth') {
      return true;
    }
    return false;
  }

  const navbarLeft = () => <React.Fragment>
    <NavbarToggle
      label={props.labels.toggleBtn}
      ariaLabel={props.labels.toggleBtnAriaLabel}
      hideFromBreakpoint={breakpoint}
      onClick={() => setDrawerOpen(true)}
    />
    <Navbar.Collapse id="normal-mode-navbar-nav">
      <ul className="nav nav-tabs" >
        {props.content?.leftItems.map(
          item => {
            if (shouldHideItem(item)) {
              return null;
            }
            return <NavbarItem
              key={item.itemKey}
              item={item}
              onNavigate={props.onNavigate}
              onOpenUrl={props.onOpenUrl}
              onOpenDialog={props.onOpenDialog}
            />
          })}
      </ul>
    </Navbar.Collapse>
  </React.Fragment>

  const navbarRightUnauth = () => (
    <div className="row">
      <ul className="nav nav-tabs justify-content-end">
        <li className="nav-item">
          <button
            aria-label={props.labels.loginBtn}
            className="nav-link nav-link-height btn btn-primary"
            onClick={() => props.onOpenDialog("login")}
          >
            {props.labels.loginBtn}
          </button>
        </li>

        {!props.disableSignup ?
          <li className="nav-item">
            <button
              aria-label={props.labels.signupBtn}
              className="nav-link nav-link-height btn btn-primary "
              onClick={() => props.onOpenDialog("signup")} >
              {props.labels.signupBtn}
            </button>
          </li>
          : null}
      </ul>
    </div>
  )

  const navbarRightAuth = () => {
    return (
      <Dropdown
        as={NavItem}
        align="end"
      >
        <Dropdown.Toggle
          className="fs-btn nav-link-height d-flex align-items-center"
          id="nav-auth-menu"
          style={{
            outline: 'none',
            boxShadow: 'none',
            outlineWidth: 0,
            border: 'none',
          }}
        >
          {props.currentProfile ? <Avatar
            avatars={props.avatars}
            className="me-1"
            avatarId={props.currentProfile.avatarId}
          /> : null}
          <span className="d-none d-sm-inline-block">
            {props.currentProfile?.alias}
          </span>
        </Dropdown.Toggle>

        <Dropdown.Menu
          className="shadow border-0 dropdown-menu-end text-end bg-secondary"
        >
          <div className="d-block d-sm-none border-bottom-2 border-grey-2">
            <span className="dropdown-item disabled">{props.currentProfile?.alias}</span>
          </div>

          {props.content?.rightItems.map(item =>
            <Dropdown.Item
              as="button"
              aria-label={item.label}
              key={item.itemKey}
              className="dropdown-item"
              type="button"
              onClick={() => {
                if (!item.url) {
                  console.warn('Navigation item did not contain a url attribute. Website creator should check the config.');
                  return
                }
                if (item.type === 'dialog') {
                  props.onOpenDialog(item.url);
                } else {
                  props.onNavigate(item.url);
                }
              }}
            >
              {item.label}
              <i className={clsx(item.iconClass, 'ms-1')}></i>
            </Dropdown.Item>
          )}

          <Dropdown.Item
            as="button"
            aria-label={props.labels.logoutBtn}
            onClick={props.onLogout}
          >
            {props.labels.logoutBtn}
            <i className={clsx('fas fa-sign-out-alt', 'ms-1')}></i>
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>
    )
  }

  const navbarRightNotVerified = () => {
    return (
      <Dropdown
        as={NavItem}
        align="end"
      >
        <Dropdown.Toggle
          className="fs-btn nav-link-height d-flex align-items-center"
          id="nav-auth-menu"
          style={{
            outline: 'none',
            boxShadow: 'none',
            outlineWidth: 0,
            border: 'none',
          }}
        >
          {props.currentProfile ? <Avatar
            avatars={props.avatars}
            className="me-1"
            avatarId={props.currentProfile.avatarId}
          /> : null}
          <span className="d-none d-sm-inline-block">
            {props.currentProfile?.alias}
          </span>
        </Dropdown.Toggle>

        <Dropdown.Menu
          className="shadow border-0 dropdown-menu-end text-end bg-secondary"
        >
          <div className="d-block d-sm-none border-bottom-2 border-grey-2">
            <span className="dropdown-item disabled">{props.currentProfile?.alias}</span>
          </div>

          <Dropdown.Item
            as="button"
            aria-label={props.labels.openSingupSuccessDialogBtn}
            onClick={() => props.onOpenDialog('signupSuccess')}
          >
            {props.labels.openSingupSuccessDialogBtn}
          </Dropdown.Item>

          <Dropdown.Item
            as="button"
            aria-label={props.labels.logoutBtn}
            onClick={props.onLogout}
          >
            {props.labels.logoutBtn}
            <i className={clsx('fas fa-sign-out-alt', 'ms-1')}></i>
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>
    )
  }

  const navbarRight = () => {
    if (props.isLoggedIn) {
      return navbarRightAuth();
    }
    if (props.isNotVerifiedUser) {
      return navbarRightNotVerified();
    }
    return navbarRightUnauth();
  }

  return (
    <React.Fragment>
      <div className={`d-block d-${breakpoint}-none`}>
        <Drawer
          isAuth={props.isLoggedIn}
          open={drawerOpen}
          items={props.content?.leftItems}
          onClose={() => {
            setDrawerOpen(false)
          }}
          onNavigate={props.onNavigate}
          onOpenUrl={props.onOpenUrl}
          onOpenDialog={props.onOpenDialog}
        />
      </div>
      <Navbar bg="primary" className="p-0"
        collapseOnSelect expand={breakpoint}
      >
        <div className={containerClassName}>
          <div className="d-flex align-items-end w-100">
            <div className="flex-grow-1">
              {navbarLeft()}
            </div>
            {navbarRight()}
          </div>
        </div>
      </Navbar >
    </React.Fragment>

  )
};

export default NormalNavbar;
