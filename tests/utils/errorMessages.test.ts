import { BACKEND_ERRORS, classifyPhoneError } from '../../src/api/errorMessages';

// The gateway turns the two gRPC statuses the phone flow can raise into HTTP codes: a spent
// send budget becomes 429 and a number Meta refuses to deliver to becomes 422. Reading the
// status keeps the frontend working when the backend rewords a message, which matching the
// English text does not.

describe('classifyPhoneError', () => {
  const errorWith = (status?: number, message?: string) => ({
    response: { status, data: { error: message } },
  });

  it('reads the rate limit off the status even when the message is unfamiliar', () => {
    expect(classifyPhoneError(errorWith(429, 'a reworded backend message'))).toBe('rateLimited');
  });

  it('reads recipient-not-allowed off the status even when the message is unfamiliar', () => {
    expect(classifyPhoneError(errorWith(422, 'a reworded backend message'))).toBe('recipientNotAllowed');
  });

  it('still recognises the known messages when no status is available', () => {
    expect(classifyPhoneError(errorWith(undefined, BACKEND_ERRORS.RATE_LIMITED))).toBe('rateLimited');
    expect(classifyPhoneError(errorWith(undefined, BACKEND_ERRORS.RECIPIENT_NOT_ALLOWED))).toBe('recipientNotAllowed');
  });

  it('tells the code failures apart, which share one status', () => {
    expect(classifyPhoneError(errorWith(401, BACKEND_ERRORS.INVALID_CODE))).toBe('invalidCode');
    expect(classifyPhoneError(errorWith(401, BACKEND_ERRORS.CODE_EXPIRED))).toBe('codeExpired');
    expect(classifyPhoneError(errorWith(401, BACKEND_ERRORS.TOO_MANY_ATTEMPTS))).toBe('tooManyAttempts');
  });

  it('falls back to unknown for anything it cannot place', () => {
    expect(classifyPhoneError(errorWith(500, 'database exploded'))).toBe('unknown');
    expect(classifyPhoneError(new Error('network down'))).toBe('unknown');
    expect(classifyPhoneError(undefined)).toBe('unknown');
  });
});
