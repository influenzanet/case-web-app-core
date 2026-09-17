/**
 * @jest-environment jsdom
 */
import React from 'react';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';

import AccountSettings from '../../src/components/settings/AccountSettings';
import { resendWhatsAppCodeReq, getUserReq } from '../../src/api/userAPI';
import { renderWithProviders } from './testUtils';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock('../../src/api/userAPI', () => ({
  resendWhatsAppCodeReq: jest.fn(),
  getUserReq: jest.fn(),
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

  it('asks for the code again when the send itself failed', async () => {
    (resendWhatsAppCodeReq as jest.Mock).mockRejectedValue({
      response: { status: 500, data: { error: 'failed to send verification code' } },
    });
    renderWithProviders(<AccountSettings itemKey="account" hideProfileSettings={true} />, stateWithUnverifiedPhone);
    clickResend();
    expect(await screen.findByText('account.phone.sendFailedError')).toBeInTheDocument();
  });

  it('says WhatsApp is unavailable instead of asking for a pointless retry', async () => {
    (resendWhatsAppCodeReq as jest.Mock).mockRejectedValue({
      response: { status: 503, data: { error: 'WhatsApp is not configured' } },
    });
    renderWithProviders(<AccountSettings itemKey="account" hideProfileSettings={true} />, stateWithUnverifiedPhone);
    clickResend();
    expect(await screen.findByText('account.phone.whatsAppUnavailableError')).toBeInTheDocument();
  });

  it('reloads the account when the backend already considers the number verified', async () => {
    // The button only exists while the number is unverified, so the answer is the account the
    // interface is missing rather than a failure: reloading it puts the verified badge in
    // place of the button.
    const verifiedUser = {
      ...stateWithUnverifiedPhone.user.currentUser,
      contactInfos: [
        { id: 'ci-1', type: 'email', email: 'test@test.it', confirmedAt: 1752000000 },
        { id: 'ci-2', type: 'phone', phone: '+391234567890', confirmedAt: 1752000000 },
      ],
    };
    (resendWhatsAppCodeReq as jest.Mock).mockRejectedValue({
      response: { status: 400, data: { error: 'phone number already verified' } },
    });
    (getUserReq as jest.Mock).mockResolvedValue({ data: verifiedUser });

    const { store } = renderWithProviders(
      <AccountSettings itemKey="account" hideProfileSettings={true} />,
      stateWithUnverifiedPhone,
    );
    clickResend();

    await waitFor(() => expect(getUserReq).toHaveBeenCalledTimes(1));
    await waitFor(() => {
      const state = store.getState() as { user: { currentUser: unknown } };
      expect(state.user.currentUser).toEqual(verifiedUser);
    });
    // The reloaded account is verified, so the badge replaces the button — and the existing
    // effect that clears the message on a verified number takes the confirmation with it.
    await waitFor(() =>
      expect(screen.queryByText('account.phone.resendBtn')).not.toBeInTheDocument(),
    );
    expect(screen.getByText('account.phone.confirmed')).toBeInTheDocument();
  });

  it('still says the number is verified when the account cannot be reloaded', async () => {
    (resendWhatsAppCodeReq as jest.Mock).mockRejectedValue({
      response: { status: 400, data: { error: 'phone number already verified' } },
    });
    (getUserReq as jest.Mock).mockRejectedValue(new Error('network down'));

    renderWithProviders(<AccountSettings itemKey="account" hideProfileSettings={true} />, stateWithUnverifiedPhone);
    clickResend();

    expect(await screen.findByText('account.phone.alreadyVerifiedError')).toBeInTheDocument();
  });

  it('keeps the generic message for a failure it cannot place', async () => {
    (resendWhatsAppCodeReq as jest.Mock).mockRejectedValue({
      response: { status: 500, data: { error: 'database exploded' } },
    });
    renderWithProviders(<AccountSettings itemKey="account" hideProfileSettings={true} />, stateWithUnverifiedPhone);
    clickResend();
    expect(await screen.findByText('account.phone.resendError')).toBeInTheDocument();
  });
});

describe('AccountSettings phone deletion', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('names the delete-phone button for anyone not reading the icon', async () => {
    // The button carries a trash glyph and no text, so without a label a screen reader
    // announces nothing but "button".
    const { store } = renderWithProviders(
      <AccountSettings itemKey="account" hideProfileSettings={true} />,
      stateWithUnverifiedPhone,
    );

    const deleteButton = screen.getByRole('button', { name: 'account.phone.deleteBtn' });
    fireEvent.click(deleteButton);

    await waitFor(() => {
      const state = store.getState() as { dialog: { config?: { type?: string } } };
      expect(state.dialog.config?.type).toBe('deletePhone');
    });
  });
});
