import React from 'react';

import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { EditBtn } from '@influenzanet/case-web-ui';
import { dialogActions } from '../../store/dialogSlice';
import { useIsAuthenticated } from '../../hooks/useIsAuthenticated';
import { RootState } from '../../store/rootReducer';

interface CommunicationSettingsProps {
  itemKey: string;
  hideLanguageSelector?: boolean
}

const CommunicationSettings: React.FC<CommunicationSettingsProps> = (props) => {
  const { t } = useTranslation(['settings']);
  const isAuth = useIsAuthenticated();
  const dispatch = useDispatch();
  const userLanguage = useSelector((state: RootState) => state.user.currentUser.account.preferredLanguage);

  if (!isAuth) {
    return <div className="bg-warning-light p-3">
      {'authentication needed'}
    </div>
  }

  return (
    <div className="border-primary border-top-2 pt-2 mt-3">
      <h2>
        {t(`${props.itemKey}.title`)}
      </h2>

      {/** email reminders*/}
      <h4 className="fw-bold mt-2">
        {t(`${props.itemKey}.emailReminders.title`)}
      </h4>
      <p className="mb-1 text-grey-7">
        {t(`${props.itemKey}.emailReminders.info`)}
      </p>
      <EditBtn
        onClick={() => dispatch(dialogActions.openDialogWithoutPayload({ type: 'changeNotifications' }))}
      >
        {t(`${props.itemKey}.emailReminders.btnManageNotifications`)}
      </EditBtn>

      {/** language*/}
      {props.hideLanguageSelector ? null : <React.Fragment>
        <h4 className="fw-bold mt-2">
          {t(`${props.itemKey}.defaultLanguage.title`)}
        </h4>
        <p className="mb-1 text-grey-7">
          {t(`${props.itemKey}.defaultLanguage.info`)}
        </p>
        <EditBtn
          onClick={() => dispatch(dialogActions.openDialogWithoutPayload({ type: 'changeLanguage' }))}
        >
          {t(`${props.itemKey}.defaultLanguage.languages.${userLanguage}`)}
        </EditBtn>
      </React.Fragment>}
    </div>
  );
};

export default CommunicationSettings;
