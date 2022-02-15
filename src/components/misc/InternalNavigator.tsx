import React, { useEffect } from 'react';
import { useHistory } from 'react-router-dom';

interface InternalNavigatorProps {
  navigateTo?: { url: string, replace: boolean }
}

const InternalNavigator: React.FC<InternalNavigatorProps> = (props) => {
  const history = useHistory();

  useEffect(() => {
    if (!props.navigateTo) {
      return
    }
    if (props.navigateTo.replace) {
      history.replace(props.navigateTo.url)
    } else {
      history.push(props.navigateTo.url)
    }
  }, [props.navigateTo])
  return null;
};

export default InternalNavigator;
