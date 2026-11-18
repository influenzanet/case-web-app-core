import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertBox } from '@influenzanet/case-web-ui';

interface WhatsAppOptInStatementProps {
  className?: string;
}

// Verifying a phone number is what turns WhatsApp notifications on, so the participant is told
// so, and how to turn them off, wherever a verification code can be sent, before it is sent.
// The text is markdown, so it can link to the privacy notice.
const WhatsAppOptInStatement: React.FC<WhatsAppOptInStatementProps> = (props) => {
  const { t } = useTranslation(['dialogs']);
  return (
    <AlertBox
      type="info"
      className={props.className}
      content={t('dialogs:whatsAppOptIn.statement')}
    />
  );
};

export default WhatsAppOptInStatement;
