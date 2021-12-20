import authApiInstance from './instances/authenticatedApi';
import apiInstance from './instances/defaultApi';

import { SurveyReferenceReq, SurveyAndContextMsg, SurveyResponseReq, AssignedSurveys, Studies, SurveyInfos, StudiesForUser, ConvertTempParticipantReq } from './types/studyAPI';

// Study API
export const getStudiesForUserReq = () => authApiInstance.get<StudiesForUser>('/v1/studies/for-user-profiles');
export const getAllAvailableStudiesReq = () => authApiInstance.get<Studies>('/v1/studies/active');
export const getSurveyInfosForStudyReq = (studyKey: string) => authApiInstance.get<SurveyInfos>(`/v1/study/${studyKey}/survey-infos`);

// Study flow
export const enterStudyReq = (studyKey: string, profileId: string) => authApiInstance.post<AssignedSurveys>(`/v1/study/${studyKey}/enter`, { studyKey, profileId });
export const leaveStudyRequest = (studyKey: string, profileId: string) => authApiInstance.post<AssignedSurveys>(`/v1/study/${studyKey}/leave`, { studyKey, profileId });
export const getAllAssignedSurveysReq = () => authApiInstance.get<AssignedSurveys>('/v1/studies/all-assigned-surveys');
export const getAssignedSurveyRequest = (payload: SurveyReferenceReq) => authApiInstance.get<SurveyAndContextMsg>(`/v1/study/${payload.studyKey}/survey/${payload.surveyKey}?pid=${payload.profileId}`);
export const submitSurveyResponseRequest = (payload: SurveyResponseReq) => authApiInstance.post(`/v1/study/${payload.studyKey}/submit-response`, payload);


// Temporary participants:
export const registerTempParticipantReq = (params: {
  instance: string;
  study: string;
}) => apiInstance.get(`/v1/temp-participant/register`, { params: params });
export const getSurveysForTempParticipantReq = (params: {
  instance: string;
  study: string;
  pid: string;
}) => apiInstance.get(`/v1/temp-participant/surveys`, { params: params });
export const getSurveyWithoutLoginReq = (params: {
  instance: string;
  study: string;
  survey: string;
  pid?: string;
}) => apiInstance.get(`/v1/temp-participant/survey`, { params: params });
export const submitSurveyResponseForTempParticipantRequest = (payload: SurveyResponseReq) => apiInstance.post(`/v1/temp-participant/submit-response`, payload);

export const assumeTempParticipantReq = (payload: ConvertTempParticipantReq) => authApiInstance.post(`/v1/study/${payload.studyKey}/assume-temp-participant`, payload);
