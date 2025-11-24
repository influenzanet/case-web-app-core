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
  SelectField,
  defaultDialogPaddingXClass,
  Dialog,
  ConfirmDialog,
} from '@influenzanet/case-web-ui';

// Lista dei prefissi internazionali più comuni
const COUNTRY_CODES = [
  { code: '+39', country: 'IT', name: 'Italy' },
  { code: '+1', country: 'US', name: 'United States' },
  { code: '+44', country: 'GB', name: 'United Kingdom' },
  { code: '+33', country: 'FR', name: 'France' },
  { code: '+49', country: 'DE', name: 'Germany' },
  { code: '+34', country: 'ES', name: 'Spain' },
  { code: '+31', country: 'NL', name: 'Netherlands' },
  { code: '+41', country: 'CH', name: 'Switzerland' },
  { code: '+43', country: 'AT', name: 'Austria' },
  { code: '+32', country: 'BE', name: 'Belgium' },
  { code: '+351', country: 'PT', name: 'Portugal' },
  { code: '+30', country: 'GR', name: 'Greece' },
  { code: '+46', country: 'SE', name: 'Sweden' },
  { code: '+47', country: 'NO', name: 'Norway' },
  { code: '+45', country: 'DK', name: 'Denmark' },
  { code: '+358', country: 'FI', name: 'Finland' },
  { code: '+48', country: 'PL', name: 'Poland' },
  { code: '+420', country: 'CZ', name: 'Czech Republic' },
  { code: '+36', country: 'HU', name: 'Hungary' },
  { code: '+40', country: 'RO', name: 'Romania' },
];


const AddPhone: React.FC = () => {
  const { t } = useTranslation(['dialogs']);
  const dispatch = useDispatch();
  const dialogState = useSelector((state: RootState) => state.dialog)
  const open = dialogState.config?.type === 'addPhone';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [openConfirm, setOpenConfirm] = useState(false);
  const [formData, setFormData] = useState({
    countryCode: '+39', // Default Italia
    phoneNumber: '', // Solo il numero senza prefisso
    newPhone: '' // Numero completo con prefisso
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
      countryCode: '+39',
      phoneNumber: '',
      newPhone: ''
    });
  }

  const updateFullPhoneNumber = (countryCode: string, phoneNumber: string) => {
    const cleanNumber = phoneNumber.replace(/[^\d\s-]/g, '');
    const fullPhone = countryCode + cleanNumber;
    setFormData(prev => ({
      ...prev,
      countryCode,
      phoneNumber: cleanNumber,
      newPhone: fullPhone
    }));
  };

  const handleCountryCodeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newCountryCode = event.target.value;
    updateFullPhoneNumber(newCountryCode, formData.phoneNumber);
  };

  const handlePhoneNumberChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newPhoneNumber = event.target.value;
    updateFullPhoneNumber(formData.countryCode, newPhoneNumber);
  };

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
      case 'phone number already taken':
        setError(t('addPhone.errors.phoneAlreadyTaken'));
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
    return loading || formData.phoneNumber.length < 8;
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
          {/* Label per il campo */}
          <label className="form-label mb-1">
            {t('dialogs:addPhone.phoneInputLabel')}
          </label>

          {/* Container per dropdown + input */}
          <div className="d-flex mb-2">
            {/* Dropdown per il prefisso */}
            <SelectField
              className="me-2"
              style={{ width: '120px', flexShrink: 0 }}
              value={formData.countryCode}
              onChange={handleCountryCodeChange}
              values={COUNTRY_CODES.map((country) => ({
                code: country.code,
                label: `${country.code} ${country.country}`
              }))}
            />

            {/* Campo del numero */}
            <TextField
              type="text"
              placeholder={t('dialogs:addPhone.phoneInputPlaceholder')}
              value={formData.phoneNumber}
              autoFocus
              autoComplete="tel"
              className="flex-grow-1"
              onChange={handlePhoneNumberChange}
              style={{ marginBottom: 0 }}
            />
          </div>

          {/* Mostra il numero completo */}
          <small className="text-muted mb-2 d-block">
            {t('dialogs:addPhone.completeNumber')}: {formData.newPhone}
          </small>

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
