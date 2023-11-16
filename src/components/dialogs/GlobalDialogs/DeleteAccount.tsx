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
import { deleteAccountReq } from '../../../api/userAPI';
import { getErrorMsg } from '../../../api/utils';

interface DeleteAccountProps {
}

const DeleteAccount: React.FC<DeleteAccountProps> = (props) => {
  const { t } = useTranslation(['dialogs']);
  const logout = useLogout();
  const dispatch = useDispatch();
  const dialogState = useSelector((state: RootState) => state.dialog)
  const open = dialogState.config?.type === 'deleteAccount';
  const user = useSelector((state: RootState) => state.user);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleClose = () => {
    setError('');
    setLoading(false);
    dispatch(dialogActions.closeDialog());
  }

  const onDeleteAccount = async () => {
    setLoading(true);
    try {
      await deleteAccountReq(user.currentUser.id);
      dispatch(dialogActions.openAlertDialog({
        type: 'alertDialog',
        payload: {
          color: 'success',
          title: t('dialogs:deleteAccount.successDialog.title'),
          content: t('dialogs:deleteAccount.successDialog.content'),
          btn: t('dialogs:deleteAccount.successDialog.btn'),
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
      title={t('deleteAccount.title')}
      color="danger"
      onClose={handleClose}
      ariaLabelledBy="deleteAccountDialogTitle"
    >
      <div className={clsx(
        defaultDialogPaddingXClass,
        'py-3',
        'bg-grey-1'
      )}>
        <AlertBox
          type="danger"
          content={t('dialogs:deleteAccount.info')}
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
            label={t('deleteAccount.cancelBtn')}
            onClick={() => handleClose()}
          />
          <DialogBtn
            type="button"
            color="danger"
            className="mt-2"
            loading={loading}
            outlined={true}
            label={t('deleteAccount.confirmBtn')}
            onClick={() => onDeleteAccount()}
          />
        </div>
      </div>
    </Dialog>
  );
};

export default DeleteAccount;
