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

// Lets the reader's awaited fetch, JSON parsing and timers settle under fake timers.
const settle = async () => {
  for (let i = 0; i < 20; i++) {
    await Promise.resolve();
  }
};

const advance = async (ms: number) => {
  jest.advanceTimersByTime(ms);
  await settle();
};

// Records how a pending promise ended, without awaiting it.
const track = <T>(promise: Promise<T>) => {
  const outcome: { settled: boolean; value?: T } = { settled: false };
  promise.then((value) => {
    outcome.settled = true;
    outcome.value = value;
  });
  return outcome;
};

// Each wait is scheduled only once the attempt before it has failed, so time moves on one wait
// at a time, with the promises settled in between.
const runOutRetries = async () => {
  for (const delay of [1000, 2000, 4000, 8000, 16000, 60000]) {
    await advance(delay);
  }
};

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
    jest.useRealTimers();
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

  it('is false when the server keeps answering with an error', async () => {
    jest.useFakeTimers();
    fetchMock.mockResolvedValue(jsonResponse({ whatsAppEnabled: true }, false, 500));
    const outcome = track(loadReader().isWhatsAppEnabled('italy'));
    await settle();
    await runOutRetries();
    expect(outcome).toEqual({ settled: true, value: false });
    expect(fetchMock).toHaveBeenCalledTimes(6);
  });

  it('is false when the response is not valid JSON', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.reject(new SyntaxError('Unexpected token < in JSON')),
    });
    await expect(loadReader().isWhatsAppEnabled('italy')).resolves.toBe(false);
  });

  it('is false when the request itself keeps failing', async () => {
    jest.useFakeTimers();
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    const outcome = track(loadReader().isWhatsAppEnabled('italy'));
    await settle();
    await runOutRetries();
    expect(outcome).toEqual({ settled: true, value: false });
    expect(fetchMock).toHaveBeenCalledTimes(6);
  });

  it('is false when fetch is not available at all', async () => {
    jest.useFakeTimers();
    delete (global as any).fetch;
    const outcome = track(loadReader().isWhatsAppEnabled('italy'));
    await settle();
    await runOutRetries();
    expect(outcome).toEqual({ settled: true, value: false });
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

  it.each([
    ['the request fails', () => Promise.reject(new TypeError('Failed to fetch'))],
    ['the server answers 500', () => Promise.resolve(jsonResponse({}, false, 500))],
    ['the server answers 503', () => Promise.resolve(jsonResponse({}, false, 503))],
    ['the server answers 429', () => Promise.resolve(jsonResponse({}, false, 429))],
  ])('tries again when %s, and turns on once an attempt succeeds', async (_label, failure) => {
    jest.useFakeTimers();
    fetchMock
      .mockImplementationOnce(failure)
      .mockImplementationOnce(failure)
      .mockResolvedValue(jsonResponse({ whatsAppEnabled: true }));
    const outcome = track(loadReader().isWhatsAppEnabled('italy'));
    await settle();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(outcome.settled).toBe(false);

    await advance(1000);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(outcome.settled).toBe(false);

    await advance(2000);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(outcome).toEqual({ settled: true, value: true });
  });

  it('waits longer before each new attempt', async () => {
    jest.useFakeTimers();
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    track(loadReader().isWhatsAppEnabled('italy'));
    await settle();
    const expectedDelays = [1000, 2000, 4000, 8000, 16000];
    for (let i = 0; i < expectedDelays.length; i++) {
      await advance(expectedDelays[i] - 1);
      expect(fetchMock).toHaveBeenCalledTimes(i + 1);
      await advance(1);
      expect(fetchMock).toHaveBeenCalledTimes(i + 2);
    }
    // No attempt after the last delay.
    await advance(60000);
    expect(fetchMock).toHaveBeenCalledTimes(6);
  });

  it('does not try again after an answer that says no', async () => {
    jest.useFakeTimers();
    fetchMock.mockResolvedValue(jsonResponse({ whatsAppEnabled: true }, false, 400));
    const outcome = track(loadReader().isWhatsAppEnabled('italy'));
    await settle();
    await runOutRetries();
    expect(outcome).toEqual({ settled: true, value: false });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('does not try again after a response that is not valid JSON', async () => {
    jest.useFakeTimers();
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.reject(new SyntaxError('Unexpected token < in JSON')),
    });
    const outcome = track(loadReader().isWhatsAppEnabled('italy'));
    await settle();
    await runOutRetries();
    expect(outcome).toEqual({ settled: true, value: false });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('shares the attempts in progress between callers', async () => {
    jest.useFakeTimers();
    fetchMock
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValue(jsonResponse({ whatsAppEnabled: true }));
    const reader = loadReader();
    const first = track(reader.isWhatsAppEnabled('italy'));
    await settle();
    const second = track(reader.isWhatsAppEnabled('italy'));
    await advance(1000);
    expect(first).toEqual({ settled: true, value: true });
    expect(second).toEqual({ settled: true, value: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('reads again for the next caller once every attempt has failed', async () => {
    jest.useFakeTimers();
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    const reader = loadReader();
    const first = track(reader.isWhatsAppEnabled('italy'));
    await settle();
    await runOutRetries();
    expect(first).toEqual({ settled: true, value: false });
    expect(fetchMock).toHaveBeenCalledTimes(6);

    fetchMock.mockResolvedValue(jsonResponse({ whatsAppEnabled: true }));
    const second = track(reader.isWhatsAppEnabled('italy'));
    await settle();
    expect(second).toEqual({ settled: true, value: true });
    expect(fetchMock).toHaveBeenCalledTimes(7);
  });

  it('keeps an answer that says no for the rest of the page load', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ whatsAppEnabled: false }));
    const reader = loadReader();
    await reader.isWhatsAppEnabled('italy');
    await expect(reader.isWhatsAppEnabled('italy')).resolves.toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
