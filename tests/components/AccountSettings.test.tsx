/**
 * @jest-environment jsdom
 */
import React from 'react';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';

import AccountSettings from '../../src/components/settings/AccountSettings';
import { resendWhatsAppCodeReq } from '../../src/api/userAPI';
import { renderWithProviders } from './testUtils';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock('../../src/api/userAPI', () => ({
  resendWhatsAppCodeReq: jest.fn(),
}));
jest.mock('../../src/hooks/useIsAuthenticated', () => ({
  useIsAuthenticated: () => true,
}));

const stateWithUnverifiedPhone = {
  user: {
    currentUser: {
      id: 'user-1',
      account: { accountId: 'test@test.it' },
      profiles: [],
      contactPreferences: { subscribedToNewsletter: false, subscribedToWeekly: true, preferredChannels: ['email'] },
      contactInfos: [
        { id: 'ci-1', type: 'email', email: 'test@test.it', confirmedAt: 1752000000 },
        { id: 'ci-2', type: 'phone', phone: '+391234567890', confirmedAt: 0 },
      ],
    },
  },
};

const clickResend = () => {
  fireEvent.click(screen.getByText('account.phone.resendBtn'));
};

describe('AccountSettings phone code resend', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('opens the verification dialog after a successful resend', async () => {
    (resendWhatsAppCodeReq as jest.Mock).mockResolvedValue({ status: 200 });
    const { store } = renderWithProviders(
      <AccountSettings itemKey="account" hideProfileSettings={true} />,
      stateWithUnverifiedPhone,
    );
    clickResend();
    await waitFor(() => expect(resendWhatsAppCodeReq).toHaveBeenCalledTimes(1));
    await waitFor(() => {
      const state = store.getState() as { dialog: { config?: { type?: string } } };
      expect(state.dialog.config?.type).toBe('verifyWhatsApp');
    });
  });

  it('maps the recipient-not-allowed error to its own message', async () => {
    (resendWhatsAppCodeReq as jest.Mock).mockRejectedValue({
      response: { data: { error: 'phone number not enabled to receive WhatsApp messages' } },
    });
    renderWithProviders(<AccountSettings itemKey="account" hideProfileSettings={true} />, stateWithUnverifiedPhone);
    clickResend();
    expect(await screen.findByText('account.phone.recipientNotAllowedError')).toBeInTheDocument();
  });

  it('maps the rate limit error to its own message', async () => {
    (resendWhatsAppCodeReq as jest.Mock).mockRejectedValue({
      response: { data: { error: 'too many phone verification attempts, try again later' } },
    });
    renderWithProviders(<AccountSettings itemKey="account" hideProfileSettings={true} />, stateWithUnverifiedPhone);
    clickResend();
    expect(await screen.findByText('account.phone.rateLimitError')).toBeInTheDocument();
  });

  it('maps the cooldown refusal to its own message', async () => {
    (resendWhatsAppCodeReq as jest.Mock).mockRejectedValue({
      response: { status: 400, data: { error: 'cannot send verification so often' } },
    });
    renderWithProviders(<AccountSettings itemKey="account" hideProfileSettings={true} />, stateWithUnverifiedPhone);
    clickResend();
    expect(await screen.findByText('account.phone.cooldownError')).toBeInTheDocument();
  });

  it('holds the resend button for the cooldown after a successful resend', async () => {
    jest.useFakeTimers();
    (resendWhatsAppCodeReq as jest.Mock).mockResolvedValue({ status: 200 });
    renderWithProviders(<AccountSettings itemKey="account" hideProfileSettings={true} />, stateWithUnverifiedPhone);
    const resendButton = () => screen.getByRole('button', { name: /account.phone.resend/ });

    fireEvent.click(resendButton());

    await waitFor(() => expect(resendWhatsAppCodeReq).toHaveBeenCalledTimes(1));
    expect(resendButton()).toBeDisabled();

    act(() => {
      jest.advanceTimersByTime(60000);
    });
    expect(resendButton()).not.toBeDisabled();
    jest.useRealTimers();
  });

  it('asks for a new code when no verification is waiting on the backend', async () => {
    (resendWhatsAppCodeReq as jest.Mock).mockRejectedValue({
      response: { status: 400, data: { error: 'phone number is not pending verification' } },
    });
    renderWithProviders(<AccountSettings itemKey="account" hideProfileSettings={true} />, stateWithUnverifiedPhone);
    clickResend();
    expect(await screen.findByText('account.phone.noPendingVerificationError')).toBeInTheDocument();
  });

  it('keeps the generic message for other send failures', async () => {
    (resendWhatsAppCodeReq as jest.Mock).mockRejectedValue({
      response: { data: { error: 'failed to send verification code' } },
    });
    renderWithProviders(<AccountSettings itemKey="account" hideProfileSettings={true} />, stateWithUnverifiedPhone);
    clickResend();
    expect(await screen.findByText('account.phone.resendError')).toBeInTheDocument();
  });
});
