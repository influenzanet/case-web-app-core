import React from 'react';
import { NavbarItemConfig } from '../../../types/navbarConfig';

interface NavbarDropdownItemProps {
  item: NavbarItemConfig;
  onOpenDialog: (dialog: string) => void;
  onOpenUrl: (url: string) => void;
  onNavigate: (url: string) => void;
}

const NavbarDropdownItem: React.FC<NavbarDropdownItemProps> = (props) => {
  return (
    <p>NavbarDropdownItem</p>
  );
};

export default NavbarDropdownItem;
