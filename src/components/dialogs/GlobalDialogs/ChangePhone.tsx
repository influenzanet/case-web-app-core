import clsx from 'clsx';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { renewToken } from '../../../api/instances/authenticatedApi';
import { changeAccountPhoneReq, getUserReq } from '../../../api/userAPI';
import { BACKEND_ERRORS, classifyPhoneError, logRequestFailure } from "../../../api/errorMessages";
import { dialogActions } from '../../../store/dialogSlice';
import { RootState } from '../../../store/rootReducer';
import { userActions } from '../../../store/userSlice';
import {
  DialogBtn,
  AlertBox,
  defaultDialogPaddingXClass,
  Dialog,
  ConfirmDialog,
} from '@influenzanet/case-web-ui';
import PhoneNumberInput from '../../inputs/PhoneNumberInput';


const ChangePhone: React.FC = () => {
  const { t } = useTranslation(['dialogs']);
  const dispatch = useDispatch();
  const dialogState = useSelector((state: RootState) => state.dialog)
  const open = dialogState.config?.type === 'changePhone';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [openConfirm, setOpenConfirm] = useState(false);
  const [formData, setFormData] = useState({
    newPhone: ''
  });

  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open])

  const resetForm = () => {
    setLoading(false);
    setError('');
    setFormData({
      newPhone: ''
    });
  }

  const handleClose = () => {
    dispatch(dialogActions.closeDialog());
  }

  const changePhone = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await changeAccountPhoneReq(formData.newPhone);
      if (response.status === 200) {
        // Awaited so a failure is handled here instead of surfacing as an unhandled
        // rejection, and so the renewal is not left racing whatever the user does next.
        try {
          await renewToken();
        } catch (renewError) {
          logRequestFailure("renewing the token after changing the phone", renewError);
        }
        if (response.data) {
          dispatch(userActions.setUser(response.data));
        } else {
          const userData = (await getUserReq()).data;
          dispatch(userActions.setUser(userData));
        }
      }
      dispatch(dialogActions.openVerifyWhatsAppDialog({
        type: 'verifyWhatsApp',
        payload: {
          phoneNumber: formData.newPhone,
        }
      }))
    } catch (e: unknown) {
      logRequestFailure("changing the phone number", e);
      handleError(e);
    } finally {
      setLoading(false);
    }
  };

  // The two failures the gateway gives a status of their own are read from it; the rest are
  // only distinguishable by their message, so those keep matching on it.
  const handleError = (e: unknown) => {
    switch (classifyPhoneError(e)) {
      case "recipientNotAllowed":
        setError(t("changePhone.errors.recipientNotAllowed"));
        return;
      case "rateLimited":
        setError(t("changePhone.errors.rateLimit"));
        return;
      default:
        break;
    }

    const errorMsg = (e as { response?: { data?: { error?: string } } })
      ?.response?.data?.error;
    switch (errorMsg) {
      case BACKEND_ERRORS.ACTION_FAILED:
        setError(t('changePhone.errors.wrongPasswordOrAccountId'));
        break;
      case BACKEND_ERRORS.PHONE_NOT_VALID:
        setError(t('changePhone.errors.wrongPhoneFormat'));
        break;
      case BACKEND_ERRORS.PHONE_ALREADY_TAKEN:
        setError(t('changePhone.errors.phoneAlreadyTaken'));
        break;
      default:
        setError(t('changePhone.errors.unknown'));
        break;
    }
  }

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setOpenConfirm(true);
  };

  const buttonDisabled = (): boolean => {
    return loading || formData.newPhone.length < 8;
  }


  return (
    <Dialog
      open={open}
      title={t('changePhone.title')}
      onClose={handleClose}
      ariaLabelledBy="changePhoneDialogTitle"
    >
      <div className={clsx(
        defaultDialogPaddingXClass,
        'py-3',
        'bg-grey-1'
      )}>
        <form onSubmit={onSubmit}>
          <PhoneNumberInput
            className="mb-2"
            value={formData.newPhone}
            label={t('dialogs:changePhone.phoneInputLabel')}
            placeholder={t('dialogs:changePhone.phoneInputPlaceholder')}
            autoFocus
            onChange={(fullPhoneNumber) => {
              setFormData(prev => { return { ...prev, newPhone: fullPhoneNumber } });
            }}
          />

          <AlertBox
            type="info"
            content={t('changePhone.info')}
          />

          <AlertBox
            type="danger"
            className="mt-2"
            hide={!error}
            closable={true}
            useIcon={true}
            onClose={() => setError("")}
            content={error}
          />

          <div className="d-flex flex-wrap">
            <DialogBtn
              className="mt-2 me-2"
              type="button"
              color="primary"
              outlined={true}
              label={t('changePhone.cancelBtn')}
              onClick={() => handleClose()}
            />
            <DialogBtn
              className="mt-2"
              type="submit"
              color="primary"
              loading={loading}
              disabled={buttonDisabled()}
              label={t('changePhone.confirmBtn')}
            />
          </div>
        </form>
      </div>
      {
        <ConfirmDialog
          open={openConfirm}
          title={t('changePhone.warningDialog.title')}
          onConfirm={() => {
            setOpenConfirm(false);
            changePhone();
          }}
          color="warning"
          onClose={() => setOpenConfirm(false)}
          cancelText={t('changePhone.warningDialog.cancelBtn')}
          confirmText={t('changePhone.warningDialog.confirmBtn')}
        >
          <AlertBox
            type="warning"
            content={t('changePhone.warningDialog.content')}
          />
        </ConfirmDialog>
      }
    </Dialog>
  );
};

export default ChangePhone;
