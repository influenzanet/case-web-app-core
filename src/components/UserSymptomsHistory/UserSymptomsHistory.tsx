import React, { useEffect, useRef } from "react";
import { useState } from "react";
import { useSelector } from "react-redux";
import UserProfilesSelector from "../UserProfilesSelector/UserProfilesSelector";
import ImageBrowser from "../ImageBrowser/ImageBrowser";
import { ImageBrowserDataReader } from "../ImageBrowser/services/ImageBrowserDataReader";
import { UserSymptomsHistoryReportReader } from "./services/UserSymptomsHistoryReportReader";
import { LoadingPlaceholder } from "@influenzanet/case-web-ui";
import { Profile } from "../../api/types/user";
import { RootState } from "../../store/rootReducer";

export type UserSymptomsHistoryDataReader = {
  init: (studyId: string, profileId: string) => Promise<ImageBrowserDataReader>;
};

export type UserSymptomsHistoryProps = {
  className?: string;
  studyId: string;
  DataReader?: UserSymptomsHistoryDataReader;
  translationNamespace?: string;
  // TODO this should be a proper type but it's definition is so widespread everywhere
  // that refactoring would take ages
  dateLocales?: Array<{ code: string; locale: any; format: string }>;
};

const UserSymptomsHistory: React.FC<UserSymptomsHistoryProps> = (props) => {
  return (
    <UserSymptomsHistoryImpl
      {...props}
      key={props.studyId}
    ></UserSymptomsHistoryImpl>
  );
};

const UserSymptomsHistoryImpl: React.FC<UserSymptomsHistoryProps> = (props) => {
  const DataReaderType = props.DataReader ?? UserSymptomsHistoryReportReader;

  const profiles: Profile[] = useSelector(
    (state: RootState) => state.user.currentUser.profiles
  );
  const mainProfileId: string = profiles.filter(
    (profile) => profile.mainProfile
  )[0].id;

  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState(mainProfileId);
  const [dataReader, setDataReader] = useState<ImageBrowserDataReader>();

  const isMounted = useRef(true);

  useEffect(() => {
    async function init() {
      try {
        const imageBrowserDataReader = await DataReaderType.init(
          props.studyId,
          selectedProfileId
        );

        if (isMounted.current) {
          setDataReader(imageBrowserDataReader);

          setIsLoading(false);
        }
      } catch (error) {
        console.error(
          "Failed to initialize UserSymptomsHistory data reader:",
          error
        );
        if (isMounted.current) {
          setIsError(true);
          setIsLoading(false);
        }
      }
    }

    init();

    return () => {
      isMounted.current = false;
    };
  }, [DataReaderType, props.studyId, selectedProfileId, isMounted]);

  const errorContent = null;

  const loadingContent = (
    <LoadingPlaceholder color="secondary" minHeight={200} />
  );

  const userProfileContent = (
    <div className={props.className}>
      <UserProfilesSelector
        selectedProfileId={selectedProfileId}
        onProfileChange={async (profileId: string) => {
          setSelectedProfileId(profileId);
          setDataReader(await DataReaderType.init(props.studyId, profileId));
        }}
      />

      {dataReader && (
        <ImageBrowser
          dataReader={dataReader}
          key={selectedProfileId}
          dateLocales={props.dateLocales}
          translationNamespace={props.translationNamespace}
        />
      )}
    </div>
  );

  return isError
    ? errorContent
    : isLoading
    ? loadingContent
    : userProfileContent;
};

export default UserSymptomsHistory;
