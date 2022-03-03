import React from 'react';

import { blurEmail } from '../../utils/blurEmail';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from "../../store/rootReducer";
import { useTranslation } from 'react-i18next';
import { EditBtn } from 'case-web-ui';
import { dialogActions } from '../../store/dialogSlice';
import { useIsAuthenticated } from '../../hooks/useIsAuthenticated';


interface AccountSettingsProps {
  itemKey: string;
  hideProfileSettings?: boolean;
}

const AccountSettings: React.FC<AccountSettingsProps> = (props) => {
  const { t } = useTranslation(['settings']);
  const isAuth = useIsAuthenticated();
  const dispatch = useDispatch();
  const currentUser = useSelector((state: RootState) => state.user.currentUser);

  if (!isAuth) {
    return <div className="bg-warning-light p-3">
      {'authentication needed'}
    </div>
  }

  const renderProfileSettings = () => {
    if (props.hideProfileSettings === true) {
      return null;
    }

    return <React.Fragment>
      <h4 className="fw-bold mt-2">
        {t(`${props.itemKey}.profiles.title`)}
      </h4>
      <p className="mb-1 text-grey-7">
        {t(`${props.itemKey}.profiles.info`)}
      </p>
      <EditBtn
        onClick={() => dispatch(dialogActions.openDialogWithoutPayload({ type: 'manageProfiles' }))}
      >
        {t(`${props.itemKey}.profiles.btn`, { count: currentUser.profiles.length })}
      </EditBtn>
    </React.Fragment>
  }

  return (
    <div className="border-primary border-top-2 pt-2">
      <h2>
        {t(`${props.itemKey}.title`)}
      </h2>

      {/** email */}
      <h4 className="fw-bold mt-2">
        {t(`${props.itemKey}.email.title`)}
      </h4>
      <p className="mb-1 text-grey-7">
        {t(`${props.itemKey}.email.info`)}
      </p>
      <EditBtn
        onClick={() => dispatch(dialogActions.openDialogWithoutPayload({ type: 'changeEmail' }))}
      >
        {blurEmail(currentUser.account.accountId)}
      </EditBtn>

      {/** password */}
      <h4 className="fw-bold mt-2">
        {t(`${props.itemKey}.password.title`)}
      </h4>
      <p className="mb-1 text-grey-7">
        {t(`${props.itemKey}.password.info`)}
      </p>
      <EditBtn
        onClick={() => dispatch(dialogActions.openDialogWithoutPayload({ type: 'changePassword' }))}
      >
        {"••••••••••••••"}
      </EditBtn>

      {renderProfileSettings()}
    </div>
  );
};

export default AccountSettings;
