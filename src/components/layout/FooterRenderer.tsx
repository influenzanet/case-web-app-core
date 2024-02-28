import React from 'react';
import { Footer } from '@influenzanet/case-web-ui';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { FooterConfig } from '../../types/footerConfig';
import { dialogActions } from '../../store/dialogSlice';

interface FooterRendererProps {
  footerConfig?: FooterConfig;
  onChangeLanguage: (code: string) => void;
  onOpenExternalPage: (url: string) => void;
}

const FooterRenderer: React.FC<FooterRendererProps> = (props) => {
  const { t } = useTranslation(['footer']);
  const history = useHistory();
  const dispatch = useDispatch();

  const handleNavigation = (url: string, external?: boolean) => {
    if (external) {
      props.onOpenExternalPage(url);
      return;
    }
    history.push(url)
  }

  const handleDialogOpening = (dialog: string) => {
    dispatch(dialogActions.openDialogWithoutPayload({ type: dialog }));
  }

  const getLocalizedConfig = (config?: FooterConfig) => {
    if (!config) { return; }
    return {
      columns: config.columns.map(column => {
        return {
          columnKey: column.columnKey,
          columnTitle: t(`${column.columnKey}.title`),
          classNameOverride: column.classNameOverride,
          items: column.items.map(item => {
            return {
              ...item,
              itemText: t(`${column.columnKey}.${item.itemKey}`),
            }
          })
        }
      })
    }
  }

  return (
    <Footer
      loading={!props.footerConfig}
      content={getLocalizedConfig(props.footerConfig)}
      onChangeLanguage={props.onChangeLanguage}
      onOpenDialog={handleDialogOpening}
      onNavigate={handleNavigation}
    />
  );
};

export default FooterRenderer;
