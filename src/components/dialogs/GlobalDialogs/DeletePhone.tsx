import React, { useState } from 'react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { RootState } from '../../../store/rootReducer';
import { useDispatch, useSelector } from 'react-redux';
import { dialogActions } from '../../../store/dialogSlice';
import {
  Dialog,
  DialogBtn,
  AlertBox,
  defaultDialogPaddingXClass,
} from '@influenzanet/case-web-ui';
import { useLogout } from '../../../hooks/useLogout';
import { deletePhoneReq } from '../../../api/userAPI';
import { getErrorMsg } from '../../../api/utils';

interface DeletePhoneProps {
}

const DeletePhone: React.FC<DeletePhoneProps> = (props) => {
  const { t } = useTranslation(['dialogs']);
  const logout = useLogout();
  const dispatch = useDispatch();
  const dialogState = useSelector((state: RootState) => state.dialog)
  const open = dialogState.config?.type === 'deletePhone';
  const user = useSelector((state: RootState) => state.user);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleClose = () => {
    setError('');
    setLoading(false);
    dispatch(dialogActions.closeDialog());
  }

  const onDeletePhone = async () => {
    setLoading(true);
    try {
      await deletePhoneReq(user.currentUser.id);
      dispatch(dialogActions.openAlertDialog({
        type: 'alertDialog',
        payload: {
          color: 'success',
          title: t('dialogs:deletePhone.successDialog.title'),
          content: t('dialogs:deletePhone.successDialog.content'),
          btn: t('dialogs:deletePhone.successDialog.btn'),
        }
      }))
      logout();
    } catch (e) {
      const err = getErrorMsg(e);
      setError(err);
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      title={t('deletePhone.title')}
      color="danger"
      onClose={handleClose}
      ariaLabelledBy="deletePhoneDialogTitle"
    >
      <div className={clsx(
        defaultDialogPaddingXClass,
        'py-3',
        'bg-grey-1'
      )}>
        <AlertBox
          type="danger"
          content={t('dialogs:deletePhone.info')}
        />
        <AlertBox
          className="mt-2"
          type="danger"
          hide={!error}
          closable={true}
          onClose={() => setError('')}
          content={error}
        />
        <div className="d-flex flex-wrap">
          <DialogBtn
            className="mt-2 me-2"
            type="button"
            color="primary"
            label={t('deletePhone.cancelBtn')}
            onClick={() => handleClose()}
          />
          <DialogBtn
            type="button"
            color="danger"
            className="mt-2"
            loading={loading}
            outlined={true}
            label={t('deletePhone.confirmBtn')}
            onClick={() => onDeletePhone()}
          />
        </div>
      </div>
    </Dialog>
  );
};

export default DeletePhone;
