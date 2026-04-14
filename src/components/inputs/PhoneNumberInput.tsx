import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TextField, SelectField } from '@influenzanet/case-web-ui';
import COUNTRY_CODES from '../../configs/countryCodes.json';

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

  // Estrai il prefisso e il numero dal valore completo
  const [countryCode, setCountryCode] = useState(() => {
    // Cerca quale prefisso corrisponde al valore attuale
    const matchingCode = COUNTRY_CODES.find(country => value.startsWith(country.code));
    return matchingCode?.code || '+39'; // Default Italia
  });

  const [phoneNumber, setPhoneNumber] = useState(() => {
    // Rimuovi il prefisso dal numero
    const matchingCode = COUNTRY_CODES.find(country => value.startsWith(country.code));
    return matchingCode ? value.substring(matchingCode.code.length) : value;
  });

  const handleCountryCodeChange = (newCode: string) => {
    setCountryCode(newCode);
    onChange(newCode + phoneNumber);
  };

  const handlePhoneNumberChange = (newNumber: string) => {
    // Rimuovi caratteri non numerici (eccetto spazi e trattini per leggibilità)
    const cleanNumber = newNumber.replace(/[^\d\s-]/g, '');
    setPhoneNumber(cleanNumber);
    onChange(countryCode + cleanNumber);
  };

  return (
    <div className={className}>
      {label && (
        <label className="form-label mb-1">
          {label}
        </label>
      )}
      <div className="d-flex">
        {/* Dropdown per il prefisso */}
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

        {/* Campo del numero */}
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

      {/* Mostra il numero completo per debug */}
      <small className="text-muted mt-1 d-block">
        {t('addPhone.completeNumber')}: {countryCode + phoneNumber}
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
