import { validatePhoneNumber } from '../../src/utils/phoneNumberValidation';

describe('validatePhoneNumber', () => {
  it('reports an empty value as empty', () => {
    expect(validatePhoneNumber('')).toEqual({ status: 'empty' });
  });

  describe('valid numbers', () => {
    const cases: Array<[string, string]> = [
      ['+39 331 622 1419', '+393316221419'],
      ['+39 06 1234 5678', '+390612345678'],
      ['+44020 7946 0018', '+442079460018'],
      ['+447911123456', '+447911123456'],
      ['+49 030 123456', '+4930123456'],
      ['+4915123456789', '+4915123456789'],
      ['+33 06 12 34 56 78', '+33612345678'],
      ['+34 612 34 56 78', '+34612345678'],
      ['+41 078 123 45 67', '+41781234567'],
      ['+1 415 555 2671', '+14155552671'],
      ['+16135550123', '+16135550123'],
    ];

    it.each(cases)('accepts %s as %s', (composed, e164) => {
      expect(validatePhoneNumber(composed)).toEqual({ status: 'valid', e164 });
    });
  });

  it('reports a number without enough digits as invalid', () => {
    expect(validatePhoneNumber('+39331622')).toEqual({ status: 'invalid', canBecomeValid: true });
  });

  it('reports a number with too many digits as too long', () => {
    expect(validatePhoneNumber('+393316221419555')).toEqual({ status: 'tooLong' });
  });

  it('reports a plausible-length but invalid Italian number as invalid', () => {
    expect(validatePhoneNumber('+391234567890')).toEqual({ status: 'invalid', canBecomeValid: false });
  });

  it('reports a plausible-length but invalid US number as invalid', () => {
    expect(validatePhoneNumber('+11235550123')).toEqual({ status: 'invalid', canBecomeValid: true });
  });

  it('reports a plausible-length but invalid Swiss number as invalid', () => {
    expect(validatePhoneNumber('+41181234567')).toEqual({ status: 'invalid', canBecomeValid: false });
  });

  it('reports a bare country code as too short', () => {
    expect(validatePhoneNumber('+3')).toEqual({ status: 'tooShort' });
  });

  it('reports garbage input as invalid instead of throwing', () => {
    expect(validatePhoneNumber('not a phone')).toEqual({ status: 'invalid', canBecomeValid: false });
  });
});

describe('validatePhoneNumber, canBecomeValid for an invalid number', () => {
  it('is true for a plausible-length Italian number that is just missing digits', () => {
    expect(validatePhoneNumber('+39331622')).toEqual({ status: 'invalid', canBecomeValid: true });
  });

  it('is false for an Italian number already at a valid length but malformed', () => {
    expect(validatePhoneNumber('+391234567890')).toEqual({ status: 'invalid', canBecomeValid: false });
  });

  it('is false for a Swiss number already at a valid length but malformed', () => {
    expect(validatePhoneNumber('+41181234567')).toEqual({ status: 'invalid', canBecomeValid: false });
  });

  it('is not present on a valid result', () => {
    const result = validatePhoneNumber('+393316221419');
    expect(result.status).toBe('valid');
    expect('canBecomeValid' in result).toBe(false);
  });

  it('is not present on a too-short result', () => {
    const result = validatePhoneNumber('+3');
    expect(result.status).toBe('tooShort');
    expect('canBecomeValid' in result).toBe(false);
  });

  it('is not present on a too-long result', () => {
    const result = validatePhoneNumber('+393316221419555');
    expect(result.status).toBe('tooLong');
    expect('canBecomeValid' in result).toBe(false);
  });
});
