/**
 * @jest-environment jsdom
 */
import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';

import AccountSettings from '../../src/components/settings/AccountSettings';
import { createTestStore } from '../components/testUtils';

// The real platform config reader and hook, with only the network replaced: a failed read must
// not hide the phone section for the rest of the page load.
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock('../../src/api/userAPI', () => ({
  resendWhatsAppCodeReq: jest.fn(),
  getUserReq: jest.fn(),
}));
jest.mock('../../src/hooks/useIsAuthenticated', () => ({
  useIsAuthenticated: () => true,
}));

const settle = async () => {
  await act(async () => {
    for (let i = 0; i < 20; i++) {
      await Promise.resolve();
    }
  });
};

const userWithoutPhone = {
  id: 'user-1',
  account: { accountId: 'test@test.it' },
  profiles: [],
  contactPreferences: { subscribedToNewsletter: false, subscribedToWeekly: true, preferredChannels: ['email'] },
  contactInfos: [{ id: 'ci-1', type: 'email', email: 'test@test.it', confirmedAt: 1752000000 }],
};

describe('WhatsApp switch read through a failure', () => {
  const originalFetch = (global as any).fetch;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    (global as any).fetch = originalFetch;
  });

  it('shows the phone section once a read after a failure succeeds', async () => {
    (global as any).fetch = jest
      .fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve({ whatsAppEnabled: true }) });
    const store = createTestStore({
      config: { instanceId: 'italy', instanceIdSet: true, languages: [], avatars: [] },
      user: { currentUser: userWithoutPhone },
    });
    render(
      <Provider store={store}>
        <AccountSettings itemKey="account" hideProfileSettings={true} />
      </Provider>,
    );

    await settle();
    expect((global as any).fetch).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('account.phone.btn')).toBeNull();

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    await settle();
    expect((global as any).fetch).toHaveBeenCalledTimes(2);
    expect(screen.getByText('account.phone.btn')).toBeInTheDocument();
  });
});
