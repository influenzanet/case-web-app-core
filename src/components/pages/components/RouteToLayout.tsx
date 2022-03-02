import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Redirect, Route } from 'react-router-dom';
import { Extension } from '../../../AppCore';
import { useIsAuthenticated } from '../../../hooks/useIsAuthenticated';
import { useUrlQuery } from '../../../hooks/useUrlQuery';
import { dialogActions } from '../../../store/dialogSlice';
import { PageConfig } from '../../../types/pagesConfig';
import { DefaultRoutes } from '../../../types/routing';
import ContentRenderer from './ContentRenderer';


interface RouteToLayoutProps {
  path: string;
  pageConfig: PageConfig;
  defaultRoutes: DefaultRoutes;
  extensions?: Extension[];
  dateLocales?: Array<{ code: string, locale: any, format: string }>;
}

const RouteToLayout: React.FC<RouteToLayoutProps> = (props) => {
  // const { t } = useTranslation([props.pageConfig.pageKey]);
  const isAuthenticated = useIsAuthenticated();
  const dispatch = useDispatch();

  const query = useUrlQuery();

  useEffect(() => {
    const openAction = query.get("action");
    if (openAction !== undefined) {
      switch (openAction) {
        case 'openSignupDialog':
          dispatch(dialogActions.openDialogWithoutPayload({ type: 'signup' }))
          break;
      }
    }
  }, [])

  if (
    (props.pageConfig.hideWhen === 'auth' && isAuthenticated) ||
    (props.pageConfig.hideWhen === 'unauth' && !isAuthenticated)
  ) {
    return <Route
      path={props.path}
      render={routeProps =>
        <Redirect to={isAuthenticated ? props.defaultRoutes.auth : props.defaultRoutes.unauth} />
      }
    />
  }

  return (
    <Route
      path={props.path}
      render={routeProps =>
        <ContentRenderer
          isAuthenticated={isAuthenticated}
          hideTitleBar={props.pageConfig.hideTitleBar}
          pageKey={props.pageConfig.pageKey}
          rows={props.pageConfig.rows}
          subPages={props.pageConfig.subPages}
          defaultRoutes={props.defaultRoutes}
          extensions={props.extensions}
          dateLocales={props.dateLocales}
        />
      }
    />
  );
};

export default RouteToLayout;
