/**
 * @jest-environment jsdom
 */
import React from 'react';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';

import ChangeNotifications from '../../src/components/dialogs/GlobalDialogs/ChangeNotifications';
import { getUserReq, updateContactPreferencesReq } from '../../src/api/userAPI';
import { renderWithProviders } from './testUtils';
import { dialogActions } from '../../src/store/dialogSlice';
import { useWhatsAppEnabled } from '../../src/hooks/useWhatsAppEnabled';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock('../../src/api/userAPI', () => ({
  getUserReq: jest.fn(),
  updateContactPreferencesReq: jest.fn(),
}));
jest.mock('../../src/api/instances/authenticatedApi', () => ({
  renewToken: jest.fn(),
}));
jest.mock('../../src/hooks/useWhatsAppEnabled', () => ({
  useWhatsAppEnabled: jest.fn(),
}));

// WhatsApp is enabled on the platform unless a test says otherwise.
beforeEach(() => {
  (useWhatsAppEnabled as jest.Mock).mockReturnValue(true);
});

const buildUser = (phoneConfirmed: boolean) => ({
  id: 'user-1',
  account: { accountId: 'test@test.it' },
  profiles: [],
  contactPreferences: {
    subscribedToNewsletter: false,
    subscribedToWeekly: true,
    preferredChannels: phoneConfirmed ? ['email', 'whatsapp'] : ['email'],
  },
  contactInfos: [
    { id: 'ci-1', type: 'phone', phone: '+391234567890', confirmedAt: phoneConfirmed ? 1752000000 : 0 },
  ],
});

const openState = (user: unknown) => ({
  dialog: { config: { type: 'changeNotifications' } },
  user: { currentUser: user },
});

const whatsappCheckbox = () =>
  screen.getByLabelText('dialogs:changeNotifications.channels.whatsapp') as HTMLInputElement;
const emailCheckbox = () =>
  screen.getByLabelText('dialogs:changeNotifications.channels.email') as HTMLInputElement;

describe('ChangeNotifications dialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not allow enabling the WhatsApp channel when the phone is not verified', async () => {
    const user = buildUser(false);
    (getUserReq as jest.Mock).mockResolvedValue({ data: user });
    renderWithProviders(<ChangeNotifications />, openState(user));

    await waitFor(() => expect(getUserReq).toHaveBeenCalled());
    expect(screen.getByText('dialogs:changeNotifications.channels.whatsappDisabled')).toBeInTheDocument();

    fireEvent.click(whatsappCheckbox());
    await waitFor(() => expect(whatsappCheckbox().checked).toBe(false));
  });

  it('enables the WhatsApp channel when the phone is verified', async () => {
    const user = buildUser(true);
    (getUserReq as jest.Mock).mockResolvedValue({ data: user });
    renderWithProviders(<ChangeNotifications />, openState(user));

    await waitFor(() => expect(getUserReq).toHaveBeenCalled());
    expect(whatsappCheckbox()).not.toBeDisabled();
    expect(whatsappCheckbox().checked).toBe(true);
  });

  it('never allows unchecking the last remaining channel', async () => {
    const user = buildUser(true);
    (getUserReq as jest.Mock).mockResolvedValue({ data: user });
    renderWithProviders(<ChangeNotifications />, openState(user));
    await waitFor(() => expect(getUserReq).toHaveBeenCalled());

    // both channels start enabled: unchecking whatsapp is allowed
    fireEvent.click(whatsappCheckbox());
    await waitFor(() => expect(whatsappCheckbox().checked).toBe(false));

    // email is now the last channel: unchecking it must be ignored
    fireEvent.click(emailCheckbox());
    await waitFor(() => expect(emailCheckbox().checked).toBe(true));
  });

  it('tells the participant when saving the settings fails', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const user = buildUser(true);
    (getUserReq as jest.Mock).mockResolvedValue({ data: user });
    (updateContactPreferencesReq as jest.Mock).mockRejectedValue({
      response: { status: 500, data: { error: 'database unavailable' } },
      config: { headers: { Authorization: 'Bearer super-secret-access-token' } },
    });
    const { store } = renderWithProviders(<ChangeNotifications />, openState(user));
    await waitFor(() => expect(getUserReq).toHaveBeenCalled());

    fireEvent.click(whatsappCheckbox());
    fireEvent.click(screen.getByText('changeNotifications.submitBtn'));

    expect(await screen.findByText('changeNotifications.errors.unknown')).toBeInTheDocument();
    // The dialog stays open on a failure: closing it would read as a save that worked.
    const state = store.getState() as { dialog: { config?: { type?: string } } };
    expect(state.dialog.config?.type).toBe('changeNotifications');
    consoleError.mockRestore();
  });

  it('keeps the failed request out of the console', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const user = buildUser(true);
    (getUserReq as jest.Mock).mockResolvedValue({ data: user });
    (updateContactPreferencesReq as jest.Mock).mockRejectedValue({
      response: { status: 500, data: { error: 'database unavailable' } },
      config: { headers: { Authorization: 'Bearer super-secret-access-token' } },
    });
    renderWithProviders(<ChangeNotifications />, openState(user));
    await waitFor(() => expect(getUserReq).toHaveBeenCalled());

    fireEvent.click(whatsappCheckbox());
    fireEvent.click(screen.getByText('changeNotifications.submitBtn'));

    await screen.findByText('changeNotifications.errors.unknown');
    expect(consoleError).toHaveBeenCalledWith('saving the notification settings failed', {
      status: 500,
      error: 'database unavailable',
    });
    expect(JSON.stringify(consoleError.mock.calls)).not.toContain('super-secret-access-token');
    consoleError.mockRestore();
  });

  it('clears the error banner when the dialog is opened again', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const user = buildUser(true);
    (getUserReq as jest.Mock).mockResolvedValue({ data: user });
    (updateContactPreferencesReq as jest.Mock).mockRejectedValue({
      response: { status: 500, data: { error: 'database unavailable' } },
    });
    const { store } = renderWithProviders(<ChangeNotifications />, openState(user));
    await waitFor(() => expect(getUserReq).toHaveBeenCalled());

    fireEvent.click(whatsappCheckbox());
    fireEvent.click(screen.getByText('changeNotifications.submitBtn'));
    await screen.findByText('changeNotifications.errors.unknown');

    // The banner belongs to the save that failed, not to the dialog: reopening starts over.
    act(() => {
      store.dispatch(dialogActions.closeDialog());
    });
    act(() => {
      store.dispatch(dialogActions.openDialogWithoutPayload({ type: 'changeNotifications' }));
    });

    await waitFor(() =>
      expect(screen.queryByText('changeNotifications.errors.unknown')).toBeNull(),
    );
    consoleError.mockRestore();
  });

  it('submits the selected channels', async () => {
    const user = buildUser(true);
    (getUserReq as jest.Mock).mockResolvedValue({ data: user });
    (updateContactPreferencesReq as jest.Mock).mockResolvedValue({ data: user });
    renderWithProviders(<ChangeNotifications />, openState(user));
    await waitFor(() => expect(getUserReq).toHaveBeenCalled());

    fireEvent.click(whatsappCheckbox());
    fireEvent.click(screen.getByText('changeNotifications.submitBtn'));

    await waitFor(() => expect(updateContactPreferencesReq).toHaveBeenCalledTimes(1));
    const sentPrefs = (updateContactPreferencesReq as jest.Mock).mock.calls[0][0];
    expect(sentPrefs.preferredChannels).toEqual(['email']);
    expect(sentPrefs.subscribedToWeekly).toBe(true);
  });
});

describe('ChangeNotifications channel checkboxes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('disables the WhatsApp checkbox itself while the phone is unverified', async () => {
    // The handler already refuses the change, but the control stayed operable: it took a click
    // to find out, and assistive technology was told nothing. The attribute is what says it.
    const user = buildUser(false);
    (getUserReq as jest.Mock).mockResolvedValue({ data: user });
    renderWithProviders(<ChangeNotifications />, openState(user));

    await waitFor(() => expect(getUserReq).toHaveBeenCalled());
    expect(whatsappCheckbox()).toBeDisabled();
  });

  it('disables the email checkbox while it is the only channel left', async () => {
    const user = buildUser(false);
    (getUserReq as jest.Mock).mockResolvedValue({ data: user });
    renderWithProviders(<ChangeNotifications />, openState(user));

    await waitFor(() => expect(getUserReq).toHaveBeenCalled());
    expect(emailCheckbox()).toBeDisabled();
  });

  it('leaves both checkboxes operable once the phone is verified', async () => {
    const user = buildUser(true);
    (getUserReq as jest.Mock).mockResolvedValue({ data: user });
    renderWithProviders(<ChangeNotifications />, openState(user));

    await waitFor(() => expect(getUserReq).toHaveBeenCalled());
    expect(whatsappCheckbox()).not.toBeDisabled();
    expect(emailCheckbox()).not.toBeDisabled();
  });
});

describe('ChangeNotifications with WhatsApp disabled on the platform', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useWhatsAppEnabled as jest.Mock).mockReturnValue(false);
  });

  const queryWhatsappCheckbox = () =>
    screen.queryByLabelText('dialogs:changeNotifications.channels.whatsapp');

  it('does not offer the WhatsApp channel or its hints to a verified phone', async () => {
    const user = buildUser(true);
    (getUserReq as jest.Mock).mockResolvedValue({ data: user });
    renderWithProviders(<ChangeNotifications />, openState(user));

    await waitFor(() => expect(getUserReq).toHaveBeenCalled());
    expect(queryWhatsappCheckbox()).toBeNull();
    expect(screen.queryByText('dialogs:changeNotifications.channels.note')).toBeNull();
    expect(screen.queryByText('dialogs:changeNotifications.channels.whatsappDisabled')).toBeNull();
    expect(emailCheckbox()).toBeInTheDocument();
  });

  it('does not offer the WhatsApp channel or its hints to an unverified phone', async () => {
    const user = buildUser(false);
    (getUserReq as jest.Mock).mockResolvedValue({ data: user });
    renderWithProviders(<ChangeNotifications />, openState(user));

    await waitFor(() => expect(getUserReq).toHaveBeenCalled());
    expect(queryWhatsappCheckbox()).toBeNull();
    expect(screen.queryByText('dialogs:changeNotifications.channels.whatsappDisabled')).toBeNull();
  });

  it('keeps email, the only channel on offer, from being unchecked', async () => {
    // The stored preferences still list whatsapp, but a channel the participant cannot see
    // must not count as the one left when email is switched off.
    const user = buildUser(true);
    (getUserReq as jest.Mock).mockResolvedValue({ data: user });
    renderWithProviders(<ChangeNotifications />, openState(user));
    await waitFor(() => expect(getUserReq).toHaveBeenCalled());

    expect(emailCheckbox()).toBeDisabled();
    fireEvent.click(emailCheckbox());
    await waitFor(() => expect(emailCheckbox().checked).toBe(true));
  });

  it('saves the stored channels as they are', async () => {
    const user = buildUser(true);
    (getUserReq as jest.Mock).mockResolvedValue({ data: user });
    (updateContactPreferencesReq as jest.Mock).mockResolvedValue({ data: user });
    renderWithProviders(<ChangeNotifications />, openState(user));
    await waitFor(() => expect(getUserReq).toHaveBeenCalled());

    fireEvent.click(screen.getByLabelText('dialogs:changeNotifications.newsletter.label'));
    fireEvent.click(screen.getByText('changeNotifications.submitBtn'));

    await waitFor(() => expect(updateContactPreferencesReq).toHaveBeenCalledTimes(1));
    const sentPrefs = (updateContactPreferencesReq as jest.Mock).mock.calls[0][0];
    expect(sentPrefs.preferredChannels).toEqual(['email', 'whatsapp']);
    expect(sentPrefs.subscribedToNewsletter).toBe(true);
  });
});
