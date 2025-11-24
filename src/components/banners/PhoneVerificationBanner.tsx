import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/rootReducer';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { useIsAuthenticated } from '../../hooks/useIsAuthenticated';
import { PhoneContactInfo } from '../../api/types/user';

const PhoneVerificationBanner: React.FC = () => {
  const { t } = useTranslation(['banner']);
  const isAuth = useIsAuthenticated();
  const history = useHistory();
  const currentUser = useSelector((state: RootState) => state.user.currentUser);

  if (!isAuth) {
    return null;
  }

  // Check if user has an unverified phone number
  const phoneInfo = currentUser.contactInfos.find(
    (info): info is PhoneContactInfo => info.type === 'phone'
  );

  // Don't show banner if no phone or phone is already verified
  if (!phoneInfo || (phoneInfo.confirmedAt && phoneInfo.confirmedAt > 0)) {
    return null;
  }

  const handleGoToProfile = () => {
    history.push('/settings');
  };

  return (
    <div className="alert alert-warning mb-0" role="alert" style={{ borderRadius: 0 }}>
      <div className="container">
        <div className="row align-items-center">
          <div className="col-12 col-md-9">
            <span className="material-icons align-middle me-2" style={{ fontSize: '1.5rem' }}>
              warning
            </span>
            <strong>{t('banner:phoneVerification.title', 'Attenzione!')}</strong>
            {' '}
            {t('banner:phoneVerification.message', 'Il tuo numero di telefono non è ancora stato verificato.')}
          </div>
          <div className="col-12 col-md-3 text-md-end mt-2 mt-md-0">
            <button
              className="btn btn-sm btn-dark"
              onClick={handleGoToProfile}
            >
              {t('banner:phoneVerification.button', 'Verifica ora')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhoneVerificationBanner;
