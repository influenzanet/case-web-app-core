/**
 * @jest-environment jsdom
 */
import React from "react";
import { fireEvent, screen } from "@testing-library/react";

import DeleteAccount from "../../src/components/dialogs/GlobalDialogs/DeleteAccount";
import { deleteAccountReq } from "../../src/api/userAPI";
import { renderWithProviders } from "./testUtils";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock("../../src/api/userAPI", () => ({
  deleteAccountReq: jest.fn(),
}));
jest.mock("../../src/hooks/useLogout", () => ({
  useLogout: () => jest.fn(),
}));

const openDialogState = {
  dialog: { config: { type: "deleteAccount" } },
  user: {
    currentUser: {
      id: "user-1",
      account: { accountId: "test@test.it" },
      profiles: [],
      contactInfos: [],
    },
  },
};

const confirmDeletion = () => {
  fireEvent.click(screen.getByText("deleteAccount.confirmBtn"));
};

describe("DeleteAccount confirm button while the request is running", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("names itself while the account is being deleted", async () => {
    let releaseDeletion: () => void = () => undefined;
    (deleteAccountReq as jest.Mock).mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          releaseDeletion = () => resolve();
        }),
    );
    renderWithProviders(<DeleteAccount />, openDialogState);

    confirmDeletion();

    // The loading state swaps the label for a spinner and an empty span, so without a label of
    // its own the button is announced as nothing at all.
    expect(
      await screen.findByRole("button", { name: "loadingMsg" }),
    ).toBeInTheDocument();
    releaseDeletion();
  });

  it("refuses a second click while the first deletion is still running", async () => {
    let releaseDeletion: () => void = () => undefined;
    (deleteAccountReq as jest.Mock).mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          releaseDeletion = () => resolve();
        }),
    );
    renderWithProviders(<DeleteAccount />, openDialogState);

    confirmDeletion();
    const confirmButton = await screen.findByRole("button", {
      name: "loadingMsg",
    });
    expect(confirmButton).toBeDisabled();
    fireEvent.click(confirmButton);

    expect(deleteAccountReq).toHaveBeenCalledTimes(1);
    releaseDeletion();
  });
});
