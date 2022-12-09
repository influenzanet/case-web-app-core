import { useHistory } from 'react-router-dom';
import { resetApiAuth } from '../api/instances/authenticatedApi';
import { localStorageManager } from '../store/store';

export const useLogout = () => {
  const history = useHistory();

  return (withoutRedirect?: boolean) => {
    resetApiAuth();
    localStorageManager.remove();
    if (history && !withoutRedirect) {
      history.push('/');
    }
  }
}
