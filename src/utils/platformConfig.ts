// The backend answers from the same decision function the backend services use, so the web
// follows the backend configuration with no static file to copy or keep in sync.
const PLATFORM_CONFIG_PATH = '/v1/platform-config';

// Waits before each new attempt after a failure that may pass: the request never got an answer,
// or the server answered with an error of its own. Once they are used up the caller gets false
// for now, and the next caller starts over.
export const RETRY_DELAYS_MS = [1000, 2000, 4000, 8000, 16000];

// One promise per instance id. An answer is kept for the whole page load; a read that ended in
// a failure is dropped, so one failure does not hide WhatsApp until the page is reloaded.
const whatsAppEnabledByInstance = new Map<string, Promise<boolean>>();

const platformConfigUrl = (instanceId: string): string =>
  (process.env.REACT_APP_API_BASE_URL ?? '') +
  PLATFORM_CONFIG_PATH +
  '?instance=' +
  encodeURIComponent(instanceId);

// What one request learned: the backend's answer, or a failure worth another attempt.
type Attempt = { answer: boolean } | { retry: true };

const readOnce = async (instanceId: string): Promise<Attempt> => {
  let response: Response;
  try {
    response = await fetch(platformConfigUrl(instanceId));
  } catch (error) {
    console.warn('platform config could not be read, WhatsApp stays hidden for now:', error);
    return { retry: true };
  }
  if (response.status >= 500 || response.status === 429) {
    console.warn('platform config could not be read, WhatsApp stays hidden for now: status', response.status);
    return { retry: true };
  }
  // Any other refusal (unknown instance, missing route) is the answer: asking again changes nothing.
  if (!response.ok) {
    return { answer: false };
  }
  try {
    const config = await response.json();
    // Only an explicit true turns WhatsApp on: anything unexpected keeps it hidden.
    return { answer: config !== null && typeof config === 'object' && config.whatsAppEnabled === true };
  } catch (error) {
    console.warn('platform config is not valid JSON, WhatsApp stays hidden:', error);
    return { answer: false };
  }
};

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const readWithRetries = async (instanceId: string): Promise<boolean> => {
  for (let attempt = 0; ; attempt++) {
    const result = await readOnce(instanceId);
    if ('answer' in result) {
      return result.answer;
    }
    if (attempt >= RETRY_DELAYS_MS.length) {
      whatsAppEnabledByInstance.delete(instanceId);
      return false;
    }
    await wait(RETRY_DELAYS_MS[attempt]);
  }
};

// Shared by every caller asking about the same instance, while it is being read and after.
export const isWhatsAppEnabled = (instanceId: string): Promise<boolean> => {
  const cached = whatsAppEnabledByInstance.get(instanceId);
  if (cached !== undefined) {
    return cached;
  }
  const promise = readWithRetries(instanceId);
  whatsAppEnabledByInstance.set(instanceId, promise);
  return promise;
};
