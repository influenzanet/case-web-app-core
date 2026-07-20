/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';

import ChangeNotifications from '../../src/components/dialogs/GlobalDialogs/ChangeNotifications';
import { getUserReq, updateContactPreferencesReq } from '../../src/api/userAPI';
import { renderWithProviders } from './testUtils';

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
