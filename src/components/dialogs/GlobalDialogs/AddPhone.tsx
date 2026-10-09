import clsx from "clsx";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { renewToken } from "../../../api/instances/authenticatedApi";
import { getUserReq, newAccountPhoneReq } from "../../../api/userAPI";
import { BACKEND_ERRORS, classifyPhoneError, logRequestFailure } from "../../../api/errorMessages";
import { dialogActions } from "../../../store/dialogSlice";
import { RootState } from "../../../store/rootReducer";
import { userActions } from "../../../store/userSlice";
import {
  DialogBtn,
  AlertBox,
  defaultDialogPaddingXClass,
  Dialog,
  ConfirmDialog,
} from "@influenzanet/case-web-ui";
import PhoneNumberInput from "../../inputs/PhoneNumberInput";

const AddPhone: React.FC = () => {
  const { t } = useTranslation(["dialogs"]);
  const dispatch = useDispatch();
  const dialogState = useSelector((state: RootState) => state.dialog);
  const open = dialogState.config?.type === "addPhone";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [openConfirm, setOpenConfirm] = useState(false);
  const [phoneValid, setPhoneValid] = useState(false);
  const [formData, setFormData] = useState({
    newPhone: "",
  });

  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  const resetForm = () => {
    setLoading(false);
    setError("");
    setPhoneValid(false);
    setFormData({
      newPhone: "",
    });
  };

  const handleClose = () => {
    dispatch(dialogActions.closeDialog());
  };

  const addPhone = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await newAccountPhoneReq(formData.newPhone);
      if (response.status === 200) {
        // Awaited so a failure is handled here instead of surfacing as an unhandled
        // rejection, and so the renewal is not left racing whatever the user does next.
        try {
          await renewToken();
        } catch (renewError) {
          logRequestFailure("renewing the token after adding a phone", renewError);
        }
        if (response.data) {
          dispatch(userActions.setUser(response.data));
        } else {
          const userData = (await getUserReq()).data;
          dispatch(userActions.setUser(userData));
        }
        dispatch(
          dialogActions.openVerifyWhatsAppDialog({
            type: "verifyWhatsApp",
            payload: {
              phoneNumber: formData.newPhone,
            },
          }),
        );
      }
    } catch (e: unknown) {
      logRequestFailure("adding a phone number", e);
      handleError(e);
      // A failure the backend answered can still have stored the number, because sending the
      // code is the step after storing it. The account is reloaded so the interface shows the
      // phone that is now waiting to be verified instead of offering to add one again.
      if ((e as { response?: unknown })?.response !== undefined) {
        await refreshUser();
      }
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const userData = (await getUserReq()).data;
      dispatch(userActions.setUser(userData));
    } catch (refreshError: unknown) {
      logRequestFailure("reloading the user after adding a phone failed", refreshError);
    }
  };

  // The two failures the gateway gives a status of their own are read from it; the rest are
  // only distinguishable by their message, so those keep matching on it.
  const handleError = (e: unknown) => {
    switch (classifyPhoneError(e)) {
      case "recipientNotAllowed":
        setError(t("addPhone.errors.recipientNotAllowed"));
        return;
      case "rateLimited":
        setError(t("addPhone.errors.rateLimit"));
        return;
      case "noPendingVerification":
        setError(t("addPhone.errors.noPendingVerification"));
        return;
      default:
        break;
    }

    const errorMsg = (e as { response?: { data?: { error?: string } } })
      ?.response?.data?.error;
    switch (errorMsg) {
      case BACKEND_ERRORS.ACTION_FAILED:
        setError(t("addPhone.errors.wrongPasswordOrAccountId"));
        break;
      case BACKEND_ERRORS.PHONE_NOT_VALID:
        setError(t("addPhone.errors.wrongPhoneFormat"));
        break;
      case BACKEND_ERRORS.PHONE_ALREADY_TAKEN:
        setError(t("addPhone.errors.phoneAlreadyTaken"));
        break;
      case BACKEND_ERRORS.USER_HAS_PHONE:
        setError(t("addPhone.errors.alreadyHasPhone"));
        break;
      case BACKEND_ERRORS.SEND_FAILED:
        setError(t("addPhone.errors.sendFailed"));
        break;
      default:
        setError(t("addPhone.errors.unknown"));
        break;
    }
  };

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setOpenConfirm(true);
  };

  const buttonDisabled = (): boolean => {
    return loading || !phoneValid;
  };

  return (
    <Dialog
      open={open}
      title={t("addPhone.title")}
      onClose={handleClose}
      ariaLabelledBy="addPhoneDialogTitle"
    >
      <div className={clsx(defaultDialogPaddingXClass, "py-3", "bg-grey-1")}>
        <form onSubmit={onSubmit}>
          <PhoneNumberInput
            className="mb-2"
            value={formData.newPhone}
            label={t("dialogs:addPhone.phoneInputLabel")}
            placeholder={t("dialogs:addPhone.phoneInputPlaceholder")}
            autoFocus
            onChange={(fullPhoneNumber, isValid) => {
              setFormData((prev) => ({ ...prev, newPhone: fullPhoneNumber }));
              setPhoneValid(isValid);
            }}
          />

          <AlertBox type="info" content={t("addPhone.info")} />

          <AlertBox
            type="danger"
            className="mt-2"
            hide={!error}
            closable={true}
            useIcon={true}
            onClose={() => setError("")}
            content={error}
          />

          <div className="d-flex flex-wrap">
            <DialogBtn
              className="mt-2 me-2"
              type="button"
              color="primary"
              outlined={true}
              label={t("addPhone.cancelBtn")}
              onClick={() => handleClose()}
            />
            <DialogBtn
              className="mt-2"
              type="submit"
              color="primary"
              loading={loading}
              loadingLabel={t("loadingMsg")}
              disabled={buttonDisabled()}
              label={t("addPhone.confirmBtn")}
            />
          </div>
        </form>
      </div>
      {
        <ConfirmDialog
          open={openConfirm}
          title={t("addPhone.warningDialog.title")}
          onConfirm={() => {
            setOpenConfirm(false);
            addPhone();
          }}
          color="warning"
          onClose={() => setOpenConfirm(false)}
          cancelText={t("addPhone.warningDialog.cancelBtn")}
          confirmText={t("addPhone.warningDialog.confirmBtn")}
        >
          <AlertBox
            type="warning"
            content={t("addPhone.warningDialog.content")}
          />
        </ConfirmDialog>
      }
    </Dialog>
  );
};

export default AddPhone;
