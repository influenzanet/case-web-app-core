export interface NavbarConfig {
  leftItems: Array<NavbarItemConfig>;
  rightItems: Array<NavbarItemConfig>;
  breakpoint?: string;
}

export interface NavbarItemConfig {
  type: 'internal' | 'dropdown' | 'dialog';
  url?: string;
  itemKey: string;
  label?: string; // for already translated items
  hideWhen?: 'auth' | 'unauth';
  iconClass?: string;
  className?: string;
  dropdownItems?: Array<NavbarItemConfig>;
  dropdownAlign?: 'start' | 'end';
}
