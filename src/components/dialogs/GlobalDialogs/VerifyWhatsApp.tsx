import React, { FC, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { RootState } from '../../../store/rootReducer';
import { dialogActions, VerifyWhatsAppDialog } from '../../../store/dialogSlice';
import { userActions } from '../../../store/userSlice';
import { verifyWhatsAppCodeReq, getUserReq } from '../../../api/userAPI';
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
  const [error, setError] = useState('');
  const [verificationCode, setVerificationCode] = useState('');

  const phoneNumber = dialogContent?.phoneNumber || '';

  const close = () => {
    dispatch(dialogActions.closeDialog());
    setVerificationCode('');
    setError('');
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
      <div className={defaultDialogPaddingXClass}>
        <div className="mb-3">
          <p>{t('verifyWhatsApp.description', { phoneNumber })}</p>
        </div>

        {error && (
          <AlertBox
            type="danger"
            content={error}
            className="mb-3"
          />
        )}

        <TextField
          id="verification-code"
          name="verificationCode"
          label={t('verifyWhatsApp.form.verificationCode.label')}
          placeholder={t('verifyWhatsApp.form.verificationCode.placeholder')}
          value={verificationCode}
          onChange={(event) => setVerificationCode(event.target.value)}
          maxLength={6}
          autoComplete="off"
        />
      </div>

      <div className="d-flex justify-content-end gap-2 p-3">
        <DialogBtn
          type="button"
          onClick={close}
          label={t('buttons.cancel')}
          disabled={loading}
        />
        <DialogBtn
          type="button"
          onClick={verifyCode}
          color="primary"
          label={t('verifyWhatsApp.form.submit')}
          loading={loading}
          disabled={!verificationCode.trim()}
        />
      </div>
    </Dialog>
  );
};

export default VerifyWhatsApp;
