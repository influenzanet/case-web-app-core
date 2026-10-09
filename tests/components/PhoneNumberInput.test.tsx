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
    expect(onChange).toHaveBeenLastCalledWith('+391234567890', false);
  });

  it('emits the full number when the prefix changes', () => {
    const onChange = jest.fn();
    const { container } = render(<PhoneNumberInput value="+391234567890" onChange={onChange} placeholder="phone" />);
    fireEvent.change(container.querySelector('select') as HTMLSelectElement, { target: { value: '+44' } });
    expect(onChange).toHaveBeenLastCalledWith('+441234567890', true);
  });

  it('emits an empty string when the local number is cleared', () => {
    const onChange = jest.fn();
    render(<PhoneNumberInput value="" onChange={onChange} placeholder="phone" />);
    const input = screen.getByPlaceholderText('phone');
    fireEvent.change(input, { target: { value: '3' } });
    fireEvent.change(input, { target: { value: '' } });
    expect(onChange).toHaveBeenLastCalledWith('', false);
  });

  it('emits an empty string when only the prefix changes on an empty number', () => {
    const onChange = jest.fn();
    const { container } = render(<PhoneNumberInput value="" onChange={onChange} placeholder="phone" />);
    fireEvent.change(container.querySelector('select') as HTMLSelectElement, { target: { value: '+44' } });
    expect(onChange).toHaveBeenLastCalledWith('', false);
  });

  it('keeps showing the selected prefix after the number is cleared', () => {
    const { container } = render(<PhoneNumberInput value="+441234567890" onChange={jest.fn()} placeholder="phone" />);
    fireEvent.change(screen.getByPlaceholderText('phone'), { target: { value: '' } });
    expect((container.querySelector('select') as HTMLSelectElement).value).toBe('+44');
  });

  it('strips characters that are not digits, spaces or hyphens', () => {
    const onChange = jest.fn();
    render(<PhoneNumberInput value="" onChange={onChange} placeholder="phone" />);
    fireEvent.change(screen.getByPlaceholderText('phone'), { target: { value: 'abc123!456-78 90' } });
    expect(onChange).toHaveBeenLastCalledWith('+39123456-78 90', false);
  });

  it('parses an initial value into prefix and number', () => {
    const { container } = render(<PhoneNumberInput value="+441234567890" onChange={jest.fn()} placeholder="phone" />);
    expect((container.querySelector('select') as HTMLSelectElement).value).toBe('+44');
    expect((screen.getByPlaceholderText('phone') as HTMLInputElement).value).toBe('1234567890');
  });

  it('re-parses a pasted number that already carries the prefix', () => {
    const onChange = jest.fn();
    const { container } = render(<PhoneNumberInput value="" onChange={onChange} placeholder="phone" />);
    fireEvent.change(screen.getByPlaceholderText('phone'), { target: { value: '+393316221419' } });
    expect(onChange).toHaveBeenLastCalledWith('+393316221419', true);
    expect((container.querySelector('select') as HTMLSelectElement).value).toBe('+39');
    expect((screen.getByPlaceholderText('phone') as HTMLInputElement).value).toBe('3316221419');
  });

  it('switches the prefix to the country code of the pasted number', () => {
    const onChange = jest.fn();
    const { container } = render(<PhoneNumberInput value="" onChange={onChange} placeholder="phone" />);
    fireEvent.change(screen.getByPlaceholderText('phone'), { target: { value: '+447911123456' } });
    expect(onChange).toHaveBeenLastCalledWith('+447911123456', true);
    expect((container.querySelector('select') as HTMLSelectElement).value).toBe('+44');
    expect((screen.getByPlaceholderText('phone') as HTMLInputElement).value).toBe('7911123456');
  });

  it('re-parses a pasted number written with spaces', () => {
    const onChange = jest.fn();
    render(<PhoneNumberInput value="" onChange={onChange} placeholder="phone" />);
    fireEvent.change(screen.getByPlaceholderText('phone'), { target: { value: '+39 331 622 1419' } });
    expect(onChange).toHaveBeenLastCalledWith('+393316221419', true);
    expect((screen.getByPlaceholderText('phone') as HTMLInputElement).value).toBe('3316221419');
  });

  it('reads a number typed with the 00 international prefix', () => {
    const onChange = jest.fn();
    const { container } = render(<PhoneNumberInput value="" onChange={onChange} placeholder="phone" />);
    fireEvent.change(screen.getByPlaceholderText('phone'), { target: { value: '003316221419' } });
    expect(onChange).toHaveBeenLastCalledWith('+3316221419', false);
    expect((container.querySelector('select') as HTMLSelectElement).value).toBe('+33');
  });

  it('keeps a number in international form while its country code is incomplete', () => {
    const onChange = jest.fn();
    const input = () => screen.getByPlaceholderText('phone') as HTMLInputElement;
    const { container } = render(<PhoneNumberInput value="" onChange={onChange} placeholder="phone" />);
    fireEvent.change(input(), { target: { value: '+3' } });
    expect(input().value).toBe('+3');
    expect(onChange).toHaveBeenLastCalledWith('+3', false);
    fireEvent.change(input(), { target: { value: '+39' } });
    expect((container.querySelector('select') as HTMLSelectElement).value).toBe('+39');
    expect(input().value).toBe('');
    expect(onChange).toHaveBeenLastCalledWith('', false);
  });
});

describe('PhoneNumberInput live validation', () => {
  const input = () => screen.getByPlaceholderText('phone') as HTMLInputElement;
  const select = (container: HTMLElement) => container.querySelector('select') as HTMLSelectElement;

  it.each([
    ['+39', '331 622 1419', '+393316221419'],
    ['+44', '(0)20 7946 0018', '+442079460018'],
    ['+49', '030 123456', '+4930123456'],
    ['+33', '06 12 34 56 78', '+33612345678'],
    ['+34', '612 34 56 78', '+34612345678'],
    ['+41', '078 123 45 67', '+41781234567'],
    ['+1', '415 555 2671', '+14155552671'],
  ])('reports a number typed as %s %s as the valid E.164 %s', (code, national, e164) => {
    const onChange = jest.fn();
    const { container } = render(<PhoneNumberInput value="" onChange={onChange} placeholder="phone" />);
    fireEvent.change(select(container), { target: { value: code } });
    fireEvent.change(input(), { target: { value: national } });
    expect(onChange).toHaveBeenLastCalledWith(e164, true);
  });

  it('reports a plausible-length but invalid number with the raw composed value and false', () => {
    const onChange = jest.fn();
    render(<PhoneNumberInput value="" onChange={onChange} placeholder="phone" />);
    fireEvent.change(input(), { target: { value: '1234567890' } });
    expect(onChange).toHaveBeenLastCalledWith('+391234567890', false);
  });

  it('accepts a pasted UK number written with spaces and switches the prefix', () => {
    const onChange = jest.fn();
    const { container } = render(<PhoneNumberInput value="" onChange={onChange} placeholder="phone" />);
    fireEvent.change(input(), { target: { value: '+44 7911 123456' } });
    expect(onChange).toHaveBeenLastCalledWith('+447911123456', true);
    expect(select(container).value).toBe('+44');
  });

  it('accepts a pasted number written with the 00 international prefix and switches the prefix', () => {
    const onChange = jest.fn();
    const { container } = render(<PhoneNumberInput value="" onChange={onChange} placeholder="phone" />);
    fireEvent.change(input(), { target: { value: '0049 151 23456789' } });
    expect(onChange).toHaveBeenLastCalledWith('+4915123456789', true);
    expect(select(container).value).toBe('+49');
  });

  it('shows no message for an empty field, even after it has been blurred', () => {
    render(<PhoneNumberInput value="" onChange={jest.fn()} placeholder="phone" />);
    fireEvent.blur(input());
    expect(screen.queryByText(/phoneValidation/)).toBeNull();
  });

  it('shows the too-short message only once the field has been left, not while still typing', () => {
    render(<PhoneNumberInput value="" onChange={jest.fn()} placeholder="phone" />);
    fireEvent.change(input(), { target: { value: '3' } });
    expect(screen.queryByText('addPhone.phoneValidation.tooShort')).toBeNull();
    fireEvent.blur(input());
    expect(screen.getByText('addPhone.phoneValidation.tooShort')).toBeInTheDocument();
  });

  it('shows the too-long message immediately, without waiting for a blur', () => {
    render(<PhoneNumberInput value="" onChange={jest.fn()} placeholder="phone" />);
    fireEvent.change(input(), { target: { value: '3316221419555' } });
    expect(screen.getByText('addPhone.phoneValidation.tooLong')).toBeInTheDocument();
  });

  it('shows the invalid message while typing a plausible-length invalid number', () => {
    render(<PhoneNumberInput value="" onChange={jest.fn()} placeholder="phone" />);
    fireEvent.change(input(), { target: { value: '1234567890' } });
    expect(screen.getByText('addPhone.phoneValidation.invalid')).toBeInTheDocument();
  });

  it('clears the invalid message once the number becomes valid', () => {
    render(<PhoneNumberInput value="" onChange={jest.fn()} placeholder="phone" />);
    fireEvent.change(input(), { target: { value: '1234567890' } });
    expect(screen.getByText('addPhone.phoneValidation.invalid')).toBeInTheDocument();
    fireEvent.change(input(), { target: { value: '3316221419' } });
    expect(screen.queryByText('addPhone.phoneValidation.invalid')).toBeNull();
  });

  it('shows the parent error prop instead of the internal message, without duplicating it', () => {
    render(
      <PhoneNumberInput value="" onChange={jest.fn()} placeholder="phone" error="external error" />,
    );
    fireEvent.change(input(), { target: { value: '1234567890' } });
    expect(screen.getByText('external error')).toBeInTheDocument();
    expect(screen.queryByText('addPhone.phoneValidation.invalid')).toBeNull();
  });
});

describe('PhoneNumberInput, delaying the invalid message while a number could still be completed', () => {
  const input = () => screen.getByPlaceholderText('phone') as HTMLInputElement;

  it('shows no message while typing a valid Italian mobile number one digit at a time', () => {
    render(<PhoneNumberInput value="" onChange={jest.fn()} placeholder="phone" />);
    let typed = '';
    for (const digit of '3316221419') {
      typed += digit;
      fireEvent.change(input(), { target: { value: typed } });
      expect(screen.queryByText('addPhone.phoneValidation.invalid')).toBeNull();
      expect(screen.queryByText('addPhone.phoneValidation.tooShort')).toBeNull();
    }
  });

  it('shows the invalid message immediately for a number that cannot become valid by typing more', () => {
    render(<PhoneNumberInput value="" onChange={jest.fn()} placeholder="phone" />);
    fireEvent.change(input(), { target: { value: '1234567890' } });
    expect(screen.getByText('addPhone.phoneValidation.invalid')).toBeInTheDocument();
  });

  it('shows the invalid message after blur for a plausible-length number that could still be completed', () => {
    render(<PhoneNumberInput value="" onChange={jest.fn()} placeholder="phone" />);
    fireEvent.change(input(), { target: { value: '331622' } });
    expect(screen.queryByText('addPhone.phoneValidation.invalid')).toBeNull();
    fireEvent.blur(input());
    expect(screen.getByText('addPhone.phoneValidation.invalid')).toBeInTheDocument();
  });
});
