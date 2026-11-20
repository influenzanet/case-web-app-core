/**
 * @jest-environment jsdom
 */
import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { Route, Router } from "react-router-dom";
import { createMemoryHistory, MemoryHistory } from "history";

import LinkResolver from "../../src/components/pages/components/LinkResolver/LinkResolver";
import { linkResolverRootUrl } from "../../src/components/pages/components/LinkResolver/Resolvers/LinkResolverConst";
import {
  unsubscribeNewsletterReq,
  unsubscribeWeeklyReq,
} from "../../src/api/userAPI";
import appReducer from "../../src/store/appSlice";
import userReducer from "../../src/store/userSlice";
import dialogReducer from "../../src/store/dialogSlice";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock("../../src/api/userAPI", () => ({
  unsubscribeNewsletterReq: jest.fn(),
  unsubscribeWeeklyReq: jest.fn(),
}));

const defaultRoutes = { auth: "/home-auth", unauth: "/home-unauth" };

const subscriptions = [
  { name: "newsletter", req: unsubscribeNewsletterReq, other: unsubscribeWeeklyReq },
  { name: "weekly", req: unsubscribeWeeklyReq, other: unsubscribeNewsletterReq },
] as const;

// A participant signed in with a confirmed account.
const loggedIn = () => {
  const app = appReducer(undefined, { type: "init" });
  const user = userReducer(undefined, { type: "init" });
  return {
    app: { ...app, auth: { accessToken: "access-token", refreshToken: "refresh-token", expiresAt: 0 } },
    user: {
      ...user,
      currentUser: {
        ...user.currentUser,
        account: { ...user.currentUser.account, accountConfirmedAt: 1700000000 },
      },
    },
  };
};

// The pages as the participant web app mounts them: under the link resolver, at its root path.
const renderLink = (url: string, preloadedState?: ReturnType<typeof loggedIn>): MemoryHistory => {
  const history = createMemoryHistory({ initialEntries: [url] });
  const store = configureStore({
    reducer: { app: appReducer, user: userReducer, dialog: dialogReducer },
    preloadedState,
  });
  render(
    <Provider store={store}>
      <Router history={history}>
        <Route
          path={linkResolverRootUrl}
          render={() => <LinkResolver defaultRoutes={defaultRoutes} />}
        />
      </Router>
    </Provider>
  );
  return history;
};

const confirm = () => fireEvent.click(screen.getByText("unsubscribe.confirmBtn"));

describe.each(subscriptions)("the $name unsubscribe page", ({ name, req, other }) => {
  const url = `/link/unsubscribe-${name}?token=the-token`;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it("asks for a confirmation and calls nothing on opening", () => {
    renderLink(url);
    expect(screen.getByText(`unsubscribe.${name}.title`)).toBeInTheDocument();
    expect(screen.getByText(`unsubscribe.${name}.info`)).toBeInTheDocument();
    expect(screen.getByText("unsubscribe.confirmBtn")).toBeInTheDocument();
    expect(req).not.toHaveBeenCalled();
    expect(other).not.toHaveBeenCalled();
  });

  it("removes the token from the address once read", () => {
    const history = renderLink(url);
    expect(history.location.pathname).toBe(`/link/unsubscribe-${name}`);
    expect(history.location.search).toBe("");
  });

  it("unsubscribes with the token of the link on confirmation", async () => {
    (req as jest.Mock).mockResolvedValue({ status: 200, data: {} });
    renderLink(url);
    confirm();
    expect(await screen.findByText(`unsubscribe.${name}.success`)).toBeInTheDocument();
    expect(req).toHaveBeenCalledTimes(1);
    expect(req).toHaveBeenCalledWith("the-token");
    expect(other).not.toHaveBeenCalled();
    expect(screen.queryByText("unsubscribe.confirmBtn")).not.toBeInTheDocument();
  });

  it("sends one request when the button is clicked twice", async () => {
    let resolve: (v: unknown) => void = () => undefined;
    (req as jest.Mock).mockReturnValue(new Promise((r) => (resolve = r)));
    renderLink(url);
    confirm();
    confirm();
    expect(req).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("status")).toBeInTheDocument();
    await act(async () => resolve({ status: 200, data: {} }));
    expect(await screen.findByText(`unsubscribe.${name}.success`)).toBeInTheDocument();
  });

  it("tells an invalid link apart when the backend refuses the token", async () => {
    (req as jest.Mock).mockRejectedValue({
      response: { status: 400, data: { error: "token expired" } },
    });
    renderLink(url);
    confirm();
    expect(await screen.findByText("unsubscribe.invalidLink")).toBeInTheDocument();
    expect(screen.queryByText("token expired")).not.toBeInTheDocument();
    expect(screen.queryByText("unsubscribe.retryBtn")).not.toBeInTheDocument();
  });

  it.each([
    ["a server error", { response: { status: 500, data: { error: "mongo: no documents" } } }],
    ["no response", { message: "Network Error" }],
  ])("offers a retry after %s", async (_, failure) => {
    (req as jest.Mock).mockRejectedValueOnce(failure).mockResolvedValueOnce({ status: 200, data: {} });
    renderLink(url);
    confirm();
    expect(await screen.findByText("unsubscribe.error")).toBeInTheDocument();
    expect(screen.queryByText("mongo: no documents")).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("unsubscribe.retryBtn"));
    expect(await screen.findByText(`unsubscribe.${name}.success`)).toBeInTheDocument();
    expect(req).toHaveBeenCalledTimes(2);
  });

  it("shows an invalid link, and offers no confirmation, without a token", () => {
    renderLink(`/link/unsubscribe-${name}`);
    expect(screen.getByText("unsubscribe.invalidLink")).toBeInTheDocument();
    expect(screen.queryByText("unsubscribe.confirmBtn")).not.toBeInTheDocument();
    expect(req).not.toHaveBeenCalled();
  });

  it("leads home, logged out", async () => {
    (req as jest.Mock).mockResolvedValue({ status: 200, data: {} });
    const history = renderLink(url);
    confirm();
    fireEvent.click(await screen.findByText("unsubscribe.homeBtn"));
    await waitFor(() => expect(history.location.pathname).toBe("/home-unauth"));
  });

  it("works signed in too, and then leads to the signed-in home", async () => {
    (req as jest.Mock).mockResolvedValue({ status: 200, data: {} });
    const history = renderLink(url, loggedIn());
    expect(req).not.toHaveBeenCalled();
    confirm();
    fireEvent.click(await screen.findByText("unsubscribe.homeBtn"));
    await waitFor(() => expect(history.location.pathname).toBe("/home-auth"));
    expect(req).toHaveBeenCalledWith("the-token");
  });
});
