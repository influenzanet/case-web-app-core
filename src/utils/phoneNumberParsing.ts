import COUNTRY_CODES from '../configs/countryCodes.json';

const DEFAULT_COUNTRY_CODES = COUNTRY_CODES.map((country) => country.code);

// "+" and the "00" international dialling prefix are the only markers that make a number
// unambiguously international. A bare country code is not one: several of them (31, 33, 34, 36,
// 39, ...) are also valid starts of an Italian mobile number, so reading those as a prefix would
// corrupt numbers entered in national form.
const INTERNATIONAL_PREFIX = /^\s*(?:\+|00)/;

export interface ParsedInternationalPhoneNumber {
  countryCode: string;
  localNumber: string;
}

/**
 * Splits a number written in international form into its country code and its national part, so a
 * pasted or autofilled number that already carries the prefix does not get prefixed a second time.
 * Returns null when the value is not in international form, or when no known country code matches
 * it yet, leaving the caller free to keep treating it as a national number.
 */
export const parseInternationalPhoneNumber = (
  value: string,
  countryCodes: readonly string[] = DEFAULT_COUNTRY_CODES,
): ParsedInternationalPhoneNumber | null => {
  const marker = INTERNATIONAL_PREFIX.exec(value);
  if (!marker) {
    return null;
  }
  const digits = value.slice(marker[0].length).replace(/\D/g, '');
  const matches = countryCodes.filter((code) => digits.startsWith(code.slice(1)));
  if (matches.length === 0) {
    return null;
  }
  // The longest match wins, so a country code starting with another one is not shadowed by it.
  const countryCode = matches.reduce((longest, code) =>
    code.length > longest.length ? code : longest,
  );
  return { countryCode, localNumber: digits.slice(countryCode.length - 1) };
};

/**
 * Keeps the characters a national number may contain: digits, plus the spaces and hyphens people
 * use to group them. A leading "+" is kept as well, so a number being typed in international form
 * stays recognisable until enough digits are there to identify its country code.
 */
export const sanitizePhoneNumberInput = (value: string): string => {
  // Both international markers are kept as a single "+", so a "00" number, or a "+" typed after a
  // space, is still recognised as international by composePhoneNumber and never prefixed again.
  const marker = INTERNATIONAL_PREFIX.exec(value);
  if (marker) {
    return '+' + value.slice(marker[0].length).replace(/[^\d\s-]/g, '');
  }
  return value.replace(/[^\d\s-]/g, '');
};

/**
 * Builds the value the form works with out of the selected prefix and the national number.
 */
export const composePhoneNumber = (countryCode: string, localNumber: string): string => {
  // A prefix on its own is not a phone number: emitting one would make an empty field read as a
  // malformed number to the forms that treat the phone as optional. A value without any digit
  // (a stray "+" or spaces) counts as empty for the same reason.
  if (!/\d/.test(localNumber)) {
    return '';
  }
  // A number still in international form has no country code of its own yet, so it is reported as
  // it was typed rather than being prefixed again.
  if (localNumber.startsWith('+')) {
    return localNumber;
  }
  return countryCode + localNumber;
};
