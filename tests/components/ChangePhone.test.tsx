/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';

import { act } from 'react-dom/test-utils';
import ChangePhone from '../../src/components/dialogs/GlobalDialogs/ChangePhone';
import { changeAccountPhoneReq, getUserReq } from '../../src/api/userAPI';
import { renderWithProviders } from './testUtils';
import { dialogActions } from '../../src/store/dialogSlice';

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
    target: { value: '3316221419' },
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
    expect(changeAccountPhoneReq).toHaveBeenCalledWith('+393316221419');
  });

  it('maps the recipient-not-allowed error to a translated message', async () => {
    (changeAccountPhoneReq as jest.Mock).mockRejectedValue({
      response: { data: { error: 'phone number not enabled to receive WhatsApp messages' } },
    });
    renderWithProviders(<ChangePhone />, openDialogState);
    await fillAndSubmitPhone();
    expect(await screen.findByText('changePhone.errors.recipientNotAllowed')).toBeInTheDocument();
  });

  it('tells the participant there is no number to change', async () => {
    (changeAccountPhoneReq as jest.Mock).mockRejectedValue({
      response: { status: 400, data: { error: 'user has no phone number to edit' } },
    });
    renderWithProviders(<ChangePhone />, openDialogState);
    await fillAndSubmitPhone();
    expect(await screen.findByText('changePhone.errors.noPhone')).toBeInTheDocument();
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

describe('ChangePhone dialog shared phone input', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const typeNumber = (value: string) =>
    fireEvent.change(screen.getByPlaceholderText('dialogs:changePhone.phoneInputPlaceholder'), {
      target: { value },
    });

  it('keeps submit disabled for an invalid number and enables it once valid', () => {
    renderWithProviders(<ChangePhone />, openDialogState);
    const submit = screen.getByText('changePhone.confirmBtn').closest('button');
    expect(submit).toBeDisabled();
    typeNumber('1234567890');
    expect(submit).toBeDisabled();
    typeNumber('3316221419');
    expect(submit).not.toBeDisabled();
  });

  it('sends the E.164 number for a UK number selected via the prefix', async () => {
    (changeAccountPhoneReq as jest.Mock).mockResolvedValue({ status: 500 });
    const { baseElement } = renderWithProviders(<ChangePhone />, openDialogState);
    fireEvent.change(baseElement.querySelector('select') as HTMLSelectElement, {
      target: { value: '+44' },
    });
    typeNumber('7911 123456');
    fireEvent.click(screen.getByText('changePhone.confirmBtn'));
    fireEvent.click(await screen.findByText('changePhone.warningDialog.confirmBtn'));
    expect(changeAccountPhoneReq).toHaveBeenCalledWith('+447911123456');
  });

  it('starts empty after the dialog is closed and opened again', () => {
    const { store, baseElement } = renderWithProviders(<ChangePhone />, openDialogState);
    fireEvent.change(baseElement.querySelector('select') as HTMLSelectElement, {
      target: { value: '+44' },
    });
    typeNumber('7911123456');
    expect(screen.getByPlaceholderText('dialogs:changePhone.phoneInputPlaceholder')).toHaveValue(
      '7911123456',
    );

    act(() => {
      store.dispatch(dialogActions.closeDialog());
    });
    act(() => {
      store.dispatch(dialogActions.openDialogWithoutPayload({ type: 'changePhone' }));
    });

    const input = screen.getByPlaceholderText('dialogs:changePhone.phoneInputPlaceholder');
    expect(input).toHaveValue('');
    expect((baseElement.querySelector('select') as HTMLSelectElement).value).toBe('+39');
    expect(screen.getByText('changePhone.confirmBtn').closest('button')).toBeDisabled();
  });
});

describe('ChangePhone confirm button while the request is running', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('names itself while the new number is being saved', async () => {
    let releaseRequest: () => void = () => undefined;
    (changeAccountPhoneReq as jest.Mock).mockImplementation(
      () => new Promise<{ status: number }>((resolve) => {
        releaseRequest = () => resolve({ status: 200 });
      }),
    );
    renderWithProviders(<ChangePhone />, openDialogState);

    await fillAndSubmitPhone();

    expect(await screen.findByRole('button', { name: 'loadingMsg' })).toBeInTheDocument();
    releaseRequest();
  });

  it('refuses a second click while the first request is still running', async () => {
    let releaseRequest: () => void = () => undefined;
    (changeAccountPhoneReq as jest.Mock).mockImplementation(
      () => new Promise<{ status: number }>((resolve) => {
        releaseRequest = () => resolve({ status: 200 });
      }),
    );
    renderWithProviders(<ChangePhone />, openDialogState);

    await fillAndSubmitPhone();
    const submitButton = await screen.findByRole('button', { name: 'loadingMsg' });
    expect(submitButton).toBeDisabled();
    fireEvent.click(submitButton);

    expect(changeAccountPhoneReq).toHaveBeenCalledTimes(1);
    releaseRequest();
  });
});
