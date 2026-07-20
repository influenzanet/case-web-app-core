/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, screen } from '@testing-library/react';

import AddPhone from '../../src/components/dialogs/GlobalDialogs/AddPhone';
import { newAccountPhoneReq } from '../../src/api/userAPI';
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
});
