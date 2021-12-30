import React from 'react';
import clsx from 'clsx';
import { NavbarItemConfig } from '../../../types/navbarConfig';
import NavbarDropdownItem from './NavbarDropdownItem';
import { NavLink } from 'react-router-dom';


interface NavbarItemProps {
  item: NavbarItemConfig;
  onOpenDialog: (dialog: string) => void;
  onOpenUrl: (url: string) => void;
  onNavigate: (url: string) => void;
}

const NavbarItem: React.FC<NavbarItemProps> = (props) => {
  if (props.item.type === 'dropdown') {
    return <NavbarDropdownItem
      {...props}
    />
  }

  const itemURL = props.item.url ? props.item.url : '';

  return (
    <li className="nav-item " >
      <NavLink
        className={clsx("nav-link nav-link-height", props.item.className)}
        to={itemURL}
        onClick={(e: any) => {
          switch (props.item.type) {
            case 'dialog':
              e.preventDefault();
              props.onOpenDialog(itemURL);
              break;
            case 'internal':
              props.onNavigate(itemURL);
              break;
            default:
              console.error(`unknown navbar item type: ${props.item.type}`)
          }
        }}
        activeStyle={{
          fontWeight: "bold",
          color: "black"
        }}>
        {props.item.iconClass ?
          <i className={clsx(props.item.iconClass, 'me-1')}></i>
          : null}
        <span>{props.item.label}</span>
      </NavLink>
    </li>

  )
};

export default NavbarItem;
