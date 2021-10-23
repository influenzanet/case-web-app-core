import React, { Suspense } from "react";

import 'localStyles';
import NormalNavbar from "./NavbarComponents/NormalNavbar";
import { LoadingPlaceholder } from "case-web-ui";
import SurveyModeNavbar from "./NavbarComponents/SurveyModeNavbar";

export default {
  title: "Navbars"
};

const exampleProfile = {
  id: 'id123123123',
  consentConfirmedAt: 1,
  createdAt: 1,
  mainProfile: true,
  avatarId: 'default',
  alias: 'Test Profile'
}

const exampleLabels = {
  toggleBtn: 'Menu',
  toggleBtnAriaLabel: 'Menu',
  loginBtn: 'Login',
  signupBtn: 'Signup',
  logoutBtn: 'Logout',
  openSingupSuccessDialogBtn: 'Start verification'
}

const onOpenExternalPage = (url: string) => { alert(`This would open a new window for ${url}`) }
const onNavigate = (url: string) => { alert(`This would navigate to ${url}`) }
const onOpenDialog = (d: string) => alert(`Would open ${d} dialog.`)

export const Example = () =>
  <Suspense fallback={() => <LoadingPlaceholder
    color="white"
    minHeight="100vh"
  />}>
    <NormalNavbar
      labels={exampleLabels}
      avatars={[
        { avatarId: 'default', url: '/images/placeholder_image.png' }
      ]}
      isLoggedIn={false}
      onOpenDialog={onOpenDialog}
      onNavigate={onNavigate}
      onOpenUrl={onOpenExternalPage}
      onLogout={() => alert('This would perform the logout.')}
    //content={{}}
    //breakpoint=''
    //onOpenExternalPage={onOpenExternalPage}
    />
  </Suspense>

export const DisabledSignup = () =>
  <Suspense fallback={() => <LoadingPlaceholder
    color="white"
    minHeight="100vh"
  />}>
    <NormalNavbar
      labels={exampleLabels}
      avatars={[
        { avatarId: 'default', url: '/images/placeholder_image.png' }
      ]}
      isLoggedIn={false}
      onOpenDialog={onOpenDialog}
      onNavigate={onNavigate}
      onOpenUrl={onOpenExternalPage}
      onLogout={() => alert('This would perform the logout.')}
      disableSignup={true}
    //content={{}}
    //breakpoint=''
    //onOpenExternalPage={onOpenExternalPage}
    />
  </Suspense>

export const LoggedIn = () =>
  <Suspense fallback={() => <LoadingPlaceholder
    color="white"
    minHeight="100vh"
  />}>
    <NormalNavbar
      labels={exampleLabels}
      avatars={[
        { avatarId: 'default', url: '/images/placeholder_image.png' }
      ]}
      currentProfile={exampleProfile}
      isLoggedIn={true}
      onOpenDialog={onOpenDialog}
      onNavigate={onNavigate}
      onOpenUrl={onOpenExternalPage}
      onLogout={() => alert('This would perform the logout.')}
      content={{
        leftItems: [],
        rightItems: [
          { itemKey: 'settings', label: 'Settings', type: 'internal', url: '/settings' },
          { itemKey: 'profiles', label: 'Profiles', type: 'dialog', url: 'manageProfiles' },
        ]
      }}
    />
  </Suspense>

export const NotVerifiedUser = () =>
  <Suspense fallback={() => <LoadingPlaceholder
    color="white"
    minHeight="100vh"
  />}>
    <NormalNavbar
      labels={exampleLabels}
      avatars={[
        { avatarId: 'default', url: '/images/placeholder_image.png' }
      ]}
      currentProfile={exampleProfile}
      isLoggedIn={false}
      isNotVerifiedUser={true}
      onOpenDialog={onOpenDialog}
      onNavigate={onNavigate}
      onOpenUrl={onOpenExternalPage}
      onLogout={() => alert('This would perform the logout.')}
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
      currentProfile={exampleProfile}
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
