import {
  composePhoneNumber,
  parseInternationalPhoneNumber,
  sanitizePhoneNumberInput,
} from '../../src/utils/phoneNumberParsing';

describe('parseInternationalPhoneNumber', () => {
  it('returns null for a national number', () => {
    expect(parseInternationalPhoneNumber('3316221419')).toBeNull();
  });

  it('returns null for an empty value', () => {
    expect(parseInternationalPhoneNumber('')).toBeNull();
  });

  it('splits a number that carries its prefix', () => {
    expect(parseInternationalPhoneNumber('+393316221419')).toEqual({
      countryCode: '+39',
      localNumber: '3316221419',
    });
  });

  it('normalises the separators of a pasted number', () => {
    expect(parseInternationalPhoneNumber('+39 331 622 1419')).toEqual({
      countryCode: '+39',
      localNumber: '3316221419',
    });
  });

  it('detects a country code other than the default one', () => {
    expect(parseInternationalPhoneNumber('+447911123456')).toEqual({
      countryCode: '+44',
      localNumber: '7911123456',
    });
  });

  it('reads 00 as the international dialling prefix', () => {
    expect(parseInternationalPhoneNumber('003316221419')).toEqual({
      countryCode: '+33',
      localNumber: '16221419',
    });
  });

  it('prefers the longest matching country code', () => {
    expect(parseInternationalPhoneNumber('+3931234567', ['+3', '+39'])).toEqual({
      countryCode: '+39',
      localNumber: '31234567',
    });
  });

  it('returns null while the country code is still incomplete', () => {
    expect(parseInternationalPhoneNumber('+3')).toBeNull();
  });

  it('returns null for a country code that is not in the list', () => {
    expect(parseInternationalPhoneNumber('+9991234567')).toBeNull();
  });
});

describe('sanitizePhoneNumberInput', () => {
  it('keeps digits, spaces and hyphens', () => {
    expect(sanitizePhoneNumberInput('abc123!456-78 90')).toBe('123456-78 90');
  });

  it('keeps a leading plus so an international number stays recognisable while it is typed', () => {
    expect(sanitizePhoneNumberInput('+3')).toBe('+3');
  });

  it('drops a plus that is not at the start', () => {
    expect(sanitizePhoneNumberInput('33+1')).toBe('331');
  });
});

describe('composePhoneNumber', () => {
  it('joins the country code and the national number', () => {
    expect(composePhoneNumber('+39', '3316221419')).toBe('+393316221419');
  });

  it('returns an empty string when there is no national number', () => {
    expect(composePhoneNumber('+39', '')).toBe('');
  });

  it('returns the fragment as it is while it is still in international form', () => {
    expect(composePhoneNumber('+39', '+3')).toBe('+3');
  });
});

describe('international markers outside the configured countries', () => {
  it('keeps a 00 number with an unknown country code in international form', () => {
    const local = sanitizePhoneNumberInput('00355691234567');
    expect(local).toBe('+355691234567');
    expect(composePhoneNumber('+39', local)).toBe('+355691234567');
  });

  it('keeps a + typed after whitespace in international form', () => {
    const local = sanitizePhoneNumberInput(' +52 55 1234 5678');
    expect(local).toBe('+52 55 1234 5678');
    expect(composePhoneNumber('+39', local)).toBe('+52 55 1234 5678');
  });

  it('treats a value without digits as an empty number', () => {
    expect(composePhoneNumber('+39', '+')).toBe('');
    expect(composePhoneNumber('+39', ' ')).toBe('');
  });
});
