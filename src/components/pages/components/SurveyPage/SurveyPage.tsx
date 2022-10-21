import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AlertBox, ConfirmDialog, containerClassName, getLocalizedString, LoadingPlaceholder, SurveyView, TitleBar } from 'case-web-ui';
import { Survey, SurveyContext, SurveyResponse } from 'survey-engine/data_types';
import { useTranslation } from 'react-i18next';
import SubmitSuccessWithLoginOptionsDialog, { LoginOptions } from './Dialogs/SubmitSuccessWithLoginOptionsDialog';
import ErrorWithRetry from './PageComponents/ErrorWithRetry';
import ProfileSelectionDialog from './Dialogs/ProfileSelectionDialog';
import SuccessDialog from './Dialogs/SuccessDialog';
import { Profile } from 'case-web-ui/build/types/profile';
import LoginRequiredDialog from './Dialogs/LoginRequiredDialog';
import PreventAccidentalNavigationPrompt from '../../../misc/PreventAccidentalNavigationPrompt';
import { useHistory, useParams } from 'react-router-dom';
import { dialogActions } from '../../../../store/dialogSlice';
import { studyAPI } from '../../../..';
import { SurveyAndContextMsg } from '../../../../api/types/studyAPI';
import { RootState } from '../../../../store/rootReducer';
import { appActions } from '../../../../store/appSlice';
import { CustomSurveyResponseComponent } from 'case-web-ui/build/components/survey/SurveySingleItemView/ResponseComponent/ResponseComponent';
import { useUrlQuery } from '../../../../hooks/useUrlQuery';
import clsx from 'clsx';


interface SurveyPageProps {
  customResponseComponents?: CustomSurveyResponseComponent[];
  dateLocales?: Array<{ code: string, locale: any, format: string }>;
  urls: {
    finishedFlowWithoutLogin: string;
    finishedFlowWithLogin: string;
  }
}

interface TempParticipant {
  temporaryParticipantId: string;
  timestamp: number;
}

type ContentState = 'loading' | 'submitting' | 'getSurveyError' | 'submitError' | 'survey';

type DialogNames = 'SubmitSuccessWithLoginOptionsDialog' | 'SubmitSuccessDialog' | 'ProfileSelectionDialog' | 'LoginRequiredDialog' | 'TempParticipantConversionSuccessDialog' | 'NavigationWarning';

const SurveyPage: React.FC<SurveyPageProps> = (props) => {
  const instanceID = useSelector((state: RootState) => state.config.instanceId);
  const persistState = useSelector((state: RootState) => state.app.persistState);
  const currentUser = useSelector((state: RootState) => state.user.currentUser);
  const authState = useSelector((state: RootState) => state.app.auth);
  const isLoggedIn = authState && authState.accessToken && authState.accessToken.length > 0 ? true : false;
  const avatars = useSelector((state: RootState) => state.config.avatars);

  const { t, i18n } = useTranslation(['surveyPage']);
  const dispatch = useDispatch();
  const history = useHistory();
  const query = useUrlQuery();
  const initialSurveyKey = query.get("surveyKey");
  const profileID = query.get("pid");

  const [currentSurvey, setCurrentSurvey] = useState<{
    surveyDef: Survey;
    context?: SurveyContext;
    prefill?: SurveyResponse;
    openedAt: number;
  } | undefined>();
  const [currentSurveyKey, setCurrentSurveyKey] = useState<string>(initialSurveyKey ? initialSurveyKey : '');
  const [currentSurveyResponse, setCurrentSurveyResponse] = useState<SurveyResponse | undefined>(undefined);
  const [tempParticipant, setTempParticipant] = useState<TempParticipant | undefined>();

  const [contentState, setContentState] = useState<ContentState>('loading');
  const [dialogOpen, setDialogOpen] = useState<DialogNames | undefined>();

  const [selectedProfileID, setSelectedProfileID] = useState<string | undefined>(profileID ? profileID : undefined);

  const [navigateTo, setNavigateTo] = useState('');
  const [protectRoute, setProtectRoute] = useState(false);
  const { studyKey } = useParams<{ studyKey: string }>();

  const currentSurveyName = getLocalizedString(currentSurvey?.surveyDef.props?.name, i18n.language);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    dispatch(appActions.openSurveyMode(undefined));
    return () => {
      dispatch(appActions.closeSurveyMode());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!currentSurveyKey) {
      return;
    }
    fetchSurvey(currentSurveyKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSurveyKey])

  useEffect(() => {
    if (currentSurveyResponse !== undefined) {
      startSubmitFlow(currentSurveyResponse)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSurveyResponse])

  useEffect(() => {
    if (isLoggedIn) {
      if (shouldSelectProfile()) {
        setDialogOpen('ProfileSelectionDialog');
        return;
      }
      if (dialogOpen === 'SubmitSuccessWithLoginOptionsDialog') {
        convertTempParticipant();
      } else if (dialogOpen === 'LoginRequiredDialog') {
        convertTempParticipant();
        setDialogOpen(undefined);
        fetchSurvey(currentSurveyKey);
        // alert('TODO: handle login after login required')
      } else {
        if (profileID && profileID?.length > 0) {
          console.log('profile already selected when page opened')
        } else {
          if (currentUser.profiles.length === 1) {
            setSelectedProfileID(currentUser.profiles[0].id)
          } else {
            console.error("unexpected user object: ", currentUser);
          }
        }
      }
    } else {
      setSelectedProfileID(undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser])

  useEffect(() => {
    const profile = currentUser.profiles.find(p => p.id === selectedProfileID);
    dispatch(appActions.openSurveyMode(profile));
    if (selectedProfileID !== undefined) {
      if (contentState === 'loading') {
        fetchSurvey(currentSurveyKey);
      } else if (contentState === 'survey') {
        // case: login required:
        convertTempParticipant(true);
        fetchSurvey(currentSurveyKey);
      } else if (contentState === 'submitting') {
        convertTempParticipant();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProfileID])

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [contentState])

  useEffect(() => {
    if (currentSurvey !== undefined) {
      setContentState('survey');
      if (currentSurvey.surveyDef.requireLoginBeforeSubmission && !isLoggedIn) {
        setDialogOpen('LoginRequiredDialog');
      } else {
        setDialogOpen(undefined);
      }
    } else {
      setContentState('loading');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSurvey])

  useEffect(() => {
    if (!protectRoute && navigateTo.length > 0) {
      onNavigate(navigateTo);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [protectRoute]);

  const onNavigate = (url: string) => {
    history.replace(url);
  }

  const shouldSelectProfile = (): boolean => {
    if (!currentUser.profiles || currentUser.profiles.length < 1) {
      console.error("no profiles found", currentUser);
      return false;
    }

    /*if (currentUser.profiles.length === 1) {
      setSelectedProfileID(currentUser.profiles[0].id)
      return false;
    }*/

    if (selectedProfileID === undefined) {
      return true;
    }
    return false;
  }

  const fetchSurvey = async (surveyKey: string) => {
    setCurrentSurvey(undefined);
    setContentState('loading');
    try {
      let survey: SurveyAndContextMsg;
      if (isLoggedIn) {
        if (!selectedProfileID) {
          console.log('should select profile first');
          setDialogOpen('ProfileSelectionDialog');
          return;
        }
        survey = (await studyAPI.getAssignedSurveyRequest({
          studyKey: studyKey,
          surveyKey: surveyKey,
          profileId: selectedProfileID,
        })).data;
      } else {
        survey = (await studyAPI.getSurveyWithoutLoginReq({
          instance: instanceID,
          study: studyKey,
          survey: surveyKey,
          pid: tempParticipant?.temporaryParticipantId,
        })).data;
      };

      console.log(survey)
      const now = Math.round(new Date().getTime() / 1000);

      if (!survey.context) {
        survey.context = {}
      }
      survey.context.isLoggedIn = isLoggedIn;

      setCurrentSurvey({
        surveyDef: survey.survey,
        context: survey.context,
        prefill: survey.prefill,
        openedAt: now,
      })
    } catch (e) {
      console.error(e)
      setContentState('getSurveyError');
    }
  }

  const registerTempParticipant = async () => {
    try {
      const resp = await studyAPI.registerTempParticipantReq({
        instance: instanceID,
        study: studyKey,
      });
      const data = {
        temporaryParticipantId: resp.data.temporaryParticipantId,
        timestamp: parseInt(resp.data.timestamp)
      };
      setTempParticipant(data);
      return data;
    } catch (e) {
      console.error(e)
    }
  }

  const convertTempParticipant = async (ignoreNextStep?: boolean) => {
    if (!currentUser || !currentUser.profiles || currentUser.profiles.length < 1) {
      console.log('no profiles yet to convert');
      return;
    }
    let profileId = selectedProfileID;
    if (!profileId) {
      profileId = currentUser.profiles[0].id;
      setSelectedProfileID(profileId);
    }
    if (!tempParticipant) {
      console.error("no temp participant found.")
      return;
    }
    try {
      await studyAPI.assumeTempParticipantReq({
        studyKey: studyKey,
        profileId: profileId,
        temporaryParticipantId: tempParticipant.temporaryParticipantId,
        timestamp: tempParticipant.timestamp,
      });
      if (!ignoreNextStep) {
        setDialogOpen('TempParticipantConversionSuccessDialog')
      }
    } catch (e) {
      console.error(e)
      if (!ignoreNextStep) {
        onNavigate(props.urls.finishedFlowWithoutLogin);
      }
    }
  }

  const startSubmitFlow = (currentSurveyResponse: SurveyResponse) => {
    setProtectRoute(false);
    if (isLoggedIn) {
      submitResponsesWithLogin(currentSurveyResponse);
    } else {
      if (currentSurvey?.surveyDef.requireLoginBeforeSubmission === true) {
        setDialogOpen('LoginRequiredDialog')
      } else {
        // nothing special to handle here:
        submitResponsesWithoutLogin(currentSurveyResponse)
      }
    }
  }

  const submitResponsesWithoutLogin = async (response: SurveyResponse) => {
    setContentState('submitting');
    try {
      let currentTempParticipant = tempParticipant;
      if (!currentTempParticipant) {
        currentTempParticipant = await registerTempParticipant();
      }

      const resp = await studyAPI.submitSurveyResponseForTempParticipantRequest({
        studyKey: studyKey,
        response: response,
        instanceId: instanceID,
        temporaryParticipantId: currentTempParticipant?.temporaryParticipantId,
        temporaryParticipantTimestamp: currentTempParticipant?.timestamp,
      })
      getNextAction(resp);
    } catch (e) {
      console.error(e)
      setContentState('submitError');
    }
  }

  const submitResponsesWithLogin = async (response: SurveyResponse) => {
    setContentState('submitting');
    try {
      const resp = await studyAPI.submitSurveyResponseRequest({
        studyKey: studyKey,
        profileId: selectedProfileID,
        response: response
      });
      // setProtectRoute(false);
      getNextAction(resp);
    } catch (e) {
      console.error(e)
      setContentState('submitError');
    }
  }

  const getNextAction = (resp: any) => {
    console.log(resp)

    let shouldOpenSurvey = false;

    if (!resp.data.surveys || resp.data.surveys.length < 1) {
      console.error('no assigned surveys found')
    } else {
      for (const survey of resp.data.surveys) {
        if (survey.category === 'immediate' && survey.surveyKey !== currentSurveyKey) {
          const now = Math.round(new Date().getTime() / 1000);
          if (!survey.validUntil || parseFloat(survey.validUntil) > now) {
            setCurrentSurveyKey(survey.surveyKey);
            shouldOpenSurvey = true;
            break;
          }
        }
      }
    }

    if (!shouldOpenSurvey) {
      if (isLoggedIn) {
        setDialogOpen('SubmitSuccessDialog');
      } else {
        setDialogOpen('SubmitSuccessWithLoginOptionsDialog');
      }
    }
  }


  let pageContent = <p>...</p>;

  switch (contentState) {
    case 'loading':
      pageContent = <LoadingPlaceholder
        color='white'
        minHeight='60vh'
      />;
      break;
    case 'submitting':
      pageContent = <LoadingPlaceholder
        color='white'
        minHeight='60vh'
      />;
      break;
    case 'getSurveyError':
      pageContent = <ErrorWithRetry
        texts={{
          content: t('surveyPage:surveyLoadingError.content'),
          btn: t('surveyPage:surveyLoadingError.btn')
        }}
        onRetry={() => fetchSurvey(currentSurveyKey)}
      />
      break;
    case 'submitError':
      pageContent = <ErrorWithRetry
        texts={{
          content: t('surveyPage:surveySubmissionError.content'),
          btn: t('surveyPage:surveySubmissionError.btn')
        }}
        onRetry={() => {
          if (currentSurveyResponse !== undefined) {
            startSubmitFlow(currentSurveyResponse)
          }
        }}
      />
      break;
    case 'survey':
      if (!currentSurvey) {
        break;
      }
      pageContent = <SurveyView
        survey={currentSurvey.surveyDef}
        context={currentSurvey.context}
        prefills={currentSurvey.prefill?.responses}
        languageCode={i18n.language}
        onSubmit={(responses, version: string) => {
          console.log(responses)
          const now = Math.round(new Date().getTime() / 1000);

          setCurrentSurveyResponse({
            key: currentSurvey.surveyDef.surveyDefinition.key,
            responses: [...responses],
            versionId: version,
            submittedAt: now,
            openedAt: currentSurvey.openedAt,
            context: {
              engineVersion: process.env.REACT_APP_SURVEY_ENGINE_VERSION,
              language: i18n.language,
            }
          })
        }}
        onResponsesChanged={() => {
          if (!protectRoute) {
            setProtectRoute(true)
          }
        }}
        nextBtnText={t('nextBtn')}
        backBtnText={t('backBtn')}
        submitBtnText={t('submitBtn')}
        invalidResponseText={t('notValidQuestion')}
        customResponseComponents={props.customResponseComponents}
        dateLocales={props.dateLocales}
      />
      break;
  }

  const dialogs = <React.Fragment>
    <LoginRequiredDialog
      open={dialogOpen === 'LoginRequiredDialog'}
      texts={{
        title: t('surveyPage:loginRequiredDialog.title'),
        info: t('surveyPage:loginRequiredDialog.info'), // '',
        loginBtn: t('surveyPage:loginRequiredDialog.loginBtn'), // 'Login',
        registerBtn: t('surveyPage:loginRequiredDialog.registerBtn'), // 'Register',
      }}
      onSelect={(option: LoginOptions) => {
        switch (option) {
          case 'login':
            dispatch(dialogActions.openLoginDialog({
              type: 'login',
              origin: 'surveyFlow',
              payload: {
                email: '',
                password: '',
                rememberMe: persistState,
                preventNavigateOnSuccess: true
              }
            }));
            break;
          case 'register':
            dispatch(dialogActions.openDialogWithoutPayload({ type: 'signup', origin: 'surveyFlow' }))
            break;
        }
      }}
    />

    <SubmitSuccessWithLoginOptionsDialog
      open={dialogOpen === 'SubmitSuccessWithLoginOptionsDialog'}
      texts={{
        title: t('surveyPage:submitSuccessWithLoginOptionsDialog.title'),
        submitConfirm: t('surveyPage:submitSuccessWithLoginOptionsDialog.successMsg'),
        info: t('surveyPage:submitSuccessWithLoginOptionsDialog.info'), // '',
        loginBtn: t('surveyPage:submitSuccessWithLoginOptionsDialog.loginBtn'), // 'Login',
        registerBtn: t('surveyPage:submitSuccessWithLoginOptionsDialog.registerBtn'), // 'Register',
        withoutAccountBtn: t('surveyPage:submitSuccessWithLoginOptionsDialog.withoutAccountBtn'),// "Continue without account"
      }}
      onSelect={(option: LoginOptions) => {
        switch (option) {
          case 'login':
            dispatch(dialogActions.openLoginDialog({
              type: 'login',
              origin: 'surveyFlow',
              payload: {
                email: '',
                password: '',
                rememberMe: persistState,
                preventNavigateOnSuccess: true
              }
            }));
            break;
          case 'register':
            dispatch(dialogActions.openDialogWithoutPayload({ type: 'signup', origin: 'surveyFlow' }))
            break;
          case 'withoutAccount':
            onNavigate(props.urls.finishedFlowWithoutLogin)
            break;
        }
      }}
    />
    <ProfileSelectionDialog
      open={dialogOpen === 'ProfileSelectionDialog'}
      texts={{
        title: t('surveyPage:profileSelectionDialog.title'),
        info: t('surveyPage:profileSelectionDialog.info'),
        manageProfiles: t('surveyPage:profileSelectionDialog.manageProfilesBtn'),
      }}
      avatars={avatars}
      profiles={currentUser.profiles}
      onSelectProfile={(p: Profile) => {
        setSelectedProfileID(p.id);
        dialogActions.closeDialog();
      }}
      onOpenProfileManager={() => {
        dispatch(dialogActions.openDialogWithoutPayload({ type: 'manageProfiles', origin: 'surveyFlow' }))
      }}
    />
    <SuccessDialog
      open={dialogOpen === 'SubmitSuccessDialog'}
      texts={{
        title: t('surveyPage:submitSuccessDialog.title'),
        info: t('surveyPage:submitSuccessDialog.content'),
        okBtn: t('surveyPage:submitSuccessDialog.btn')
      }}
      onClose={() => {
        setDialogOpen(undefined);
        onNavigate(props.urls.finishedFlowWithLogin)
      }}
    />

    <SuccessDialog
      open={dialogOpen === 'TempParticipantConversionSuccessDialog'}
      texts={{
        title: t('surveyPage:tempParticipantConversionSuccessDialog.title'),
        info: t('surveyPage:tempParticipantConversionSuccessDialog.content'),
        okBtn: t('surveyPage:tempParticipantConversionSuccessDialog.btn')
      }}
      onClose={() => {
        setDialogOpen(undefined);
        onNavigate(props.urls.finishedFlowWithLogin)
      }}
    />

    <ConfirmDialog
      color="warning"
      open={dialogOpen === 'NavigationWarning'}
      title={t('exitSurveyWarningDialog.title')}
      confirmText={t('exitSurveyWarningDialog.confirmBtn')}
      cancelText={t('exitSurveyWarningDialog.cancelBtn')}
      onConfirm={() => {
        setProtectRoute(false);
        setDialogOpen(undefined);
      }}
      onClose={() => { setDialogOpen(undefined); }}
    >
      <AlertBox
        type="warning"
        content={t('exitSurveyWarningDialog.warning')}
      />
    </ConfirmDialog>
  </React.Fragment>

  const protectRoutePrompt = <PreventAccidentalNavigationPrompt
    protectionActive={protectRoute}
    onTriggered={(path: string) => {
      setDialogOpen('NavigationWarning');
      setNavigateTo(path);
    }}
  />

  return (
    <React.Fragment>
      <TitleBar
        content={currentSurveyName}
        showAlways={true}
      />
      <div className={clsx(containerClassName, "py-3")}>
        <div className="row">
          <div className="col-12 col-lg-8 offset-lg-2"
            style={{ minHeight: '60vh' }}
          >
            {pageContent}
          </div>
        </div>
      </div>
      {protectRoutePrompt}
      {dialogs}
    </React.Fragment>
  )
};

export default SurveyPage;
