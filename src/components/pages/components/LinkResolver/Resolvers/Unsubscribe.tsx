import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import {
  containerClassName,
  AlertBox,
  TitleBar,
} from "@influenzanet/case-web-ui";

import { DefaultRoutes } from "../../../../../types/routing";
import { useUrlQuery } from "../../../../../hooks/useUrlQuery";
import { useIsAuthenticated } from "../../../../../hooks/useIsAuthenticated";
import {
  unsubscribeNewsletterReq,
  unsubscribeWeeklyReq,
} from "../../../../../api/userAPI";
import { logRequestFailure } from "../../../../../api/errorMessages";
import { LinkResolverPaths } from "./LinkResolverConst";

export type UnsubscribeSubscription = "newsletter" | "weekly";

const requests = {
  newsletter: unsubscribeNewsletterReq,
  weekly: unsubscribeWeeklyReq,
};

const paths = {
  newsletter: LinkResolverPaths.UnsubscribeNewsletter,
  weekly: LinkResolverPaths.UnsubscribeWeekly,
};

type UnsubscribeState = "confirm" | "loading" | "success" | "invalidLink" | "error";

interface UnsubscribeProps {
  subscription: UnsubscribeSubscription;
  defaultRoutes: DefaultRoutes;
}

// The keys are written out in full, so that a locale check can find them in the built library.
const subscriptionTexts = {
  newsletter: {
    title: "unsubscribe.newsletter.title",
    info: "unsubscribe.newsletter.info",
    success: "unsubscribe.newsletter.success",
  },
  weekly: {
    title: "unsubscribe.weekly.title",
    info: "unsubscribe.weekly.info",
    success: "unsubscribe.weekly.success",
  },
};

// The page of the unsubscribe link in a newsletter or a weekly reminder, by e-mail or WhatsApp.
// It turns the subscription off only when the participant confirms: mail security scanners open
// the links of a message by themselves, and a link that acted on opening would unsubscribe
// participants who never clicked it. No login is needed; the token in the link is the
// participant's.
const Unsubscribe: React.FC<UnsubscribeProps> = (props) => {
  const { t } = useTranslation(["linkresolvers"]);
  const history = useHistory();
  const query = useUrlQuery();
  const isLoggedIn = useIsAuthenticated();

  const [token] = useState(() => query.get("token") ?? "");
  const [state, setState] = useState<UnsubscribeState>(
    token ? "confirm" : "invalidLink"
  );

  // The token stays out of the address bar and the browser history once it has been read.
  useEffect(() => {
    history.replace(paths[props.subscription]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The button is disabled while the request runs, so a double click sends one request.
  const unsubscribe = async () => {
    setState("loading");
    try {
      await requests[props.subscription](token);
      setState("success");
    } catch (e: unknown) {
      logRequestFailure(`unsubscribing from ${props.subscription}`, e);
      const status = (e as { response?: { status?: number } })?.response?.status;
      setState(status === 400 ? "invalidLink" : "error");
    }
  };

  const texts = subscriptionTexts[props.subscription];

  const confirmButton = (label: string) => (
    <button
      className="btn btn-primary me-2"
      disabled={state === "loading"}
      onClick={unsubscribe}
    >
      {label}
    </button>
  );

  const homeButton = (
    <button
      className="btn btn-outline-primary"
      onClick={() =>
        history.push(
          isLoggedIn ? props.defaultRoutes.auth : props.defaultRoutes.unauth
        )
      }
    >
      {t("unsubscribe.homeBtn")}
    </button>
  );

  const content = () => {
    switch (state) {
      case "confirm":
      case "loading":
        return (
          <React.Fragment>
            <AlertBox
              className="mb-2"
              type="info"
              content={t(texts.info)}
            />
            {confirmButton(t("unsubscribe.confirmBtn"))}
            {state === "loading" ? (
              <span
                className="spinner-border spinner-border-sm text-primary"
                role="status"
              />
            ) : null}
          </React.Fragment>
        );
      case "success":
        return (
          <React.Fragment>
            <AlertBox
              className="mb-2"
              type="success"
              content={t(texts.success)}
            />
            {homeButton}
          </React.Fragment>
        );
      case "invalidLink":
        return (
          <React.Fragment>
            <AlertBox
              className="mb-2"
              type="danger"
              useIcon={true}
              content={t("unsubscribe.invalidLink")}
            />
            {homeButton}
          </React.Fragment>
        );
      case "error":
        return (
          <React.Fragment>
            <AlertBox
              className="mb-2"
              type="danger"
              useIcon={true}
              content={t("unsubscribe.error")}
            />
            {confirmButton(t("unsubscribe.retryBtn"))}
            {homeButton}
          </React.Fragment>
        );
    }
  };

  return (
    <React.Fragment>
      <TitleBar content={t(texts.title)} />
      <div className={containerClassName}>
        <div
          className="d-flex align-items-center my-3 justify-content-center h-100"
          style={{ minHeight: "60vh" }}
        >
          <div className="bg-grey-1 p-2" style={{ maxWidth: 500 }}>
            {content()}
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};

export default Unsubscribe;
