import React, { useState, useEffect } from 'react';

import { blurEmail } from '../../utils/blurEmail';
import { blurPhone } from '../../utils/blurPhone';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from "../../store/rootReducer";
import { useTranslation } from 'react-i18next';
import { EditBtn } from '@influenzanet/case-web-ui';
import { dialogActions } from '../../store/dialogSlice';
import { userActions } from '../../store/userSlice';
import { useIsAuthenticated } from '../../hooks/useIsAuthenticated';
import { PhoneContactInfo } from '../../api/types/user';
import { resendWhatsAppCodeReq, getUserReq } from '../../api/userAPI';
import { classifyPhoneError, logRequestFailure } from "../../api/errorMessages";
import { useResendCooldown } from '../../hooks/useResendCooldown';


interface AccountSettingsProps {
  itemKey: string;
  hideProfileSettings?: boolean;
}

const AccountSettings: React.FC<AccountSettingsProps> = (props) => {
  const { t } = useTranslation(['settings']);
  const isAuth = useIsAuthenticated();
  const dispatch = useDispatch();
  const currentUser = useSelector((state: RootState) => state.user.currentUser);
  const dialogState = useSelector((state: RootState) => state.dialog);
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const { secondsLeft: resendSecondsLeft, isCoolingDown: resendOnCooldown, start: startResendCooldown } = useResendCooldown();

  const phoneInfo = currentUser?.contactInfos.find(
    (info): info is PhoneContactInfo => info.type === 'phone'
  );

  // Clear success message when phone is verified
  useEffect(() => {
    if (phoneInfo && phoneInfo.confirmedAt && phoneInfo.confirmedAt > 0) {
      setResendMessage(null);
    }
  }, [phoneInfo]);

  // Clear success message when dialog closes
  useEffect(() => {
    if (dialogState.config === undefined && resendMessage?.type === 'success') {
      setResendMessage(null);
    }
  }, [dialogState.config, resendMessage?.type]);

  if (!isAuth) {
    return <div className="bg-warning-light p-3">
      {'authentication needed'}
    </div>
  }

  // The backend considers the number verified, so the account this page is showing is the one
  // that is out of date: reloading it puts the verified badge in place of the resend button,
  // which is the whole answer. Only when that reload fails does the page still show the number
  // as unverified, and then the message is the only thing telling the participant why no code
  // is coming.
  const handleAlreadyVerified = async () => {
    try {
      const userData = (await getUserReq()).data;
      dispatch(userActions.setUser(userData));
      return;
    } catch (refreshError) {
      logRequestFailure('reloading the user after the phone was already verified', refreshError);
    }
    setResendMessage({
      type: 'error',
      text: t(`${props.itemKey}.phone.alreadyVerifiedError`, 'This number is already verified.')
    });
  };

  const handleResendCode = async () => {
    setIsResending(true);
    setResendMessage(null);
    try {
      await resendWhatsAppCodeReq();

      // Use requestAnimationFrame to wait for React to finish rendering
      requestAnimationFrame(() => {
        dispatch(dialogActions.openVerifyWhatsAppDialog({
          type: 'verifyWhatsApp',
          payload: {
            phoneNumber: phoneInfo?.phone || '',
          }
        }));
      });

      setResendMessage({
        type: 'success',
        text: t(`${props.itemKey}.phone.resendSuccess`, 'Code sent.')
      });
      startResendCooldown();
    } catch (error) {
      logRequestFailure("resending the WhatsApp code", error);
      switch (classifyPhoneError(error)) {
        case 'recipientNotAllowed':
          setResendMessage({
            type: 'error',
            text: t(`${props.itemKey}.phone.recipientNotAllowedError`, 'This number cannot receive WhatsApp messages. Please check the number you entered.')
          });
          break;
        case 'rateLimited':
          setResendMessage({
            type: 'error',
            text: t(`${props.itemKey}.phone.rateLimitError`, 'Too many verification codes requested. Please try again later.')
          });
          break;
        case 'noPendingVerification':
          setResendMessage({
            type: 'error',
            text: t(`${props.itemKey}.phone.noPendingVerificationError`, 'There is no verification waiting for this number. Add the number again to start over.')
          });
          break;
        case 'cooldown':
          setResendMessage({
            type: 'error',
            text: t(`${props.itemKey}.phone.cooldownError`, 'A code was just sent. Please wait a moment before asking for another one.')
          });
          // The window left is at most a full one, so holding the button for that long keeps
          // the participant from walking into the same refusal a second time.
          startResendCooldown();
          break;
        case 'sendFailed':
          // The code never reached Meta, so nothing is on its way and another request is what
          // the participant has to make.
          setResendMessage({
            type: 'error',
            text: t(`${props.itemKey}.phone.sendFailedError`, 'We could not send the code. Please ask for a new one.')
          });
          break;
        case 'whatsAppUnavailable':
          // No code can go out until the instance is configured again, so a retry would only
          // spend the participant's patience.
          setResendMessage({
            type: 'error',
            text: t(`${props.itemKey}.phone.whatsAppUnavailableError`, 'WhatsApp messages cannot be sent at the moment. Please try again later.')
          });
          break;
        case 'alreadyVerified':
          await handleAlreadyVerified();
          break;
        default:
          setResendMessage({
            type: 'error',
            text: t(`${props.itemKey}.phone.resendError`, 'Could not send the code. Please try again.')
          });
          break;
      }
    } finally {
      setIsResending(false);
    }
  };

  const renderProfileSettings = () => {
    if (props.hideProfileSettings === true) {
      return null;
    }

    return <React.Fragment>
      <h4 className="fw-bold mt-2">
        {t(`${props.itemKey}.profiles.title`)}
      </h4>
      <p className="mb-1 text-grey-7">
        {t(`${props.itemKey}.profiles.info`)}
      </p>
      <EditBtn
        onClick={() => dispatch(dialogActions.openDialogWithoutPayload({ type: 'manageProfiles' }))}
      >
        {t(`${props.itemKey}.profiles.btn`, { count: currentUser.profiles.length })}
      </EditBtn>
    </React.Fragment>
  }

  return (
    <div className="border-primary border-top-2 pt-2">
      <h2>
        {t(`${props.itemKey}.title`)}
      </h2>

      {/** email */}
      <h4 className="fw-bold mt-2">
        {t(`${props.itemKey}.email.title`)}
      </h4>
      <p className="mb-1 text-grey-7">
        {t(`${props.itemKey}.email.info`)}
      </p>
      <EditBtn
        onClick={() => dispatch(dialogActions.openDialogWithoutPayload({ type: 'changeEmail' }))}
      >
        {blurEmail(currentUser.account.accountId)}
      </EditBtn>

      {/** phone */}
      <div className="d-flex align-items-center mt-2">
        <h4 className="fw-bold mb-0">
          {t(`${props.itemKey}.phone.title`)}
        </h4>
        {phoneInfo && (phoneInfo.confirmedAt === undefined || !phoneInfo.confirmedAt || phoneInfo.confirmedAt === 0) && (
          <span className="badge bg-warning text-dark ms-2">
            {t(`${props.itemKey}.phone.notConfirmed`)}
          </span>
        )}
        {phoneInfo && phoneInfo.confirmedAt && phoneInfo.confirmedAt > 0 && (
          <span className="badge bg-success ms-2">
            <i className="fas fa-check me-1"></i>
            {t(`${props.itemKey}.phone.confirmed`)}
          </span>
        )}
      </div>
      {phoneInfo ? (
        <p className="mb-1 text-grey-7">
          {t(`${props.itemKey}.phone.info`)}
        </p>) : (
        <p className="mb-1 text-grey-7">
          {t(`${props.itemKey}.phone.infoAdd`)}
        </p>
      )}
      <div className="m-0 d-flex align-items-center py-2">
        {phoneInfo ? (
          <>
            <EditBtn
              onClick={() => dispatch(dialogActions.openDialogWithoutPayload({ type: 'changePhone' }))}
            >
              {blurPhone(phoneInfo.phone)}
            </EditBtn>
            {(phoneInfo.confirmedAt === undefined || !phoneInfo.confirmedAt || phoneInfo.confirmedAt === 0) && (
              <button
                className="btn btn-primary d-flex align-items-center ms-2"
                onClick={handleResendCode}
                disabled={isResending || resendOnCooldown}
              >
                {isResending ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    {t(`${props.itemKey}.phone.resending`, 'Sending...')}
                  </>
                ) : resendOnCooldown ? (
                  <>
                    {t(`${props.itemKey}.phone.resendCountdown`, 'New code in {{seconds}}s', { seconds: resendSecondsLeft })}
                  </>
                ) : (
                  <>
                    {t(`${props.itemKey}.phone.resendBtn`, 'Send the code again')}
                    <span className="material-icons ms-1" style={{ fontSize: 'inherit' }}>send</span>
                  </>
                )}
              </button>
            )}
          </>
        ) : (
          <EditBtn
            onClick={() => dispatch(dialogActions.openDialogWithoutPayload({ type: 'addPhone' }))}
          >
            {t(`${props.itemKey}.phone.btn`)}
          </EditBtn>
        )}

        {phoneInfo && (
          <button
            className="btn btn-danger-light ms-2"
            // The button shows a trash glyph and no text, so the name it is announced with has
            // to be spelled out here.
            aria-label={t(`${props.itemKey}.phone.deleteBtn`)}
            onClick={() => {
              dispatch(dialogActions.openDialogWithoutPayload({ type: 'deletePhone' }))
            }}
          >
            <i className="fas fa-trash text-grey-5"></i>
          </button>
        )}
      </div>
      {resendMessage && (
        <div className={`alert alert-${resendMessage.type === 'success' ? 'success' : 'danger'} mt-2`}>
          {resendMessage.text}
        </div>
      )}


      {/** password */}
      <h4 className="fw-bold mt-2">
        {t(`${props.itemKey}.password.title`)}
      </h4>
      <p className="mb-1 text-grey-7">
        {t(`${props.itemKey}.password.info`)}
      </p>
      <EditBtn
        onClick={() => dispatch(dialogActions.openDialogWithoutPayload({ type: 'changePassword' }))}
      >
        {"••••••••••••••"}
      </EditBtn>

      {renderProfileSettings()}
    </div>
  );
};

export default AccountSettings;
