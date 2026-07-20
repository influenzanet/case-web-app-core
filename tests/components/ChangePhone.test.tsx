/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, screen } from '@testing-library/react';

import ChangePhone from '../../src/components/dialogs/GlobalDialogs/ChangePhone';
import { changeAccountPhoneReq } from '../../src/api/userAPI';
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
});
