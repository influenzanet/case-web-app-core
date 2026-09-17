/**
 * @jest-environment jsdom
 */
import React from "react";
import { act, fireEvent, screen, waitFor } from "@testing-library/react";

import DeletePhone from "../../src/components/dialogs/GlobalDialogs/DeletePhone";
import { deletePhoneReq, getUserReq } from "../../src/api/userAPI";
import { dialogActions } from "../../src/store/dialogSlice";
import { renderWithProviders } from "./testUtils";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock("../../src/api/userAPI", () => ({
  deletePhoneReq: jest.fn(),
  getUserReq: jest.fn(),
}));
jest.mock("../../src/api/instances/authenticatedApi", () => ({
  renewToken: jest.fn(),
}));

const openDialogState = {
  dialog: { config: { type: "deletePhone" } },
};

const userWithoutPhone = {
  id: "user-1",
  account: { accountId: "test@test.it" },
  profiles: [],
  contactInfos: [],
};

const confirmDeletion = () => {
  fireEvent.click(screen.getByText("deletePhone.confirmBtn"));
};

describe("DeletePhone dialog", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows a translated message instead of the text the backend sent", async () => {
    (deletePhoneReq as jest.Mock).mockRejectedValue({
      response: { status: 500, data: { error: "mongo: no documents in result" } },
    });
    renderWithProviders(<DeletePhone />, openDialogState);

    confirmDeletion();

    expect(
      await screen.findByText("deletePhone.errors.unknown"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("mongo: no documents in result"),
    ).not.toBeInTheDocument();
  });

  it("never renders markup that arrived in a backend message", async () => {
    // The alert box reads its content as markdown with raw HTML enabled, so a backend message
    // put straight into it is markup the participant's browser would run.
    (deletePhoneReq as jest.Mock).mockRejectedValue({
      response: {
        status: 500,
        data: { error: '<img src="x" onerror="alert(1)">' },
      },
    });
    renderWithProviders(<DeletePhone />, openDialogState);

    confirmDeletion();

    expect(
      await screen.findByText("deletePhone.errors.unknown"),
    ).toBeInTheDocument();
    expect(document.querySelector("img")).toBeNull();
  });

  it("stops the spinner when the deletion fails", async () => {
    (deletePhoneReq as jest.Mock).mockRejectedValue({
      response: { status: 500, data: { error: "action failed" } },
    });
    renderWithProviders(<DeletePhone />, openDialogState);

    confirmDeletion();

    expect(
      await screen.findByText("deletePhone.errors.unknown"),
    ).toBeInTheDocument();
    expect(screen.getByText("deletePhone.confirmBtn")).toBeInTheDocument();
  });

  it("leaves no spinner behind for the next time the dialog is opened", async () => {
    // The dialog stays mounted once the deletion succeeds, so a loading flag that is never
    // cleared is still set when the participant opens it again.
    (deletePhoneReq as jest.Mock).mockResolvedValue({
      status: 200,
      data: userWithoutPhone,
    });
    (getUserReq as jest.Mock).mockResolvedValue({ data: userWithoutPhone });
    const { store } = renderWithProviders(<DeletePhone />, openDialogState);

    confirmDeletion();
    await waitFor(() => {
      const state = store.getState() as { dialog: { config?: { type?: string } } };
      expect(state.dialog.config?.type).toBe("alertDialog");
    });

    act(() => {
      store.dispatch(
        dialogActions.openDialogWithoutPayload({ type: "deletePhone" }),
      );
    });

    expect(screen.getByText("deletePhone.confirmBtn")).toBeInTheDocument();
  });

  it("does not ask for the account again when the deletion already returned it", async () => {
    (deletePhoneReq as jest.Mock).mockResolvedValue({
      status: 200,
      data: userWithoutPhone,
    });
    const { store } = renderWithProviders(<DeletePhone />, openDialogState);

    confirmDeletion();

    await waitFor(() => {
      const state = store.getState() as { user: { currentUser: unknown } };
      expect(state.user.currentUser).toEqual(userWithoutPhone);
    });
    expect(getUserReq).not.toHaveBeenCalled();
  });

  it("asks for the account when the deletion answers without it", async () => {
    (deletePhoneReq as jest.Mock).mockResolvedValue({ status: 200 });
    (getUserReq as jest.Mock).mockResolvedValue({ data: userWithoutPhone });
    const { store } = renderWithProviders(<DeletePhone />, openDialogState);

    confirmDeletion();

    await waitFor(() => expect(getUserReq).toHaveBeenCalledTimes(1));
    await waitFor(() => {
      const state = store.getState() as { user: { currentUser: unknown } };
      expect(state.user.currentUser).toEqual(userWithoutPhone);
    });
  });
});
