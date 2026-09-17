/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';

import AddPhone from '../../src/components/dialogs/GlobalDialogs/AddPhone';
import { getUserReq, newAccountPhoneReq } from '../../src/api/userAPI';
import { renderWithProviders } from './testUtils';
import COUNTRY_CODES from '../../src/configs/countryCodes.json';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock('../../src/api/userAPI', () => ({
  newAccountPhoneReq: jest.fn(),
  getUserReq: jest.fn(),
}));
jest.mock('../../src/api/instances/authenticatedApi', () => ({
  renewToken: jest.fn(),
}));

const openDialogState = {
  dialog: {
    config: { type: 'addPhone' },
  },
};

const fillAndSubmitPhone = async () => {
  fireEvent.change(screen.getByPlaceholderText('dialogs:addPhone.phoneInputPlaceholder'), {
    target: { value: '1234567890' },
  });
  fireEvent.click(screen.getByText('addPhone.confirmBtn'));
  fireEvent.click(await screen.findByText('addPhone.warningDialog.confirmBtn'));
};

describe('AddPhone dialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('offers exactly the prefixes from the shared countryCodes config', () => {
    renderWithProviders(<AddPhone />, openDialogState);
    const options = document.querySelectorAll('select option');
    expect(options.length).toBe(COUNTRY_CODES.length);
  });

  it('shows the composed full number and enables submit only from 8 digits', () => {
    renderWithProviders(<AddPhone />, openDialogState);
    const submit = screen.getByText('addPhone.confirmBtn').closest('button');
    expect(submit).toBeDisabled();
    fireEvent.change(screen.getByPlaceholderText('dialogs:addPhone.phoneInputPlaceholder'), {
      target: { value: '1234567890' },
    });
    expect(screen.getByText(/\+391234567890/)).toBeInTheDocument();
    expect(submit).not.toBeDisabled();
  });

  it('sends the full number including the selected prefix', async () => {
    (newAccountPhoneReq as jest.Mock).mockResolvedValue({ status: 500 });
    renderWithProviders(<AddPhone />, openDialogState);
    await fillAndSubmitPhone();
    expect(newAccountPhoneReq).toHaveBeenCalledWith('+391234567890');
  });

  it('sends a pasted number that already carries its prefix without duplicating it', async () => {
    (newAccountPhoneReq as jest.Mock).mockResolvedValue({ status: 500 });
    renderWithProviders(<AddPhone />, openDialogState);
    fireEvent.change(screen.getByPlaceholderText('dialogs:addPhone.phoneInputPlaceholder'), {
      target: { value: '+393316221419' },
    });
    expect((document.querySelector('select') as HTMLSelectElement).value).toBe('+39');
    fireEvent.click(screen.getByText('addPhone.confirmBtn'));
    fireEvent.click(await screen.findByText('addPhone.warningDialog.confirmBtn'));
    expect(newAccountPhoneReq).toHaveBeenCalledWith('+393316221419');
  });
});

describe('AddPhone dialog error mapping', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('maps the recipient-not-allowed error to a translated message', async () => {
    (newAccountPhoneReq as jest.Mock).mockRejectedValue({
      response: { data: { error: 'phone number not enabled to receive WhatsApp messages' } },
    });
    renderWithProviders(<AddPhone />, openDialogState);
    await fillAndSubmitPhone();
    expect(await screen.findByText('addPhone.errors.recipientNotAllowed')).toBeInTheDocument();
  });

  it('maps the rate limit error to a translated message', async () => {
    (newAccountPhoneReq as jest.Mock).mockRejectedValue({
      response: { data: { error: 'too many phone verification attempts, try again later' } },
    });
    renderWithProviders(<AddPhone />, openDialogState);
    await fillAndSubmitPhone();
    expect(await screen.findByText('addPhone.errors.rateLimit')).toBeInTheDocument();
  });

  it('names the failure when the code could not be sent', async () => {
    (newAccountPhoneReq as jest.Mock).mockRejectedValue({
      response: { status: 500, data: { error: 'failed to send verification code' } },
    });
    (getUserReq as jest.Mock).mockResolvedValue({ data: { id: 'user-1' } });
    renderWithProviders(<AddPhone />, openDialogState);
    await fillAndSubmitPhone();
    expect(await screen.findByText('addPhone.errors.sendFailed')).toBeInTheDocument();
  });

  it('names the pending phone left by an earlier attempt', async () => {
    (newAccountPhoneReq as jest.Mock).mockRejectedValue({
      response: { status: 400, data: { error: 'user already has a phone number' } },
    });
    (getUserReq as jest.Mock).mockResolvedValue({ data: { id: 'user-1' } });
    renderWithProviders(<AddPhone />, openDialogState);
    await fillAndSubmitPhone();
    expect(await screen.findByText('addPhone.errors.alreadyHasPhone')).toBeInTheDocument();
  });
});

describe('AddPhone dialog verification state errors', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('asks for a new code when the number is no longer the one waiting to be verified', async () => {
    (newAccountPhoneReq as jest.Mock).mockRejectedValue({
      response: { status: 400, data: { error: 'phone number is not pending verification' } },
    });
    (getUserReq as jest.Mock).mockResolvedValue({ data: { id: 'user-1' } });
    renderWithProviders(<AddPhone />, openDialogState);
    await fillAndSubmitPhone();
    expect(await screen.findByText('addPhone.errors.noPendingVerification')).toBeInTheDocument();
  });
});

describe('AddPhone dialog account refresh after a failure', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('reloads the account when the backend answered, since it may already hold the phone', async () => {
    const userWithPendingPhone = {
      id: 'user-1',
      account: { accountId: 'test@test.it' },
      profiles: [],
      contactInfos: [{ id: 'ci-1', type: 'phone', phone: '+391234567890', confirmedAt: 0 }],
    };
    (newAccountPhoneReq as jest.Mock).mockRejectedValue({
      response: { status: 500, data: { error: 'failed to send verification code' } },
    });
    (getUserReq as jest.Mock).mockResolvedValue({ data: userWithPendingPhone });

    const { store } = renderWithProviders(<AddPhone />, openDialogState);
    await fillAndSubmitPhone();

    await waitFor(() => expect(getUserReq).toHaveBeenCalledTimes(1));
    await waitFor(() => {
      const state = store.getState() as { user: { currentUser: unknown } };
      expect(state.user.currentUser).toEqual(userWithPendingPhone);
    });
  });

  it('does not reload the account when the request never reached the backend', async () => {
    (newAccountPhoneReq as jest.Mock).mockRejectedValue(new Error('network down'));
    renderWithProviders(<AddPhone />, openDialogState);
    await fillAndSubmitPhone();

    expect(await screen.findByText('addPhone.errors.unknown')).toBeInTheDocument();
    expect(getUserReq).not.toHaveBeenCalled();
  });
});
