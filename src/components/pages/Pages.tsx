import React, { Suspense } from 'react';

import { PagesConfig } from '../../types/pagesConfig';
import { Redirect, Route, Switch } from 'react-router-dom';
import RouteToLayout from './components/RouteToLayout';
import { useIsAuthenticated } from '../../hooks/useIsAuthenticated';
import LinkResolver, { linkResolverRootUrl } from './components/LinkResolver/LinkResolver';
import { DefaultRoutes } from '../../types/routing';
import SurveyPage from './components/SurveyPage/SurveyPage';
import { LoadingPlaceholder, containerClassName } from 'case-web-ui';
import clsx from 'clsx';
import { Extension } from '../../AppCore';
import { CustomSurveyResponseComponent } from 'case-web-ui/build/components/survey/SurveySingleItemView/ResponseComponent/ResponseComponent';

interface PagesProps {
  config?: PagesConfig;
  extensions?: Extension[];
  customResponseComponents?: CustomSurveyResponseComponent[];
  dateLocales?: Array<{ code: string, locale: any, format: string }>;
  defaultRoutes: DefaultRoutes;
  onOpenExternalPage: (url: string) => void;
}

const Pages: React.FC<PagesProps> = (props) => {
  const isAuth = useIsAuthenticated();

  // Loading page:
  const loadingDiv = <div className={clsx(containerClassName, 'my-3')}>
    <LoadingPlaceholder className='loading-page' color='secondary' minHeight='60vh' />
  </div>;

  if(!props.config) {
    return loadingDiv;
  }

  const notFoundRoute = props.defaultRoutes.notFound ? props.defaultRoutes.notFound : (isAuth ? props.defaultRoutes.auth : props.defaultRoutes.unauth);

  return (
    <Suspense fallback={loadingDiv}>
      <div>
        <Switch >
          <Redirect from="/" exact to={isAuth ? props.defaultRoutes.auth : props.defaultRoutes.unauth} />
          {props.config.pages.map(pageConfig => {
            return <RouteToLayout
              key={pageConfig.path}
              path={pageConfig.path}
              pageConfig={pageConfig}
              defaultRoutes={props.defaultRoutes}
              extensions={props.extensions}
              dateLocales={props.dateLocales}
            />
          })}
          <Route path={props.defaultRoutes.surveyPage + '/:studyKey'} render={() => <SurveyPage
            customResponseComponents={props.customResponseComponents}
            dateLocales={props.dateLocales}
            urls={{
              finishedFlowWithLogin: props.defaultRoutes.auth,
              finishedFlowWithoutLogin: props.defaultRoutes.unauth
            }}
          />} />

          <Route path={linkResolverRootUrl} render={() => <LinkResolver defaultRoutes={props.defaultRoutes} />} />
          <Redirect to={notFoundRoute} />
        </Switch>
      </div>
    </Suspense>
  );
};

export default Pages;
