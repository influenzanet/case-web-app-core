import { containerClassName } from 'case-web-ui';
import clsx from 'clsx';
import React, { useState } from 'react';
import { Nav, Navbar } from 'react-bootstrap';
import Drawer from './Drawer';

interface NormalNavbarProps {
  breakpoint?: "md" | "sm" | "lg" | "xl" | "xxl";
  labels: {
    toggleBtn: string;
    toggleBtnAriaLabel?: string;
  }
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

  return (
    <React.Fragment>
      <div className={`d-block d-${breakpoint}-none`}>
        <Drawer
          isAuth={false}
          open={drawerOpen}
          items={[]}
          onClose={() => {
            setDrawerOpen(false)
          }}
        />
      </div>
      <Navbar bg="primary" className="p-0"
        collapseOnSelect expand={breakpoint}
      >
        <div className={containerClassName}>
          <NavbarToggle
            label={props.labels.toggleBtn}
            ariaLabel={props.labels.toggleBtnAriaLabel}
            hideFromBreakpoint={breakpoint}
            onClick={() => setDrawerOpen(true)}
          />
          <Navbar.Collapse id="normal-mode-navbar-nav">


            <Nav className="me-auto">
              <Nav.Link href="#home">Home</Nav.Link>
              <Nav.Link href="#features">Features</Nav.Link>
              <Nav.Link href="#pricing">Pricing</Nav.Link>
            </Nav>



          </Navbar.Collapse>
        </div>
      </Navbar >
    </React.Fragment>

  )

  /*
  <Container>
        <Navbar.Brand href="#home">Navbar</Navbar.Brand>
        <Nav className="me-auto">
          <Nav.Link href="#home">Home</Nav.Link>
          <Nav.Link href="#features">Features</Nav.Link>
          <Nav.Link href="#pricing">Pricing</Nav.Link>
        </Nav>
      </Container>
      */
  //const breakpoint = props.content.breakpoint ? props.content.breakpoint : 'md';
  /*
  TODO:
  - get list of items to be rendered
  - render items
  - add callbacks
  */
  /*return (
    <React.Fragment>
      <div className={`d-block d-${breakpoint}-none`}>
        <Drawer
          isAuth={isLoggedIn}
          open={drawerOpen}
          items={props.content.leftItems}
          onClose={() => { setDrawerOpen(false) }}
        />
      </div>
      <nav className={`navbar navbar-expand-${breakpoint} bg-primary p-0`}>
        <div className={containerClassName}>
          {surveyMode.active ? surveyModeHeader() : normalModeHeader()}
        </div>
      </nav>


    </React.Fragment>
  );*/
};

export default NormalNavbar;


/*

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
*/
