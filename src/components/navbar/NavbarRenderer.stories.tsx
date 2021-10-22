import React, { Suspense } from "react";

import 'localStyles';
import NavbarRenderer from "./NavbarRenderer";
import { LoadingPlaceholder } from "case-web-ui";

export default {
  title: "Navbar"
};

const onOpenExternalPage = (url: string) => { alert(`This would open ${url}`) }

export const Example = () =>
  <Suspense fallback={() => <LoadingPlaceholder
    color="white"
    minHeight="100vh"
  />}>
    <NavbarRenderer
      toggleLabel={'Menu'}
      toggleAriaLabel={'Menu'}
    //content={{}}
    //breakpoint=''
    //onOpenExternalPage={onOpenExternalPage}
    />
  </Suspense>
