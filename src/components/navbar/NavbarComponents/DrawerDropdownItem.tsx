import { ChevronDown, ChevronUp } from 'case-web-ui';
import clsx from 'clsx';
import React, { useState } from 'react';
import { Collapse } from 'react-bootstrap';
import { useRouteMatch } from 'react-router-dom';
import { NavbarItemConfig } from '../../../types/navbarConfig';

interface DrawerDropdownItemProps {
  item: NavbarItemConfig;
  onOpenDialog: (dialog: string) => void;
  onOpenUrl: (url: string) => void;
  onNavigate: (url: string) => void;
}

const DrawerDropdownItem: React.FC<DrawerDropdownItemProps> = (props) => {
  const match = useRouteMatch([
    props.item.url ? props.item.url : 'not defined',
    ...(props.item && props.item.dropdownItems ? props.item.dropdownItems.map(item => item.url ? item.url : '') : [])
  ]);

  const [open, setOpen] = useState(true);

  return (
    <div className="w-100">
      <button
        key={props.item.itemKey}
        role="navigation"
        className={clsx(
          "btn w-100 text-start nav-link px-3 py-1a cursor-pointer",
          {
            'fw-bold active text-body': match !== null,
            'text-decoration-underline': open,
          }
        )}
        onClick={() => setOpen(prev => !prev)}
        style={{
          minWidth: 250,
        }}
      >
        {props.item.iconClass ?
          <i className={clsx(props.item.iconClass, 'me-1')}></i>
          : null}
        <span>{props.item.label}</span>
        <span className="ms-1">
          {
            open ? <ChevronUp /> : <ChevronDown />
          }
        </span>
      </button>
      <Collapse in={open}>
        <div>
          {props.item.dropdownItems?.map(item => {
            const activeRoute = match !== null && match.path === item.url;
            return (
              <button
                aria-label={item.label}
                key={item.itemKey}
                role="navigation"
                className={clsx(
                  "nav-link px-4 btn w-100 text-start",
                  {
                    "active text-body": activeRoute
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
              </button>)
          }
          )}
        </div>
      </Collapse>
    </div>
  );
};

export default DrawerDropdownItem;
