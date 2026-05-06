import clsx from 'clsx';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { ContactPreferences, PhoneContactInfo } from '../../../api/types/user';
import { getUserReq, updateContactPreferencesReq } from '../../../api/userAPI';
import { dialogActions } from '../../../store/dialogSlice';
import { RootState } from '../../../store/rootReducer';
import { userActions } from '../../../store/userSlice';
import {
  Dialog,
  DialogBtn,
  AlertBox,
  Checkbox,
  defaultDialogPaddingXClass,
} from '@influenzanet/case-web-ui';


const ChangeNotifications = () => {
  const { t } = useTranslation(['dialogs']);
  const dispatch = useDispatch();
  const dialogState = useSelector((state: RootState) => state.dialog)
  const open = dialogState.config?.type === 'changeNotifications';
  const currentUser = useSelector((state: RootState) => state.user.currentUser);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [changed, setChanged] = useState(false);

  const [weeklyEnabled, setWeeklyEnabled] = useState(false);
  const [newsletterEnabled, setNewsletterEnabled] = useState(false);
  const [channelEmail, setChannelEmail] = useState(true);
  const [channelWhatsapp, setChannelWhatsapp] = useState(false);

  const phoneInfo = currentUser.contactInfos.find(
    (info): info is PhoneContactInfo => info.type === 'phone'
  );
  const confirmedPhone = (phoneInfo?.confirmedAt ?? 0) > 0;

  useEffect(() => {
    if (open) {
      fetchUser();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    setNewsletterEnabled(currentUser.contactPreferences.subscribedToNewsletter ? true : false);
    setWeeklyEnabled(currentUser.contactPreferences.subscribedToWeekly ? true : false);
    const channels = currentUser.contactPreferences.preferredChannels ?? [];
    if (channels.length === 0) {
      setChannelEmail(true);
      setChannelWhatsapp(false);
    } else {
      setChannelEmail(channels.includes('email'));
      setChannelWhatsapp(channels.includes('whatsapp'));
    }
  }, [currentUser]);

  const fetchUser = async () => {
    if (loading) { return; }
    setLoading(true);
    try {
      const user = (await getUserReq()).data;
      dispatch(userActions.setUser(user));
      setLoading(false);
    } catch (e: any) {
      console.error(e.response);
      setLoading(false);
    }
  }

  const handleClose = () => {
    setChanged(false);
    setLoading(false);
    dispatch(dialogActions.closeDialog());
  }

  const handleChannelEmail = (value: boolean) => {
    if (!value && !channelWhatsapp) return;
    setChanged(true);
    setChannelEmail(value);
  }

  const handleChannelWhatsapp = (value: boolean) => {
    if (!value && !channelEmail) return;
    setChanged(true);
    setChannelWhatsapp(value);
  }

  const submitForm = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    const preferredChannels: string[] = [];
    if (channelEmail) preferredChannels.push('email');
    if (channelWhatsapp) preferredChannels.push('whatsapp');

    const contactPreferences: ContactPreferences = {
      ...currentUser.contactPreferences,
      subscribedToWeekly: weeklyEnabled,
      subscribedToNewsletter: newsletterEnabled,
      preferredChannels: preferredChannels,
    };

    try {
      const user = (await updateContactPreferencesReq(contactPreferences)).data;
      dispatch(userActions.setUser(user));
      handleClose();
      dispatch(dialogActions.openAlertDialog({
        type: 'alertDialog',
        payload: {
          color: 'success',
          title: t('changeNotifications.successDialog.title'),
          content: t('changeNotifications.successDialog.content'),
          btn: t('changeNotifications.successDialog.btn'),
        }
      }))
    } catch (e: any) {
      setLoading(false);
      console.error(e.response);
    }
  }

  return (
    <Dialog
      open={open}
      title={t('changeNotifications.title')}
      onClose={handleClose}
      ariaLabelledBy="changeNotificationsDialogTitle"
    >
      <div className={clsx(
        defaultDialogPaddingXClass,
        'py-3',
        'bg-grey-1'
      )}>
        <form onSubmit={submitForm}>
          <label
            className="mb-1 form-label"
            htmlFor="weeklyEmail">
            {t('dialogs:changeNotifications.weeklyReminder.label')}
          </label>
          <Checkbox
            id="weeklyEmail"
            name="weeklyEmail"
            checked={weeklyEnabled}
            onChange={(value: boolean) => {
              setChanged(true);
              setWeeklyEnabled(value);
            }}
          >
            {weeklyEnabled
              ? t('dialogs:changeNotifications.weeklyReminder.on')
              : t('dialogs:changeNotifications.weeklyReminder.off')}
          </Checkbox>

          <label
            className="mt-2 mb-1 form-label"
            htmlFor="newsletter">
            {t('dialogs:changeNotifications.newsletter.label')}
          </label>
          <Checkbox
            id="newsletter"
            name="newsletter"
            checked={newsletterEnabled}
            onChange={(value: boolean) => {
              setChanged(true);
              setNewsletterEnabled(value);
            }}
          >
            {newsletterEnabled
              ? t('dialogs:changeNotifications.newsletter.on')
              : t('dialogs:changeNotifications.newsletter.off')}
          </Checkbox>

          <hr className="my-3" />

          <label className="mb-1 form-label">
            {t('dialogs:changeNotifications.channels.label')}
          </label>
          <Checkbox
            id="channelEmail"
            name="channelEmail"
            checked={channelEmail}
            disabled={!confirmedPhone && channelEmail}
            onChange={handleChannelEmail}
          >
            {t('dialogs:changeNotifications.channels.email')}
          </Checkbox>
          <Checkbox
            id="channelWhatsapp"
            name="channelWhatsapp"
            checked={channelWhatsapp}
            disabled={!confirmedPhone}
            onChange={handleChannelWhatsapp}
          >
            {t('dialogs:changeNotifications.channels.whatsapp')}
          </Checkbox>

          {!confirmedPhone && (
            <AlertBox
              type="warning"
              className="mt-2"
              content={t('dialogs:changeNotifications.channels.whatsappDisabled')}
            />
          )}

          {confirmedPhone && (
            <p className="mt-1" style={{ fontSize: '0.8rem', color: '#888', fontStyle: 'italic' }}>
              {t('dialogs:changeNotifications.channels.note')}
            </p>
          )}

          <AlertBox
            type="danger"
            className="mt-2"
            hide={!error}
            closable={true}
            onClose={() => setError('')}
            useIcon={true}
            content={error}
          />

          <div className="d-flex flex-wrap">
            <DialogBtn
              className="mt-2 me-2"
              type="button"
              color="primary"
              outlined={true}
              label={t('changeNotifications.cancelBtn')}
              onClick={() => handleClose()}
            />
            <DialogBtn
              className="mt-2"
              type="submit"
              color="primary"
              loading={loading}
              disabled={loading || !changed}
              label={t('changeNotifications.submitBtn')}
            />
          </div>
        </form>
      </div>
    </Dialog>
  );
};

export default ChangeNotifications;
