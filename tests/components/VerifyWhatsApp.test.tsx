/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';

import VerifyWhatsApp from '../../src/components/dialogs/GlobalDialogs/VerifyWhatsApp';
import {
  verifyWhatsAppCodeReq,
  resendWhatsAppCodeReq,
  getUserReq,
  deletePhoneReq,
  newAccountPhoneReq,
  changeAccountPhoneReq,
} from '../../src/api/userAPI';
import { renewToken } from '../../src/api/instances/authenticatedApi';
import { renderWithProviders } from './testUtils';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock('../../src/api/userAPI', () => ({
  verifyWhatsAppCodeReq: jest.fn(),
  resendWhatsAppCodeReq: jest.fn(),
  getUserReq: jest.fn(),
  deletePhoneReq: jest.fn(),
  newAccountPhoneReq: jest.fn(),
  changeAccountPhoneReq: jest.fn(),
}));
jest.mock('../../src/api/instances/authenticatedApi', () => ({
  renewToken: jest.fn(),
}));

const openDialogState = {
  dialog: {
    config: {
      type: 'verifyWhatsApp',
      payload: { phoneNumber: '+391234567890' },
    },
  },
};

describe('VerifyWhatsApp dialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing when the dialog is not open', () => {
    renderWithProviders(<VerifyWhatsApp />);
    expect(screen.queryByText('verifyWhatsApp.title')).toBeNull();
  });

  it('renders the dialog when the verifyWhatsApp dialog is open', () => {
    renderWithProviders(<VerifyWhatsApp />, openDialogState);
    expect(screen.getByText('verifyWhatsApp.title')).toBeInTheDocument();
    expect(screen.getByText('verifyWhatsApp.resendBtn')).toBeInTheDocument();
  });

  it('disables the submit button until a code is entered', () => {
    renderWithProviders(<VerifyWhatsApp />, openDialogState);
    const submit = screen.getByText('verifyWhatsApp.submitBtn').closest('button');
    expect(submit).toBeDisabled();
    fireEvent.change(screen.getByPlaceholderText('verifyWhatsApp.codeInputPlaceholder'), {
      target: { value: '123456' },
    });
    expect(submit).not.toBeDisabled();
  });

  it('resends via the resend endpoint and never deletes or re-adds the phone', async () => {
    (resendWhatsAppCodeReq as jest.Mock).mockResolvedValue({ status: 200 });
    renderWithProviders(<VerifyWhatsApp />, openDialogState);

    fireEvent.click(screen.getByText('verifyWhatsApp.resendBtn'));

    await waitFor(() => expect(resendWhatsAppCodeReq).toHaveBeenCalledTimes(1));
    // C-6 regression guard: the resend must not use the old delete + re-add pattern
    expect(deletePhoneReq).not.toHaveBeenCalled();
    expect(newAccountPhoneReq).not.toHaveBeenCalled();
    expect(changeAccountPhoneReq).not.toHaveBeenCalled();
  });

  it('maps the rate limit error on resend to a translated message', async () => {
    (resendWhatsAppCodeReq as jest.Mock).mockRejectedValue({
      response: { data: { error: 'too many phone verification attempts, try again later' } },
    });
    renderWithProviders(<VerifyWhatsApp />, openDialogState);
    fireEvent.click(screen.getByText('verifyWhatsApp.resendBtn'));
    expect(await screen.findByText('verifyWhatsApp.errors.rateLimit')).toBeInTheDocument();
  });

  it('maps the recipient-not-allowed error on resend to a translated message', async () => {
    (resendWhatsAppCodeReq as jest.Mock).mockRejectedValue({
      response: { data: { error: 'phone number not enabled to receive WhatsApp messages' } },
    });
    renderWithProviders(<VerifyWhatsApp />, openDialogState);
    fireEvent.click(screen.getByText('verifyWhatsApp.resendBtn'));
    expect(await screen.findByText('verifyWhatsApp.errors.recipientNotAllowed')).toBeInTheDocument();
  });

  it('stores the user and opens the success dialog after a successful verification', async () => {
    const verifiedUser = { id: 'user-1', account: { accountId: 'test@test.it' }, profiles: [] };
    (verifyWhatsAppCodeReq as jest.Mock).mockResolvedValue({ status: 200, data: verifiedUser });

    const { store } = renderWithProviders(<VerifyWhatsApp />, openDialogState);

    fireEvent.change(screen.getByPlaceholderText('verifyWhatsApp.codeInputPlaceholder'), {
      target: { value: '123456' },
    });
    fireEvent.click(screen.getByText('verifyWhatsApp.submitBtn'));

    await waitFor(() => expect(verifyWhatsAppCodeReq).toHaveBeenCalledWith('123456'));
    await waitFor(() => {
      const state = store.getState() as { dialog: { config?: { type?: string } }; user: { currentUser: unknown } };
      expect(state.dialog.config?.type).toBe('alertDialog');
      expect(state.user.currentUser).toEqual(verifiedUser);
    });
    expect(renewToken).toHaveBeenCalled();
    expect(getUserReq).not.toHaveBeenCalled();
  });
});
