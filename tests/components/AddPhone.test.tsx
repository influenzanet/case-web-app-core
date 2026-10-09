/**
 * @jest-environment jsdom
 */
import React from 'react';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';

import AddPhone from '../../src/components/dialogs/GlobalDialogs/AddPhone';
import { getUserReq, newAccountPhoneReq } from '../../src/api/userAPI';
import { renderWithProviders } from './testUtils';
import { dialogActions } from '../../src/store/dialogSlice';
import PhoneNumberInput from '../../src/components/inputs/PhoneNumberInput';
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

jest.mock('../../src/components/inputs/PhoneNumberInput', () => {
  const actual = jest.requireActual('../../src/components/inputs/PhoneNumberInput');
  return { __esModule: true, default: jest.fn(actual.default) };
});

const openDialogState = {
  dialog: {
    config: { type: 'addPhone' },
  },
};

const fillAndSubmitPhone = async () => {
  fireEvent.change(screen.getByPlaceholderText('dialogs:addPhone.phoneInputPlaceholder'), {
    target: { value: '3316221419' },
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

  it('shows the composed full number and enables submit once it is a valid number', () => {
    renderWithProviders(<AddPhone />, openDialogState);
    const submit = screen.getByText('addPhone.confirmBtn').closest('button');
    expect(submit).toBeDisabled();
    fireEvent.change(screen.getByPlaceholderText('dialogs:addPhone.phoneInputPlaceholder'), {
      target: { value: '3316221419' },
    });
    expect(screen.getByText(/\+393316221419/)).toBeInTheDocument();
    expect(submit).not.toBeDisabled();
  });

  it('sends the full number including the selected prefix', async () => {
    (newAccountPhoneReq as jest.Mock).mockResolvedValue({ status: 500 });
    renderWithProviders(<AddPhone />, openDialogState);
    await fillAndSubmitPhone();
    expect(newAccountPhoneReq).toHaveBeenCalledWith('+393316221419');
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

describe('AddPhone dialog shared phone input', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const typeNumber = (value: string) =>
    fireEvent.change(screen.getByPlaceholderText('dialogs:addPhone.phoneInputPlaceholder'), {
      target: { value },
    });

  it('delegates the phone field to the shared PhoneNumberInput', () => {
    renderWithProviders(<AddPhone />, openDialogState);
    expect(PhoneNumberInput).toHaveBeenCalled();
    const props = (PhoneNumberInput as unknown as jest.Mock).mock.calls[0][0];
    expect(props.label).toBe('dialogs:addPhone.phoneInputLabel');
    expect(props.placeholder).toBe('dialogs:addPhone.phoneInputPlaceholder');
    expect(props.autoFocus).toBe(true);
  });

  it('renders the shared PhoneNumberInput once, with its label, placeholder and focus', () => {
    const { baseElement } = renderWithProviders(<AddPhone />, openDialogState);
    expect(baseElement.querySelectorAll('select').length).toBe(1);
    expect(baseElement.querySelectorAll('input[type="text"]').length).toBe(1);
    expect(screen.getByText('dialogs:addPhone.phoneInputLabel')).toBeInTheDocument();
    expect(screen.getAllByText(/addPhone\.completeNumber/).length).toBe(1);
    expect(screen.getByPlaceholderText('dialogs:addPhone.phoneInputPlaceholder')).toHaveFocus();
  });

  it('prefixes a typed number with the selected country code', async () => {
    (newAccountPhoneReq as jest.Mock).mockResolvedValue({ status: 500 });
    const { baseElement } = renderWithProviders(<AddPhone />, openDialogState);
    fireEvent.change(baseElement.querySelector('select') as HTMLSelectElement, {
      target: { value: '+44' },
    });
    typeNumber('7911123456');
    fireEvent.click(screen.getByText('addPhone.confirmBtn'));
    fireEvent.click(await screen.findByText('addPhone.warningDialog.confirmBtn'));
    expect(newAccountPhoneReq).toHaveBeenCalledWith('+447911123456');
  });

  it('does not duplicate the prefix of a pasted international number', async () => {
    (newAccountPhoneReq as jest.Mock).mockResolvedValue({ status: 500 });
    const { baseElement } = renderWithProviders(<AddPhone />, openDialogState);
    typeNumber('+393316221419');
    expect((baseElement.querySelector('select') as HTMLSelectElement).value).toBe('+39');
    expect(screen.getByPlaceholderText('dialogs:addPhone.phoneInputPlaceholder')).toHaveValue(
      '3316221419',
    );
    fireEvent.click(screen.getByText('addPhone.confirmBtn'));
    fireEvent.click(await screen.findByText('addPhone.warningDialog.confirmBtn'));
    expect(newAccountPhoneReq).toHaveBeenCalledTimes(1);
    expect(newAccountPhoneReq).toHaveBeenCalledWith('+393316221419');
  });

  it('accepts a number typed with the 00 international prefix', async () => {
    (newAccountPhoneReq as jest.Mock).mockResolvedValue({ status: 500 });
    const { baseElement } = renderWithProviders(<AddPhone />, openDialogState);
    typeNumber('00447911123456');
    expect((baseElement.querySelector('select') as HTMLSelectElement).value).toBe('+44');
    fireEvent.click(screen.getByText('addPhone.confirmBtn'));
    fireEvent.click(await screen.findByText('addPhone.warningDialog.confirmBtn'));
    expect(newAccountPhoneReq).toHaveBeenCalledWith('+447911123456');
  });

  it('sends the E.164 number for a number typed with spaces', async () => {
    (newAccountPhoneReq as jest.Mock).mockResolvedValue({ status: 500 });
    renderWithProviders(<AddPhone />, openDialogState);
    typeNumber('331 622 1419');
    fireEvent.click(screen.getByText('addPhone.confirmBtn'));
    fireEvent.click(await screen.findByText('addPhone.warningDialog.confirmBtn'));
    expect(newAccountPhoneReq).toHaveBeenCalledWith('+393316221419');
  });

  it('opens the verification dialog for the number the shared input composed', async () => {
    (newAccountPhoneReq as jest.Mock).mockResolvedValue({ status: 200, data: { id: 'user-1', profiles: [] } });
    const { store } = renderWithProviders(<AddPhone />, openDialogState);
    typeNumber('+393316221419');
    fireEvent.click(screen.getByText('addPhone.confirmBtn'));
    fireEvent.click(await screen.findByText('addPhone.warningDialog.confirmBtn'));
    await waitFor(() => {
      expect(store.getState().dialog.config?.type).toBe('verifyWhatsApp');
    });
    expect((store.getState().dialog.config as { payload?: { phoneNumber?: string } }).payload?.phoneNumber).toBe(
      '+393316221419',
    );
  });

  it('keeps submit disabled for an invalid number and enables it once valid', () => {
    renderWithProviders(<AddPhone />, openDialogState);
    const submit = screen.getByText('addPhone.confirmBtn').closest('button');
    expect(submit).toBeDisabled();
    typeNumber('331622');
    expect(submit).toBeDisabled();
    typeNumber('3316221419');
    expect(submit).not.toBeDisabled();
    typeNumber('+39123');
    expect(submit).toBeDisabled();
    typeNumber('+393316221419');
    expect(submit).not.toBeDisabled();
    typeNumber('');
    expect(submit).toBeDisabled();
  });

  it('starts empty after the dialog is closed and opened again', () => {
    const { store, baseElement } = renderWithProviders(<AddPhone />, openDialogState);
    fireEvent.change(baseElement.querySelector('select') as HTMLSelectElement, {
      target: { value: '+44' },
    });
    typeNumber('7911123456');
    expect(screen.getByPlaceholderText('dialogs:addPhone.phoneInputPlaceholder')).toHaveValue(
      '7911123456',
    );

    act(() => {
      store.dispatch(dialogActions.closeDialog());
    });
    act(() => {
      store.dispatch(dialogActions.openDialogWithoutPayload({ type: 'addPhone' }));
    });

    const input = screen.getByPlaceholderText('dialogs:addPhone.phoneInputPlaceholder');
    expect(input).toHaveValue('');
    expect((baseElement.querySelector('select') as HTMLSelectElement).value).toBe('+39');
    expect(screen.getByText('addPhone.confirmBtn').closest('button')).toBeDisabled();
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

describe('AddPhone confirm button while the request is running', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('names itself while the number is being saved', async () => {
    let releaseRequest: () => void = () => undefined;
    (newAccountPhoneReq as jest.Mock).mockImplementation(
      () => new Promise<{ status: number }>((resolve) => {
        releaseRequest = () => resolve({ status: 200 });
      }),
    );
    renderWithProviders(<AddPhone />, openDialogState);

    await fillAndSubmitPhone();

    expect(await screen.findByRole('button', { name: 'loadingMsg' })).toBeInTheDocument();
    releaseRequest();
  });

  it('refuses a second click while the first request is still running', async () => {
    let releaseRequest: () => void = () => undefined;
    (newAccountPhoneReq as jest.Mock).mockImplementation(
      () => new Promise<{ status: number }>((resolve) => {
        releaseRequest = () => resolve({ status: 200 });
      }),
    );
    renderWithProviders(<AddPhone />, openDialogState);

    await fillAndSubmitPhone();
    const submitButton = await screen.findByRole('button', { name: 'loadingMsg' });
    expect(submitButton).toBeDisabled();
    fireEvent.click(submitButton);

    expect(newAccountPhoneReq).toHaveBeenCalledTimes(1);
    releaseRequest();
  });
});
