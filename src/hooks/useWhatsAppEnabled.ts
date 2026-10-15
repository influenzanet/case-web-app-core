import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { isWhatsAppEnabled } from '../utils/platformConfig';
import { RootState } from '../store/rootReducer';

// False until the platform config has confirmed WhatsApp is enabled, so phone and WhatsApp
// controls never appear and then vanish.
export const useWhatsAppEnabled = (): boolean => {
  const instanceId = useSelector((state: RootState) => state.config.instanceId);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    let mounted = true;
    setEnabled(false);
    // AppCore dispatches the real instance id in its own effect, which runs AFTER this one on
    // first render. Deferring the fetch with a zero-delay timer lets that dispatch land first,
    // so the cleanup below cancels the stale 'default' request before it is ever sent.
    const timer = setTimeout(() => {
      isWhatsAppEnabled(instanceId).then((value) => {
        if (mounted) {
          setEnabled(value);
        }
      });
    }, 0);
    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [instanceId]);

  return enabled;
};
