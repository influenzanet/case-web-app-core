/**
 * @jest-environment node
 */
import apiInstance from "../../src/api/instances/defaultApi";
import authApiInstance from "../../src/api/instances/authenticatedApi";
import { unsubscribeNewsletterReq, unsubscribeWeeklyReq } from "../../src/api/userAPI";

jest.mock("../../src/api/instances/defaultApi", () => ({ __esModule: true, default: { get: jest.fn() } }));
jest.mock("../../src/api/instances/authenticatedApi", () => ({ __esModule: true, default: { get: jest.fn() } }));

// The unsubscribe pages work without a login: their requests go through the instance that sends
// no Authorization header, with the token of the link as the only credential.
describe("unsubscribe requests", () => {
  it.each([
    ["newsletter", unsubscribeNewsletterReq, "/v1/user/unsubscribe-newsletter"],
    ["weekly", unsubscribeWeeklyReq, "/v1/user/unsubscribe-weekly"],
  ])("the %s request carries the token to its route", (_, req, path) => {
    req("the-token");
    expect(apiInstance.get).toHaveBeenCalledWith(path, { params: { token: "the-token" } });
    expect(authApiInstance.get).not.toHaveBeenCalled();
  });
});
