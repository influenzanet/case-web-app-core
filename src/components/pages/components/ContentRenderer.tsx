import clsx from 'clsx';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux'
import { Redirect, Switch, useHistory } from 'react-router-dom';
import { dialogActions } from '../../../store/dialogSlice';
import { Helmet } from 'react-helmet-async';

import { PageColumn, PagesConfig, PageItem, PageRow, ExtensionComponent, HelmetPageConfig } from '../../../types/pagesConfig';
import {
  handleOpenExternalPage,
  ImageCard,
  LoginCard,
  SimpleCard,
  AccordionList,
  ImageContainer,
  LogoCredits,
  TeaserImage,
  TitleBar,
  VideoPlayer,
  MarkdownLoader,
  LinkList,
  MapWithTimeSliderLoader,
  ComposedLineAndScatterChartLoader,
  containerClassName,
  ActionCard,
  MarkdownRenderer,
} from 'case-web-ui';

import SystemInfo from '../../settings/SystemInfo';
import AccountSettings from '../../settings/AccountSettings';
import CommunicationSettings from '../../settings/CommunicationSettings';
import DeleteAccount from '../../settings/DeleteAccount';

import SurveyList from '../../study/SurveyList';
import { BasicRoutes, DefaultRoutes } from '../../../types/routing';
import { setPersistState } from '../../../store/appSlice';
import { RootState } from '../../../store/rootReducer';
import { getTranslatedMarkdownPath } from '../../../hooks/useTranslatedMarkdown';
import RouteToLayout from './RouteToLayout';
import { Extension } from '../../../AppCore';
import ReportList from '../../study/ReportList';
import IframeResizer from 'iframe-resizer-react';

interface ContentRendererProps {
  hideTitleBar?: boolean;
  isAuthenticated: boolean;
  rows: Array<PageRow>;
  subPages?: PagesConfig;
  pageKey: string;
  defaultRoutes: DefaultRoutes;
  extensions?: Extension[];
  dateLocales?: Array<{ code: string, locale: any, format: string }>;
  helmet?: HelmetPageConfig;
}

const shouldHide = (hideWhen?: string, isAuth?: boolean): boolean => {
  if (
    (hideWhen === 'auth' && isAuth) ||
    (hideWhen === 'unauth' && !isAuth)
  ) {
    return true;
  }
  return false;
}

const ContentRenderer: React.FC<ContentRendererProps> = (props) => {
  const { t, i18n } = useTranslation([props.pageKey, 'global']);
  const dispatch = useDispatch()
  const history = useHistory();
  const persistState = useSelector((state: RootState) => state.app.persistState);

  /**
   * Method to render extension components
   * @param item item's configuration
   * @param renderGenericItemFunc reference to the function that renders generic items, to be able to call it recursively
   * @param onNavigate reference to a method to handle internal navigation
   * @returns
   */
  const handleExtensionRendering = (
    item: PageItem,
    renderGenericItemFunc: (item: PageItem) => React.ReactElement | null,
    onNavigate: (url: string) => void,
  ) => {
    if (!props.extensions) {
      console.warn(`No extension defined, so the following item is not rendered: ${JSON.stringify(item)}`);
      return null;
    }
    const itemConfig = item.config as ExtensionComponent;

    const currentExtensionComponent = props.extensions.filter(ext => ext.name === itemConfig.config.type);
    if (!currentExtensionComponent || currentExtensionComponent.length < 1) {
      return null;
    }

    const Component = currentExtensionComponent[0].component;
    return <Component
      key={item.itemKey}
      pageKey={props.pageKey}
      itemKey={item.itemKey}
      className={item.className}
      dateLocales={props.dateLocales}
      renderGenericItemFunc={renderGenericItemFunc}
      onNavigate={onNavigate}
      {...itemConfig.config} />
  }

  /**
   * Method to render a page item
   * @param item item's configuration
   * @returns
   */
  const renderItem = (item: PageItem): React.ReactElement | null => {
    if (shouldHide(item.hideWhen, props.isAuthenticated)) {
      return null;
    }
    switch (item.config.type) {
      case 'markdown':
        return <MarkdownLoader
          key={item.itemKey}
          className={item.className}
          languageCode={i18n.language}
          markdownUrl={getTranslatedMarkdownPath(item.config.markdownUrl, i18n.language)}
          flavor={item.config.flavor}
        />
      case 'teaserImage':
        return <TeaserImage
          key={item.itemKey}
          image={item.config.image}
          textBox={item.config.textBox ? {
            className: item.config.textBox.className,
            title: t(`${item.itemKey}.title`),
            content: t(`${item.itemKey}.content`),
          } : undefined}
        />
      case 'imageCard':
        const action = item.config.action;
        return <ImageCard
          key={item.itemKey}
          className={item.className}
          imageSrc={item.config.imageSrc ? item.config.imageSrc : t(`${item.itemKey}.imageSrc`)}
          imageAlt={t(`${item.itemKey}.imageAlt`)}
          title={t(`${item.itemKey}.title`)}
          body={t(`${item.itemKey}.body`)}
          openActionText={item.config.showActionBtn ? t(`${item.itemKey}.actionLabel`) : undefined}
          onClick={() => {
            if (!action) { return; }
            if (action.type === 'openDialog') {
              dispatch(dialogActions.openDialogWithoutPayload({ type: action.value }))
            } else if (action.type === 'navigate') {
              history.push(action.value);
            }
          }}
        />
      case 'actionCard':
        const actionCardAction = item.config.action;
        if (item.config.image) {
          item.config.image.alt = t(`${item.itemKey}.imgAlt`)
        }
        return <ActionCard
          key={item.itemKey}
          className={item.className}
          title={t(`${item.itemKey}.title`)}
          actionBtnText={actionCardAction ? t(`${item.itemKey}.actionBtn`) : undefined}
          footerText={item.config.useFooterText ? t(`${item.itemKey}.footer`) : undefined}
          image={item.config.image}
          bodyBgImage={item.config.bodyBgImage}
          onClick={() => {
            if (!actionCardAction) { return; }
            if (actionCardAction.type === 'openDialog') {
              dispatch(dialogActions.openDialogWithoutPayload({ type: actionCardAction.value }))
            } else if (actionCardAction.type === 'navigate') {
              history.push(actionCardAction.value);
            }
          }}
        >
          {item.config.hideBodyContent ? null : <MarkdownRenderer markdown={
            t(`${item.itemKey}.body`)
          } />}
        </ActionCard>
      case 'image':
        return <ImageContainer
          key={item.itemKey}
        // className={item.className}
        />
      case 'video':
        return <VideoPlayer
          key={item.itemKey + i18n.language}
          className={item.className}
          minHeight={item.config.minHeight}
          posterUrl={item.config.posterUrlKey ? t(`${item.itemKey}.${item.config.posterUrlKey}`) : undefined}
          sources={item.config.videoSources.map(vs => {
            // console.log(t(`${item.itemKey}.${vs.type}`))
            return {
              src: t(`${item.itemKey}.${vs.urlKey}`),
              type: vs.type,
            }
          })}
          tracks={item.config.tracks}
          fallbackText={item.config.fallbackTextKey ? t(`${item.itemKey}.${item.config.fallbackTextKey}`) : undefined}
        />
      case 'loginCard':
        return <LoginCard
          key={item.itemKey}
          className={item.className}
          title={t(`${item.itemKey}.title`)}
          infoText={item.config.showInfoText ? t(`${item.itemKey}.info`) : undefined}
          emailInputLabel={t(`${item.itemKey}.emailInputLabel`)}
          emailInputPlaceholder={t(`${item.itemKey}.emailInputPlaceholder`)}
          passwordInputLabel={t(`${item.itemKey}.passwordInputLabel`)}
          passwordInputPlaceholder={t(`${item.itemKey}.passwordInputPlaceholder`)}
          rememberMeLabel={t(`${item.itemKey}.rememberMeLabel`)}
          passwordForgottenBtn={t(`${item.itemKey}.passwordForgottenBtn`)}
          signupBtn={t(`${item.itemKey}.signupBtn`)}
          loginBtn={t(`${item.itemKey}.btn`)}
          persistState={persistState}
          onChangePersistState={(checked) => dispatch(setPersistState(checked))}
          onSubmit={(email, password, rememberMe) => {
            dispatch(dialogActions.openLoginDialog({
              type: 'login',
              payload: {
                email,
                password,
                rememberMe,
              }
            }))
          }}
          onOpenDialog={(dialog) => dispatch(dialogActions.openDialogWithoutPayload({ type: dialog }))}
        />
      case 'accordionList':
        const items = t(`${item.itemKey}`, { returnObjects: true }) as Array<{ title: string; content: string; }>;
        if (items === undefined || !Array.isArray(items)) {
          return <span key={item.itemKey}>Accordion items not found for: {item.itemKey}</span>
        }
        return <div key={item.itemKey} className={item.className}>
          <AccordionList
            itemKey={item.itemKey}
            items={items}
            openLabel={t(`${item.config.accordionCtrlsKey}.open`)}
            closeLabel={t(`${item.config.accordionCtrlsKey}.close`)}
          />
        </div>
      case 'simpleCard':
        return <SimpleCard
          key={item.itemKey}
          className={item.className}
          title={t(`${item.itemKey}.title`)}
          content={t(`${item.itemKey}.content`)}
          variant={item.config.variant}
        />
      case 'systemInfo':
        return <SystemInfo
          key={item.itemKey}
          itemKey={item.itemKey}
          showBrowserInfo={item.config.showBrowserInfo}
        />
      case 'accountSettings':
        return <AccountSettings
          key={item.itemKey}
          itemKey={item.itemKey}
          hideProfileSettings={item.config.hideProfileSettings}
        />
      case 'communicationSettings':
        return <CommunicationSettings
          key={item.itemKey}
          itemKey={item.itemKey}
          hideLanguageSelector={item.config.hideLanguageSelector}
        />
      case 'deleteAccount':
        return <DeleteAccount
          key={item.itemKey}
          itemKey={item.itemKey}
        />
      case 'logoCredits':
        return <LogoCredits
          key={item.itemKey}
          itemKey={item.itemKey}
          className={item.className}
          containerClassName={item.config.className}
          useTitle={item.config.useTitle}
          images={item.config.images.map(image => {
            image.altKey = t(`${item.itemKey}.${image.altKey}`);
            return image
          })}
          title={item.config.useTitle ? t(`${item.itemKey}.title`) : undefined}
        />
      case 'linkList':
        return <LinkList
          key={item.itemKey}
          className={item.className}
          title={t(`${item.itemKey}.title`)}
          items={item.config.links.map(link => {
            return {
              label: t(`${item.itemKey}.${link.linkKey}`),
              type: link.type,
              value: link.value
            }
          })}
          onChangeLanguage={(code: string) => i18n.changeLanguage(code)}
          onNavigate={(url) => history.push(url)}
          onOpenExternalPage={handleOpenExternalPage}
          onOpenDialog={dialog => dispatch(dialogActions.openDialogWithoutPayload({ type: dialog }))}
        />
      case 'mapDataSeries':
        return <MapWithTimeSliderLoader
          key={item.itemKey}
          mapUrl={item.config.mapUrl}
          dataUrl={item.config.dataUrl}
        />
      case 'lineWithScatterChart':
        return <ComposedLineAndScatterChartLoader
          key={item.itemKey}
          language={i18n.language}
          dataUrl={item.config.dataUrl}
        />
      case 'surveyList':
        return <SurveyList
          key={item.itemKey}
          className={item.className}
          pageKey={props.pageKey}
          itemKey={item.itemKey}
          defaultRoutes={props.defaultRoutes}
        />
      case 'reportList':
        return <ReportList
          key={item.itemKey}
          pageKey={props.pageKey}
          itemKey={item.itemKey}
          className={item.className}
          studyKeys={item.config.studyKeys}
          reportKey={item.config.reportKey}
          ignoreReports={item.config.ignoreReports}
          dateLocales={props.dateLocales}
          cardBgOverride={item.config.cardBgOverride}
          hideStudyKey={item.config.hideStudyKey}
          maxReportAgeInSeconds={item.config.maxReportAgeInSeconds}
        />
      case 'container':
        const subItems = item.config.items;
        return <div
          key={item.itemKey}
          className={item.className}
        >
          {subItems.map(subItem => renderItem(subItem))}
        </div>
      case 'placeholder':
        return <div
          key={item.itemKey}
          className={clsx(
            "d-flex justify-content-center align-items-center bg-grey-4",
            item.className)}
          style={{
            height: item.config.height ? item.config.height : undefined
          }}
        >
          <h1 className="fs-1 text-center text-white text-uppercase m-0 p-2">{item.config.label}</h1>
        </div>
      case 'helmet':
        return <Helmet key={item.itemKey}>
          {item.config.updateTitle ? <title>{t(`${item.itemKey}.title`)}</title> : null}
          {item.config.updateDescription ? <meta name="description" content={t(`${item.itemKey}.description`)} /> : null}
        </Helmet>
      case 'iframe':
        return <IframeResizer
          key={item.itemKey}
          log={item.config.log}
          height={item.config.height}
          src={item.config.url}
          scrolling={item.config.scrolling}
          style={{ width: '1px', minWidth: '100%' }}
        />
      case 'extension':
        return handleExtensionRendering(item, renderItem, (url: string) => { history.push(url) });
      case 'router':
        const dRoutes = item.config.pagesConfig.defaultRoutes ? item.config.pagesConfig.defaultRoutes : BasicRoutes;
        const notFoundRoute = dRoutes.notFound ? dRoutes.notFound : (props.isAuthenticated ? dRoutes.auth : dRoutes.unauth);
        return <Switch key={item.itemKey}>{
          item.config.pagesConfig.pages.map(pageConfig => {
            return <RouteToLayout
              key={pageConfig.path}
              path={pageConfig.path}
              pageConfig={pageConfig}
              defaultRoutes={dRoutes}
            />
          })}
          <Redirect to={notFoundRoute} />
        </Switch>
    }
    return <div
      key={item.itemKey}
      className={item.className}>
      {item.itemKey}
    </div>
  }

  const renderColumn = (col: PageColumn, index: number) => {
    if (shouldHide(col.hideWhen, props.isAuthenticated)) {
      return null;
    }
    return <div
      className={col.className}
      key={col.key ? col.key : index.toFixed()}>
      {col.items.map(item => renderItem(item))}
    </div>
  }

  return (
    <React.Fragment>
      {
        props.helmet ? <Helmet>
          {
            props.helmet.ignoreTitle ? null :
              <title>{t(`${props.helmet.override === 'local' ? props.pageKey : 'global'}:helmet.title`)}</title>
          }
          {
            props.helmet.ignoreDescription ? null :
              <meta name="description" content={t(`${props.helmet.override === 'local' ? props.pageKey : 'global'}:helmet.description`)} />
          }
        </Helmet> : null
      }
      {props.hideTitleBar ? null :
        <TitleBar
          content={t('title')}
        />
      }
      {props.rows.map(row => {
        if (shouldHide(row.hideWhen, props.isAuthenticated)) {
          return null;
        }
        return <div
          key={row.key}
          className={clsx(
            {
              [containerClassName]: !row.fullWidth,
              "container-fluid": row.fullWidth
            },
            row.containerClassName)}
        >
          <div className={clsx({
            "row": row.rowClassNameOverride === undefined,
          }, row.rowClassNameOverride)}>
            {row.columns.map((col, index) => renderColumn(col, index))}
          </div>
        </div>
      }
      )}
      {props.subPages ?
        <Switch key={props.pageKey}>
          {props.subPages.pages.map(pageConfig => {
            return <RouteToLayout
              key={pageConfig.path}
              path={pageConfig.path}
              pageConfig={pageConfig}
              defaultRoutes={props.subPages?.defaultRoutes ? props.subPages?.defaultRoutes : props.defaultRoutes}
              extensions={props.extensions}
            />
          })}
          {props.subPages?.defaultRoutes !== undefined ?
            <Redirect to={props.isAuthenticated ? props.subPages.defaultRoutes.auth : props.subPages.defaultRoutes.unauth} />
            : null}
        </Switch> : null}
    </React.Fragment>
  );
};

export default ContentRenderer;
