import React from 'react';
import { NavbarItemConfig } from '../../../types/navbarConfig';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';
import clsx from 'clsx';

import { Offcanvas } from 'react-bootstrap';

interface DrawerProps {
  isAuth?: boolean;
  open: boolean;
  items: Array<NavbarItemConfig>;
  onClose: () => void;
}

const Drawer: React.FC<DrawerProps> = (props) => {
  return (
    <Offcanvas
      className="py-2 bg-primary text-white"
      show={props.open}
      onHide={props.onClose}
      style={{ maxWidth: '90%' }}
    >
      {props.items.map(item => {
        if (item.hideWhen === 'auth' && props.isAuth) {
          return null;
        }
        if (item.hideWhen === 'unauth' && !props.isAuth) {
          return null;
        }
        switch (item.type) {
          case 'internal':
            return <NavLink
              key={item.itemKey}
              className="nav-link px-3 py-1a"
              to={item.url}
              onClick={() => props.onClose()}
              activeClassName="bg-secondary"
              activeStyle={{
                fontWeight: "bold",
                color: "black"
              }}
              style={{
                minWidth: 250
              }}
            >
              {item.iconClass ?
                <i className={clsx(item.iconClass, 'me-1')}></i>
                : null}
              <span>{item.label}</span>
            </NavLink>
          case 'dialog':
            return <p key={item.itemKey}>todo: dialog opening</p>
          case 'dropdown':
            return <p key={item.itemKey}>todo: handledropdown</p>
          default:
            return <p>{item.itemKey}</p>

        }
      })}
    </Offcanvas>
  );
};

export default Drawer;
