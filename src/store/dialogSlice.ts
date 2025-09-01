import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export type DialogOrigin = 'surveyFlow'

interface DialogWithoutPayload {
  type: string;
  origin?: DialogOrigin;
}

export interface LoginDialog {
  type: 'login'
  origin?: DialogOrigin;
  payload: {
    email: string
    password: string
    rememberMe: boolean
    verificationCode?: string
    preventNavigateOnSuccess?: boolean
  }
}

export interface AlertDialog {
  type: 'alertDialog'
  origin?: DialogOrigin;
  payload: {
    color: 'danger' | 'warning' | 'success'
    title: string
    content: string
    btn: string
  }
}

export interface VerifyWhatsAppDialog {
  type: 'verifyWhatsApp'
  origin?: DialogOrigin;
  payload: {
    phoneNumber: string
    token?: string
  }
}

export interface DialogState {
  config?: DialogWithoutPayload | LoginDialog | AlertDialog | VerifyWhatsAppDialog
}

export const initialState: DialogState = {
  config: undefined
}

const dialogSlice = createSlice({
  name: 'dialog',
  initialState,
  reducers: {
    reset(state) {
      state = { ...initialState };
      return state;
    },
    closeDialog(state) {
      state.config = undefined
    },
    openDialogWithoutPayload(state, action: PayloadAction<{ type: string; origin?: DialogOrigin }>) {
      state.config = {
        type: action.payload.type,
        origin: action.payload.origin,
      }
    },
    openLoginDialog(state, action: PayloadAction<LoginDialog>) {
      state.config = {
        type: action.payload.type,
        origin: action.payload.origin,
        payload: action.payload.payload
      }
    },
    openAlertDialog(state, action: PayloadAction<AlertDialog>) {
      state.config = {
        type: action.payload.type,
        origin: action.payload.origin,
        payload: action.payload.payload
      }
    },
    openVerifyWhatsAppDialog(state, action: PayloadAction<VerifyWhatsAppDialog>) {
      state.config = {
        type: action.payload.type,
        origin: action.payload.origin,
        payload: action.payload.payload
      }
    },
  }
})

export const dialogActions = dialogSlice.actions;

export default dialogSlice.reducer
