import React from 'react';
import { useIsAuthenticated } from '../../hooks/useIsAuthenticated';
import Login from './GlobalDialogs/Login';
import Signup from './GlobalDialogs/Signup';
import SignupSuccess from './GlobalDialogs/SignupSuccess';
import AlertDialog from './GlobalDialogs/AlertDialog';
import ChangeEmail from './GlobalDialogs/ChangeEmail';
import ChangeLanguage from './GlobalDialogs/ChangeLanguage';
import ChangeNotifications from './GlobalDialogs/ChangeNotifications';
import ChangePassword from './GlobalDialogs/ChangePassword';
import DeleteAccount from './GlobalDialogs/DeleteAccount';
import ManageProfiles from './GlobalDialogs/ManageProfiles';
import PasswordForgotten from './GlobalDialogs/PasswordForgotten';
import { useAuthTokenCheck } from '../../hooks/useAuthTokenCheck';


interface GlobalDialogsProps {
  onChangeLanguage: (code: string) => void;
}

const GlobalDialogs: React.FC<GlobalDialogsProps> = (props) => {
  const isAuth = useIsAuthenticated();
  const hasToken = useAuthTokenCheck();

  const authDialogs = () => {
    return <React.Fragment>
      <ChangeEmail />
      <ChangePassword />
      <ChangeLanguage
        onChangeLanguage={props.onChangeLanguage}
      />
      <ChangeNotifications />
      <DeleteAccount />
    </React.Fragment>
  }

  return (
    <React.Fragment>
      <Login />
      <Signup />
      <SignupSuccess />
      <PasswordForgotten />
      <AlertDialog />
      {hasToken ? <ManageProfiles /> : null}
      {isAuth ? authDialogs() : null}
    </React.Fragment>
  );
};

export default GlobalDialogs;
