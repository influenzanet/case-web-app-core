import {
  isValidPhoneNumber,
  parsePhoneNumber,
  validatePhoneNumberLength,
} from 'libphonenumber-js/max';

export type PhoneNumberValidationStatus = 'empty' | 'valid' | 'tooShort' | 'tooLong' | 'invalid';

// A discriminated union, rather than one shape with optional fields, so a caller that has
// narrowed on `status` gets `e164` or `canBecomeValid` without casting.
export type PhoneNumberValidationResult =
  | { status: 'empty' }
  | { status: 'valid'; e164: string }
  | { status: 'tooShort' }
  | { status: 'tooLong' }
  | { status: 'invalid'; canBecomeValid: boolean };

// How many digits are tried, appended to an invalid number, to tell a draft still being typed
// apart from a number that is already wrong and no amount of typing will fix.
const MAX_APPENDED_DIGITS = 6;
// A repeated digit alone cannot probe every valid pattern (e.g. a scheme that forbids repeats),
// so a non-repeating sequence is tried as well at each length.
const MIXED_DIGITS_SEQUENCE = '123456789';

/**
 * Heuristic used to delay the "invalid" message while a number that is merely incomplete is
 * still being typed: true if appending some number of digits could make it valid. It can only
 * ever delay the message to blur, never suppress it for a number that truly cannot be fixed by
 * typing more digits, and it never decides whether the number is accepted (that is always
 * `status === 'valid'`), so a false positive here costs nothing beyond showing the message one
 * blur later than ideal.
 */
const canBecomeValidByAppendingDigits = (composed: string): boolean => {
  for (let length = 1; length <= MAX_APPENDED_DIGITS; length += 1) {
    for (let digit = 0; digit <= 9; digit += 1) {
      if (isValidPhoneNumber(composed + String(digit).repeat(length))) {
        return true;
      }
    }
    if (isValidPhoneNumber(composed + MIXED_DIGITS_SEQUENCE.slice(0, length))) {
      return true;
    }
  }
  return false;
};

/**
 * Validates a composed international number ("+<prefix><national number>") with the same rules
 * the server applies: libphonenumber-js parses it with no default region, so a prefix like +1
 * (shared by the US and Canada) is resolved from the digits that follow rather than from a
 * country guessed on the client. The caller must never pass an ISO country of its own.
 */
export const validatePhoneNumber = (composed: string): PhoneNumberValidationResult => {
  if (composed === '') {
    return { status: 'empty' };
  }

  const lengthIssue = validatePhoneNumberLength(composed);
  switch (lengthIssue) {
    case 'TOO_SHORT':
      return { status: 'tooShort' };
    case 'TOO_LONG':
      return { status: 'tooLong' };
    case 'INVALID_COUNTRY':
    case 'NOT_A_NUMBER':
    case 'INVALID_LENGTH':
      return { status: 'invalid', canBecomeValid: canBecomeValidByAppendingDigits(composed) };
    default:
      break;
  }

  if (!isValidPhoneNumber(composed)) {
    return { status: 'invalid', canBecomeValid: canBecomeValidByAppendingDigits(composed) };
  }

  try {
    return { status: 'valid', e164: parsePhoneNumber(composed).number };
  } catch {
    // parsePhoneNumber throws on input isValidPhoneNumber would not otherwise reject on its own,
    // such as malformed text that still happens to carry a plausible length.
    return { status: 'invalid', canBecomeValid: canBecomeValidByAppendingDigits(composed) };
  }
};
