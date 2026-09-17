import React, { FC, useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";

import { RootState } from "../../../store/rootReducer";
import {
  dialogActions,
  VerifyWhatsAppDialog,
} from "../../../store/dialogSlice";
import { userActions } from "../../../store/userSlice";
import {
  verifyWhatsAppCodeReq,
  getUserReq,
  resendWhatsAppCodeReq,
} from "../../../api/userAPI";
import { classifyPhoneError, logRequestFailure } from "../../../api/errorMessages";
import { renewToken } from "../../../api/instances/authenticatedApi";
import { useResendCooldown } from "../../../hooks/useResendCooldown";
import {
  DialogBtn,
  AlertBox,
  TextField,
  defaultDialogPaddingXClass,
  Dialog,
} from "@influenzanet/case-web-ui";

const VerifyWhatsApp: FC = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation(["dialogs"]);

  const dialogState = useSelector((state: RootState) => state.dialog);
  const open = dialogState.config?.type === "verifyWhatsApp";
  const dialogContent = open
    ? (dialogState.config as VerifyWhatsAppDialog).payload
    : undefined;

  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendConfirmation, setResendConfirmation] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const {
    secondsLeft: resendSecondsLeft,
    isCoolingDown: resendOnCooldown,
    start: startResendCooldown,
  } = useResendCooldown();

  const phoneNumber = dialogContent?.phoneNumber || "";

  // Reset verification code when dialog opens
  useEffect(() => {
    if (open) {
      setVerificationCode("");
      setError("");
      setResendConfirmation("");
    }
  }, [open]);

  const close = () => {
    dispatch(dialogActions.closeDialog());
    setVerificationCode("");
    setError("");
    setResendConfirmation("");
  };

  const resendCode = async () => {
    setResendLoading(true);
    setError("");
    setResendConfirmation("");
    try {
      await resendWhatsAppCodeReq();
      setError("");
      setResendConfirmation(t("verifyWhatsApp.resendSuccess"));
      startResendCooldown();
    } catch (e: unknown) {
      logRequestFailure("resending the WhatsApp code", e);
      switch (classifyPhoneError(e)) {
        case "rateLimited":
          setError(t("verifyWhatsApp.errors.rateLimit"));
          break;
        case "recipientNotAllowed":
          setError(t("verifyWhatsApp.errors.recipientNotAllowed"));
          break;
        case "noPendingVerification":
          setError(t("verifyWhatsApp.errors.noPendingVerification"));
          break;
        case "cooldown":
          setError(t("verifyWhatsApp.errors.cooldown"));
          // The window left is at most a full one, so holding the button for that long keeps
          // the participant from walking into the same refusal a second time.
          startResendCooldown();
          break;
        default:
          setError(t("verifyWhatsApp.errors.unknown"));
          break;
      }
    } finally {
      setResendLoading(false);
    }
  };

  // The attempt cap removes the phone on the backend, so the account is reloaded and the
  // verification dialog gives way to the alert: leaving it open would keep offering a code for
  // a number that is gone.
  const handlePhoneRemoved = async () => {
    try {
      const userData = (await getUserReq()).data;
      dispatch(userActions.setUser(userData));
    } catch (refreshError: unknown) {
      logRequestFailure("reloading the user after the phone was removed", refreshError);
    }
    dispatch(
      dialogActions.openAlertDialog({
        type: "alertDialog",
        payload: {
          color: "danger",
          title: t("verifyWhatsApp.tooManyAttemptsDialog.title"),
          content: t("verifyWhatsApp.errors.tooManyAttempts"),
          btn: t("verifyWhatsApp.tooManyAttemptsDialog.btn"),
        },
      }),
    );
  };

  const verifyCode = async () => {
    if (!verificationCode.trim()) {
      setError(t("verifyWhatsApp.errors.codeRequired"));
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await verifyWhatsAppCodeReq(verificationCode);
      if (response.status === 200) {
        // Awaited so a failure is handled here instead of surfacing as an unhandled
        // rejection, and so the renewal is not left racing whatever the user does next.
        try {
          await renewToken();
        } catch (renewError) {
          logRequestFailure("renewing the token after verifying the phone", renewError);
        }
        if (response.data) {
          dispatch(userActions.setUser(response.data));
        } else {
          const userData = (await getUserReq()).data;
          dispatch(userActions.setUser(userData));
        }

        // Show success message
        dispatch(
          dialogActions.openAlertDialog({
            type: "alertDialog",
            payload: {
              color: "success",
              title: t("verifyWhatsApp.successDialog.title"),
              content: t("verifyWhatsApp.successDialog.content"),
              btn: t("verifyWhatsApp.successDialog.btn"),
            },
          }),
        );
      }
    } catch (e: unknown) {
      logRequestFailure("verifying the WhatsApp code", e);
      // Every branch translates: the backend message is English prose meant for logs, and
      // showing it raw put it in front of participants who do not read the interface in it.
      switch (classifyPhoneError(e)) {
        case "invalidCode":
          setError(t("verifyWhatsApp.errors.wrongCode"));
          break;
        case "codeExpired":
          setError(t("verifyWhatsApp.errors.codeExpired"));
          break;
        case "tooManyAttempts":
          await handlePhoneRemoved();
          break;
        case "rateLimited":
          setError(t("verifyWhatsApp.errors.rateLimit"));
          break;
        case "noPendingVerification":
          setError(t("verifyWhatsApp.errors.noPendingVerification"));
          break;
        default:
          setError(t("verifyWhatsApp.errors.verificationFailed"));
          break;
      }
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return null;
  }

  return (
    <Dialog
      open={open}
      title={t("verifyWhatsApp.title")}
      ariaLabelledBy="verify-whatsapp-title"
      onClose={close}
    >
      <div className={`${defaultDialogPaddingXClass} py-4`}>
        <div className="mb-4">
          <p className="mb-2">{t("verifyWhatsApp.info")}</p>
        </div>

        {error && <AlertBox type="danger" content={error} className="mb-3" />}

        {resendConfirmation && (
          <AlertBox
            type="success"
            content={resendConfirmation}
            className="mb-3"
          />
        )}

        <div className="mb-3">
          <TextField
            id="verification-code"
            name="verificationCode"
            label={t("verifyWhatsApp.codeInputLabel")}
            placeholder={t("verifyWhatsApp.codeInputPlaceholder")}
            value={verificationCode}
            onChange={(event) => setVerificationCode(event.target.value)}
            maxLength={6}
            autoComplete="off"
          />
        </div>
      </div>

      <div className="d-flex justify-content-between align-items-center gap-3 p-3 border-top">
        <DialogBtn
          type="button"
          onClick={resendCode}
          label={
            resendOnCooldown
              ? t("verifyWhatsApp.resendCountdown", {
                  seconds: resendSecondsLeft,
                })
              : t("verifyWhatsApp.resendBtn")
          }
          loading={resendLoading}
          loadingLabel={t("loadingMsg")}
          // DialogBtn's loading prop only swaps the label, so the in-flight resend is what
          // disables the button: a second click would spend another of the codes the backend
          // allows before the first answer is even back.
          disabled={loading || resendLoading || !phoneNumber || resendOnCooldown}
        />
        <div className="d-flex gap-3">
          <DialogBtn
            type="button"
            onClick={close}
            label={t("verifyWhatsApp.cancelBtn")}
            disabled={loading || resendLoading}
          />
          <DialogBtn
            type="button"
            onClick={verifyCode}
            color="primary"
            label={t("verifyWhatsApp.submitBtn")}
            loading={loading}
            loadingLabel={t("loadingMsg")}
            // DialogBtn's loading prop only swaps the label, so the in-flight check is what
            // disables the button: a second click would spend another of the attempts the
            // backend counts before the first answer is even back.
            disabled={!verificationCode.trim() || loading || resendLoading}
          />
        </div>
      </div>
    </Dialog>
  );
};

export default VerifyWhatsApp;
