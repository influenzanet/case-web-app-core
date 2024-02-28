import clsx from 'clsx';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { getUserReq, resendVerificationEmailReq } from '../../../api/userAPI';
import { getErrorMsg } from '../../../api/utils';
import { dialogActions } from '../../../store/dialogSlice';
import { RootState } from '../../../store/rootReducer';
import {
  DialogBtn,
  AlertBox,
  defaultDialogPaddingXClass,
  Dialog,
} from '@influenzanet/case-web-ui';
import { userActions } from '../../../store/userSlice';
import { renewToken } from '../../../api/instances/authenticatedApi';


const SignupSuccess: React.FC = () => {
  const { t } = useTranslation(['dialogs']);

  const dispatch = useDispatch();
  const dialogState = useSelector((state: RootState) => state.dialog)
  const open = dialogState.config?.type === 'signupSuccess';

  const emailAddress = useSelector((state: RootState) => state.user.currentUser.account.accountId);

  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [btnEnabled, setBtnEnabled] = useState(false);
  const [error, setError] = useState('');
  const [error2, setError2] = useState('');

  useEffect(() => {
    if (!btnEnabled) {
      setTimeout(() => {
        setBtnEnabled(true);
      }, 20000);
    }
  }, [btnEnabled])

  useEffect(() => {
    if (open) {
      setBtnEnabled(false);
    }
  }, [open]);

  const resendActivation = async () => {
    if (loading) return;
    setLoading(true);
    try {
      let response = await resendVerificationEmailReq(emailAddress);
      if (response.status === 200) {
        setEmailSent(true);
      }
    } catch (e) {
      const errMsg = getErrorMsg(e);
      console.error(errMsg);
      handleError(errMsg);
    }
    setLoading(false);
  }

  const handleError = (err: string) => {
    setError(t('dialogs:signupSuccess.errors.unknown'));
  }

  const onResendClicked = () => {
    setBtnEnabled(false);
    resendActivation();
  }

  const onReloadUser = async () => {
    try {
      setLoading(true)

      const user = (await getUserReq()).data;
      if (user.account.accountConfirmedAt > 0) {

        /*
        *  In case the account was confirmed, set the freshly acquired user state **after** renewing the token.
        *  This is done in order to avoid race conditions with other components that depend on the user state.
        *  Differently, those components might fail performing api requests since they would be using a weaker token.
        */
        await renewToken();
        dispatch(userActions.setUser(user));

        handleClose();
      } else {
        setError2(t('dialogs:signupSuccess.errors.verifyEmailFirst'));
      }

    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setError('');
    setError2('');
    setLoading(false);
    dispatch(dialogActions.closeDialog());
  }


  return (
    <Dialog
      open={open}
      title={t('signupSuccess.title')}
      onClose={handleClose}
      ariaLabelledBy="signupDialogTitle"
    >
      <div className={clsx(
        defaultDialogPaddingXClass,
        'py-3',
        'bg-grey-1'
      )}>
        <AlertBox
          className="mb-2"
          type="success"
          useIcon={false}
          content={t('signupSuccess.successMsg')}
        />
        <AlertBox
          className="mb-2"
          hide={!emailSent}
          type="success"
          useIcon={true}
          content={t('signupSuccess.emailSentMsg')}
        />
        <AlertBox
          className="mb-2"
          hide={!error}
          type="danger"
          useIcon={true}
          content={error}
          closable={true}
          onClose={() => setError('')}
        />
        <DialogBtn
          type="button"
          label={t('signupSuccess.resendVerificationEmailBtn')}
          disabled={loading || !btnEnabled}
          loading={loading}
          loadingLabel={t('loadingMsg')}
          onClick={onResendClicked}
        />
        <hr className='my-2' />
        <AlertBox
          type="info"
          useIcon={true}
          content={t('signupSuccess.msgForVerifiedAccount')}
        />
        <AlertBox
          className="mt-2"
          hide={!error2}
          type="danger"
          useIcon={true}
          content={error2}
          closable={true}
          onClose={() => setError2('')}
        />
        <DialogBtn
          type="button"
          className='d-block mt-2'
          label={t('signupSuccess.reloadUser')}
          disabled={loading}
          loading={loading}
          loadingLabel={t('loadingMsg')}
          onClick={onReloadUser}
        />
      </div>
    </Dialog>
  );
};

export default SignupSuccess;
