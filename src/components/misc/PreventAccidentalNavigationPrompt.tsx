import React from 'react';
import { Prompt } from 'react-router-dom';

interface PreventAccidentalNavigationPromptProps {
  protectionActive: boolean;
  onTriggered: (path: string) => void;
}

const PreventAccidentalNavigationPrompt: React.FC<PreventAccidentalNavigationPromptProps> = (props) => {
  return (
    <Prompt
      when={props.protectionActive}
      message={(location, action) => {
        props.onTriggered(location.pathname);
        return false;
      }}
    />
  );
};

export default PreventAccidentalNavigationPrompt;
