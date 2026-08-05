import clsx from "clsx";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { renewToken } from "../../../api/instances/authenticatedApi";
import { getUserReq, newAccountPhoneReq } from "../../../api/userAPI";
import { BACKEND_ERRORS, classifyPhoneError } from "../../../api/errorMessages";
import { dialogActions } from "../../../store/dialogSlice";
import { RootState } from "../../../store/rootReducer";
import { userActions } from "../../../store/userSlice";
import {
  DialogBtn,
  AlertBox,
  TextField,
  SelectField,
  defaultDialogPaddingXClass,
  Dialog,
  ConfirmDialog,
} from "@influenzanet/case-web-ui";
import COUNTRY_CODES from "../../../configs/countryCodes.json";

const AddPhone: React.FC = () => {
  const { t } = useTranslation(["dialogs"]);
  const dispatch = useDispatch();
  const dialogState = useSelector((state: RootState) => state.dialog);
  const open = dialogState.config?.type === "addPhone";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [openConfirm, setOpenConfirm] = useState(false);
  const [formData, setFormData] = useState({
    countryCode: "+39",
    phoneNumber: "",
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
    setFormData({
      countryCode: "+39",
      phoneNumber: "",
      newPhone: "",
    });
  };

  const updateFullPhoneNumber = (countryCode: string, phoneNumber: string) => {
    const cleanNumber = phoneNumber.replace(/[^\d\s-]/g, "");
    const fullPhone = countryCode + cleanNumber;
    setFormData((prev) => ({
      ...prev,
      countryCode,
      phoneNumber: cleanNumber,
      newPhone: fullPhone,
    }));
  };

  const handleCountryCodeChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const newCountryCode = event.target.value;
    updateFullPhoneNumber(newCountryCode, formData.phoneNumber);
  };

  const handlePhoneNumberChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const newPhoneNumber = event.target.value;
    updateFullPhoneNumber(formData.countryCode, newPhoneNumber);
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
          console.error(renewError);
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
      console.error(e);
      handleError(e);
    } finally {
      setLoading(false);
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
    return loading || formData.phoneNumber.length < 8;
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
          <label className="form-label mb-1">
            {t("dialogs:addPhone.phoneInputLabel")}
          </label>

          <div className="d-flex mb-2">
            <SelectField
              className="me-2"
              style={{ width: "120px", flexShrink: 0 }}
              value={formData.countryCode}
              onChange={handleCountryCodeChange}
              values={COUNTRY_CODES.map((country) => ({
                code: country.code,
                label: `${country.code} ${country.country}`,
              }))}
            />

            <TextField
              type="text"
              placeholder={t("dialogs:addPhone.phoneInputPlaceholder")}
              value={formData.phoneNumber}
              autoFocus
              autoComplete="tel"
              className="flex-grow-1"
              onChange={handlePhoneNumberChange}
              style={{ marginBottom: 0 }}
            />
          </div>

          <small className="text-muted mb-2 d-block">
            {t("dialogs:addPhone.completeNumber")}: {formData.newPhone}
          </small>

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
