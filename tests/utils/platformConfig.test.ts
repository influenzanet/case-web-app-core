/**
 * @jest-environment jsdom
 */
export {};

type Reader = typeof import('../../src/utils/platformConfig');

// Every test loads a fresh copy of the module, so the per-page-load cache starts empty.
const loadReader = (): Reader => {
  let reader: Reader | undefined;
  jest.isolateModules(() => {
    reader = require('../../src/utils/platformConfig');
  });
  return reader as Reader;
};

const jsonResponse = (body: unknown, ok = true, status = 200) => ({
  ok,
  status,
  json: () => Promise.resolve(body),
});

describe('platform config reader', () => {
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;
  const originalFetch = (global as any).fetch;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    process.env.REACT_APP_API_BASE_URL = '/api';
    fetchMock = jest.fn();
    (global as any).fetch = fetchMock;
    // The reader logs why it fell back to hidden; the reason is not what these tests check.
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });
  afterAll(() => {
    if (apiBaseUrl === undefined) {
      delete process.env.REACT_APP_API_BASE_URL;
    } else {
      process.env.REACT_APP_API_BASE_URL = apiBaseUrl;
    }
    (global as any).fetch = originalFetch;
  });

  it('asks the backend for the given instance, with the instance id encoded', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ whatsAppEnabled: true }));
    await loadReader().isWhatsAppEnabled('it aly');
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/platform-config?instance=it%20aly');
  });

  it('encodes instance ids containing a slash', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ whatsAppEnabled: true }));
    await loadReader().isWhatsAppEnabled('a/b');
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/platform-config?instance=a%2Fb');
  });

  it('is true only when the backend says whatsAppEnabled: true', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ whatsAppEnabled: true }));
    await expect(loadReader().isWhatsAppEnabled('italy')).resolves.toBe(true);
  });

  it('is false when the backend says whatsAppEnabled: false', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ whatsAppEnabled: false }));
    await expect(loadReader().isWhatsAppEnabled('italy')).resolves.toBe(false);
  });

  it.each([
    ['a string', { whatsAppEnabled: 'true' }],
    ['a number', { whatsAppEnabled: 1 }],
    ['a missing key', {}],
    ['null', null],
    ['an array', [true]],
  ])('is false when the value is %s', async (_label, body) => {
    fetchMock.mockResolvedValue(jsonResponse(body));
    await expect(loadReader().isWhatsAppEnabled('italy')).resolves.toBe(false);
  });

  it('is false when the instance is unknown or invalid (400)', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ whatsAppEnabled: true }, false, 400));
    await expect(loadReader().isWhatsAppEnabled('italy')).resolves.toBe(false);
  });

  it('is false when the route is missing (404)', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ whatsAppEnabled: true }, false, 404));
    await expect(loadReader().isWhatsAppEnabled('italy')).resolves.toBe(false);
  });

  it('is false when the server answers with an error', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ whatsAppEnabled: true }, false, 500));
    await expect(loadReader().isWhatsAppEnabled('italy')).resolves.toBe(false);
  });

  it('is false when the response is not valid JSON', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.reject(new SyntaxError('Unexpected token < in JSON')),
    });
    await expect(loadReader().isWhatsAppEnabled('italy')).resolves.toBe(false);
  });

  it('is false when the request itself fails', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(loadReader().isWhatsAppEnabled('italy')).resolves.toBe(false);
  });

  it('is false when fetch is not available at all', async () => {
    delete (global as any).fetch;
    await expect(loadReader().isWhatsAppEnabled('italy')).resolves.toBe(false);
  });

  it('fetches once per instance per page load, however many callers ask', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ whatsAppEnabled: true }));
    const reader = loadReader();
    const answers = await Promise.all([
      reader.isWhatsAppEnabled('italy'),
      reader.isWhatsAppEnabled('italy'),
    ]);
    await expect(reader.isWhatsAppEnabled('italy')).resolves.toBe(true);
    expect(answers).toEqual([true, true]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('keeps separate cache entries for different instances', async () => {
    fetchMock.mockImplementation((url: string) =>
      Promise.resolve(jsonResponse({ whatsAppEnabled: url.includes('italy') })),
    );
    const reader = loadReader();
    await expect(reader.isWhatsAppEnabled('italy')).resolves.toBe(true);
    await expect(reader.isWhatsAppEnabled('netherlands')).resolves.toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does not retry a failed load within the same page load', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    const reader = loadReader();
    await reader.isWhatsAppEnabled('italy');
    await expect(reader.isWhatsAppEnabled('italy')).resolves.toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
