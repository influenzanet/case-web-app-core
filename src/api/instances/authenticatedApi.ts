import axios from "axios";
import store, { resetStore } from "../../store/store";
import { minuteToMillisecondFactor } from "../../constants";
import { setAppAuth } from "../../store/appSlice";
import { TokenResponse } from "../types/authAPI";

const renewThreshold = 1 * minuteToMillisecondFactor;

const authApiInstance = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL,
});

export const renewTokenURL = "/v1/auth/renew-token";

export const renewTokenReq = (refreshToken: string) =>
  authApiInstance.post<TokenResponse>(renewTokenURL, {
    refreshToken: refreshToken,
  });

export const renewToken = async (): Promise<string> => {
  const refreshToken = store.getState().app.auth?.refreshToken;
  if (!refreshToken || refreshToken.length <= 0) {
    throw new Error("no valid tokens");
  }

  const response = await renewTokenReq(refreshToken);
  store.dispatch(
    setAppAuth({
      accessToken: response.data.accessToken,
      refreshToken: response.data.refreshToken,
      expiresAt:
        new Date().getTime() +
        response.data.expiresIn * minuteToMillisecondFactor,
    })
  );
  setDefaultAccessTokenHeader(response.data.accessToken);
  return response.data.accessToken;
};

const renewTokenIfNecessary = async (): Promise<string | undefined> => {
  const expiresAt = store.getState().app.auth?.expiresAt;
  if (!expiresAt) {
    return;
  }

  if (expiresAt < new Date().getTime() + renewThreshold) {
    const accessToken = await renewToken();
    return accessToken;
  }
  return;
};

authApiInstance.interceptors.request.use(
  async (config) => {
    if (renewTokenURL === config.url) {
      return config;
    }
    try {
      const newAccessToken = await renewTokenIfNecessary();
      if (newAccessToken && newAccessToken.length && config.headers) {
        config.headers.Authorization = "Bearer " + newAccessToken;
      }
    } catch (e: any) {
      resetApiAuth();
      if (e.response) {
        console.error(e.response);
      } else {
        console.error(e);
      }
    }
    return config;
  },
  (error) => {
    resetApiAuth();
    console.error(error);
    return Promise.reject(error);
  }
);

export const setDefaultAccessTokenHeader = (token: string) => {
  authApiInstance.defaults.headers.common["Authorization"] = "Bearer " + token;
};

export const resetApiAuth = () => {
  resetStore();
  setDefaultAccessTokenHeader("");
};

export default authApiInstance;
