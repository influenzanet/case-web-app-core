export interface DefaultRoutes {
  auth: string;
  unauth: string;
  studyPage?: string; // used to redirect when login from email link
  surveyPage?: string;
  notFound?: string; // can assign a dedicated route for not found page
}

export const BasicRoutes: DefaultRoutes = {
  auth: '/home',
  unauth: '/home',
  studyPage: '/home',
  surveyPage: '/surveys',
}
