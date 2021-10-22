import React, { Suspense } from "react";

import 'localStyles';
import NormalNavbar from "./NavbarComponents/NormalNavbar";
import { LoadingPlaceholder } from "case-web-ui";
import SurveyModeNavbar from "./NavbarComponents/SurveyModeNavbar";

export default {
  title: "Navbars"
};

const onOpenExternalPage = (url: string) => { alert(`This would open ${url}`) }

export const Example = () =>
  <Suspense fallback={() => <LoadingPlaceholder
    color="white"
    minHeight="100vh"
  />}>
    <NormalNavbar
      toggleLabel={'Menu'}
      toggleAriaLabel={'Menu'}
    //content={{}}
    //breakpoint=''
    //onOpenExternalPage={onOpenExternalPage}
    />
  </Suspense>


export const SurveyMode = () =>
  <Suspense fallback={() => <LoadingPlaceholder
    color="white"
    minHeight="100vh"
  />}>
    <SurveyModeNavbar
      currentProfile={{
        id: 'todo',
        consentConfirmedAt: 1,
        createdAt: 1,
        mainProfile: true,
        avatarId: 'default',
        alias: 'Test Profile'
      }}
      avatars={[
        { avatarId: 'default', url: '/images/placeholder_image.png' }
      ]}
      onExit={() => alert('Exiting survey')}
      labels={{
        exitSurveyModeBtn: 'Exit survey',
        selectedProfilePrefix: 'Survey for:'
      }}
    />
  </Suspense>
