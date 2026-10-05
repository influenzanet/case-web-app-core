/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

import { useWhatsAppEnabled } from '../../src/hooks/useWhatsAppEnabled';
import { isWhatsAppEnabled } from '../../src/utils/platformConfig';

jest.mock('../../src/utils/platformConfig', () => ({
  isWhatsAppEnabled: jest.fn(),
}));

const Probe: React.FC = () => <span data-testid="flag">{String(useWhatsAppEnabled())}</span>;

describe('useWhatsAppEnabled', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('starts hidden and turns on once the platform says WhatsApp is enabled', async () => {
    (isWhatsAppEnabled as jest.Mock).mockResolvedValue(true);
    render(<Probe />);
    // The first render must not show anything that could disappear a moment later.
    expect(screen.getByTestId('flag').textContent).toBe('false');
    await waitFor(() => expect(screen.getByTestId('flag').textContent).toBe('true'));
  });

  it('stays hidden when the platform says WhatsApp is disabled', async () => {
    (isWhatsAppEnabled as jest.Mock).mockResolvedValue(false);
    render(<Probe />);
    await waitFor(() => expect(isWhatsAppEnabled).toHaveBeenCalledTimes(1));
    await Promise.resolve();
    expect(screen.getByTestId('flag').textContent).toBe('false');
  });

  it('does not update a component that has already gone away', async () => {
    let resolve: (value: boolean) => void = () => undefined;
    (isWhatsAppEnabled as jest.Mock).mockReturnValue(new Promise<boolean>((r) => { resolve = r; }));
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const { unmount } = render(<Probe />);
    unmount();
    resolve(true);
    await Promise.resolve();
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
