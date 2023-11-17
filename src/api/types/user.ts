import { AssignedSurvey } from "./studyAPI";

export interface User {
  id: string;
  account: {
    type: string;
    accountId: string;
    accountConfirmedAt: number;
    preferredLanguage: string;
  };
  roles: string[];
  timestamps: {
    createdAt: number;
    updatedAt: number;
    lastLogin: number;
    lastTokenRefresh: number;
  };
  profiles: Profile[];
  contactPreferences: ContactPreferences;
  contactInfos: ContactInfo[];
}

export interface Profile {
  id: string;
  alias: string;
  consentConfirmedAt: number;
  avatarId: string;
  createdAt: number;
  mainProfile: boolean;

  /**
   * The following fields were added here for convenience since
   * the types defined in this file are also used as type for
   * the redux store object.
   *
   * This is a huge mistake but we cannot refactor everything now.
   */
  studies: string[];
  assignedSurveys: AssignedSurvey[];
}

export interface ContactPreferences {
  subscribedToNewsletter: boolean;
  sendNewsletterTo: string[];
  subscribedToWeekly: boolean;
  receiveWeeklyMessageDayOfWeek: number;
}

interface ContactInfoBase {
  id: string;
  type: string;
  confirmedAt: number;
}

export interface EmailContactInfo extends ContactInfoBase {
  email: string;
}

export interface PhoneContactInfo extends ContactInfoBase {
  phone: string;
}

export type ContactInfo = EmailContactInfo | PhoneContactInfo;
