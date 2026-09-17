/**
 * @jest-environment jsdom
 */
import React from "react";
import { fireEvent, screen, waitFor } from "@testing-library/react";

import ManageProfiles from "../../src/components/dialogs/GlobalDialogs/ManageProfiles";
import { removeProfileReq } from "../../src/api/userAPI";
import { renderWithProviders } from "./testUtils";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock("../../src/api/userAPI", () => ({
  removeProfileReq: jest.fn(),
}));
jest.mock("../../src/api/instances/authenticatedApi", () => ({
  renewToken: jest.fn(),
}));

const profile = (id: string, alias: string, mainProfile: boolean) => ({
  id,
  alias,
  avatarId: "default",
  createdAt: 0,
  consentConfirmedAt: 1752000000,
  mainProfile,
  studies: [],
  activeSurveys: [],
});

const openDialogState = {
  dialog: { config: { type: "manageProfiles" } },
  user: {
    currentUser: {
      id: "user-1",
      account: { accountId: "test@test.it" },
      contactInfos: [],
      profiles: [profile("p-1", "Main", true), profile("p-2", "Child", false)],
    },
  },
};

const deleteSecondProfile = () => {
  const trashButton = Array.from(document.querySelectorAll("button")).find(
    (button) => button.querySelector(".fa-trash") !== null,
  ) as HTMLButtonElement;
  fireEvent.click(trashButton);
};

describe("ManageProfiles profile deletion", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("removes a profile once however many times the confirmation is clicked", async () => {
    // The confirmation dialog stays open until the request settles, so its button is there to be
    // clicked again, and every click removes another profile.
    let releaseRemoval: () => void = () => undefined;
    (removeProfileReq as jest.Mock).mockImplementation(
      () =>
        new Promise<{ data: unknown }>((resolve) => {
          releaseRemoval = () => resolve({ data: undefined });
        }),
    );
    renderWithProviders(<ManageProfiles />, openDialogState);

    deleteSecondProfile();
    const confirmButton = await screen.findByText(
      "manageProfiles.warningDialog.confirmBtn",
    );
    fireEvent.click(confirmButton);
    fireEvent.click(confirmButton);

    await waitFor(() => expect(removeProfileReq).toHaveBeenCalledTimes(1));
    expect(removeProfileReq).toHaveBeenCalledWith("p-2");
    releaseRemoval();
  });
});
