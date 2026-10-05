/**
 * @jest-environment jsdom
 */
import React from 'react';
import { screen } from '@testing-library/react';

import PhoneVerificationBanner from '../../src/components/banners/PhoneVerificationBanner';
import { useWhatsAppEnabled } from '../../src/hooks/useWhatsAppEnabled';
import { renderWithProviders } from './testUtils';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock('react-router-dom', () => ({
  useHistory: () => ({ push: jest.fn() }),
}));
jest.mock('../../src/hooks/useIsAuthenticated', () => ({
  useIsAuthenticated: () => true,
}));
jest.mock('../../src/hooks/useWhatsAppEnabled', () => ({
  useWhatsAppEnabled: jest.fn(),
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

describe('PhoneVerificationBanner and the platform WhatsApp switch', () => {
  it('asks to verify an unverified phone when WhatsApp is enabled', () => {
    (useWhatsAppEnabled as jest.Mock).mockReturnValue(true);
    renderWithProviders(<PhoneVerificationBanner />, stateWithUnverifiedPhone);
    expect(screen.getByText('phoneVerificationBanner.title')).toBeInTheDocument();
  });

  it('renders nothing when WhatsApp is disabled', () => {
    (useWhatsAppEnabled as jest.Mock).mockReturnValue(false);
    const { container } = renderWithProviders(<PhoneVerificationBanner />, stateWithUnverifiedPhone);
    expect(container).toBeEmptyDOMElement();
  });
});
