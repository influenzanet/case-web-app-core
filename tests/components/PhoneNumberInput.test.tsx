/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import PhoneNumberInput from '../../src/components/inputs/PhoneNumberInput';
import COUNTRY_CODES from '../../src/configs/countryCodes.json';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe('PhoneNumberInput', () => {
  it('offers exactly the prefixes from the shared countryCodes config', () => {
    const { container } = render(<PhoneNumberInput value="" onChange={jest.fn()} placeholder="phone" />);
    const options = container.querySelectorAll('select option');
    expect(options.length).toBe(COUNTRY_CODES.length);
    const values = Array.from(options).map((o) => (o as HTMLOptionElement).value);
    expect(values).toEqual(COUNTRY_CODES.map((c) => c.code));
  });

  it('emits the full number with the default +39 prefix', () => {
    const onChange = jest.fn();
    render(<PhoneNumberInput value="" onChange={onChange} placeholder="phone" />);
    fireEvent.change(screen.getByPlaceholderText('phone'), { target: { value: '1234567890' } });
    expect(onChange).toHaveBeenLastCalledWith('+391234567890');
  });

  it('emits the full number when the prefix changes', () => {
    const onChange = jest.fn();
    const { container } = render(<PhoneNumberInput value="+391234567890" onChange={onChange} placeholder="phone" />);
    fireEvent.change(container.querySelector('select') as HTMLSelectElement, { target: { value: '+44' } });
    expect(onChange).toHaveBeenLastCalledWith('+441234567890');
  });

  it('strips characters that are not digits, spaces or hyphens', () => {
    const onChange = jest.fn();
    render(<PhoneNumberInput value="" onChange={onChange} placeholder="phone" />);
    fireEvent.change(screen.getByPlaceholderText('phone'), { target: { value: 'abc123!456-78 90' } });
    expect(onChange).toHaveBeenLastCalledWith('+39123456-78 90');
  });

  it('parses an initial value into prefix and number', () => {
    const { container } = render(<PhoneNumberInput value="+441234567890" onChange={jest.fn()} placeholder="phone" />);
    expect((container.querySelector('select') as HTMLSelectElement).value).toBe('+44');
    expect((screen.getByPlaceholderText('phone') as HTMLInputElement).value).toBe('1234567890');
  });
});
