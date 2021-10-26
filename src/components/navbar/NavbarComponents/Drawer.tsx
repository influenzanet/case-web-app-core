import React from 'react';
import { NavbarItemConfig } from '../../../types/navbarConfig';
import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import { Offcanvas } from 'react-bootstrap';
import DrawerDropdownItem from './DrawerDropdownItem';

interface DrawerProps {
  isAuth?: boolean;
  open: boolean;
  items?: Array<NavbarItemConfig>;
  onClose: () => void;
  onOpenDialog: (dialog: string) => void;
  onOpenUrl: (url: string) => void;
  onNavigate: (url: string) => void;
}

const Drawer: React.FC<DrawerProps> = (props) => {
  return (
    <Offcanvas
      className="py-2 bg-primary text-white"
      show={props.open}
      onHide={props.onClose}
      style={{ maxWidth: '90%' }}
    >
      {props.items?.map(item => {
        if (item.hideWhen === 'auth' && props.isAuth) {
          return null;
        }
        if (item.hideWhen === 'unauth' && !props.isAuth) {
          return null;
        }
        switch (item.type) {
          case 'dropdown':
            return <DrawerDropdownItem
              key={item.itemKey}
              item={item}
              onNavigate={(url) => {
                props.onNavigate(url);
                props.onClose()
              }}
              onOpenUrl={(url) => {
                props.onOpenUrl(url);
                props.onClose()
              }}
              onOpenDialog={(url) => {
                props.onOpenDialog(url);
                props.onClose()
              }}
            />
          default:
            return <NavLink
              key={item.itemKey}
              className="nav-link px-3 py-1a"
              to={item.url ? item.url : ''}
              onClick={() => props.onClose()}
              activeClassName="active"
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

        }
      })}
    </Offcanvas>
  );
};

export default Drawer;
