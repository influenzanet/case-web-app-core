/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, screen } from '@testing-library/react';

import AddPhone from '../../src/components/dialogs/GlobalDialogs/AddPhone';
import { newAccountPhoneReq } from '../../src/api/userAPI';
import { renderWithProviders } from './testUtils';

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
