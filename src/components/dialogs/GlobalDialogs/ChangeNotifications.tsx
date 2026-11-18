import clsx from 'clsx';
import { logRequestFailure } from "../../../api/errorMessages";
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { ContactPreferences, PhoneContactInfo } from '../../../api/types/user';
import { getUserReq, updateContactPreferencesReq } from '../../../api/userAPI';
import { dialogActions } from '../../../store/dialogSlice';
import { RootState } from '../../../store/rootReducer';
import { userActions } from '../../../store/userSlice';
import { useWhatsAppEnabled } from '../../../hooks/useWhatsAppEnabled';
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
  const [channelEmail, setChannelEmail] = useState(false);
  const [channelWhatsapp, setChannelWhatsapp] = useState(false);

  const phoneInfo = currentUser.contactInfos.find(
    (info): info is PhoneContactInfo => info.type === 'phone'
  );
  const confirmedPhone = (phoneInfo?.confirmedAt ?? 0) > 0;
  // When WhatsApp is disabled on the platform its channel is not offered; a stored WhatsApp
  // choice is saved back unchanged.
  const whatsAppEnabled = useWhatsAppEnabled();

  useEffect(() => {
    if (open) {
      // The banner belongs to the save that failed, not to the dialog, so a dialog opened
      // again starts without it.
      setError('');
      fetchUser();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    setNewsletterEnabled(currentUser.contactPreferences.subscribedToNewsletter ? true : false);
    setWeeklyEnabled(currentUser.contactPreferences.subscribedToWeekly ? true : false);
    // An empty list means the participant has chosen no channel, and the API leaves an empty
    // list out of its answer, so a missing one means the same. Accounts from before channels
    // existed already arrive as e-mail.
    const channels = currentUser.contactPreferences.preferredChannels ?? [];
    setChannelEmail(channels.includes('email'));
    // WhatsApp only counts with a verified phone: a stored whatsapp channel without one cannot be
    // delivered nor saved again, and its box is disabled, so it is shown and saved as off.
    setChannelWhatsapp(channels.includes('whatsapp') && confirmedPhone);
  }, [currentUser]);

  const fetchUser = async () => {
    if (loading) { return; }
    setLoading(true);
    try {
      const user = (await getUserReq()).data;
      dispatch(userActions.setUser(user));
      setLoading(false);
    } catch (e: any) {
      logRequestFailure("loading the notification settings", e);
      setLoading(false);
    }
  }

  const handleClose = () => {
    setChanged(false);
    setLoading(false);
    dispatch(dialogActions.closeDialog());
  }

  // Both channels may be unticked: the participant then gets no notification at all, which the
  // warning below says, and nothing switches e-mail back on for them.
  const handleChannelEmail = (value: boolean) => {
    setChanged(true);
    setChannelEmail(value);
  }

  const handleChannelWhatsapp = (value: boolean) => {
    // the checkbox is already disabled without a verified phone; the guard keeps the state consistent regardless
    if (value && !confirmedPhone) return;
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
    } catch (e: unknown) {
      setLoading(false);
      logRequestFailure("saving the notification settings", e);
      setError(t('changeNotifications.errors.unknown'));
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

          <div className="mb-2">
            <Checkbox
              id="channelEmail"
              name="channelEmail"
              checked={channelEmail}
              onChange={handleChannelEmail}
            >
              {t('dialogs:changeNotifications.channels.email')}
            </Checkbox>
          </div>

          {whatsAppEnabled && (<React.Fragment>
          <div className="mb-2">
            <Checkbox
              id="channelWhatsapp"
              name="channelWhatsapp"
              checked={channelWhatsapp}
              disabled={!confirmedPhone}
              onChange={handleChannelWhatsapp}
            >
              {t('dialogs:changeNotifications.channels.whatsapp')}
            </Checkbox>
          </div>

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
          </React.Fragment>)}

          {!channelEmail && !channelWhatsapp && (
            <AlertBox
              type="warning"
              className="mt-2"
              content={t('dialogs:changeNotifications.channels.noChannelWarning')}
            />
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
              loadingLabel={t('loadingMsg')}
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
