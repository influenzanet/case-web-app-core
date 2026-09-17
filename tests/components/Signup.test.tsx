/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';

import Signup from '../../src/components/dialogs/GlobalDialogs/Signup';
import { signupWithEmailRequest } from '../../src/api/authAPI';
import dialogReducer from '../../src/store/dialogSlice';
import userReducer from '../../src/store/userSlice';
import configReducer from '../../src/store/configSlice';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'it' } }),
  Trans: ({ i18nKey }: { i18nKey: string }) => <span>{i18nKey}</span>,
}));
jest.mock('../../src/hooks/useTranslatedMarkdown', () => ({
  useTranslatedMarkdown: () => ({ content: 'consent text' }),
}));
jest.mock('react-google-recaptcha', () => () => null);
jest.mock('react-router-dom', () => ({
  useHistory: () => ({ push: jest.fn() }),
}));
jest.mock('../../src/api/authAPI', () => ({
  signupWithEmailRequest: jest.fn(),
}));
jest.mock('../../src/api/userAPI', () => ({
  getUserReq: jest.fn(),
}));
jest.mock('../../src/api/instances/authenticatedApi', () => ({
  setDefaultAccessTokenHeader: jest.fn(),
  resetApiAuth: jest.fn(),
}));

// The dialog only renders when the dialog slice says it is the open one.
const openSignupState = {
  dialog: { config: { type: 'signup' } },
  config: { instanceId: 'italy', languages: [], avatars: [] },
};

// The dialog goes into a portal, so assertions run against baseElement, not container.
const renderSignup = () => {
  const store = configureStore({
    reducer: { dialog: dialogReducer, user: userReducer, config: configReducer },
    preloadedState: openSignupState,
  });
  return render(
    <Provider store={store}>
      <Signup />
    </Provider>,
  );
};

const PHONE_ERROR = 'dialogs:signup.errors.phone';

const phoneField = () =>
  screen.getByPlaceholderText('signup.phoneInputPlaceholdersignup.phoneOptionalWithExplanation');

const submitButton = (root: HTMLElement) =>
  root.querySelector('button[type="submit"]') as HTMLButtonElement;

const acceptThePrivacyPolicy = (root: HTMLElement) => {
  // Ticking the box opens the consent dialog; acceptance happens inside it.
  fireEvent.click(root.querySelector('#acceptPrivacyConsent') as HTMLInputElement);
  const acceptButton = () =>
    screen.getByText('privacyConsent.acceptBtn').closest('button') as HTMLButtonElement;
  // The dialog unlocks its accept button once the text is scrolled to within a few pixels of the
  // end. jsdom reports every element as zero-height, which already counts as the end, so a single
  // scroll event is enough to reach the state a reader reaches by scrolling.
  fireEvent.scroll(acceptButton().closest('.modal')?.querySelector('.overflow-auto') as Element);
  fireEvent.click(acceptButton());
};

// Everything the form needs except the phone, which is the optional field under test.
const fillTheRequiredFields = (root: HTMLElement) => {
  fireEvent.change(root.querySelector('#signupEmail') as HTMLInputElement, {
    target: { value: 'partecipante@example.org' },
  });
  fireEvent.change(root.querySelector('#signupPW') as HTMLInputElement, {
    target: { value: 'Passw0rd!2026' },
  });
  fireEvent.change(root.querySelector('#signupConfirmPw') as HTMLInputElement, {
    target: { value: 'Passw0rd!2026' },
  });
  acceptThePrivacyPolicy(root);
};

describe('Signup dialog, a phone number already on another account', () => {
  const recaptchaFlag = process.env.REACT_APP_USE_RECAPTCHA;
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.REACT_APP_USE_RECAPTCHA;
  });
  afterAll(() => {
    if (recaptchaFlag === undefined) {
      delete process.env.REACT_APP_USE_RECAPTCHA;
    } else {
      process.env.REACT_APP_USE_RECAPTCHA = recaptchaFlag;
    }
  });

  // A taken phone is answered like a duplicate e-mail, and the interface must not tell the two
  // apart: a message naming the phone would turn the signup form into a membership oracle,
  // where anyone could learn whether a number belongs to a participant.
  it('never names the phone number as the reason a signup was refused', async () => {
    (signupWithEmailRequest as jest.Mock).mockRejectedValue({
      response: { status: 409, data: { error: 'phone number already registered' } },
    });
    const { baseElement } = renderSignup();
    const root = baseElement as HTMLElement;
    fillTheRequiredFields(root);
    fireEvent.change(phoneField(), { target: { value: '3316221419' } });
    fireEvent.blur(phoneField());

    fireEvent.click(submitButton(root));

    expect(await screen.findByText('dialogs:signup.errors.unknown')).toBeInTheDocument();
    expect(screen.queryByText('dialogs:signup.errors.phoneAlreadyRegistered')).toBeNull();
  });
});

describe('Signup dialog, optional phone number', () => {
  // The submit button is also gated on the recaptcha consent, which the repository's own .env
  // turns on. Pinning the flag keeps these assertions about the phone field and nothing else.
  const recaptchaFlag = process.env.REACT_APP_USE_RECAPTCHA;
  beforeEach(() => {
    delete process.env.REACT_APP_USE_RECAPTCHA;
  });
  afterAll(() => {
    if (recaptchaFlag === undefined) {
      delete process.env.REACT_APP_USE_RECAPTCHA;
    } else {
      process.env.REACT_APP_USE_RECAPTCHA = recaptchaFlag;
    }
  });

  it('lets a participant register after typing and clearing the phone', () => {
    const { baseElement } = renderSignup();
    const root = baseElement as HTMLElement;
    fillTheRequiredFields(root);

    const phone = phoneField();
    fireEvent.change(phone, { target: { value: '3' } });
    // The half-typed number really does block the form: this is the state being recovered from.
    expect(submitButton(root).disabled).toBe(true);
    fireEvent.change(phone, { target: { value: '' } });
    fireEvent.blur(phone);

    expect(screen.queryByText(PHONE_ERROR)).toBeNull();
    expect(submitButton(root).disabled).toBe(false);
  });

  it('lets a participant register when only the prefix was touched', () => {
    const { baseElement } = renderSignup();
    const root = baseElement as HTMLElement;
    fillTheRequiredFields(root);

    fireEvent.change(root.querySelector('select') as HTMLSelectElement, { target: { value: '+44' } });
    expect((root.querySelector('select') as HTMLSelectElement).value).toBe('+44');
    fireEvent.blur(phoneField());

    expect(screen.queryByText(PHONE_ERROR)).toBeNull();
    expect(submitButton(root).disabled).toBe(false);
  });

  it('still rejects a phone number that is too short', () => {
    const { baseElement } = renderSignup();
    const root = baseElement as HTMLElement;
    fillTheRequiredFields(root);

    const phone = phoneField();
    fireEvent.change(phone, { target: { value: '3' } });
    fireEvent.blur(phone);

    expect(screen.getByText(PHONE_ERROR)).toBeTruthy();
    expect(submitButton(root).disabled).toBe(true);
  });

  it('accepts a complete phone number', () => {
    const { baseElement } = renderSignup();
    const root = baseElement as HTMLElement;
    fillTheRequiredFields(root);

    const phone = phoneField();
    fireEvent.change(phone, { target: { value: '3316221419' } });
    fireEvent.blur(phone);

    expect(screen.queryByText(PHONE_ERROR)).toBeNull();
    expect(submitButton(root).disabled).toBe(false);
  });
});
