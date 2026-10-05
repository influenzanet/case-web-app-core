// Runtime switches the platform publishes next to the other runtime assets, so the same build
// can run on instances with and without WhatsApp.
const PLATFORM_CONFIG_FILE = '/platform-config.json';

let whatsAppEnabledPromise: Promise<boolean> | undefined;

const platformConfigUrl = (): string =>
  (process.env.REACT_APP_CONTENT_URL ?? '') + PLATFORM_CONFIG_FILE;

const readWhatsAppEnabled = async (): Promise<boolean> => {
  try {
    const response = await fetch(platformConfigUrl());
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

// Read once per page load and shared by every caller, failures included.
export const isWhatsAppEnabled = (): Promise<boolean> => {
  if (whatsAppEnabledPromise === undefined) {
    whatsAppEnabledPromise = readWhatsAppEnabled();
  }
  return whatsAppEnabledPromise;
};
