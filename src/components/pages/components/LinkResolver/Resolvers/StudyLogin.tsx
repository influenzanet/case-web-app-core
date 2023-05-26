import React, { useCallback, useEffect, useState } from 'react';
import { DefaultRoutes } from '../../../../../types/routing';
import { useTranslation } from 'react-i18next';
import { useLogout } from '../../../../../hooks/useLogout';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../../../../store/rootReducer';
import { useUrlQuery } from '../../../../../hooks/useUrlQuery';
import { LinkResolverPaths } from '../LinkResolver';
import { useHistory } from 'react-router-dom';
import { autoValidateTemporaryTokenReq } from '../../../../../api/authAPI';
import { getErrorMsg } from '../../../../../api/utils';
import { dialogActions } from '../../../../../store/dialogSlice';
import { useAuthTokenCheck } from '../../../../../hooks/useAuthTokenCheck';

import {
  containerClassName,
  TitleBar,
  LoginCard,
} from 'case-web-ui';
import { setPersistState } from '../../../../../store/appSlice';


interface StudyLoginProps {
  defaultRoutes: DefaultRoutes;
}

const translationRootKey = 'studyLogin';

const StudyLogin: React.FC<StudyLoginProps> = (props) => {
  const dispatch = useDispatch();

  const query = useUrlQuery();
  const [redirectTo, setRedirectTo] = useState<string | undefined>()
  const history = useHistory();
  const hasToken = useAuthTokenCheck();
  const logout = useLogout();
  const loggedInUser = useSelector((state: RootState) => state.user.currentUser.account.accountId);

  const { t } = useTranslation(["linkresolvers"]);
  const accessToken = useSelector((state: RootState) => state.app.auth?.accessToken);
  const persistState = useSelector((state: RootState) => state.app.persistState);

  const [loginData, setLoginData] = useState({ accountId: '', verificationCode: '' });
  const [loading, setLoading] = useState(false);
  const [loginInitiated, setLoginInitiated] = useState(false);

  useEffect(() => {
    const token = query.get("token");
    const redirect = query.get("redirect");
    if (redirect !== null) {
      setRedirectTo(redirect);
    } else {
      setRedirectTo(undefined);
    }
    const replaceUrl = LinkResolverPaths.StudyLogin;

    validateToken(token).then(
      stayOnPage => {
        if (stayOnPage) {
          history.replace(replaceUrl);
        }
      }
    );
  }, []);

  const isRedirectToDefined = useCallback((): boolean => {
    return redirectTo !== undefined && redirectTo.length > 0;
  }, [redirectTo])

  useEffect(() => {
    if (loginInitiated && loggedInUser.length > 0 && isRedirectToDefined()) {
      history.replace(redirectTo as string)
    }
  }, [loginInitiated, loggedInUser, history, redirectTo, isRedirectToDefined])

  const validateToken = async (token: string | null): Promise<boolean> => {
    if (!token) {
      return true;
    }

    setLoading(true);
    try {
      const response = await autoValidateTemporaryTokenReq(token, accessToken ? accessToken : '');
      if (response.status === 200) {
        if (hasToken) {
          if (loggedInUser !== response.data.accountId) {
            logout(true);
          } else if (response.data.isSameUser) {
            let navTo = props.defaultRoutes.studyPage ? props.defaultRoutes.studyPage : props.defaultRoutes.auth;
            if (isRedirectToDefined()) {
              navTo = redirectTo as string;
            }
            history.replace(navTo);
            return false;
          } else {
            logout(true);
          }
        }
      }
      setLoginData({
        accountId: response.data.accountId,
        verificationCode: response.data.verificationCode,
      });
    } catch (e) {
      console.error(getErrorMsg(e))
    } finally {
      setLoading(false);
    }
    return true;
  };

  const resolvedContent = () => <div style={{ width: 450 }}>
    <LoginCard
      title={t(`${translationRootKey}.content.cardTitle`)}
      infoText={t(`${translationRootKey}.content.info`)}
      emailInputLabel={t(`${translationRootKey}.content.emailInputLabel`)}
      emailInputPlaceholder={t(`${translationRootKey}.content.emailInputPlaceholder`)}
      passwordInputLabel={t(`${translationRootKey}.content.passwordInputLabel`)}
      passwordInputPlaceholder={t(`${translationRootKey}.content.passwordInputPlaceholder`)}
      rememberMeLabel={t(`${translationRootKey}.content.rememberMeLabel`)}
      loginBtn={t(`${translationRootKey}.content.btn`)}
      passwordForgottenBtn={t(`${translationRootKey}.content.passwordForgottenBtn`)}
      signupBtn={t(`${translationRootKey}.content.signupBtn`)}
      fixEmailValue={loginData.accountId}
      persistState={persistState}
      onChangePersistState={(checked) => dispatch(setPersistState(checked))}
      onOpenDialog={(dialog) => {
        dispatch(dialogActions.openDialogWithoutPayload({ type: dialog }));
      }}
      onSubmit={(email, password, rememberMe) => {
        setLoginInitiated(true);
        dispatch(dialogActions.openLoginDialog(
          {
            type: 'login',
            payload: {
              email: email,
              password: password,
              verificationCode: loginData.verificationCode,
              rememberMe: rememberMe,
              preventNavigateOnSuccess: isRedirectToDefined(),
            }
          }
        ));
      }}
    />
  </div>

  const loadingContent = <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }} role="status">
    <span className="visually-hidden">Loading...</span>
  </div>

  return (
    <React.Fragment>
      <TitleBar
        content={t(`${translationRootKey}.title`)}
      />
      <div className={containerClassName}>
        <div className="d-flex align-items-center my-3 justify-content-center h-100" style={{ minHeight: '60vh' }}>
          {loading ? loadingContent : resolvedContent()}
        </div>
      </div>
    </React.Fragment>
  );
};

export default StudyLogin;
