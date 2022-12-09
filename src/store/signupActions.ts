import { createAction } from '@reduxjs/toolkit';

export const signupActions = {
  contactVerified: createAction<void, string>("signup/contactVerified")
}
