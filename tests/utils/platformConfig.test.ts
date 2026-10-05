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
  const contentUrl = process.env.REACT_APP_CONTENT_URL;
  const originalFetch = (global as any).fetch;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    process.env.REACT_APP_CONTENT_URL = '/assets';
    fetchMock = jest.fn();
    (global as any).fetch = fetchMock;
    // The reader logs why it fell back to hidden; the reason is not what these tests check.
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });
  afterAll(() => {
    if (contentUrl === undefined) {
      delete process.env.REACT_APP_CONTENT_URL;
    } else {
      process.env.REACT_APP_CONTENT_URL = contentUrl;
    }
    (global as any).fetch = originalFetch;
  });

  it('reads the file served next to the other runtime assets', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ whatsAppEnabled: true }));
    await loadReader().isWhatsAppEnabled();
    expect(fetchMock).toHaveBeenCalledWith('/assets/platform-config.json');
  });

  it('is true only when the file says whatsAppEnabled: true', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ whatsAppEnabled: true }));
    await expect(loadReader().isWhatsAppEnabled()).resolves.toBe(true);
  });

  it('is false when the file says whatsAppEnabled: false', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ whatsAppEnabled: false }));
    await expect(loadReader().isWhatsAppEnabled()).resolves.toBe(false);
  });

  it.each([
    ['a string', { whatsAppEnabled: 'true' }],
    ['a number', { whatsAppEnabled: 1 }],
    ['a missing key', {}],
    ['null', null],
    ['an array', [true]],
  ])('is false when the value is %s', async (_label, body) => {
    fetchMock.mockResolvedValue(jsonResponse(body));
    await expect(loadReader().isWhatsAppEnabled()).resolves.toBe(false);
  });

  it('is false when the file is missing (404)', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ whatsAppEnabled: true }, false, 404));
    await expect(loadReader().isWhatsAppEnabled()).resolves.toBe(false);
  });

  it('is false when the server answers with an error', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ whatsAppEnabled: true }, false, 500));
    await expect(loadReader().isWhatsAppEnabled()).resolves.toBe(false);
  });

  it('is false when the file is not valid JSON', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.reject(new SyntaxError('Unexpected token < in JSON')),
    });
    await expect(loadReader().isWhatsAppEnabled()).resolves.toBe(false);
  });

  it('is false when the request itself fails', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(loadReader().isWhatsAppEnabled()).resolves.toBe(false);
  });

  it('is false when fetch is not available at all', async () => {
    delete (global as any).fetch;
    await expect(loadReader().isWhatsAppEnabled()).resolves.toBe(false);
  });

  it('fetches the file once per page load, however many callers ask', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ whatsAppEnabled: true }));
    const reader = loadReader();
    const answers = await Promise.all([reader.isWhatsAppEnabled(), reader.isWhatsAppEnabled()]);
    await expect(reader.isWhatsAppEnabled()).resolves.toBe(true);
    expect(answers).toEqual([true, true]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('does not retry a failed load within the same page load', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    const reader = loadReader();
    await reader.isWhatsAppEnabled();
    await expect(reader.isWhatsAppEnabled()).resolves.toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
