import clsx from "clsx";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { renewToken } from "../../../api/instances/authenticatedApi";
import { Profile } from "../../../api/types/user";
import { removeProfileReq } from "../../../api/userAPI";
import { getErrorMsg } from "../../../api/utils";
import { dialogActions } from "../../../store/dialogSlice";
import { RootState } from "../../../store/rootReducer";
import { userActions } from "../../../store/userSlice";
import {
  DialogBtn,
  Dialog,
  AlertBox,
  Avatar,
  ConfirmDialog,
  defaultDialogPaddingXClass,
} from "@influenzanet/case-web-ui";
import EditProfile from "./EditProfile";

const emptyProfile: Profile = {
  id: "",
  alias: "",
  avatarId: "default",
  createdAt: 0,
  consentConfirmedAt: 0,
  mainProfile: false,
  studies: [],
  activeSurveys: [],
};

const ManageProfiles: React.FC = () => {
  const { t } = useTranslation(["dialogs"]);
  const dispatch = useDispatch();
  const dialogState = useSelector((state: RootState) => state.dialog);
  const open = dialogState.config?.type === "manageProfiles";

  const avatars = useSelector((state: RootState) => state.config.avatars);
  const profiles = useSelector(
    (state: RootState) => state.user.currentUser.profiles
  );

  const [openNewProfileDialog, setNewProfileDialog] = useState(false);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<Profile>({
    ...emptyProfile,
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open]);

  const reset = () => {
    setError("");
    setLoading(false);
    setSelectedProfile({ ...emptyProfile });
    setNewProfileDialog(false);
  };

  const handleClose = () => {
    dispatch(dialogActions.closeDialog());
  };

  const deleteProfile = async () => {
    if (!selectedProfile) {
      return;
    }
    setLoading(true);
    try {
      const response = await removeProfileReq(selectedProfile.id);
      if (response.data) {
        dispatch(userActions.setUser(response.data));
      }
      setSelectedProfile({ ...emptyProfile });
      renewToken();
    } catch (e) {
      const err = getErrorMsg(e);
      console.error(err);
      setError(err);
    } finally {
      setLoading(false);
      setOpenConfirmDialog(false);
    }
  };

  const renderProfileItem = (p: Profile, isLast?: boolean) => {
    return (
      <div
        key={p.id}
        className={clsx("m-0 d-flex align-items-center py-2", {
          "border-grey-2 border-bottom-2": !isLast,
          // "mb-2": isLast,
          "fw-bold": p.mainProfile,
        })}
      >
        <Avatar
          avatars={avatars}
          avatarId={p.avatarId}
          size="28px"
          className="me-1"
        />
        <p className="m-0 flex-grow-1 d-flex align-items-center fs-btn">
          <span
            className="d-inline-block text-truncate"
            style={{ maxWidth: 200 }}
          >
            {p.alias}
          </span>
          {p.mainProfile ? (
            <span className="text-grey-7 ms-1 fw-normal">
              {`(${t("dialogs:manageProfiles.mainProfileLabel")})`}
            </span>
          ) : null}
        </p>

        <button
          className="btn btn-link "
          onClick={() => {
            setSelectedProfile({ ...p });
            setNewProfileDialog(true);
          }}
        >
          <i className="fas fa-pen"></i>
        </button>
        {!p.mainProfile ? (
          <button
            className="btn btn-link"
            onClick={() => {
              setSelectedProfile({ ...p });
              setOpenConfirmDialog(true);
            }}
          >
            <i className="fas fa-trash text-grey-5"></i>
          </button>
        ) : null}
      </div>
    );
  };

  return (
    <Dialog
      open={open}
      title={t("manageProfiles.title")}
      onClose={handleClose}
      ariaLabelledBy="manageProfilesDialogTitle"
    >
      <div
        className={clsx(defaultDialogPaddingXClass, "pb-3 pt-1", "bg-grey-1")}
      >
        {profiles.map((p, i) =>
          renderProfileItem(p, i === profiles.length - 1)
        )}
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
            label={t("manageProfiles.cancelBtn")}
            onClick={() => handleClose()}
          />
          <DialogBtn
            className="mt-2"
            type="button"
            color="primary"
            loading={loading}
            label={t("manageProfiles.newProfileBtn")}
            onClick={() => setNewProfileDialog(true)}
          />
        </div>
        <EditProfile
          open={openNewProfileDialog}
          selectedProfile={selectedProfile}
          onClose={() => {
            setSelectedProfile({ ...emptyProfile });
            setNewProfileDialog(false);
          }}
        />
        <ConfirmDialog
          open={openConfirmDialog}
          color="warning"
          title={t("manageProfiles.warningDialog.title")}
          cancelText={t("manageProfiles.warningDialog.cancelBtn")}
          confirmText={t("manageProfiles.warningDialog.confirmBtn")}
          onClose={() => {
            setSelectedProfile({ ...emptyProfile });
            setOpenConfirmDialog(false);
          }}
          onConfirm={() => {
            deleteProfile();
          }}
        >
          {t("dialogs:manageProfiles.warningDialog.content", {
            alias: selectedProfile.alias,
          })}
        </ConfirmDialog>
      </div>
    </Dialog>
  );
};

export default ManageProfiles;
