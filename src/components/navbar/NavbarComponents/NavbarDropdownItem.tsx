import clsx from 'clsx';
import React from 'react';
import { Dropdown } from 'react-bootstrap';
import { useRouteMatch } from 'react-router-dom';
import { NavbarItemConfig } from '../../../types/navbarConfig';

interface NavbarDropdownItemProps {
  item: NavbarItemConfig;
  onOpenDialog: (dialog: string) => void;
  onOpenUrl: (url: string) => void;
  onNavigate: (url: string) => void;
}

const NavbarDropdownItem: React.FC<NavbarDropdownItemProps> = (props) => {
  const match = useRouteMatch([
    props.item.url ? props.item.url : 'not defined',
    ...(props.item && props.item.dropdownItems ? props.item.dropdownItems.map(item => item.url ? item.url : '') : [])
  ]);

  return (
    <Dropdown
      align={props.item.dropdownAlign}
    >
      <Dropdown.Toggle
        className={clsx(
          "fs-btn nav-link nav-link-height d-flex align-items-center",
          {
            'fw-bold active text-body': match !== null
          }
        )}
        style={{
          outline: 'none',
          boxShadow: 'none',
          outlineWidth: 0,
          border: 'none',
        }}
        id={props.item.itemKey + '-menu'}
      >
        {props.item.iconClass ?
          <i className={clsx(props.item.iconClass, 'me-1')}></i>
          : null}
        <span>{props.item.label}</span>
      </Dropdown.Toggle>

      <Dropdown.Menu
        className="shadow border-0 text-end bg-secondary"
      >
        {props.item.dropdownItems?.map(item =>
          <Dropdown.Item
            aria-label={item.label}
            key={item.itemKey}
            className={clsx(
              "dropdown-item",
              {
                "fw-bold": match !== null && match.path === item.url
              }
            )}
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
      </Dropdown.Menu>
    </Dropdown >
  );
};

export default NavbarDropdownItem;
