import { useEffect, useState } from 'react';
import { isWhatsAppEnabled } from '../utils/platformConfig';

// False until the platform config has confirmed WhatsApp is enabled, so phone and WhatsApp
// controls never appear and then vanish.
export const useWhatsAppEnabled = (): boolean => {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    let mounted = true;
    isWhatsAppEnabled().then((value) => {
      if (mounted) {
        setEnabled(value);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  return enabled;
};
