/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';

import ChangePhone from '../../src/components/dialogs/GlobalDialogs/ChangePhone';
import { changeAccountPhoneReq, getUserReq } from '../../src/api/userAPI';
import { renderWithProviders } from './testUtils';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock('../../src/api/userAPI', () => ({
  changeAccountPhoneReq: jest.fn(),
  getUserReq: jest.fn(),
}));
jest.mock('../../src/api/instances/authenticatedApi', () => ({
  renewToken: jest.fn(),
}));

const openDialogState = {
  dialog: {
    config: { type: 'changePhone' },
  },
};

const fillAndSubmitPhone = async () => {
  fireEvent.change(screen.getByPlaceholderText('dialogs:changePhone.phoneInputPlaceholder'), {
    target: { value: '1234567890' },
  });
  fireEvent.click(screen.getByText('changePhone.confirmBtn'));
  fireEvent.click(await screen.findByText('changePhone.warningDialog.confirmBtn'));
};

describe('ChangePhone dialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sends the full number including the selected prefix', async () => {
    (changeAccountPhoneReq as jest.Mock).mockResolvedValue({ status: 500 });
    renderWithProviders(<ChangePhone />, openDialogState);
    await fillAndSubmitPhone();
    expect(changeAccountPhoneReq).toHaveBeenCalledWith('+391234567890');
  });

  it('maps the recipient-not-allowed error to a translated message', async () => {
    (changeAccountPhoneReq as jest.Mock).mockRejectedValue({
      response: { data: { error: 'phone number not enabled to receive WhatsApp messages' } },
    });
    renderWithProviders(<ChangePhone />, openDialogState);
    await fillAndSubmitPhone();
    expect(await screen.findByText('changePhone.errors.recipientNotAllowed')).toBeInTheDocument();
  });

  it('maps the rate limit error to a translated message', async () => {
    (changeAccountPhoneReq as jest.Mock).mockRejectedValue({
      response: { data: { error: 'too many phone verification attempts, try again later' } },
    });
    renderWithProviders(<ChangePhone />, openDialogState);
    await fillAndSubmitPhone();
    expect(await screen.findByText('changePhone.errors.rateLimit')).toBeInTheDocument();
  });

  it('names the failure when the code could not be sent', async () => {
    (changeAccountPhoneReq as jest.Mock).mockRejectedValue({
      response: { status: 500, data: { error: 'failed to send verification code' } },
    });
    (getUserReq as jest.Mock).mockResolvedValue({ data: { id: 'user-1' } });
    renderWithProviders(<ChangePhone />, openDialogState);
    await fillAndSubmitPhone();
    expect(await screen.findByText('changePhone.errors.sendFailed')).toBeInTheDocument();
  });

  it('reloads the account when the backend answered, since it may already hold the new number', async () => {
    const userWithPendingPhone = {
      id: 'user-1',
      account: { accountId: 'test@test.it' },
      profiles: [],
      contactInfos: [{ id: 'ci-1', type: 'phone', phone: '+391234567890', confirmedAt: 0 }],
    };
    (changeAccountPhoneReq as jest.Mock).mockRejectedValue({
      response: { status: 500, data: { error: 'failed to send verification code' } },
    });
    (getUserReq as jest.Mock).mockResolvedValue({ data: userWithPendingPhone });

    const { store } = renderWithProviders(<ChangePhone />, openDialogState);
    await fillAndSubmitPhone();

    await waitFor(() => expect(getUserReq).toHaveBeenCalledTimes(1));
    await waitFor(() => {
      const state = store.getState() as { user: { currentUser: unknown } };
      expect(state.user.currentUser).toEqual(userWithPendingPhone);
    });
  });

  it('does not reload the account when the request never reached the backend', async () => {
    (changeAccountPhoneReq as jest.Mock).mockRejectedValue(new Error('network down'));
    renderWithProviders(<ChangePhone />, openDialogState);
    await fillAndSubmitPhone();

    expect(await screen.findByText('changePhone.errors.unknown')).toBeInTheDocument();
    expect(getUserReq).not.toHaveBeenCalled();
  });

  it('asks for a new code when the number is no longer the one waiting to be verified', async () => {
    (changeAccountPhoneReq as jest.Mock).mockRejectedValue({
      response: { status: 400, data: { error: 'phone number is not pending verification' } },
    });
    renderWithProviders(<ChangePhone />, openDialogState);
    await fillAndSubmitPhone();
    expect(await screen.findByText('changePhone.errors.noPendingVerification')).toBeInTheDocument();
  });
});
