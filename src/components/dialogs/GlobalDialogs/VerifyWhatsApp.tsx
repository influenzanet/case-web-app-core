import React, { FC, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { RootState } from '../../../store/rootReducer';
import { dialogActions, VerifyWhatsAppDialog } from '../../../store/dialogSlice';
import { userActions } from '../../../store/userSlice';
import { verifyWhatsAppCodeReq, getUserReq, deletePhoneReq, newAccountPhoneReq } from '../../../api/userAPI';
import { renewToken } from '../../../api/instances/authenticatedApi';
import {
  DialogBtn,
  AlertBox,
  TextField,
  defaultDialogPaddingXClass,
  Dialog,
} from '@influenzanet/case-web-ui';

const VerifyWhatsApp: FC = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation(['dialogs']);

  const dialogState = useSelector((state: RootState) => state.dialog);
  const open = dialogState.config?.type === 'verifyWhatsApp';
  const dialogContent = open ? (dialogState.config as VerifyWhatsAppDialog).payload : undefined;

  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState('');
  const [verificationCode, setVerificationCode] = useState('');

  const phoneNumber = dialogContent?.phoneNumber || '';

  // Reset verification code when dialog opens
  useEffect(() => {
    if (open) {
      setVerificationCode('');
      setError('');
    }
  }, [open]);

  const close = () => {
    dispatch(dialogActions.closeDialog());
    setVerificationCode('');
    setError('');
  };

  const resendCode = async () => {
    setResendLoading(true);
    setError('');
    try {
      // First delete existing phone number
      await deletePhoneReq();
      // Then re-add it (this will send the WhatsApp code)
      await newAccountPhoneReq(phoneNumber);
      setError('');
    } catch (e: unknown) {
      console.error(e);
      const errorResponse = e as { response?: { data?: { error?: string } } };
      setError(errorResponse.response?.data?.error || t('verifyWhatsApp.errors.unknown'));
    } finally {
      setResendLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!verificationCode.trim()) {
      setError(t('verifyWhatsApp.errors.codeRequired'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await verifyWhatsAppCodeReq(verificationCode);
      if (response.status === 200) {
        renewToken();
        if (response.data) {
          dispatch(userActions.setUser(response.data));
        } else {
          const userData = (await getUserReq()).data;
          dispatch(userActions.setUser(userData));
        }

        // Show success message
        dispatch(dialogActions.openAlertDialog({
          type: 'alertDialog',
          payload: {
            color: 'success',
            title: t('verifyWhatsApp.successDialog.title'),
            content: t('verifyWhatsApp.successDialog.content'),
            btn: t('verifyWhatsApp.successDialog.btn'),
          }
        }));
      }
    } catch (e: unknown) {
      console.error(e);
      const errorResponse = e as { response?: { data?: { error?: string } } };
      setError(errorResponse.response?.data?.error || t('verifyWhatsApp.errors.verificationFailed'));
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return null;
  }

  return (
    <Dialog
      open={open}
      title={t('verifyWhatsApp.title')}
      ariaLabelledBy="verify-whatsapp-title"
      onClose={close}
      size="sm"
    >
      <div className={`${defaultDialogPaddingXClass} py-3`}>
        <div className="mb-3">
          <p className="mb-2 small">{t("verifyWhatsApp.info")}</p>
        </div>

        {error && (
          <AlertBox
            type="danger"
            content={error}
            className="mb-3"
          />
        )}

        <div className="mb-3">
          <TextField
            id="verification-code"
            name="verificationCode"
            label={t('verifyWhatsApp.codeInputLabel')}
            placeholder={t('verifyWhatsApp.codeInputPlaceholder')}
            value={verificationCode}
            onChange={(event) => setVerificationCode(event.target.value)}
            maxLength={6}
            autoComplete="off"
          />
        </div>
      </div>

      <div className="d-flex justify-content-between align-items-center gap-2 p-3 border-top">
        <DialogBtn
          type="button"
          onClick={resendCode}
          label={t('verifyWhatsApp.resendBtn')}
          loading={resendLoading}
          disabled={loading || !phoneNumber}
          className="btn-sm"
        />
        <div className="d-flex gap-2">
          <DialogBtn
            type="button"
            onClick={close}
            label={t('verifyWhatsApp.cancelBtn')}
            disabled={loading || resendLoading}
            className="btn-sm"
          />
          <DialogBtn
            type="button"
            onClick={verifyCode}
            color="primary"
            label={t('verifyWhatsApp.submitBtn')}
            loading={loading}
            disabled={!verificationCode.trim() || resendLoading}
            className="btn-sm"
          />
        </div>
      </div>
    </Dialog>
  );
};

export default VerifyWhatsApp;
