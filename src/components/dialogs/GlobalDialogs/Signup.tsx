import React, { useEffect, useRef, useState } from 'react';
import {
  Dialog,
  defaultDialogPaddingXClass,
  Checkbox,
  DialogBtn,
  TextLink,
  AlertBox,
  TextField,
  ConsentDialog,
} from '@influenzanet/case-web-ui';
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../../../store/rootReducer';
import { dialogActions } from '../../../store/dialogSlice';
import clsx from 'clsx';
import { useTranslatedMarkdown } from '../../../hooks/useTranslatedMarkdown';
import { Trans, useTranslation } from 'react-i18next';
import { checkPasswordRules } from '../../../utils/passwordRules';

import ReCAPTCHA from 'react-google-recaptcha';
import { useLogout } from '../../../hooks/useLogout';
import { signupWithEmailRequest } from '../../../api/authAPI';
import { minuteToMillisecondFactor } from '../../../constants';
import { useSetAuthState } from '../../../hooks/useSetAuthState';
import { setAppAuth } from '../../../store/appSlice';
import { setDefaultAccessTokenHeader } from '../../../api/instances/authenticatedApi';
import { userActions } from '../../../store/userSlice';
import { getErrorMsg } from '../../../api/utils';
import { parseBooleanFlag } from '../../../utils/parseBooleanFlag';

const marginBottomClass = "mb-2";

interface SignupFormData {
  email: string;
  password: string;
  confirmPassword: string;
  infoCheck: string;
  captchaToken?: string;
}

interface SignupFormProps {
  isLoading?: boolean;
  initialSignupData?: SignupFormData;
  onSubmit: (data: SignupFormData) => void;
  onOpenDialog: (dialog: 'login') => void;
  error?: string;
  clearError: () => void;
}

const emailFormatRegexp = new RegExp(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);

const checkEmailFormat = (email: string): boolean => {
  return emailFormatRegexp.test(email);
}

const signUpInfoCheckStyle: React.CSSProperties = {
  position: 'absolute',
  opacity: 0,
  top: 0,
  left: 0,
  width: 0,
  height: 0,
  zIndex: -2,
}

type DialogSize = 'sm' | 'lg' | 'xl';

const consentDialogSize = (): DialogSize | undefined => {
  const s = process.env.REACT_APP_CONSENT_DIALOG_WIDTH ?? undefined;
  if(s === 'sm' || s === 'lg' || s === 'xl') {
    return s;
  }
  return undefined;
}

const use2FA = parseBooleanFlag(process.env.REACT_APP_USE_2FA_SIGNUP, true, false);

const SignupForm: React.FC<SignupFormProps> = (props) => {
  const { t, i18n } = useTranslation(['dialogs']);
  const [signupData, setSignupData] = useState(props.initialSignupData ? props.initialSignupData : {
    email: '',
    password: '',
    confirmPassword: '',
    infoCheck: '',
  });

  const privacyConsentText = useTranslatedMarkdown('consent/privacy.md');
  const recaptchaConsentText = useTranslatedMarkdown('consent/recaptcha.md');

  const [openPrivacyConsent, setOpenPrivacyConsent] = useState(false);
  const [openRecaptchaConsent, setOpenRecaptchaConsent] = useState(false);

  const [acceptedPrivacyPolicy, setAcceptedPrivacyPolicy] = useState(false);
  const [reCaptchaAccepted, setReCaptchaAccepted] = useState(false);

  const [showEmailError, setShowEmailError] = useState(false);
  const [showPasswordError, setShowPasswordError] = useState(false);
  const [showConfirmPasswordError, setShowConfirmPasswordError] = useState(false);

  const reCaptchaSiteKey = process.env.REACT_APP_RECAPTCHA_SITEKEY ? process.env.REACT_APP_RECAPTCHA_SITEKEY : '';
  const useRecaptcha = process.env.REACT_APP_USE_RECAPTCHA === 'true';

  const recaptchaRef = useRef<ReCAPTCHA>(null);

  useEffect(() => {
    setSignupData(props.initialSignupData ? props.initialSignupData : {
      email: '',
      password: '',
      confirmPassword: '',
      infoCheck: '',
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.initialSignupData])

  const passwordsMatch = () => {
    return signupData.password === signupData.confirmPassword;
  }

  const isDisabled = (): boolean => {
    const emailOk = checkEmailFormat(signupData.email);
    const passwordRuleOk = checkPasswordRules(signupData.password);
    return !(!props.isLoading && (!useRecaptcha || reCaptchaAccepted) && acceptedPrivacyPolicy && emailOk && passwordRuleOk && passwordsMatch());
  }

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (useRecaptcha && !recaptchaRef.current) {
      console.error('issue with recaptcha');
      // props.onFormError('issue with recaptcha');
      return;
    }

    try {
      let reCaptchaToken = '';
      if (useRecaptcha) {
        recaptchaRef.current?.reset();
        const captchaResponse = await recaptchaRef.current?.executeAsync();
        reCaptchaToken = captchaResponse ? captchaResponse : '';
      }
      props.onSubmit({ ...signupData, captchaToken: reCaptchaToken });
    } catch (err) {
      // props.onFormError("unexpected error with recaptcha");
    }
  }

  const infoText: string = t('signup.info');
  const emailInputLabel = t('signup.emailInputLabel');
  const emailInputPlaceholder = t('signup.emailInputPlaceholder');
  const passwordInputLabel = t('signup.passwordInputLabel');
  const passwordInputPlaceholder = t('signup.passwordInputPlaceholder');
  const confirmPasswordInputLabel = t('signup.confirmPasswordInputLabel');
  const confirmPasswordPlaceholder = t('signup.confirmPasswordInputLabel');

  const dialogSize = consentDialogSize();
  return (
    <React.Fragment>
      {infoText && infoText.length > 0 ?
        <AlertBox
          type="info"
          className={marginBottomClass}
          content={infoText}
        /> : null}
      {
        useRecaptcha && reCaptchaAccepted ? <div>
          {reCaptchaSiteKey ?
            <ReCAPTCHA
              sitekey={reCaptchaSiteKey}
              size="invisible"
              hl={i18n.language}
              ref={recaptchaRef}
            />
            : null}
        </div> : null
      }
      <form onSubmit={submit}>
        <TextField
          id="signupEmail"
          label={emailInputLabel}
          placeholder={emailInputPlaceholder}
          type="email"
          name="email"
          autoComplete="off"
          className={marginBottomClass}
          value={signupData.email}
          required={true}
          hasError={!checkEmailFormat(signupData.email) && showEmailError}
          errorMsg={t("dialogs:signup.errors.emailRules")}
          onBlur={() => {
            setShowEmailError(true)
          }}
          onChange={(event) => {
            const value = event.target.value;
            setSignupData(prev => { return { ...prev, email: value } })
          }}
        />
        <TextField
          id="signupPW"
          label={passwordInputLabel}
          placeholder={passwordInputPlaceholder}
          type="password"
          name="new-password"
          autoComplete="new-password"
          className={marginBottomClass}
          value={signupData.password}
          required={true}
          hasError={!checkPasswordRules(signupData.password) && showPasswordError}
          errorMsg={t("dialogs:signup.errors.passwordRules")}
          onBlur={() => {
            setShowPasswordError(true)
          }}
          onChange={(event) => {
            const value = event.target.value;
            setSignupData(prev => { return { ...prev, password: value } })
          }}
        />
        <TextField
          id="signupConfirmPw"
          label={confirmPasswordInputLabel}
          placeholder={confirmPasswordPlaceholder}
          type="password"
          name="confirmPassword"
          className={marginBottomClass}
          value={signupData.confirmPassword}
          required={true}
          errorMsg={t("dialogs:signup.errors.passwordMatch")}
          hasError={!passwordsMatch() && showConfirmPasswordError}
          onBlur={() => {
            setShowConfirmPasswordError(true)
          }}
          onChange={(event) => {
            const value = event.target.value;
            setSignupData(prev => { return { ...prev, confirmPassword: value } })
          }}
        />

        {/* additional input to check signup validity --> */}
        <label style={signUpInfoCheckStyle} aria-hidden="true" htmlFor='name'></label>
        <input
          style={signUpInfoCheckStyle}
          type="text"
          id="name"
          name="name"
          value={signupData.infoCheck}
          tabIndex={-1}
          autoComplete='off'
          onChange={(event) => {
            const value = event.target.value;
            setSignupData(prev => { return { ...prev, infoCheck: value } })
          }}
        ></input>
        {/* <-- additional input to check signup validity */}

        <Checkbox
          className={marginBottomClass}
          id="acceptPrivacyConsent"
          name="privacyConsent"
          checked={acceptedPrivacyPolicy}
          onClick={() => {
            if (!acceptedPrivacyPolicy) {
              setOpenPrivacyConsent(true);
            }
          }}
          onChange={(checked) => {
            if (!checked) {
              setAcceptedPrivacyPolicy(checked);
            }
          }}
        >
          <Trans t={t} i18nKey="signup.informedConsentCheckbox">
            {'...'}<span
              onClick={() => setOpenPrivacyConsent(true)}
              className="text-primary text-decoration-none">{'...'}</span>{'...'}
          </Trans>
        </Checkbox>

        {useRecaptcha ?
          <Checkbox
            className={marginBottomClass}
            id="recaptchaConsent"
            name="recaptchaConsent"
            checked={reCaptchaAccepted}
            onClick={() => {
              if (!reCaptchaAccepted) {
                setOpenRecaptchaConsent(true);
              }
            }}
            onChange={(checked) => {
              if (!checked) {
                setReCaptchaAccepted(checked);
              }
            }}
          >
            <Trans t={t} i18nKey="signup.reCaptchaCookieCheckbox">
              {'...'}<span
                onClick={() => setOpenRecaptchaConsent(true)}
                className="text-primary text-decoration-none">{'...'}</span>{'...'}
            </Trans>
          </Checkbox> : null}

        <AlertBox
          className={marginBottomClass}
          hide={!props.error}
          content={props.error ? props.error : ''}
          type="danger"
          useIcon={true}
          iconSize="2rem"
          closable={true}
          onClose={() => props.clearError()}
        />

        <DialogBtn
          className={marginBottomClass}
          type="submit"
          label={t('signup.signupBtn')}
          disabled={isDisabled()}
          loading={props.isLoading}
          loadingLabel={t('loadingMsg')}
        />

        <div className={marginBottomClass}>
          <button
            type="button"
            className="btn btn-link p-0 text-decoration-none text-start text-uppercase"
            onClick={(event) => {
              event.preventDefault();
              props.onOpenDialog('login');
            }}
          >{t('signup.loginLink')}</button>
        </div>


        {useRecaptcha ?
          <React.Fragment>
            <div className="mt-2 captcha-badge-alt">
              <Trans t={t} i18nKey="signup.reCaptchaLinks">
                {'...'}
                <TextLink
                  href="https://policies.google.com/privacy"
                  style={{ textDecoration: 'none' }}
                >
                  {'Privacy link'}
                </TextLink>
                {'and'}
                <TextLink
                  href="https://policies.google.com/terms"
                  style={{ textDecoration: 'none' }}
                >
                  {'Terms of Service'}
                </TextLink>
                {'...'}
              </Trans>
            </div>
          </React.Fragment> : null}

      </form>
      <ConsentDialog
        size={dialogSize}
        open={openPrivacyConsent}
        title={t("privacyConsent.title")}
        content={privacyConsentText.content}
        cancelBtn={t("privacyConsent.cancelBtn")}
        acceptBtn={t("privacyConsent.acceptBtn")}
        onCancelled={() => {
          setAcceptedPrivacyPolicy(false)
          setOpenPrivacyConsent(false)
        }}
        onConfirmed={() => {
          setAcceptedPrivacyPolicy(true)
          setOpenPrivacyConsent(false)
        }}
      />
      <ConsentDialog
        size={dialogSize}
        open={openRecaptchaConsent}
        title={t("recaptchaConsent.title")}
        content={recaptchaConsentText.content}
        cancelBtn={t("recaptchaConsent.cancelBtn")}
        acceptBtn={t("recaptchaConsent.acceptBtn")}
        onCancelled={() => {
          setReCaptchaAccepted(false)
          setOpenRecaptchaConsent(false)
        }}
        onConfirmed={() => {
          setReCaptchaAccepted(true)
          setOpenRecaptchaConsent(false)
        }}
      />
    </React.Fragment>
  )
}

const Signup: React.FC = () => {
  const { t, i18n } = useTranslation(['dialogs']);

  const instanceId = useSelector((state: RootState) => state.config.instanceId);
  const dialogState = useSelector((state: RootState) => state.dialog)
  const open = dialogState.config?.type === 'signup';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const dispatch = useDispatch();
  const setAuthState = useSetAuthState();
  const logout = useLogout();


  const handleClose = () => {
    setError('')
    setLoading(false)
    dispatch(dialogActions.closeDialog())
  }

  const closeWithSuccess = () => {
    setError('')
    setLoading(false)
    if (dialogState.config?.origin !== 'surveyFlow') {
      dispatch(dialogActions.openDialogWithoutPayload({ type: 'signupSuccess', origin: dialogState.config?.origin }));
    } else {
      dispatch(dialogActions.closeDialog())
    }

  }


  const handleSignup = async (data: SignupFormData) => {
    if (loading) return;
    logout(true);
    try {
      setLoading(true);

      const response = await signupWithEmailRequest({
        email: data.email,
        password: data.password,
        infoCheck: data.infoCheck,
        instanceId: instanceId,
        preferredLanguage: i18n.language,
        wantsNewsletter: true,
        use2fa: use2FA
      }, data.captchaToken);

      // TODO: update user correctly
      setAuthState(response.data, {
        id: '',
        account: {
          type: 'email',
          accountId: data.email,
          accountConfirmedAt: 0,
          preferredLanguage: "en",
        },
        roles: [],
        contactPreferences: { subscribedToNewsletter: false, sendNewsletterTo: [], subscribedToWeekly: true, receiveWeeklyMessageDayOfWeek: 0 },
        contactInfos: [],
        profiles: response.data.profiles,
        timestamps: {
          createdAt: 0,
          updatedAt: 0,
          lastLogin: 0,
          lastTokenRefresh: 0,
        },
      })
      let tokenRefreshedAt = new Date().getTime();

      dispatch(setAppAuth({
        accessToken: response.data.accessToken,
        refreshToken: response.data.refreshToken,
        expiresAt: tokenRefreshedAt + response.data.expiresIn * minuteToMillisecondFactor,
      }));

      setDefaultAccessTokenHeader(response.data.accessToken);

      dispatch(userActions.setFromTokenResponse(response.data));
      setLoading(false);
      closeWithSuccess();
    } catch (e: any) {
      console.log(e.response);
      if (!e.response) {
        handleError('request failed');
      } else if (e.response.status === 404) {
        handleError('not found');
      } else {
        const errMsg = getErrorMsg(e);
        handleError(errMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleError = (error?: string) => {
    switch (error) {
      case 'email not valid':
        setError(t("dialogs:signup.errors.invalidEmail"));
        break;
      case 'user creation failed':
        setError(t("dialogs:signup.errors.userCreationFailed"));
        break;
      case 'not found':
        setError(t("dialogs:signup.errors.noRegistrationAllowed"));
        break;
      default:
        setError(t("dialogs:signup.errors.unknown"));
        break;
    }

  }

  return (
    <Dialog
      open={open}
      title={t('signup.title')}
      onClose={handleClose}
      ariaLabelledBy="signupDialogTitle"
    >
      <div className={clsx(
        defaultDialogPaddingXClass,
        'py-3',
        'bg-grey-1'
      )}>
        <SignupForm
          isLoading={loading}
          onSubmit={(data) => handleSignup(data)}
          onOpenDialog={(dialog) => dispatch(dialogActions.openDialogWithoutPayload({ type: dialog, origin: dialogState.config?.origin }))}
          error={error}
          clearError={() => setError('')}
        />
      </div>
    </Dialog>
  );
};

export default Signup;
