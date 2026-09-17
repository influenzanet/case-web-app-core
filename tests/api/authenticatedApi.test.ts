/**
 * @jest-environment jsdom
 */
export {};

// The module builds its axios instance when it is imported, so the instance is replaced before
// the import and the request interceptor is captured from it.
const mockPost = jest.fn();
const mockRequestHandlers: {
  onFulfilled: (config: unknown) => Promise<unknown>;
  onRejected: (error: unknown) => Promise<unknown>;
}[] = [];
const mockAxiosInstance = {
  defaults: { headers: { common: {} as Record<string, string> } },
  interceptors: {
    request: {
      use: (
        onFulfilled: (config: unknown) => Promise<unknown>,
        onRejected: (error: unknown) => Promise<unknown>,
      ) => {
        mockRequestHandlers.push({ onFulfilled, onRejected });
      },
    },
  },
  post: mockPost,
};

jest.mock('axios', () => ({
  __esModule: true,
  default: { create: () => mockAxiosInstance },
}));

const mockGetState = jest.fn();
jest.mock('../../src/store/store', () => ({
  __esModule: true,
  default: {
    getState: () => mockGetState(),
    dispatch: jest.fn(),
  },
  resetStore: jest.fn(),
}));

describe('authenticated api request interceptor', () => {
  beforeAll(() => {
    // Required here, not imported at the top, so the mocks above are in place first.
    require('../../src/api/instances/authenticatedApi');
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('logs a failed token renewal without the request that carries the access token', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    // An expiry in the past sends the interceptor through the renewal it is meant to fail at.
    mockGetState.mockReturnValue({ app: { auth: { refreshToken: 'refresh-token', expiresAt: 1 } } });
    mockPost.mockRejectedValue({
      response: { status: 401, data: { error: 'invalid refresh token' } },
      config: {
        headers: { Authorization: 'Bearer super-secret-access-token' },
        data: '{"phone":"+391234567890"}',
      },
    });

    await mockRequestHandlers[0].onFulfilled({
      url: '/v1/user/contact/add-phone',
      headers: {},
    });

    expect(consoleError).toHaveBeenCalledWith('renewing the access token failed', {
      status: 401,
      error: 'invalid refresh token',
    });
    const logged = JSON.stringify(consoleError.mock.calls);
    expect(logged).not.toContain('super-secret-access-token');
    expect(logged).not.toContain('+391234567890');
    consoleError.mockRestore();
  });

  it('logs a renewal that never reached the backend by its message alone', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    mockGetState.mockReturnValue({ app: { auth: { refreshToken: '', expiresAt: 1 } } });

    await mockRequestHandlers[0].onFulfilled({ url: '/v1/user', headers: {} });

    expect(consoleError).toHaveBeenCalledWith('renewing the access token failed', 'no valid tokens');
    consoleError.mockRestore();
  });
});
