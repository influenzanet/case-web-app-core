import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TextField, SelectField } from '@influenzanet/case-web-ui';
import COUNTRY_CODES from '../../configs/countryCodes.json';
import {
  composePhoneNumber,
  parseInternationalPhoneNumber,
  sanitizePhoneNumberInput,
} from '../../utils/phoneNumberParsing';

interface PhoneNumberInputProps {
  value: string;
  onChange: (fullPhoneNumber: string) => void;
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

  const handleCountryCodeChange = (newCode: string) => {
    setCountryCode(newCode);
    onChange(composePhoneNumber(newCode, phoneNumber));
  };

  const handlePhoneNumberChange = (newNumber: string) => {
    // A number pasted or autofilled with its own prefix is split again, instead of being prefixed
    // a second time with the selected country code.
    const parsed = parseInternationalPhoneNumber(newNumber);
    if (parsed) {
      setCountryCode(parsed.countryCode);
      setPhoneNumber(parsed.localNumber);
      onChange(composePhoneNumber(parsed.countryCode, parsed.localNumber));
      return;
    }
    const cleanNumber = sanitizePhoneNumberInput(newNumber);
    setPhoneNumber(cleanNumber);
    onChange(composePhoneNumber(countryCode, cleanNumber));
  };

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
          onBlur={onBlur}
          style={{ marginBottom: 0 }}
        />
      </div>

      <small className="text-muted mt-1 d-block">
        {t('addPhone.completeNumber')}: {composePhoneNumber(countryCode, phoneNumber) || countryCode}
      </small>

      {error && (
        <div className="text-danger mt-1 small">
          {error}
        </div>
      )}
    </div>
  );
};

export default PhoneNumberInput;
