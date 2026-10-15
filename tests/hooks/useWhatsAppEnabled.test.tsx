/**
 * @jest-environment jsdom
 */
import React, { useEffect } from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { Provider, useDispatch } from 'react-redux';

import { useWhatsAppEnabled } from '../../src/hooks/useWhatsAppEnabled';
import { isWhatsAppEnabled } from '../../src/utils/platformConfig';
import { createTestStore } from '../components/testUtils';
import { appConfig } from '../../src/store/configSlice';

jest.mock('../../src/utils/platformConfig', () => ({
  isWhatsAppEnabled: jest.fn(),
}));

const Probe: React.FC = () => <span data-testid="flag">{String(useWhatsAppEnabled())}</span>;

// Stands in for AppCore: dispatches the real instance id in its own effect, after the store
// starts out with the 'default' placeholder, with the probe mounted as its child.
const AppCoreLike: React.FC<{ instanceId: string }> = ({ instanceId }) => {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(appConfig.updateInstanceID(instanceId));
  }, [dispatch, instanceId]);
  return <Probe />;
};

const renderProbe = (instanceId = 'default') => {
  const store = createTestStore({ config: { instanceId, languages: [], avatars: [] } });
  return render(
    <Provider store={store}>
      <Probe />
    </Provider>,
  );
};

describe('useWhatsAppEnabled', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('starts hidden and turns on once the platform says WhatsApp is enabled', async () => {
    (isWhatsAppEnabled as jest.Mock).mockResolvedValue(true);
    renderProbe('italy');
    // The first render must not show anything that could disappear a moment later.
    expect(screen.getByTestId('flag').textContent).toBe('false');
    await act(async () => {
      jest.runOnlyPendingTimers();
    });
    await waitFor(() => expect(screen.getByTestId('flag').textContent).toBe('true'));
  });

  it('stays hidden when the platform says WhatsApp is disabled', async () => {
    (isWhatsAppEnabled as jest.Mock).mockResolvedValue(false);
    renderProbe('italy');
    await act(async () => {
      jest.runOnlyPendingTimers();
    });
    await waitFor(() => expect(isWhatsAppEnabled).toHaveBeenCalledTimes(1));
    expect(screen.getByTestId('flag').textContent).toBe('false');
  });

  it('stays hidden when the platform config read fails', async () => {
    // isWhatsAppEnabled itself never rejects: a failure is already folded into `false`.
    (isWhatsAppEnabled as jest.Mock).mockResolvedValue(false);
    renderProbe('italy');
    await act(async () => {
      jest.runOnlyPendingTimers();
    });
    await waitFor(() => expect(isWhatsAppEnabled).toHaveBeenCalledTimes(1));
    expect(screen.getByTestId('flag').textContent).toBe('false');
  });

  it('stays hidden while the platform config read is still loading', async () => {
    (isWhatsAppEnabled as jest.Mock).mockReturnValue(new Promise<boolean>(() => undefined));
    renderProbe('italy');
    await act(async () => {
      jest.runOnlyPendingTimers();
    });
    expect(screen.getByTestId('flag').textContent).toBe('false');
  });

  it('passes the instance id from the store to isWhatsAppEnabled', async () => {
    (isWhatsAppEnabled as jest.Mock).mockResolvedValue(true);
    renderProbe('italy');
    await act(async () => {
      jest.runOnlyPendingTimers();
    });
    expect(isWhatsAppEnabled).toHaveBeenCalledWith('italy');
  });

  it('refetches when the instance id changes', async () => {
    (isWhatsAppEnabled as jest.Mock).mockResolvedValue(true);
    const store = createTestStore({
      config: { instanceId: 'italy', languages: [], avatars: [] },
    });
    render(
      <Provider store={store}>
        <Probe />
      </Provider>,
    );
    await act(async () => {
      jest.runOnlyPendingTimers();
    });
    await waitFor(() => expect(isWhatsAppEnabled).toHaveBeenCalledTimes(1));

    act(() => {
      store.dispatch(appConfig.updateInstanceID('netherlands'));
    });
    // Resetting while the new instance is confirmed avoids showing the previous instance's flag.
    expect(screen.getByTestId('flag').textContent).toBe('false');
    await act(async () => {
      jest.runOnlyPendingTimers();
    });
    await waitFor(() => expect(isWhatsAppEnabled).toHaveBeenCalledTimes(2));
    expect(isWhatsAppEnabled).toHaveBeenLastCalledWith('netherlands');
  });

  it('does not update a component that has already gone away', async () => {
    let resolve: (value: boolean) => void = () => undefined;
    (isWhatsAppEnabled as jest.Mock).mockReturnValue(new Promise<boolean>((r) => { resolve = r; }));
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const { unmount } = renderProbe('italy');
    await act(async () => {
      jest.runOnlyPendingTimers();
    });
    unmount();
    resolve(true);
    await act(async () => {});
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('never calls isWhatsAppEnabled when unmounted before the deferred fetch fires', async () => {
    (isWhatsAppEnabled as jest.Mock).mockResolvedValue(true);
    const { unmount } = renderProbe('italy');
    unmount();
    await act(async () => {
      jest.runOnlyPendingTimers();
    });
    expect(isWhatsAppEnabled).not.toHaveBeenCalled();
  });

  it('calls isWhatsAppEnabled exactly once, with the real instance, when a parent dispatches it after the first render', async () => {
    (isWhatsAppEnabled as jest.Mock).mockResolvedValue(true);
    const store = createTestStore({
      config: { instanceId: 'default', languages: [], avatars: [] },
    });
    render(
      <Provider store={store}>
        <AppCoreLike instanceId="italy" />
      </Provider>,
    );
    await act(async () => {
      jest.runOnlyPendingTimers();
    });
    await waitFor(() => expect(isWhatsAppEnabled).toHaveBeenCalledTimes(1));
    expect(isWhatsAppEnabled).toHaveBeenCalledWith('italy');
  });
});
