import React, { useState, useEffect } from 'react';

import { blurEmail } from '../../utils/blurEmail';
import { blurPhone } from '../../utils/blurPhone';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from "../../store/rootReducer";
import { useTranslation } from 'react-i18next';
import { EditBtn } from '@influenzanet/case-web-ui';
import { dialogActions } from '../../store/dialogSlice';
import { useIsAuthenticated } from '../../hooks/useIsAuthenticated';
import { PhoneContactInfo } from '../../api/types/user';
import { resendWhatsAppCodeReq } from '../../api/userAPI';


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

  console.log('phoneInfo:', phoneInfo);
  console.log('confirmedAt:', phoneInfo?.confirmedAt);

  const handleResendCode = async () => {
    setIsResending(true);
    setResendMessage(null);
    try {
      await resendWhatsAppCodeReq();
      console.log('Opening dialog with phone:', phoneInfo?.phone);

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
        text: t(`${props.itemKey}.phone.resendSuccess`, 'Codice inviato con successo!')
      });
    } catch (error) {
      console.error('Error resending WhatsApp code:', error);
      setResendMessage({
        type: 'error',
        text: t(`${props.itemKey}.phone.resendError`, 'Errore nell\'invio del codice. Riprova.')
      });
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
                disabled={isResending}
              >
                {isResending ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    {t(`${props.itemKey}.phone.resending`, 'Invio...')}
                  </>
                ) : (
                  <>
                    {t(`${props.itemKey}.phone.resendBtn`, 'Invia di nuovo codice')}
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
