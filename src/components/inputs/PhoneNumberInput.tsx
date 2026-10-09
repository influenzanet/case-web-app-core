import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TextField, SelectField } from '@influenzanet/case-web-ui';
import COUNTRY_CODES from '../../configs/countryCodes.json';
import {
  composePhoneNumber,
  parseInternationalPhoneNumber,
  sanitizePhoneNumberInput,
} from '../../utils/phoneNumberParsing';
import { validatePhoneNumber } from '../../utils/phoneNumberValidation';

interface PhoneNumberInputProps {
  value: string;
  onChange: (fullPhoneNumber: string, isValid: boolean) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  error?: string;
  onBlur?: () => void;
}

const PhoneNumberInput: React.FC<PhoneNumberInputProps> = ({
  value,
  onChange,
  label,
  placeholder,
  className,
  autoFocus,
  disabled,
  error,
  onBlur
}) => {
  const { t } = useTranslation(['dialogs']);

  // Extract country code and number from the full value
  const [countryCode, setCountryCode] = useState(() => {
    const matchingCode = COUNTRY_CODES.find(country => value.startsWith(country.code));
    return matchingCode?.code || '+39';
  });

  const [phoneNumber, setPhoneNumber] = useState(() => {
    const matchingCode = COUNTRY_CODES.find(country => value.startsWith(country.code));
    return matchingCode ? value.substring(matchingCode.code.length) : value;
  });

  const [touched, setTouched] = useState(false);

  // The number reported to the caller is the E.164 form once it validates, so only a number the
  // server would also accept ever reaches the request; otherwise the raw composed value is kept,
  // exactly as before this validation existed.
  const emitChange = (code: string, number: string) => {
    const composed = composePhoneNumber(code, number);
    const validation = validatePhoneNumber(composed);
    const isValid = validation.status === 'valid';
    onChange(validation.status === 'valid' ? validation.e164 : composed, isValid);
  };

  const handleCountryCodeChange = (newCode: string) => {
    setCountryCode(newCode);
    emitChange(newCode, phoneNumber);
  };

  const handlePhoneNumberChange = (newNumber: string) => {
    // A number pasted or autofilled with its own prefix is split again, instead of being prefixed
    // a second time with the selected country code.
    const parsed = parseInternationalPhoneNumber(newNumber);
    if (parsed) {
      setCountryCode(parsed.countryCode);
      setPhoneNumber(parsed.localNumber);
      emitChange(parsed.countryCode, parsed.localNumber);
      return;
    }
    const cleanNumber = sanitizePhoneNumberInput(newNumber);
    setPhoneNumber(cleanNumber);
    emitChange(countryCode, cleanNumber);
  };

  const handleBlur = () => {
    // The parent's own onBlur keeps firing, so a too-short message only ever becomes an addition
    // on top of what it already does.
    setTouched(true);
    onBlur?.();
  };

  // A too-short number is only a draft still being typed, so it is not shown as an error until the
  // field is left; a too-long number cannot be fixed by typing more, so it is shown at once.
  const validation = validatePhoneNumber(composePhoneNumber(countryCode, phoneNumber));
  const validationMessage = (): string | undefined => {
    switch (validation.status) {
      case 'tooShort':
        return touched
          ? t('addPhone.phoneValidation.tooShort', 'The number is too short')
          : undefined;
      case 'tooLong':
        return t('addPhone.phoneValidation.tooLong', 'The number is too long');
      case 'invalid':
        // Before the field is left, a number that could still become valid by typing more
        // digits (e.g. an Italian mobile with only 6 digits so far) is not flagged yet, so a
        // normal entry does not flash "invalid" on every keystroke on its way to being complete.
        // This can only ever delay the message to blur, never hide a number that truly is wrong.
        return touched || !validation.canBecomeValid
          ? t(
              'addPhone.phoneValidation.invalid',
              'This is not a valid number for the selected country',
            )
          : undefined;
      default:
        return undefined;
    }
  };

  const message = error || validationMessage();

  return (
    <div className={className}>
      {label && (
        <label className="form-label mb-1">
          {label}
        </label>
      )}
      <div className="d-flex">
        <SelectField
          className="me-2"
          style={{ width: '120px', flexShrink: 0 }}
          value={countryCode}
          onChange={(event) => handleCountryCodeChange(event.target.value)}
          disabled={disabled}
          values={COUNTRY_CODES.map((country) => ({
            code: country.code,
            label: `${country.code} ${country.country}`
          }))}
        />

        <TextField
          type="text"
          placeholder={placeholder || t('addPhone.phoneInputPlaceholder')}
          value={phoneNumber}
          autoFocus={autoFocus}
          autoComplete="tel"
          disabled={disabled}
          className="flex-grow-1"
          onChange={(event) => handlePhoneNumberChange(event.target.value)}
          onBlur={handleBlur}
          style={{ marginBottom: 0 }}
        />
      </div>

      <small className="text-muted mt-1 d-block">
        {t('addPhone.completeNumber')}: {composePhoneNumber(countryCode, phoneNumber) || countryCode}
      </small>

      {message && (
        <div className="text-danger mt-1 small">
          {message}
        </div>
      )}
    </div>
  );
};

export default PhoneNumberInput;
