import { logRequestFailure } from '../../src/api/errorMessages';

// An axios error carries the request that produced it: config.headers holds the Authorization
// bearer, and config.data holds the body — in these dialogs a phone number or a verification
// code. Handing the whole object to the console publishes all of it to anything reading the
// browser log. What is worth recording is the status and the message the backend sent.

describe('logRequestFailure', () => {
  let logged: unknown[][];
  let original: typeof console.error;

  beforeEach(() => {
    logged = [];
    original = console.error;
    console.error = (...args: unknown[]) => {
      logged.push(args);
    };
  });

  afterEach(() => {
    console.error = original;
  });

  const axiosLikeError = () => ({
    message: 'Request failed with status code 429',
    config: {
      headers: { Authorization: 'Bearer super-secret-token' },
      data: JSON.stringify({ newPhone: '+391234567890', code: '123456' }),
    },
    response: {
      status: 429,
      data: { error: 'too many phone verification attempts, try again later' },
    },
  });

  const flatten = () => JSON.stringify(logged);

  it('records the status and the backend message', () => {
    logRequestFailure('add phone', axiosLikeError());
    expect(flatten()).toContain('add phone');
    expect(flatten()).toContain('429');
    expect(flatten()).toContain('too many phone verification attempts');
  });

  it('never lets the bearer token or the request body reach the console', () => {
    logRequestFailure('add phone', axiosLikeError());
    expect(flatten()).not.toContain('super-secret-token');
    expect(flatten()).not.toContain('Authorization');
    expect(flatten()).not.toContain('+391234567890');
    expect(flatten()).not.toContain('123456');
  });

  it('still says something useful when the request never got a response', () => {
    logRequestFailure('add phone', new Error('Network Error'));
    expect(flatten()).toContain('add phone');
    expect(flatten()).toContain('Network Error');
  });

  it('does not throw on something that is not an error at all', () => {
    expect(() => logRequestFailure('add phone', undefined)).not.toThrow();
    expect(flatten()).toContain('add phone');
  });
});
