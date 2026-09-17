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
import { deletePhoneReq, getUserReq } from '../../../api/userAPI';
import { logRequestFailure } from '../../../api/errorMessages';
import { renewToken } from '../../../api/instances/authenticatedApi';
import { userActions } from '../../../store/userSlice';

interface DeletePhoneProps {
}

const DeletePhone: React.FC<DeletePhoneProps> = (props) => {
  const { t } = useTranslation(['dialogs']);
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
    setError('');
    try {
      const response = await deletePhoneReq();

      if (response.status === 200) {
        // The endpoint answers with the account it just updated, so it is only fetched again
        // when that answer carried no body: reloading it every time asked the backend for what
        // had already been stored a line above.
        if (response.data) {
          dispatch(userActions.setUser(response.data));
        } else {
          const userData = (await getUserReq()).data;
          dispatch(userActions.setUser(userData));
        }
      }
      dispatch(dialogActions.openAlertDialog({
        type: 'alertDialog',
        payload: {
          color: 'success',
          title: t('dialogs:deletePhone.successDialog.title'),
          content: t('dialogs:deletePhone.successDialog.content'),
          btn: t('dialogs:deletePhone.successDialog.btn'),
        }
      }))
    } catch (e: unknown) {
      logRequestFailure('deleting the phone number', e);
      // The endpoint refuses with a missing argument or a database message, neither of which
      // means anything to a participant; both are English prose, and the alert box below reads
      // its content as markdown with raw HTML enabled, so the backend text was also markup the
      // browser would render.
      setError(t('deletePhone.errors.unknown'));
    } finally {
      // Also on the way out of a successful deletion: the dialog stays mounted, so a loading
      // flag left set is still set the next time it is opened.
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
            loadingLabel={t('loadingMsg')}
            // DialogBtn's loading prop only swaps the label for a spinner, so the button has to
            // be disabled as well: a second click sends the request the first one is still
            // waiting on.
            disabled={loading}
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
