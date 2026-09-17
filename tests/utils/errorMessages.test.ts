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

  it('recognises the resend cooldown, which shares its status with every other bad request', () => {
    expect(classifyPhoneError(errorWith(400, BACKEND_ERRORS.COOLDOWN))).toBe('cooldown');
  });

  it('recognises both halves of a verification that is no longer in progress', () => {
    // The two messages come from different endpoints but mean the same thing to a participant:
    // the code they are holding belongs to nothing, and they need a new one.
    expect(classifyPhoneError(errorWith(400, BACKEND_ERRORS.PHONE_NOT_PENDING))).toBe('noPendingVerification');
    expect(classifyPhoneError(errorWith(400, BACKEND_ERRORS.NO_VERIFICATION_IN_PROGRESS))).toBe('noPendingVerification');
  });

  it('recognises the four answers that were declared but never classified', () => {
    // Matched on the message alone: the statuses they arrive with are shared with every other
    // bad request, internal fault and unreachable service, so none of them identifies its
    // answer. A 503 in particular is also what the gateway returns when user-management itself
    // is down, which has nothing to do with WhatsApp being configured.
    expect(classifyPhoneError(errorWith(500, BACKEND_ERRORS.SEND_FAILED))).toBe('sendFailed');
    expect(classifyPhoneError(errorWith(400, BACKEND_ERRORS.PHONE_ALREADY_VERIFIED))).toBe('alreadyVerified');
    expect(classifyPhoneError(errorWith(400, BACKEND_ERRORS.NO_PHONE_TO_EDIT))).toBe('noPhone');
    expect(classifyPhoneError(errorWith(503, BACKEND_ERRORS.WHATSAPP_UNAVAILABLE))).toBe('whatsAppUnavailable');
  });

  it('falls back to unknown for anything it cannot place', () => {
    expect(classifyPhoneError(errorWith(500, 'database exploded'))).toBe('unknown');
    expect(classifyPhoneError(errorWith(503, 'user-management is unreachable'))).toBe('unknown');
    expect(classifyPhoneError(new Error('network down'))).toBe('unknown');
    expect(classifyPhoneError(undefined)).toBe('unknown');
  });
});
