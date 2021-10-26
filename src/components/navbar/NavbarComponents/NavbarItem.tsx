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
        onClick={() => props.onNavigate(itemURL)}
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
/*
<li className="dropdown nav-item">
  <button
    className="customDropDown btn btn-primary dropdown-toggle text-lightest fs-btn "
    type="button"
    id="DropMenu"
    data-bs-toggle="dropdown"
    aria-expanded="false">
    {props.iconClass ?
      <i className={clsx(props.iconClass, 'me-1')}></i>
      : null}
    {t(`${props.itemkey}.title`)}
  </button>
  <div className="dropdown-menu dropdown-menu-end ">
    {props.dropdownItems!.slice(0).map(
      item =>
        <DropdownItem
          key={item.itemKey}
          title={t(`${props.itemkey}.${item.itemKey}`)}
          itemkey={item.itemKey}
          iconClass={item.iconClass}
          url={item.url}
          onNavigate={handleNavigation}
        />)}
  </div>
</li>
}*/
