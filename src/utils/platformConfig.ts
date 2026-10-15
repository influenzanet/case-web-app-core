// The backend answers from the same decision function the backend services use, so the web
// follows the backend configuration with no static file to copy or keep in sync.
const PLATFORM_CONFIG_PATH = '/v1/platform-config';

// One cached promise per instance id, failures included, so each instance is read at most once
// per page load however many callers ask.
const whatsAppEnabledByInstance = new Map<string, Promise<boolean>>();

const platformConfigUrl = (instanceId: string): string =>
  (process.env.REACT_APP_API_BASE_URL ?? '') +
  PLATFORM_CONFIG_PATH +
  '?instance=' +
  encodeURIComponent(instanceId);

const readWhatsAppEnabled = async (instanceId: string): Promise<boolean> => {
  try {
    const response = await fetch(platformConfigUrl(instanceId));
    if (!response.ok) {
      return false;
    }
    const config = await response.json();
    // Only an explicit true turns WhatsApp on: anything unexpected keeps it hidden.
    return config !== null && typeof config === 'object' && config.whatsAppEnabled === true;
  } catch (error) {
    console.warn('platform config could not be read, WhatsApp stays hidden:', error);
    return false;
  }
};

// Read once per instance per page load and shared by every caller, failures included.
export const isWhatsAppEnabled = (instanceId: string): Promise<boolean> => {
  const cached = whatsAppEnabledByInstance.get(instanceId);
  if (cached !== undefined) {
    return cached;
  }
  const promise = readWhatsAppEnabled(instanceId);
  whatsAppEnabledByInstance.set(instanceId, promise);
  return promise;
};
