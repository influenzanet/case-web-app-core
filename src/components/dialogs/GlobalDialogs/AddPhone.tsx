import clsx from 'clsx';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { renewToken } from '../../../api/instances/authenticatedApi';
import { getUserReq, newAccountPhoneReq } from '../../../api/userAPI';
import { dialogActions } from '../../../store/dialogSlice';
import { RootState } from '../../../store/rootReducer';
import { userActions } from '../../../store/userSlice';
import {
  DialogBtn,
  AlertBox,
  TextField,
  defaultDialogPaddingXClass,
  Dialog,
  ConfirmDialog,
} from '@influenzanet/case-web-ui';


const AddPhone: React.FC = () => {
  const { t } = useTranslation(['dialogs']);
  const dispatch = useDispatch();
  const dialogState = useSelector((state: RootState) => state.dialog)
  const open = dialogState.config?.type === 'addPhone';

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

  const addPhone = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await newAccountPhoneReq(formData.newPhone);
      if (response.status === 200) {
        renewToken();
        if (response.data) {
          dispatch(userActions.setUser(response.data));
        } else {
          const userData = (await getUserReq()).data;
          dispatch(userActions.setUser(userData));
        }
        dispatch(dialogActions.openVerifyWhatsAppDialog({
          type: 'verifyWhatsApp',
          payload: {
            phoneNumber: formData.newPhone,
          }
        }))

      }
    } catch (e: unknown) {
      console.error(e);
      const errorResponse = e as { response?: { data?: { error?: string } } };
      handleError(errorResponse.response?.data?.error);
    } finally {
      setLoading(false);
    }
  };

  const handleError = (errorMsg?: string) => {
    switch (errorMsg) {
      case 'action failed':
        setError(t('addPhone.errors.wrongPasswordOrAccountId'));
        break;
      case 'phone not valid':
        setError(t('addPhone.errors.wrongPhoneFormat'));
        break;
      default:
        setError(t('addPhone.errors.unknown'));
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
      title={t('addPhone.title')}
      onClose={handleClose}
      ariaLabelledBy="addPhoneDialogTitle"
    >
      <div className={clsx(
        defaultDialogPaddingXClass,
        'py-3',
        'bg-grey-1'
      )}>
        <form onSubmit={onSubmit}>
          <TextField
            className="mb-2"
            id="newPhone"
            name="newPhone"
            type="text"
            label={t('dialogs:addPhone.phoneInputLabel')}
            placeholder={t('dialogs:addPhone.phoneInputPlaceholder')}
            value={formData.newPhone}
            autoFocus
            autoComplete="off"
            onChange={(event) => {
              const value = event.target.value;
              setFormData(prev => { return { ...prev, newPhone: value } });
            }}
          />

          <AlertBox
            type="info"
            content={t('addPhone.info')}
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
              label={t('addPhone.cancelBtn')}
              onClick={() => handleClose()}
            />
            <DialogBtn
              className="mt-2"
              type="submit"
              color="primary"
              loading={loading}
              disabled={buttonDisabled()}
              label={t('addPhone.confirmBtn')}
            />
          </div>
        </form>
      </div>
      {
        <ConfirmDialog
          open={openConfirm}
          title={t('addPhone.warningDialog.title')}
          onConfirm={() => {
            setOpenConfirm(false);
            addPhone();
          }}
          color="warning"
          onClose={() => setOpenConfirm(false)}
          cancelText={t('addPhone.warningDialog.cancelBtn')}
          confirmText={t('addPhone.warningDialog.confirmBtn')}
        >
          <AlertBox
            type="warning"
            content={t('addPhone.warningDialog.content')}
          />
        </ConfirmDialog>
      }
    </Dialog>
  );
};

export default AddPhone;
