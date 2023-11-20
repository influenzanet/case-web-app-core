import { useHistory } from "react-router-dom";
import { resetApiAuth } from "../api/instances/authenticatedApi";
import { localStorageManager } from "../store/store";
import { useDispatch } from "react-redux";
import { setPersistState } from "../store/appSlice";

export const useLogout = () => {
  const history = useHistory();
  const dispatch = useDispatch();

  return (withoutRedirect?: boolean) => {
    dispatch(setPersistState(false));

    resetApiAuth();
    localStorageManager.remove();

    if (history && !withoutRedirect) {
      history.push("/");
    }
  };
};
