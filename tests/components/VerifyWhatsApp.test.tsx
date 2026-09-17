/**
 * @jest-environment jsdom
 */
import React from "react";
import { act, fireEvent, screen, waitFor } from "@testing-library/react";

import VerifyWhatsApp from "../../src/components/dialogs/GlobalDialogs/VerifyWhatsApp";
import {
  verifyWhatsAppCodeReq,
  resendWhatsAppCodeReq,
  getUserReq,
  deletePhoneReq,
  newAccountPhoneReq,
  changeAccountPhoneReq,
} from "../../src/api/userAPI";
import { renewToken } from "../../src/api/instances/authenticatedApi";
import { renderWithProviders } from "./testUtils";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock("../../src/api/userAPI", () => ({
  verifyWhatsAppCodeReq: jest.fn(),
  resendWhatsAppCodeReq: jest.fn(),
  getUserReq: jest.fn(),
  deletePhoneReq: jest.fn(),
  newAccountPhoneReq: jest.fn(),
  changeAccountPhoneReq: jest.fn(),
}));
jest.mock("../../src/api/instances/authenticatedApi", () => ({
  renewToken: jest.fn(),
}));

const openDialogState = {
  dialog: {
    config: {
      type: "verifyWhatsApp",
      payload: { phoneNumber: "+391234567890" },
    },
  },
};

describe("VerifyWhatsApp dialog", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders nothing when the dialog is not open", () => {
    renderWithProviders(<VerifyWhatsApp />);
    expect(screen.queryByText("verifyWhatsApp.title")).toBeNull();
  });

  it("renders the dialog when the verifyWhatsApp dialog is open", () => {
    renderWithProviders(<VerifyWhatsApp />, openDialogState);
    expect(screen.getByText("verifyWhatsApp.title")).toBeInTheDocument();
    expect(screen.getByText("verifyWhatsApp.resendBtn")).toBeInTheDocument();
  });

  it("disables the submit button until a code is entered", () => {
    renderWithProviders(<VerifyWhatsApp />, openDialogState);
    const submit = screen
      .getByText("verifyWhatsApp.submitBtn")
      .closest("button");
    expect(submit).toBeDisabled();
    fireEvent.change(
      screen.getByPlaceholderText("verifyWhatsApp.codeInputPlaceholder"),
      {
        target: { value: "123456" },
      },
    );
    expect(submit).not.toBeDisabled();
  });

  it("resends via the resend endpoint and never deletes or re-adds the phone", async () => {
    (resendWhatsAppCodeReq as jest.Mock).mockResolvedValue({ status: 200 });
    renderWithProviders(<VerifyWhatsApp />, openDialogState);

    fireEvent.click(screen.getByText("verifyWhatsApp.resendBtn"));

    await waitFor(() => expect(resendWhatsAppCodeReq).toHaveBeenCalledTimes(1));
    // C-6 regression guard: the resend must not use the old delete + re-add pattern
    expect(deletePhoneReq).not.toHaveBeenCalled();
    expect(newAccountPhoneReq).not.toHaveBeenCalled();
    expect(changeAccountPhoneReq).not.toHaveBeenCalled();
  });

  it("never sends a second resend while the first is still in flight", async () => {
    // DialogBtn's loading prop only swaps the label, so the button has to be disabled as well:
    // without that, a second click spends another of the three codes the backend allows.
    let releaseResend: () => void = () => undefined;
    (resendWhatsAppCodeReq as jest.Mock).mockImplementation(
      () =>
        new Promise<{ status: number }>((resolve) => {
          releaseResend = () => resolve({ status: 200 });
        }),
    );
    renderWithProviders(<VerifyWhatsApp />, openDialogState);
    const resendButton = () =>
      screen.getByRole("button", { name: /verifyWhatsApp.resend|loadingMsg/ });

    fireEvent.click(resendButton());
    await waitFor(() => expect(resendButton()).toBeDisabled());
    fireEvent.click(resendButton());

    expect(resendWhatsAppCodeReq).toHaveBeenCalledTimes(1);
    releaseResend();
    await waitFor(() =>
      expect(screen.getByText("verifyWhatsApp.resendSuccess")).toBeInTheDocument(),
    );
  });

  it("maps the rate limit error on resend to a translated message", async () => {
    (resendWhatsAppCodeReq as jest.Mock).mockRejectedValue({
      response: {
        data: {
          error: "too many phone verification attempts, try again later",
        },
      },
    });
    renderWithProviders(<VerifyWhatsApp />, openDialogState);
    fireEvent.click(screen.getByText("verifyWhatsApp.resendBtn"));
    expect(
      await screen.findByText("verifyWhatsApp.errors.rateLimit"),
    ).toBeInTheDocument();
  });

  it("maps the rate limit off the status when the backend rewords the message", async () => {
    (resendWhatsAppCodeReq as jest.Mock).mockRejectedValue({
      response: {
        status: 429,
        data: { error: "send budget exhausted for this user" },
      },
    });
    renderWithProviders(<VerifyWhatsApp />, openDialogState);
    fireEvent.click(screen.getByText("verifyWhatsApp.resendBtn"));
    expect(
      await screen.findByText("verifyWhatsApp.errors.rateLimit"),
    ).toBeInTheDocument();
  });

  it("never checks the same code twice while the first check is still in flight", async () => {
    // DialogBtn's loading prop only swaps the label, so the in-flight request is what disables
    // the button: a second click would spend another of the attempts the backend counts before
    // the first answer is even back.
    let releaseVerification: () => void = () => undefined;
    (verifyWhatsAppCodeReq as jest.Mock).mockImplementation(
      () =>
        new Promise<{ status: number; data: unknown }>((resolve) => {
          releaseVerification = () =>
            resolve({
              status: 200,
              data: {
                id: "user-1",
                account: { accountId: "test@test.it" },
                profiles: [],
              },
            });
        }),
    );
    const { store } = renderWithProviders(<VerifyWhatsApp />, openDialogState);
    // Addressed by position, not by name: the label is swapped for the loading one while the
    // request is in flight, which is the state under test.
    const submitButton = () => {
      const buttons = Array.from(document.querySelectorAll("button"));
      return buttons[buttons.length - 1];
    };
    expect(submitButton()).toHaveTextContent("verifyWhatsApp.submitBtn");

    fireEvent.change(
      screen.getByPlaceholderText("verifyWhatsApp.codeInputPlaceholder"),
      { target: { value: "123456" } },
    );
    fireEvent.click(submitButton());
    expect(verifyWhatsAppCodeReq).toHaveBeenCalledTimes(1);

    await waitFor(() => expect(submitButton()).toBeDisabled());
    fireEvent.click(submitButton());

    expect(verifyWhatsAppCodeReq).toHaveBeenCalledTimes(1);
    releaseVerification();
    await waitFor(() => {
      const state = store.getState() as { dialog: { config?: { type?: string } } };
      expect(state.dialog.config?.type).toBe("alertDialog");
    });
  });

  it("shows a translated message for a wrong code instead of the backend text", async () => {
    (verifyWhatsAppCodeReq as jest.Mock).mockRejectedValue({
      response: { status: 401, data: { error: "invalid verification code" } },
    });
    renderWithProviders(<VerifyWhatsApp />, openDialogState);
    fireEvent.change(screen.getByLabelText("verifyWhatsApp.codeInputLabel"), {
      target: { value: "123456" },
    });
    fireEvent.click(screen.getByText("verifyWhatsApp.submitBtn"));
    expect(
      await screen.findByText("verifyWhatsApp.errors.wrongCode"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("invalid verification code"),
    ).not.toBeInTheDocument();
  });

  it("waits for the token renewal instead of leaving it in flight", async () => {
    let renewalSettled = false;
    (verifyWhatsAppCodeReq as jest.Mock).mockResolvedValue({
      status: 200,
      data: { id: "user-1" },
    });
    (renewToken as jest.Mock).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => {
            renewalSettled = true;
            resolve("token");
          }, 0),
        ),
    );
    renderWithProviders(<VerifyWhatsApp />, openDialogState);
    fireEvent.change(screen.getByLabelText("verifyWhatsApp.codeInputLabel"), {
      target: { value: "123456" },
    });
    fireEvent.click(screen.getByText("verifyWhatsApp.submitBtn"));
    await waitFor(() => expect(getUserReq).not.toHaveBeenCalled());
    await waitFor(() => expect(renewalSettled).toBe(true));
  });

  it("keeps the verification successful when the token renewal fails", async () => {
    const verifiedUser = {
      id: "user-1",
      account: { accountId: "test@test.it" },
      profiles: [],
    };
    (verifyWhatsAppCodeReq as jest.Mock).mockResolvedValue({
      status: 200,
      data: verifiedUser,
    });
    (renewToken as jest.Mock).mockRejectedValue(new Error("renewal failed"));

    const { store } = renderWithProviders(<VerifyWhatsApp />, openDialogState);
    fireEvent.change(
      screen.getByPlaceholderText("verifyWhatsApp.codeInputPlaceholder"),
      { target: { value: "123456" } },
    );
    fireEvent.click(screen.getByText("verifyWhatsApp.submitBtn"));

    // The phone is verified either way: a failed renewal is logged, not turned into a
    // failure the participant has to make sense of.
    await waitFor(() => {
      const state = store.getState() as {
        dialog: { config?: { type?: string } };
        user: { currentUser: unknown };
      };
      expect(state.user.currentUser).toEqual(verifiedUser);
      expect(state.dialog.config?.type).toBe("alertDialog");
    });
  });

  it("refreshes the user and closes the dialog when the attempt cap removes the phone", async () => {
    const userWithoutPhone = {
      id: "user-1",
      account: { accountId: "test@test.it" },
      profiles: [],
      contactInfos: [],
    };
    (verifyWhatsAppCodeReq as jest.Mock).mockRejectedValue({
      response: {
        status: 401,
        data: { error: "too many attempts, phone number removed" },
      },
    });
    (getUserReq as jest.Mock).mockResolvedValue({ data: userWithoutPhone });

    const { store } = renderWithProviders(<VerifyWhatsApp />, openDialogState);
    fireEvent.change(
      screen.getByPlaceholderText("verifyWhatsApp.codeInputPlaceholder"),
      { target: { value: "123456" } },
    );
    fireEvent.click(screen.getByText("verifyWhatsApp.submitBtn"));

    // The backend removed the phone, so the account is reloaded instead of being left showing
    // a number that no longer exists.
    await waitFor(() => expect(getUserReq).toHaveBeenCalledTimes(1));
    await waitFor(() => {
      const state = store.getState() as {
        dialog: { config?: { type?: string } };
        user: { currentUser: unknown };
      };
      expect(state.user.currentUser).toEqual(userWithoutPhone);
      expect(state.dialog.config?.type).toBe("alertDialog");
    });
  });

  it("still closes the dialog when reloading the user after the phone removal fails", async () => {
    (verifyWhatsAppCodeReq as jest.Mock).mockRejectedValue({
      response: {
        status: 401,
        data: { error: "too many attempts, phone number removed" },
      },
    });
    (getUserReq as jest.Mock).mockRejectedValue(new Error("network down"));

    const { store } = renderWithProviders(<VerifyWhatsApp />, openDialogState);
    fireEvent.change(
      screen.getByPlaceholderText("verifyWhatsApp.codeInputPlaceholder"),
      { target: { value: "123456" } },
    );
    fireEvent.click(screen.getByText("verifyWhatsApp.submitBtn"));

    await waitFor(() => {
      const state = store.getState() as { dialog: { config?: { type?: string } } };
      expect(state.dialog.config?.type).toBe("alertDialog");
    });
  });

  it("maps the recipient-not-allowed error on resend to a translated message", async () => {
    (resendWhatsAppCodeReq as jest.Mock).mockRejectedValue({
      response: {
        data: {
          error: "phone number not enabled to receive WhatsApp messages",
        },
      },
    });
    renderWithProviders(<VerifyWhatsApp />, openDialogState);
    fireEvent.click(screen.getByText("verifyWhatsApp.resendBtn"));
    expect(
      await screen.findByText("verifyWhatsApp.errors.recipientNotAllowed"),
    ).toBeInTheDocument();
  });

  it("confirms a successful resend and holds the button until the cooldown is over", async () => {
    jest.useFakeTimers();
    (resendWhatsAppCodeReq as jest.Mock).mockResolvedValue({ status: 200 });
    renderWithProviders(<VerifyWhatsApp />, openDialogState);
    const resendButton = () =>
      screen.getByRole("button", { name: /verifyWhatsApp.resend/ });

    fireEvent.click(resendButton());

    // The participant is told the code went out, and the button holds for the minute the
    // backend refuses a second one in.
    expect(
      await screen.findByText("verifyWhatsApp.resendSuccess"),
    ).toBeInTheDocument();
    expect(resendButton()).toBeDisabled();

    act(() => {
      jest.advanceTimersByTime(60000);
    });
    expect(resendButton()).not.toBeDisabled();
    jest.useRealTimers();
  });

  it("maps the cooldown refusal instead of asking the participant to simply try again", async () => {
    (resendWhatsAppCodeReq as jest.Mock).mockRejectedValue({
      response: {
        status: 400,
        data: { error: "cannot send verification so often" },
      },
    });
    renderWithProviders(<VerifyWhatsApp />, openDialogState);
    fireEvent.click(screen.getByText("verifyWhatsApp.resendBtn"));
    expect(
      await screen.findByText("verifyWhatsApp.errors.cooldown"),
    ).toBeInTheDocument();
  });

  it("asks for a new code when the verification is no longer in progress", async () => {
    (verifyWhatsAppCodeReq as jest.Mock).mockRejectedValue({
      response: {
        status: 400,
        data: { error: "no phone verification in progress" },
      },
    });
    renderWithProviders(<VerifyWhatsApp />, openDialogState);
    fireEvent.change(
      screen.getByPlaceholderText("verifyWhatsApp.codeInputPlaceholder"),
      { target: { value: "123456" } },
    );
    fireEvent.click(screen.getByText("verifyWhatsApp.submitBtn"));
    expect(
      await screen.findByText("verifyWhatsApp.errors.noPendingVerification"),
    ).toBeInTheDocument();
  });

  it("asks for a new code when the resend finds no number waiting", async () => {
    (resendWhatsAppCodeReq as jest.Mock).mockRejectedValue({
      response: {
        status: 400,
        data: { error: "phone number is not pending verification" },
      },
    });
    renderWithProviders(<VerifyWhatsApp />, openDialogState);
    fireEvent.click(screen.getByText("verifyWhatsApp.resendBtn"));
    expect(
      await screen.findByText("verifyWhatsApp.errors.noPendingVerification"),
    ).toBeInTheDocument();
  });

  it("stores the user and opens the success dialog after a successful verification", async () => {
    const verifiedUser = {
      id: "user-1",
      account: { accountId: "test@test.it" },
      profiles: [],
    };
    (verifyWhatsAppCodeReq as jest.Mock).mockResolvedValue({
      status: 200,
      data: verifiedUser,
    });

    const { store } = renderWithProviders(<VerifyWhatsApp />, openDialogState);

    fireEvent.change(
      screen.getByPlaceholderText("verifyWhatsApp.codeInputPlaceholder"),
      {
        target: { value: "123456" },
      },
    );
    fireEvent.click(screen.getByText("verifyWhatsApp.submitBtn"));

    await waitFor(() =>
      expect(verifyWhatsAppCodeReq).toHaveBeenCalledWith("123456"),
    );
    await waitFor(() => {
      const state = store.getState() as {
        dialog: { config?: { type?: string } };
        user: { currentUser: unknown };
      };
      expect(state.dialog.config?.type).toBe("alertDialog");
      expect(state.user.currentUser).toEqual(verifiedUser);
    });
    expect(renewToken).toHaveBeenCalled();
    expect(getUserReq).not.toHaveBeenCalled();
  });
});

describe("VerifyWhatsApp code field", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const codeField = () =>
    screen.getByPlaceholderText(
      "verifyWhatsApp.codeInputPlaceholder",
    ) as HTMLInputElement;

  it("asks the browser for the numeric keypad and the one-time code", () => {
    renderWithProviders(<VerifyWhatsApp />, openDialogState);
    const field = codeField();
    expect(field).toHaveAttribute("inputmode", "numeric");
    expect(field).toHaveAttribute("pattern", "[0-9]*");
    // The code arrives by WhatsApp on the same phone, so the browser is allowed to offer it
    // instead of being told to suggest nothing.
    expect(field).toHaveAttribute("autocomplete", "one-time-code");
    // No maxLength: the browser applies it to the pasted text before the field ever sees it,
    // so a code pasted with a space in it arrives one digit short. The length is held in state
    // instead, after the separators have been taken out.
    expect(field).not.toHaveAttribute("maxlength");
  });

  it("takes the whole code from a paste that carries separators", () => {
    renderWithProviders(<VerifyWhatsApp />, openDialogState);
    const submit = screen
      .getByText("verifyWhatsApp.submitBtn")
      .closest("button");

    fireEvent.change(codeField(), { target: { value: "123 456" } });

    expect(codeField().value).toBe("123456");
    expect(submit).not.toBeDisabled();
  });

  it("keeps no more than the six digits the code has", () => {
    renderWithProviders(<VerifyWhatsApp />, openDialogState);
    fireEvent.change(codeField(), { target: { value: "1234567890" } });
    expect(codeField().value).toBe("123456");
  });

  it("keeps only the digits of what is typed", () => {
    renderWithProviders(<VerifyWhatsApp />, openDialogState);
    fireEvent.change(codeField(), { target: { value: "12a4 b5-6" } });
    expect(codeField().value).toBe("12456");
  });

  it("holds the submit button until the code is six digits long", () => {
    renderWithProviders(<VerifyWhatsApp />, openDialogState);
    const submit = screen
      .getByText("verifyWhatsApp.submitBtn")
      .closest("button");

    fireEvent.change(codeField(), { target: { value: "12345" } });
    expect(submit).toBeDisabled();

    fireEvent.change(codeField(), { target: { value: "123456" } });
    expect(submit).not.toBeDisabled();
  });

  it("never spends an attempt on anything but six digits", async () => {
    // Every code the backend issues is six digits, so a shorter or non-numeric one can only
    // be refused — and each refusal costs the participant one of the attempts that, once
    // spent, take the registered number with them.
    (verifyWhatsAppCodeReq as jest.Mock).mockResolvedValue({
      status: 200,
      data: { id: "user-1" },
    });
    renderWithProviders(<VerifyWhatsApp />, openDialogState);

    fireEvent.change(codeField(), { target: { value: "abc-def" } });
    fireEvent.click(screen.getByText("verifyWhatsApp.submitBtn"));
    expect(verifyWhatsAppCodeReq).not.toHaveBeenCalled();

    fireEvent.change(codeField(), { target: { value: "1a2b3c4d5e6f" } });
    fireEvent.click(screen.getByText("verifyWhatsApp.submitBtn"));
    await waitFor(() =>
      expect(verifyWhatsAppCodeReq).toHaveBeenCalledWith("123456"),
    );
  });
});
