import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { useHistory } from "react-router-dom";
import { RootState } from "../../store/rootReducer";
import { DefaultRoutes } from "../../types/routing";
import {
  LoadingPlaceholder,
  SurveyList as SurveyListRenderer,
} from "@influenzanet/case-web-ui";
import { SurveyCardDetails } from "@influenzanet/case-web-ui/build/components/cards/SurveyCard";

interface SurveyListProps {
  pageKey: string;
  itemKey: string;
  className?: string;
  defaultRoutes: DefaultRoutes;
}

const SurveyList: React.FC<SurveyListProps> = (props) => {
  const [loading, setLoading] = useState(false);
  const { t, i18n } = useTranslation([props.pageKey]);
  const currentUser = useSelector((state: RootState) => state.user.currentUser);
  const avatars = useSelector((state: RootState) => state.config.avatars);
  const history = useHistory();

  const profiles = useSelector(
    (state: RootState) => state.user.currentUser.profiles
  );

  const activeSurveyInfos = useSelector(
    (state: RootState) => state.studies.activeSurveyInfos
  );

  useEffect(() => {
    window.scrollTo(0, 0);
    if (profiles.length < 1) {
      return;
    }
  }, [profiles]);

  const cardInfos: SurveyCardDetails[] = [];

  for (const assignedSurvey of profiles
    .map((profile) => profile.assignedSurveys)
    .flat()
    .filter((s) => s && s.profileId)) {
    const profile = profiles.find((p) => p.id === assignedSurvey.profileId);

    if (!profile) {
      console.warn("Profile cannot be added");
      continue;
    }

    const currentSurveyInfo = activeSurveyInfos.find(
      (si) =>
        si.studyKey === assignedSurvey.studyKey &&
        si.surveyKey === assignedSurvey.surveyKey
    );

    if (!currentSurveyInfo) {
      continue;
    }

    cardInfos.push({
      ...assignedSurvey,
      profiles: [profile],
      surveyInfos: currentSurveyInfo,
    });
  }

  const sortedCardInfos = cardInfos.sort((a, b) =>
    a.profiles[0].id.localeCompare(b.profiles[0].id)
  );
  const optionalSurveys = sortedCardInfos.filter(
    (s) => s.category === "optional"
  );
  const requiredSurveys = sortedCardInfos.filter(
    (s) => s.category !== "optional"
  );

  const openSurvey = (
    studyKey: string,
    surveyKey: string,
    profileId: string
  ) => {
    history.push(
      props.defaultRoutes.surveyPage +
        `/${studyKey}/?surveyKey=${surveyKey}&pid=${profileId}`
    );
  };

  const renderContent = () => (
    <div className={props.className}>
      <SurveyListRenderer
        requiredSurveys={requiredSurveys}
        optionalSurveys={optionalSurveys}
        openSurvey={openSurvey}
        avatars={avatars}
        selectedLanguage={i18n.language}
        texts={{
          requiredSurveys: {
            title: t(`${props.itemKey}.requiredSurveys.title`),
            successMsg: t(`${props.itemKey}.requiredSurveys.successMsg`),
            info: t(`${props.itemKey}.requiredSurveys.info`),
          },
          optionalSurveys: {
            title: t(`${props.itemKey}.optionalSurveys.title`),
            hideBtn: t(`${props.itemKey}.optionalSurveys.hideBtn`),
            showBtn: t(`${props.itemKey}.optionalSurveys.showBtn`),
            info: t(`${props.itemKey}.optionalSurveys.info`),
          },
        }}
      />
    </div>
  );

  const loadingContent = () => (
    <LoadingPlaceholder color="secondary" minHeight={450} />
  );

  return (
    <React.Fragment>
      {loading ? loadingContent() : renderContent()}
    </React.Fragment>
  );
};

export default SurveyList;
