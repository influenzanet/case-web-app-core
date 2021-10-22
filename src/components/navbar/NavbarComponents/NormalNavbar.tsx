import { containerClassName } from 'case-web-ui';
import clsx from 'clsx';
import React, { useState } from 'react';
import { Nav, Navbar } from 'react-bootstrap';
import Drawer from './Drawer';

interface NormalNavbarProps {
  breakpoint?: "md" | "sm" | "lg" | "xl" | "xxl";
  toggleLabel: string;
  toggleAriaLabel?: string;
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
            label={props.toggleLabel}
            hideFromBreakpoint={breakpoint}
            onClick={() => setDrawerOpen(true)}
          />
          <Navbar.Collapse id="responsive-navbar-nav">
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
