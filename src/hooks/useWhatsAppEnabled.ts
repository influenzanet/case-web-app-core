import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { isWhatsAppEnabled } from '../utils/platformConfig';
import { RootState } from '../store/rootReducer';

// False until the platform config has confirmed WhatsApp is enabled, so phone and WhatsApp
// controls never appear and then vanish.
export const useWhatsAppEnabled = (): boolean => {
  const instanceId = useSelector((state: RootState) => state.config.instanceId);
  // The app stores its instance id in an effect that runs after its children's first effects,
  // so until then the store holds a placeholder that must not be asked about.
  const instanceIdSet = useSelector((state: RootState) => state.config.instanceIdSet === true);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(false);
    if (!instanceIdSet) {
      return;
    }
    let mounted = true;
    isWhatsAppEnabled(instanceId).then((value) => {
      if (mounted) {
        setEnabled(value);
      }
    });
    return () => {
      mounted = false;
    };
  }, [instanceId, instanceIdSet]);

  return enabled;
};
