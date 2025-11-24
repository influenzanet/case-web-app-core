import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/rootReducer';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { useIsAuthenticated } from '../../hooks/useIsAuthenticated';
import { PhoneContactInfo } from '../../api/types/user';

const PhoneVerificationBanner: React.FC = () => {
  const { t } = useTranslation();
  const isAuth = useIsAuthenticated();
  const history = useHistory();
  const currentUser = useSelector((state: RootState) => state.user.currentUser);


  if (!isAuth || !currentUser) {
    return null;
  }


  if (!currentUser.contactInfos || !Array.isArray(currentUser.contactInfos)) {
    return null;
  }


  const phoneInfo = currentUser.contactInfos.find(
    (info): info is PhoneContactInfo => info.type === 'phone'
  );


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
            <strong>{t('phoneVerificationBanner.title')}</strong>
            {' '}
            {t('phoneVerificationBanner.message')}
          </div>
          <div className="col-12 col-md-3 text-md-end mt-2 mt-md-0">
            <button
              className="btn btn-sm btn-dark"
              onClick={handleGoToProfile}
            >
              {t('phoneVerificationBanner.button')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhoneVerificationBanner;
